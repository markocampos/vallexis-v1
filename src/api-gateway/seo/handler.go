package seo

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/jmoiron/sqlx"

	"github.com/markocampos/vallexis-v1/src/api-gateway/auth"
	"github.com/markocampos/vallexis-v1/src/internal/httpx"
)

type Handler struct {
	db     *sqlx.DB
	seoURL string
}

func NewHandler(db *sqlx.DB) *Handler {
	seoURL := os.Getenv("SEO_SERVICE_URL")
	if seoURL == "" {
		seoURL = "http://localhost:3003"
	}
	return &Handler{db: db, seoURL: seoURL}
}

type auditResponse struct {
	ID        string          `json:"id" db:"id"`
	URL       string          `json:"url" db:"url"`
	Status    string          `json:"status" db:"status"`
	Score     int             `json:"score" db:"score"`
	Results   json.RawMessage `json:"results,omitempty" db:"results"`
	CreatedAt string          `json:"created_at" db:"created_at"`
}

func (h *Handler) ListAudits(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	pg := httpx.ParsePagination(r)

	var total int64
	_ = h.db.QueryRowContext(r.Context(),
		`SELECT COUNT(*) FROM seo_audits WHERE user_id = $1`, userID,
	).Scan(&total)

	rows, err := h.db.QueryxContext(r.Context(),
		`SELECT id, url, status, score, results, created_at
		 FROM seo_audits WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, userID, pg.Limit, pg.Offset,
	)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to list audits")
		return
	}
	defer rows.Close()

	var audits []auditResponse
	for rows.Next() {
		var a auditResponse
		if err := rows.StructScan(&a); err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to scan audit")
			return
		}
		audits = append(audits, a)
	}
	if err := rows.Err(); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to iterate audits")
		return
	}

	if audits == nil {
		audits = []auditResponse{}
	}
	httpx.WriteJSON(w, http.StatusOK, httpx.PaginatedResponse{Data: audits, Total: total, Page: pg.Page, Limit: pg.Limit})
}

type runAuditRequest struct {
	URL string `json:"url"`
}

func (h *Handler) RunAudit(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	var req runAuditRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.URL == "" {
		httpx.WriteError(w, http.StatusBadRequest, "url is required")
		return
	}

	var a auditResponse
	err := h.db.QueryRowContext(r.Context(),
		`INSERT INTO seo_audits (user_id, url, status)
		 VALUES ($1, $2, 'running')
		 RETURNING id, url, status, score, created_at`,
		userID, req.URL,
	).Scan(&a.ID, &a.URL, &a.Status, &a.Score, &a.CreatedAt)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to create audit")
		return
	}

	go h.runAuditAsync(a.ID, req.URL)

	httpx.WriteJSON(w, http.StatusCreated, a)
}

func (h *Handler) runAuditAsync(auditID, url string) {
	payload, _ := json.Marshal(map[string]string{"url": url})
	resp, err := http.Post(h.seoURL+"/seo/audit", "application/json", bytes.NewReader(payload))
	if err != nil {
		_, _ = h.db.Exec(`UPDATE seo_audits SET status = 'failed' WHERE id = $1`, auditID)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result struct {
		Score   int             `json:"score"`
		Results json.RawMessage `json:"results"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		_, _ = h.db.Exec(`UPDATE seo_audits SET status = 'failed' WHERE id = $1`, auditID)
		return
	}

	_, _ = h.db.Exec(`UPDATE seo_audits SET status = 'completed', score = $1, results = $2 WHERE id = $3`,
		result.Score, result.Results, auditID)
}

func (h *Handler) GetAudit(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	auditID := chi.URLParam(r, "id")
	if auditID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "missing audit id")
		return
	}

	var a auditResponse
	err := h.db.QueryRowxContext(r.Context(),
		`SELECT id, url, status, score, results, created_at
		 FROM seo_audits WHERE id = $1 AND user_id = $2`, auditID, userID,
	).StructScan(&a)
	if err != nil {
		httpx.WriteError(w, http.StatusNotFound, "audit not found")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, a)
}
