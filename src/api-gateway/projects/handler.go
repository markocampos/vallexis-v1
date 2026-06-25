package projects

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jmoiron/sqlx"

	"github.com/markocampos/vallexis-v1/src/api-gateway/auth"
	"github.com/markocampos/vallexis-v1/src/internal/httpx"
)

type Handler struct {
	db *sqlx.DB
}

func NewHandler(db *sqlx.DB) *Handler {
	return &Handler{db: db}
}

type createJSON struct {
	Name      string `json:"name"`
	GitRepo   string `json:"git_repo"`
	GitBranch string `json:"git_branch"`
}

type projectResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	GitRepo   string `json:"git_repo"`
	GitBranch string `json:"git_branch"`
	Subdomain string `json:"subdomain"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	var req createJSON
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	errs := ValidateCreateRequest(CreateRequest(req))
	if len(errs) > 0 {
		msgs := make([]string, len(errs))
		for i, e := range errs {
			msgs[i] = e.Error()
		}
		httpx.WriteJSON(w, http.StatusUnprocessableEntity, map[string]any{"errors": msgs})
		return
	}

	branch := DefaultBranchName(req.GitBranch)
	subdomain := GenerateSubdomain(req.Name)

	var p projectResponse
	const maxRetries = 3
	for attempt := range maxRetries {
		err := h.db.QueryRowContext(r.Context(),
			`INSERT INTO projects (user_id, name, git_repo, git_branch, subdomain, status)
			 VALUES ($1, $2, $3, $4, $5, $6)
			 RETURNING id, name, git_repo, git_branch, subdomain, status, created_at`,
			userID, req.Name, req.GitRepo, branch, subdomain, StatusIdle,
		).Scan(&p.ID, &p.Name, &p.GitRepo, &p.GitBranch, &p.Subdomain, &p.Status, &p.CreatedAt)
		if err == nil {
			break
		}
		if isUniqueViolation(err) && attempt < maxRetries-1 {
			subdomain = appendRandomSuffix(GenerateSubdomain(req.Name))
			continue
		}
		httpx.WriteError(w, http.StatusInternalServerError, "failed to create project")
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, p)
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}

func appendRandomSuffix(base string) string {
	b := make([]byte, 3)
	_, _ = rand.Read(b)
	suffix := hex.EncodeToString(b)
	maxBase := MaxSubdomainLength - 1 - len(suffix)
	if len(base) > maxBase {
		base = base[:maxBase]
		base = strings.TrimRight(base, "-")
	}
	return base + "-" + suffix
}
