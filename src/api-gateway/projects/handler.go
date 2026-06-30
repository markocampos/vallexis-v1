package projects

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
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
	ID        string    `db:"id" json:"id"`
	Name      string    `db:"name" json:"name"`
	GitRepo   string    `db:"git_repo" json:"git_repo"`
	GitBranch string    `db:"git_branch" json:"git_branch"`
	Subdomain string    `db:"subdomain" json:"subdomain"`
	Status    string    `db:"status" json:"status"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
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

	var plan string
	if err := h.db.QueryRowContext(r.Context(), `SELECT plan FROM users WHERE id = $1`, userID).Scan(&plan); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to load user plan")
		return
	}
	var currentCount int64
	if err := h.db.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM projects WHERE user_id = $1`, userID).Scan(&currentCount); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to count projects")
		return
	}
	if err := CanCreateProject(plan, int(currentCount)); err != nil {
		httpx.WriteError(w, http.StatusForbidden, err.Error())
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

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	pg := httpx.ParsePagination(r)

	var total int64
	_ = h.db.QueryRowContext(r.Context(),
		`SELECT COUNT(*) FROM projects WHERE user_id = $1`, userID,
	).Scan(&total)

	rows, err := h.db.QueryxContext(r.Context(),
		`SELECT id, name, git_repo, git_branch, subdomain, status, created_at
		 FROM projects WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, userID, pg.Limit, pg.Offset,
	)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to list projects")
		return
	}
	defer rows.Close()

	var projects []projectResponse
	for rows.Next() {
		var p projectResponse
		if err := rows.StructScan(&p); err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to scan project")
			return
		}
		projects = append(projects, p)
	}
	if err := rows.Err(); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to iterate projects")
		return
	}

	if projects == nil {
		projects = []projectResponse{}
	}
	httpx.WriteJSON(w, http.StatusOK, httpx.PaginatedResponse{Data: projects, Total: total, Page: pg.Page, Limit: pg.Limit})
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	projectID := chi.URLParam(r, "id")
	if projectID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "missing project id")
		return
	}

	result, err := h.db.ExecContext(r.Context(),
		`DELETE FROM projects WHERE id = $1 AND user_id = $2`, projectID, userID,
	)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to delete project")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		httpx.WriteError(w, http.StatusNotFound, "project not found")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]string{"message": "project deleted"})
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
