package auth

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jmoiron/sqlx"
	"github.com/redis/go-redis/v9"

	"github.com/markocampos/vallexis-v1/src/internal/cache"
	"github.com/markocampos/vallexis-v1/src/internal/httpx"
)

type Handler struct {
	svc         *Service
	db          *sqlx.DB
	privateKey  *rsa.PrivateKey
	rdb         *redis.Client
	frontendURL string
	cfg         OauthConfig
}

type OauthConfig struct {
	OAuthRedirectBase  string
	GitHubClientID     string
	GitHubClientSecret string
	GoogleClientID     string
	GoogleClientSecret string
}

func NewHandler(svc *Service, db *sqlx.DB, privateKey *rsa.PrivateKey, rdb *redis.Client, frontendURL string, cfg OauthConfig) *Handler {
	return &Handler{
		svc:         svc,
		db:          db,
		privateKey:  privateKey,
		rdb:         rdb,
		frontendURL: frontendURL,
		cfg:         cfg,
	}
}

func (h *Handler) clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	addr := r.RemoteAddr
	if idx := strings.LastIndex(addr, ":"); idx != -1 {
		return addr[:idx]
	}
	return addr
}

func (h *Handler) checkRateLimit(r *http.Request, action string) bool {
	ip := h.clientIP(r)
	key := fmt.Sprintf("rate:%s:%s", action, ip)
	allowed, err := cache.Allow(r.Context(), h.rdb, key, 10, 60*time.Second)
	if err != nil {
		log.Printf("rate limit error: %v", err)
		return true
	}
	return allowed
}

type registerJSON struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type loginJSON struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type tokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	if !h.checkRateLimit(r, "register") {
		w.Header().Set("Retry-After", "60")
		httpx.WriteError(w, http.StatusTooManyRequests, "rate limit exceeded, try again later")
		return
	}

	var req registerJSON
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	errs := ValidateRegisterRequest(RegisterRequest(req))
	if len(errs) > 0 {
		msgs := make([]string, len(errs))
		for i, e := range errs {
			msgs[i] = e.Error()
		}
		httpx.WriteJSON(w, http.StatusUnprocessableEntity, map[string]any{"errors": msgs})
		return
	}

	hash, err := h.svc.HashPassword(req.Password)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	var userID string
	err = h.db.QueryRowContext(r.Context(),
		`INSERT INTO users (email, password_hash, name, plan, storage_used_bytes)
		 VALUES ($1, $2, $3, 'free', 0)
		 RETURNING id`,
		req.Email, hash, req.Name,
	).Scan(&userID)
	if err != nil {
		log.Printf("Register insert error: %v", err)
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			httpx.WriteError(w, http.StatusConflict, "email already registered")
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, "failed to register user")
		return
	}

	pair, err := h.issueTokenPair(userID, req.Email)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to issue tokens")
		return
	}

	if err := h.storeRefreshToken(r.Context(), userID, pair.RefreshToken); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to store refresh token")
		return
	}

	h.setAuthCookies(w, r, pair)

	httpx.WriteJSON(w, http.StatusCreated, tokenResponse(pair))
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	if !h.checkRateLimit(r, "login") {
		w.Header().Set("Retry-After", "60")
		httpx.WriteError(w, http.StatusTooManyRequests, "rate limit exceeded, try again later")
		return
	}

	var req loginJSON
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	errs := ValidateLoginRequest(LoginRequest(req))
	if len(errs) > 0 {
		msgs := make([]string, len(errs))
		for i, e := range errs {
			msgs[i] = e.Error()
		}
		httpx.WriteJSON(w, http.StatusUnprocessableEntity, map[string]any{"errors": msgs})
		return
	}

	var userID, passwordHash string
	err := h.db.QueryRowContext(r.Context(),
		`SELECT id, password_hash FROM users WHERE email = $1`, req.Email,
	).Scan(&userID, &passwordHash)
	if err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, ErrInvalidCredentials.Error())
		return
	}

	if err := h.svc.VerifyPassword(passwordHash, req.Password); err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, ErrInvalidCredentials.Error())
		return
	}

	pair, err := h.issueTokenPair(userID, req.Email)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to issue tokens")
		return
	}

	if err := h.storeRefreshToken(r.Context(), userID, pair.RefreshToken); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to store refresh token")
		return
	}

	h.setAuthCookies(w, r, pair)

	httpx.WriteJSON(w, http.StatusOK, tokenResponse(pair))
}

func (h *Handler) issueTokenPair(userID, email string) (TokenPair, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"sub":   userID,
		"email": email,
		"iat":   now.Unix(),
		"exp":   now.Add(h.svc.cfg.AccessTokenTTL).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	accessToken, err := token.SignedString(h.privateKey)
	if err != nil {
		return TokenPair{}, err
	}

	refreshToken, err := GenerateRefreshToken()
	if err != nil {
		return TokenPair{}, err
	}

	return TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    h.svc.AccessTokenTTLSeconds(),
	}, nil
}

func (h *Handler) storeRefreshToken(ctx context.Context, userID, token string) error {
	// Invalidate/delete old refresh tokens for this user (rotation)
	_, _ = h.db.ExecContext(ctx, `DELETE FROM refresh_tokens WHERE user_id = $1`, userID)

	hash := sha256.Sum256([]byte(token))
	tokenHash := hex.EncodeToString(hash[:])
	_, err := h.db.ExecContext(ctx,
		`INSERT INTO refresh_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`,
		tokenHash, userID, h.svc.RefreshTokenExpiry(),
	)
	return err
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	// Try to identify user from refresh token cookie (most reliable for logout)
	if refreshCookie, err := r.Cookie("refresh_token"); err == nil && refreshCookie.Value != "" {
		hash := sha256.Sum256([]byte(refreshCookie.Value))
		tokenHash := hex.EncodeToString(hash[:])
		var userID string
		if err := h.db.QueryRowContext(r.Context(),
			`SELECT user_id FROM refresh_tokens WHERE token_hash = $1`, tokenHash,
		).Scan(&userID); err == nil && userID != "" {
			_, _ = h.db.ExecContext(r.Context(), `DELETE FROM refresh_tokens WHERE user_id = $1`, userID)
		}
	}

	// Also try to blocklist the access token if available
	var tokenStr string
	if cookie, err := r.Cookie("access_token"); err == nil {
		tokenStr = cookie.Value
	} else {
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if tokenStr != "" && h.rdb != nil {
		ctx := r.Context()
		h.rdb.Set(ctx, "blocklist:"+tokenStr, "1", 15*time.Minute)
	}

	h.clearAuthCookies(w, r)

	httpx.WriteJSON(w, http.StatusOK, map[string]string{"message": "logged out successfully"})
}

func (h *Handler) OAuthStart(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	if provider != "github" && provider != "google" {
		httpx.WriteError(w, http.StatusBadRequest, "invalid oauth provider")
		return
	}

	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to generate state")
		return
	}
	state := hex.EncodeToString(b)

	if h.rdb == nil {
		log.Printf("OAuth unavailable: Redis is down, cannot store state parameter")
		httpx.WriteError(w, http.StatusServiceUnavailable, "oauth temporarily unavailable")
		return
	}
	ctx := r.Context()
	h.rdb.Set(ctx, "oauth:state:"+state, provider, 10*time.Minute)

	redirectURI := h.cfg.OAuthRedirectBase + "/api/v1/auth/oauth/" + provider + "/callback"

	var authURL string
	switch provider {
	case "github":
		authURL = fmt.Sprintf(
			"https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=user:email&state=%s",
			h.cfg.GitHubClientID, redirectURI, state,
		)
	case "google":
		authURL = fmt.Sprintf(
			"https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&scope=openid+email+profile&response_type=code&state=%s&access_type=offline",
			h.cfg.GoogleClientID, redirectURI, state,
		)
	}

	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

func (h *Handler) OAuthCallback(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	if provider != "github" && provider != "google" {
		httpx.WriteError(w, http.StatusBadRequest, "invalid oauth provider")
		return
	}

	state := r.URL.Query().Get("state")
	code := r.URL.Query().Get("code")
	if code == "" || state == "" {
		httpx.WriteError(w, http.StatusBadRequest, "missing auth code or state")
		return
	}

	if h.rdb == nil {
		log.Printf("OAuth unavailable: Redis is down, cannot verify state parameter")
		httpx.WriteError(w, http.StatusServiceUnavailable, "oauth temporarily unavailable")
		return
	}
	ctx := r.Context()
	stored, err := h.rdb.Get(ctx, "oauth:state:"+state).Result()
	if err != nil || stored != provider {
		httpx.WriteError(w, http.StatusBadRequest, "invalid or expired state parameter")
		return
	}
	h.rdb.Del(ctx, "oauth:state:"+state)

	tokenURL, userURL, scopes := h.providerEndpoints(provider)
	if tokenURL == "" {
		httpx.WriteError(w, http.StatusBadRequest, "unsupported provider")
		return
	}

	clientID, clientSecret := h.providerCredentials(provider)

	tokenBody := fmt.Sprintf("client_id=%s&client_secret=%s&code=%s&redirect_uri=%s&scope=%s",
		clientID, clientSecret, code, h.cfg.OAuthRedirectBase+"/api/v1/auth/oauth/"+provider+"/callback", scopes)

	tokenResp, err := http.Post(tokenURL, "application/x-www-form-urlencoded", strings.NewReader(tokenBody))
	if err != nil {
		log.Printf("OAuth token exchange error: %v", err)
		httpx.WriteError(w, http.StatusInternalServerError, "failed to exchange auth code")
		return
	}
	defer tokenResp.Body.Close()

	var tokenData struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error"`
		ErrorDesc   string `json:"error_description"`
	}
	if err := json.NewDecoder(tokenResp.Body).Decode(&tokenData); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to parse token response")
		return
	}
	if tokenData.Error != "" {
		httpx.WriteError(w, http.StatusUnauthorized, "oauth provider denied access: "+tokenData.ErrorDesc)
		return
	}

	userReq, err := http.NewRequest("GET", userURL, nil)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to create user info request")
		return
	}
	userReq.Header.Set("Authorization", "Bearer "+tokenData.AccessToken)
	userReq.Header.Set("Accept", "application/json")

	userResp, err := http.DefaultClient.Do(userReq)
	if err != nil {
		log.Printf("OAuth user info error: %v", err)
		httpx.WriteError(w, http.StatusInternalServerError, "failed to fetch user info")
		return
	}
	defer userResp.Body.Close()

	var userInfo struct {
		Email string `json:"email"`
		Name  string `json:"name"`
		ID    any    `json:"id"`
	}
	if err := json.NewDecoder(userResp.Body).Decode(&userInfo); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to parse user info")
		return
	}
	if userInfo.Email == "" {
		httpx.WriteError(w, http.StatusBadRequest, "provider did not return an email")
		return
	}
	if userInfo.Name == "" {
		userInfo.Name = userInfo.Email
	}

	var userID string
	err = h.db.QueryRowContext(r.Context(),
		`SELECT id FROM users WHERE email = $1`, userInfo.Email,
	).Scan(&userID)

	if err != nil {
		err = h.db.QueryRowContext(r.Context(),
			`INSERT INTO users (email, password_hash, name, plan, storage_used_bytes)
			 VALUES ($1, '', $2, 'free', 0)
			 RETURNING id`,
			userInfo.Email, userInfo.Name,
		).Scan(&userID)
		if err != nil {
			log.Printf("OAuth registration insert error: %v", err)
			httpx.WriteError(w, http.StatusInternalServerError, "failed to register user via OAuth")
			return
		}

		_, _ = h.db.ExecContext(r.Context(),
			`INSERT INTO subscriptions (user_id, plan, status, current_period_end)
			 VALUES ($1, 'free', 'active', now() + INTERVAL '30 days')
			 ON CONFLICT (user_id) DO NOTHING`,
			userID,
		)
	}

	pair, err := h.issueTokenPair(userID, userInfo.Email)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to issue tokens")
		return
	}

	if err := h.storeRefreshToken(r.Context(), userID, pair.RefreshToken); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to store refresh token")
		return
	}

	h.setAuthCookies(w, r, pair)

	redirectTarget := fmt.Sprintf("%s/login", h.frontendURL)
	http.Redirect(w, r, redirectTarget, http.StatusTemporaryRedirect)
}

type refreshJSON struct {
	RefreshToken string `json:"refresh_token"`
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req refreshJSON
	// Try reading refresh_token from cookie first
	if cookie, err := r.Cookie("refresh_token"); err == nil {
		req.RefreshToken = cookie.Value
	} else {
		// Fallback to JSON request body
		_ = json.NewDecoder(r.Body).Decode(&req)
	}

	if req.RefreshToken == "" {
		httpx.WriteError(w, http.StatusBadRequest, "missing refresh token")
		return
	}

	hash := sha256.Sum256([]byte(req.RefreshToken))
	tokenHash := hex.EncodeToString(hash[:])

	var userID, email string
	var expiresAt time.Time

	// Find the refresh token and check if it's expired
	err := h.db.QueryRowContext(r.Context(),
		`SELECT r.user_id, u.email, r.expires_at 
		 FROM refresh_tokens r
		 JOIN users u ON r.user_id = u.id
		 WHERE r.token_hash = $1`, 
		tokenHash,
	).Scan(&userID, &email, &expiresAt)

	if err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, "invalid refresh token")
		return
	}

	if time.Now().After(expiresAt) {
		// Clean up expired token
		_, _ = h.db.ExecContext(r.Context(), `DELETE FROM refresh_tokens WHERE token_hash = $1`, tokenHash)
		httpx.WriteError(w, http.StatusUnauthorized, "refresh token expired")
		return
	}

	pair, err := h.issueTokenPair(userID, email)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to issue tokens")
		return
	}

	if err := h.storeRefreshToken(r.Context(), userID, pair.RefreshToken); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to store refresh token")
		return
	}

	h.setAuthCookies(w, r, pair)

	httpx.WriteJSON(w, http.StatusOK, tokenResponse(pair))
}

func (h *Handler) setAuthCookies(w http.ResponseWriter, r *http.Request, pair TokenPair) {
	secure := r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https"
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    pair.AccessToken,
		Path:     "/",
		MaxAge:   900, // 15 mins
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    pair.RefreshToken,
		Path:     "/",
		MaxAge:   604800, // 7 days
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})
}

func (h *Handler) clearAuthCookies(w http.ResponseWriter, r *http.Request) {
	secure := r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https"
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})
}

func (h *Handler) providerEndpoints(provider string) (tokenURL, userURL, scopes string) {
	switch provider {
	case "github":
		return "https://github.com/login/oauth/access_token", "https://api.github.com/user", "user:email"
	case "google":
		return "https://oauth2.googleapis.com/token", "https://www.googleapis.com/oauth2/v2/userinfo", "openid email profile"
	}
	return "", "", ""
}

func (h *Handler) providerCredentials(provider string) (clientID, clientSecret string) {
	switch provider {
	case "github":
		return h.cfg.GitHubClientID, h.cfg.GitHubClientSecret
	case "google":
		return h.cfg.GoogleClientID, h.cfg.GoogleClientSecret
	}
	return "", ""
}
