package auth_test

import (
	"crypto/rand"
	"crypto/rsa"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/markocampos/vallexis-v1/src/api-gateway/auth"
)

func generateTestKey(t *testing.T) *rsa.PrivateKey {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate RSA key: %v", err)
	}
	return key
}

func signToken(t *testing.T, key *rsa.PrivateKey, claims jwt.MapClaims) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	s, err := token.SignedString(key)
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return s
}

func TestRequireAuth_ValidToken(t *testing.T) {
	key := generateTestKey(t)
	now := time.Now()
	tokenStr := signToken(t, key, jwt.MapClaims{
		"sub":   "user-123",
		"email": "test@example.com",
		"iat":   now.Unix(),
		"exp":   now.Add(15 * time.Minute).Unix(),
	})

	var gotUserID string
	handler := auth.RequireAuth(&key.PublicKey)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotUserID = auth.UserIDFromContext(r.Context())
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if gotUserID != "user-123" {
		t.Fatalf("expected user ID %q, got %q", "user-123", gotUserID)
	}
}

func TestRequireAuth_ExpiredToken(t *testing.T) {
	key := generateTestKey(t)
	past := time.Now().Add(-1 * time.Hour)
	tokenStr := signToken(t, key, jwt.MapClaims{
		"sub":   "user-123",
		"email": "test@example.com",
		"iat":   past.Unix(),
		"exp":   past.Add(15 * time.Minute).Unix(),
	})

	handler := auth.RequireAuth(&key.PublicKey)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("handler should not be called for expired token")
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestRequireAuth_MissingHeader(t *testing.T) {
	key := generateTestKey(t)

	handler := auth.RequireAuth(&key.PublicKey)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("handler should not be called without auth header")
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestRequireAuth_InvalidToken(t *testing.T) {
	key := generateTestKey(t)

	handler := auth.RequireAuth(&key.PublicKey)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("handler should not be called for invalid token")
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer not-a-valid-jwt")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestRequireAuth_WrongSigningKey(t *testing.T) {
	signingKey := generateTestKey(t)
	validationKey := generateTestKey(t)

	now := time.Now()
	tokenStr := signToken(t, signingKey, jwt.MapClaims{
		"sub":   "user-123",
		"email": "test@example.com",
		"iat":   now.Unix(),
		"exp":   now.Add(15 * time.Minute).Unix(),
	})

	handler := auth.RequireAuth(&validationKey.PublicKey)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("handler should not be called for wrong signing key")
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestRequireAuth_MalformedAuthHeader(t *testing.T) {
	key := generateTestKey(t)

	handler := auth.RequireAuth(&key.PublicKey)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("handler should not be called for malformed header")
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Basic dXNlcjpwYXNz")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestRequireAuth_MissingSub(t *testing.T) {
	key := generateTestKey(t)
	now := time.Now()
	tokenStr := signToken(t, key, jwt.MapClaims{
		"email": "test@example.com",
		"iat":   now.Unix(),
		"exp":   now.Add(15 * time.Minute).Unix(),
	})

	handler := auth.RequireAuth(&key.PublicKey)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("handler should not be called for token without sub")
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestUserIDFromContext_Empty(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	got := auth.UserIDFromContext(req.Context())
	if got != "" {
		t.Fatalf("expected empty string, got %q", got)
	}
}
