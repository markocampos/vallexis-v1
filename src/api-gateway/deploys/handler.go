package deploys

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
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

type deployResponse struct {
	ID            string  `json:"id" db:"id"`
	ProjectID     string  `json:"project_id" db:"project_id"`
	Status        string  `json:"status" db:"status"`
	CommitHash    *string `json:"commit_hash" db:"commit_hash"`
	CommitMessage *string `json:"commit_message" db:"commit_message"`
	CreatedAt     string  `json:"created_at" db:"created_at"`
	CompletedAt   *string `json:"completed_at" db:"completed_at"`
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	projectID := chi.URLParam(r, "projectId")
	if err := ValidateProjectAccess(h.db, userID, projectID); err != nil {
		httpx.WriteError(w, http.StatusNotFound, "project not found")
		return
	}

	pg := httpx.ParsePagination(r)

	var total int64
	_ = h.db.QueryRowContext(r.Context(),
		`SELECT COUNT(*) FROM deployments WHERE project_id = $1`, projectID,
	).Scan(&total)

	rows, err := h.db.QueryxContext(r.Context(),
		`SELECT id, project_id, status, commit_hash, commit_message, created_at, completed_at
		 FROM deployments WHERE project_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, projectID, pg.Limit, pg.Offset,
	)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to list deploys")
		return
	}
	defer rows.Close()

	var deploys []deployResponse
	for rows.Next() {
		var d deployResponse
		if err := rows.StructScan(&d); err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to scan deploy")
			return
		}
		deploys = append(deploys, d)
	}
	if err := rows.Err(); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to iterate deploys")
		return
	}

	if deploys == nil {
		deploys = []deployResponse{}
	}
	httpx.WriteJSON(w, http.StatusOK, httpx.PaginatedResponse{Data: deploys, Total: total, Page: pg.Page, Limit: pg.Limit})
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	projectID := chi.URLParam(r, "projectId")
	if err := ValidateProjectAccess(h.db, userID, projectID); err != nil {
		httpx.WriteError(w, http.StatusNotFound, "project not found")
		return
	}

	tx, err := h.db.BeginTx(r.Context(), nil)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to start transaction")
		return
	}
	defer tx.Rollback()

	var activeCount int
	err = tx.QueryRowContext(r.Context(),
		`SELECT COUNT(*) FROM deployments WHERE project_id = $1 AND status IN ('building', 'queued', 'pending') FOR UPDATE`,
		projectID,
	).Scan(&activeCount)
	if err == nil && activeCount > 0 {
		httpx.WriteError(w, http.StatusConflict, "a deploy is already running for this project")
		return
	}

	var d deployResponse
	err = tx.QueryRowContext(r.Context(),
		`INSERT INTO deployments (project_id, status)
		 VALUES ($1, 'building')
		 RETURNING id, project_id, status, commit_hash, commit_message, created_at, completed_at`,
		projectID,
	).Scan(&d.ID, &d.ProjectID, &d.Status, &d.CommitHash, &d.CommitMessage, &d.CreatedAt, &d.CompletedAt)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to create deploy")
		return
	}

	_, _ = tx.ExecContext(r.Context(),
		`UPDATE projects SET status = 'building' WHERE id = $1`, projectID,
	)

	if err := tx.Commit(); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to commit transaction")
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, d)
}

func (h *Handler) GetCurrent(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	projectID := chi.URLParam(r, "projectId")
	if err := ValidateProjectAccess(h.db, userID, projectID); err != nil {
		httpx.WriteError(w, http.StatusNotFound, "project not found")
		return
	}

	var d deployResponse
	err := h.db.QueryRowxContext(r.Context(),
		`SELECT id, project_id, status, commit_hash, commit_message, created_at, completed_at
		 FROM deployments WHERE project_id = $1
		 ORDER BY created_at DESC LIMIT 1`, projectID,
	).StructScan(&d)
	if err != nil {
		httpx.WriteError(w, http.StatusNotFound, "no active deployment")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, d)
}

func (h *Handler) Stream(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	projectID := chi.URLParam(r, "projectId")
	if err := ValidateProjectAccess(h.db, userID, projectID); err != nil {
		httpx.WriteError(w, http.StatusNotFound, "project not found")
		return
	}

	hijacker, ok := w.(http.Hijacker)
	if !ok {
		httpx.WriteError(w, http.StatusInternalServerError, "streaming not supported")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(http.StatusOK)

	conn, bufrw, err := hijacker.Hijack()
	if err != nil {
		return
	}
	defer conn.Close()

	bufrw.WriteString("HTTP/1.1 200 OK\r\n")
	bufrw.WriteString("Content-Type: text/event-stream\r\n")
	bufrw.WriteString("Cache-Control: no-cache\r\n")
	bufrw.WriteString("Connection: keep-alive\r\n")
	bufrw.WriteString("\r\n")
	bufrw.Flush()

	_ = conn.(*net.TCPConn).SetDeadline(time.Now().Add(30 * time.Minute))

	ctx := r.Context()
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			var d deployResponse
			err := h.db.QueryRowxContext(ctx,
				`SELECT id, project_id, status, commit_hash, commit_message, created_at, completed_at
				 FROM deployments WHERE project_id = $1
				 ORDER BY created_at DESC LIMIT 1`, projectID,
			).StructScan(&d)
			if err != nil {
				continue
			}

			data, _ := json.Marshal(d)
			fmt.Fprintf(bufrw, "data: %s\n\n", data)
			bufrw.Flush()

			if d.Status == "deployed" || d.Status == "failed" {
				fmt.Fprintf(bufrw, "event: deploy_complete\ndata: %s\n\n", d.Status)
				bufrw.Flush()
				return
			}
		}
	}
}
