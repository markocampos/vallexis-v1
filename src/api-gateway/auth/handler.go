package auth

import (
	"context"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jmoiron/sqlx"

	"github.com/markocampos/vallexis-v1/src/internal/httpx"
)

type Handler struct {
	svc        *Service
	db         *sqlx.DB
	privateKey *rsa.PrivateKey
}

func NewHandler(svc *Service, db *sqlx.DB, privateKey *rsa.PrivateKey) *Handler {
	return &Handler{svc: svc, db: db, privateKey: privateKey}
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

	httpx.WriteJSON(w, http.StatusCreated, tokenResponse(pair))
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
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
	hash := sha256.Sum256([]byte(token))
	tokenHash := hex.EncodeToString(hash[:])
	_, err := h.db.ExecContext(ctx,
		`INSERT INTO refresh_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`,
		tokenHash, userID, h.svc.RefreshTokenExpiry(),
	)
	return err
}
