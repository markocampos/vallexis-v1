package auth

import (
	"context"
	"crypto/rsa"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"

	"github.com/markocampos/vallexis-v1/src/internal/httpx"
)

type contextKey string

const userIDKey contextKey = "user_id"

// UserIDFromContext returns the authenticated user ID from the request context.
func UserIDFromContext(ctx context.Context) string {
	v, _ := ctx.Value(userIDKey).(string)
	return v
}

// RequireAuth returns middleware that validates an RS256 JWT access token
// and injects the subject claim into the request context.
func RequireAuth(publicKey *rsa.PublicKey) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var tokenStr string
			if cookie, err := r.Cookie("access_token"); err == nil {
				tokenStr = cookie.Value
			} else {
				header := r.Header.Get("Authorization")
				if header == "" || !strings.HasPrefix(header, "Bearer ") {
					httpx.WriteError(w, http.StatusUnauthorized, "missing or malformed authorization header")
					return
				}
				tokenStr = strings.TrimPrefix(header, "Bearer ")
			}

			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
				if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return publicKey, nil
			})
			if err != nil || !token.Valid {
				httpx.WriteError(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				httpx.WriteError(w, http.StatusUnauthorized, "invalid token claims")
				return
			}

			sub, _ := claims["sub"].(string)
			if sub == "" {
				httpx.WriteError(w, http.StatusUnauthorized, "token missing subject")
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, sub)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// Blocklist checks if the access token has been blocklisted via logout.
func Blocklist(rdb *redis.Client) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if rdb == nil {
				next.ServeHTTP(w, r)
				return
			}
			var tokenStr string
			if cookie, err := r.Cookie("access_token"); err == nil {
				tokenStr = cookie.Value
			} else {
				header := r.Header.Get("Authorization")
				if header != "" && strings.HasPrefix(header, "Bearer ") {
					tokenStr = strings.TrimPrefix(header, "Bearer ")
				}
			}

			if tokenStr != "" {
				exists, err := rdb.Exists(r.Context(), "blocklist:"+tokenStr).Result()
				if err == nil && exists > 0 {
					httpx.WriteError(w, http.StatusUnauthorized, "token has been revoked")
					return
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}
