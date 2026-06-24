package users

import (
	"encoding/json"
	"net/http"

	"github.com/jmoiron/sqlx"

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
	Plan             string `json:"plan" db:"plan"`
	StorageUsedBytes int64  `json:"storage_used_bytes" db:"storage_used_bytes"`
	StorageLimit     int64  `json:"storage_limit"`
	CreatedAt        string `json:"created_at" db:"created_at"`
}

func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	var u userResponse
	err := h.db.QueryRowxContext(r.Context(),
		`SELECT id, email, name, plan, storage_used_bytes, created_at FROM users WHERE id = $1`, userID,
	).StructScan(&u)
	if err != nil {
		httpx.WriteError(w, http.StatusNotFound, "user not found")
		return
	}

	limit, _ := StorageLimit(u.Plan)
	u.StorageLimit = limit

	httpx.WriteJSON(w, http.StatusOK, u)
}

type updateMeJSON struct {
	Name string `json:"name"`
}

func (h *Handler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	var req updateMeJSON
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := ValidateUpdateProfile(UpdateProfileRequest{Name: req.Name}); err != nil {
		httpx.WriteError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	_, err := h.db.ExecContext(r.Context(),
		`UPDATE users SET name = $1 WHERE id = $2`, req.Name, userID,
	)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to update profile")
		return
	}

	h.GetMe(w, r)
}
