package storage

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jmoiron/sqlx"

	"github.com/markocampos/vallexis-v1/src/api-gateway/auth"
	"github.com/markocampos/vallexis-v1/src/internal/httpx"
)

var allowedExtensions = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true, ".avif": true, ".svg": true,
	".pdf": true, ".doc": true, ".docx": true, ".xls": true, ".xlsx": true, ".ppt": true, ".pptx": true,
	".txt": true, ".csv": true, ".json": true, ".xml": true, ".yaml": true, ".yml": true,
	".zip": true, ".tar": true, ".gz": true,
	".mp3": true, ".mp4": true, ".wav": true, ".ogg": true, ".webm": true,
	".woff": true, ".woff2": true, ".ttf": true, ".otf": true, ".eot": true,
	".css": true, ".js": true, ".ts": true, ".html": true, ".htm": true, ".md": true,
}

type Handler struct {
	db *sqlx.DB
}

func NewHandler(db *sqlx.DB) *Handler {
	return &Handler{db: db}
}

type fileResponse struct {
	ID        string `json:"id" db:"id"`
	Name      string `json:"name" db:"name"`
	Size      int64  `json:"size" db:"size"`
	Type      string `json:"type" db:"type"`
	URL       string `json:"url" db:"url"`
	CreatedAt string `json:"created_at" db:"created_at"`
}

type statsResponse struct {
	Used      int64 `json:"used"`
	Limit     int64 `json:"limit"`
	FileCount int64 `json:"file_count"`
}

func (h *Handler) ListFiles(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	pg := httpx.ParsePagination(r)

	var total int64
	_ = h.db.QueryRowContext(r.Context(),
		`SELECT COUNT(*) FROM storage_objects WHERE user_id = $1`, userID,
	).Scan(&total)

	rows, err := h.db.QueryxContext(r.Context(),
		`SELECT id, name, size, type, url, created_at
		 FROM storage_objects WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, userID, pg.Limit, pg.Offset,
	)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to list files")
		return
	}
	defer rows.Close()

	var files []fileResponse
	for rows.Next() {
		var f fileResponse
		if err := rows.StructScan(&f); err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to scan file")
			return
		}
		files = append(files, f)
	}
	if err := rows.Err(); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to iterate files")
		return
	}

	if files == nil {
		files = []fileResponse{}
	}
	httpx.WriteJSON(w, http.StatusOK, httpx.PaginatedResponse{Data: files, Total: total, Page: pg.Page, Limit: pg.Limit})
}

func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	var plan string
	_ = h.db.QueryRowContext(r.Context(),
		`SELECT plan FROM users WHERE id = $1`, userID,
	).Scan(&plan)

	var stats statsResponse
	_ = h.db.QueryRowContext(r.Context(),
		`SELECT COALESCE(SUM(size), 0), COUNT(*) FROM storage_objects WHERE user_id = $1`, userID,
	).Scan(&stats.Used, &stats.FileCount)

	switch plan {
	case "pro":
		stats.Limit = 20 * 1024 * 1024 * 1024
	case "starter":
		stats.Limit = 5 * 1024 * 1024 * 1024
	case "enterprise":
		stats.Limit = 1024 * 1024 * 1024 * 1024
	default:
		stats.Limit = 2 * 1024 * 1024 * 1024
	}

	httpx.WriteJSON(w, http.StatusOK, stats)
}

func (h *Handler) Upload(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "failed to parse upload")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "no file provided")
		return
	}
	defer file.Close()

	var plan string
	_ = h.db.QueryRowContext(r.Context(),
		`SELECT plan FROM users WHERE id = $1`, userID,
	).Scan(&plan)

	var usedBytes int64
	_ = h.db.QueryRowContext(r.Context(),
		`SELECT COALESCE(SUM(size), 0) FROM storage_objects WHERE user_id = $1`, userID,
	).Scan(&usedBytes)

	var limit int64
	switch plan {
	case "pro":
		limit = 20 * 1024 * 1024 * 1024
	case "starter":
		limit = 5 * 1024 * 1024 * 1024
	case "enterprise":
		limit = 1024 * 1024 * 1024 * 1024
	default:
		limit = 2 * 1024 * 1024 * 1024
	}

	if usedBytes+header.Size > limit {
		httpx.WriteError(w, http.StatusForbidden, "storage quota exceeded")
		return
	}

	uploadDir := filepath.Join("uploads", userID)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to create upload directory")
		return
	}

	b := make([]byte, 16)
	_, _ = rand.Read(b)
	fileID := hex.EncodeToString(b)
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExtensions[ext] {
		httpx.WriteError(w, http.StatusBadRequest, "file type not allowed")
		return
	}
	filename := fileID + ext
	destPath := filepath.Join(uploadDir, filename)

	dst, err := os.Create(destPath)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to save file")
		return
	}
	defer dst.Close()

	written, err := io.Copy(dst, file)
	if err != nil {
		_ = os.Remove(destPath)
		httpx.WriteError(w, http.StatusInternalServerError, "failed to write file")
		return
	}

	if usedBytes+written > limit {
		_ = os.Remove(destPath)
		httpx.WriteError(w, http.StatusForbidden, "storage quota exceeded")
		return
	}

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	var f fileResponse
	err = h.db.QueryRowContext(r.Context(),
		`INSERT INTO storage_objects (user_id, name, size, type, url)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, name, size, type, url, created_at`,
		userID, header.Filename, written, contentType, "/uploads/"+userID+"/"+filename,
	).Scan(&f.ID, &f.Name, &f.Size, &f.Type, &f.URL, &f.CreatedAt)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to save file metadata")
		return
	}

	_, _ = h.db.ExecContext(r.Context(),
		`UPDATE users SET storage_used_bytes = storage_used_bytes + $1 WHERE id = $2`, written, userID,
	)

	httpx.WriteJSON(w, http.StatusCreated, f)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	fileID := chi.URLParam(r, "id")
	if fileID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "missing file id")
		return
	}

	var filePath string
	var fileSize int64
	err := h.db.QueryRowContext(r.Context(),
		`SELECT url, size FROM storage_objects WHERE id = $1 AND user_id = $2`, fileID, userID,
	).Scan(&filePath, &fileSize)
	if err != nil {
		httpx.WriteError(w, http.StatusNotFound, "file not found")
		return
	}

	result, _ := h.db.ExecContext(r.Context(),
		`DELETE FROM storage_objects WHERE id = $1 AND user_id = $2`, fileID, userID,
	)
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		httpx.WriteError(w, http.StatusNotFound, "file not found")
		return
	}

	fullPath := filepath.Join(".", filePath)
	_ = os.Remove(fullPath)

	_, _ = h.db.ExecContext(r.Context(),
		`UPDATE users SET storage_used_bytes = GREATEST(0, storage_used_bytes - $1) WHERE id = $2`, fileSize, userID,
	)

	httpx.WriteJSON(w, http.StatusOK, map[string]string{"message": "file deleted"})
}

func (h *Handler) GetFile(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	fileID := chi.URLParam(r, "id")
	if fileID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "missing file id")
		return
	}

	var f fileResponse
	err := h.db.QueryRowxContext(r.Context(),
		`SELECT id, name, size, type, url, created_at
		 FROM storage_objects WHERE id = $1 AND user_id = $2`, fileID, userID,
	).StructScan(&f)
	if err != nil {
		httpx.WriteError(w, http.StatusNotFound, "file not found")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, f)
}
