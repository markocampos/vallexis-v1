package users

import (
	"encoding/json"
	"net/http"

	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"

	"github.com/markocampos/vallexis-v1/src/api-gateway/auth"
	"github.com/markocampos/vallexis-v1/src/internal/httpx"
)

type Handler struct {
	db *sqlx.DB
}

func NewHandler(db *sqlx.DB) *Handler {
	return &Handler{db: db}
}

type userResponse struct {
	ID               string `json:"id" db:"id"`
	Email            string `json:"email" db:"email"`
	Name             string `json:"name" db:"name"`
	AvatarURL        string `json:"avatar_url,omitempty" db:"avatar_url"`
	Plan             string `json:"plan" db:"plan"`
	StorageUsedBytes int64  `json:"storage_used_bytes" db:"storage_used_bytes"`
	StorageLimit     int64  `json:"storage_limit"`
	CreatedAt        string `json:"created_at" db:"created_at"`
}

func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	var u userResponse
	err := h.db.QueryRowxContext(r.Context(),
		`SELECT id, email, name, COALESCE(avatar_url, '') as avatar_url, plan, storage_used_bytes, created_at FROM users WHERE id = $1`, userID,
	).StructScan(&u)
	if err != nil {
		httpx.WriteError(w, http.StatusNotFound, "user not found")
		return
	}

	limit, _ := StorageLimit(u.Plan)
	u.StorageLimit = limit

	httpx.WriteJSON(w, http.StatusOK, u)
}

type settingsResponse struct {
	ID            string          `json:"id" db:"id"`
	Name          string          `json:"name" db:"name"`
	Email         string          `json:"email" db:"email"`
	AvatarURL     string          `json:"avatar_url,omitempty" db:"avatar_url"`
	Timezone      string          `json:"timezone" db:"timezone"`
	Language      string          `json:"language" db:"language"`
	Notifications json.RawMessage `json:"notifications" db:"notifications"`
}

func (h *Handler) GetSettings(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	var s settingsResponse
	err := h.db.QueryRowxContext(r.Context(),
		`SELECT id, name, email, COALESCE(avatar_url, '') as avatar_url, timezone, language, notifications
		 FROM users WHERE id = $1`, userID,
	).StructScan(&s)
	if err != nil {
		httpx.WriteError(w, http.StatusNotFound, "user not found")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, s)
}

type updateSettingsRequest struct {
	Name          string          `json:"name,omitempty"`
	Email         string          `json:"email,omitempty"`
	Timezone      string          `json:"timezone,omitempty"`
	Language      string          `json:"language,omitempty"`
	Notifications json.RawMessage `json:"notifications,omitempty"`
}

func (h *Handler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	var req updateSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Name != "" {
		_, _ = h.db.ExecContext(r.Context(), `UPDATE users SET name = $1 WHERE id = $2`, req.Name, userID)
	}
	if req.Email != "" {
		_, _ = h.db.ExecContext(r.Context(), `UPDATE users SET email = $1 WHERE id = $2`, req.Email, userID)
	}
	if req.Timezone != "" {
		_, _ = h.db.ExecContext(r.Context(), `UPDATE users SET timezone = $1 WHERE id = $2`, req.Timezone, userID)
	}
	if req.Language != "" {
		_, _ = h.db.ExecContext(r.Context(), `UPDATE users SET language = $1 WHERE id = $2`, req.Language, userID)
	}
	if req.Notifications != nil {
		_, _ = h.db.ExecContext(r.Context(), `UPDATE users SET notifications = $1 WHERE id = $2`, req.Notifications, userID)
	}

	h.GetSettings(w, r)
}

type updatePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

func (h *Handler) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	var req updatePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.CurrentPassword == "" || req.NewPassword == "" {
		httpx.WriteError(w, http.StatusBadRequest, "current and new password are required")
		return
	}

	if len(req.NewPassword) < 8 {
		httpx.WriteError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}

	var passwordHash string
	err := h.db.QueryRowContext(r.Context(),
		`SELECT password_hash FROM users WHERE id = $1`, userID,
	).Scan(&passwordHash)
	if err != nil {
		httpx.WriteError(w, http.StatusNotFound, "user not found")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.CurrentPassword)); err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, "incorrect current password")
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 12)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	_, err = h.db.ExecContext(r.Context(),
		`UPDATE users SET password_hash = $1 WHERE id = $2`, string(newHash), userID,
	)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to update password")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]string{"message": "password updated"})
}

func (h *Handler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	_, err := h.db.ExecContext(r.Context(), `DELETE FROM users WHERE id = $1`, userID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to delete account")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]string{"message": "account deleted"})
}

type updateMeRequest struct {
	Name string `json:"name"`
}

func (h *Handler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	var req updateMeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	profileReq := UpdateProfileRequest{Name: req.Name}
	if err := ValidateUpdateProfile(profileReq); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.Name != "" {
		_, err := h.db.ExecContext(r.Context(), `UPDATE users SET name = $1 WHERE id = $2`, req.Name, userID)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to update profile name")
			return
		}
	}

	h.GetMe(w, r)
}

