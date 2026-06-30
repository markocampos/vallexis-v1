package storage_test

import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"

	"github.com/markocampos/vallexis-v1/src/api-gateway/storage"
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

func TestListFiles_MissingAuth(t *testing.T) {
	h := storage.NewHandler(nil)

	r := chi.NewRouter()
	r.Get("/storage", h.ListFiles)

	req := httptest.NewRequest("GET", "/storage", nil)
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestUpload_MissingAuth(t *testing.T) {
	h := storage.NewHandler(nil)

	r := chi.NewRouter()
	r.Post("/storage/upload", h.Upload)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	writer.Close()

	req := httptest.NewRequest("POST", "/storage/upload", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestDelete_MissingAuth(t *testing.T) {
	h := storage.NewHandler(nil)

	r := chi.NewRouter()
	r.Delete("/storage/{id}", h.Delete)

	req := httptest.NewRequest("DELETE", "/storage/test-id", nil)
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestGetFile_MissingAuth(t *testing.T) {
	h := storage.NewHandler(nil)

	r := chi.NewRouter()
	r.Get("/storage/{id}", h.GetFile)

	req := httptest.NewRequest("GET", "/storage/test-id", nil)
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestGetStats_MissingAuth(t *testing.T) {
	h := storage.NewHandler(nil)

	r := chi.NewRouter()
	r.Get("/storage/stats", h.GetStats)

	req := httptest.NewRequest("GET", "/storage/stats", nil)
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}
