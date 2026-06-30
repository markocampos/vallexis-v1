package projects_test

import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"

	"github.com/markocampos/vallexis-v1/src/api-gateway/auth"
	"github.com/markocampos/vallexis-v1/src/api-gateway/projects"
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

func TestHandlerCreate_MissingAuth(t *testing.T) {
	h := projects.NewHandler(nil)

	r := chi.NewRouter()
	r.Post("/projects", h.Create)

	req := httptest.NewRequest("POST", "/projects", bytes.NewReader([]byte(`{}`)))
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401 Unauthorized, got %d", rec.Code)
	}
}

func TestHandlerCreate_InvalidJSON(t *testing.T) {
	key := generateTestKey(t)
	now := time.Now()
	tokenStr := signToken(t, key, jwt.MapClaims{
		"sub": "user-123",
		"exp": now.Add(15 * time.Minute).Unix(),
	})

	h := projects.NewHandler(nil)

	r := chi.NewRouter()
	r.Use(auth.RequireAuth(&key.PublicKey))
	r.Post("/projects", h.Create)

	req := httptest.NewRequest("POST", "/projects", bytes.NewReader([]byte(`{invalid-json`)))
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected status 400 Bad Request, got %d", rec.Code)
	}
}
