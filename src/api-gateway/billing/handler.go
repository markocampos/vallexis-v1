package billing

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/jmoiron/sqlx"

	"github.com/markocampos/vallexis-v1/src/api-gateway/auth"
	"github.com/markocampos/vallexis-v1/src/internal/httpx"
)

type Handler struct {
	db              *sqlx.DB
	paymongo        *payMongoClient
	frontendURL     string
	webhookSec      string
	proPriceID      string
	starterPriceID  string
}

type HandlerConfig struct {
	PayMongoSecretKey  string
	FrontendURL        string
	PayMongoWebhook    string
	PayMongoProPrice   string
	PayMongoStarterPrice string
}

func NewHandler(db *sqlx.DB, cfg HandlerConfig) *Handler {
	var pm *payMongoClient
	if cfg.PayMongoSecretKey != "" {
		pm = newPayMongoClient(cfg.PayMongoSecretKey)
	}
	return &Handler{
		db:              db,
		paymongo:        pm,
		frontendURL:     cfg.FrontendURL,
		webhookSec:      cfg.PayMongoWebhook,
		proPriceID:      cfg.PayMongoProPrice,
		starterPriceID:  cfg.PayMongoStarterPrice,
	}
}

type subscriptionResponse struct {
	ID                 string `json:"id" db:"id"`
	Plan               string `json:"plan" db:"plan"`
	Status             string `json:"status" db:"status"`
	CurrentPeriodEnd   string `json:"current_period_end" db:"current_period_end"`
	CancelAtPeriodEnd  bool   `json:"cancel_at_period_end" db:"cancel_at_period_end"`
}

type usageResponse struct {
	Projects       int64 `json:"projects"`
	ProjectsLimit  int64 `json:"projects_limit"`
	Storage        int64 `json:"storage"`
	StorageLimit   int64 `json:"storage_limit"`
	Bandwidth      int64 `json:"bandwidth"`
	BandwidthLimit int64 `json:"bandwidth_limit"`
}

func (h *Handler) GetSubscription(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	var sub subscriptionResponse
	err := h.db.QueryRowxContext(r.Context(),
		`SELECT id, plan, status, current_period_end, cancel_at_period_end
		 FROM subscriptions WHERE user_id = $1`, userID,
	).StructScan(&sub)
	if err != nil {
		sub = subscriptionResponse{
			Plan:              "free",
			Status:            "active",
			CurrentPeriodEnd:  time.Now().AddDate(0, 0, 30).Format(time.RFC3339),
			CancelAtPeriodEnd: false,
		}
	}

	httpx.WriteJSON(w, http.StatusOK, sub)
}

func (h *Handler) GetUsage(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	var plan string
	if err := h.db.QueryRowContext(r.Context(),
		`SELECT plan FROM users WHERE id = $1`, userID,
	).Scan(&plan); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to load user plan")
		return
	}

	var projectCount int64
	if err := h.db.QueryRowContext(r.Context(),
		`SELECT COUNT(*) FROM projects WHERE user_id = $1`, userID,
	).Scan(&projectCount); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to count projects")
		return
	}

	var storageUsed int64
	if err := h.db.QueryRowContext(r.Context(),
		`SELECT COALESCE(SUM(size), 0) FROM storage_objects WHERE user_id = $1`, userID,
	).Scan(&storageUsed); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to calculate storage usage")
		return
	}

	var bandwidthUsed int64
	if err := h.db.QueryRowContext(r.Context(),
		`SELECT COALESCE(SUM(bytes), 0) FROM bandwidth_usage WHERE user_id = $1 AND recorded_at >= now() - INTERVAL '30 days'`, userID,
	).Scan(&bandwidthUsed); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to calculate bandwidth usage")
		return
	}

	limits := getPlanLimits(plan)

	httpx.WriteJSON(w, http.StatusOK, usageResponse{
		Projects:       projectCount,
		ProjectsLimit:  limits.ProjectsLimit,
		Storage:        storageUsed,
		StorageLimit:   limits.StorageLimit,
		Bandwidth:      bandwidthUsed,
		BandwidthLimit: limits.BandwidthLimit,
	})
}

type subscribeRequest struct {
	PlanID string `json:"plan_id"`
}

func (h *Handler) Subscribe(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	var req subscribeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.PlanID == "free" || req.PlanID == "enterprise" {
		_, err := h.db.ExecContext(r.Context(),
			`INSERT INTO subscriptions (user_id, plan, status, current_period_end)
			 VALUES ($1, $2, 'active', now() + INTERVAL '30 days')
			 ON CONFLICT (user_id) DO UPDATE SET plan = $2, status = 'active',
			 current_period_end = now() + INTERVAL '30 days', cancel_at_period_end = false`,
			userID, req.PlanID,
		)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to update subscription")
			return
		}
		_, _ = h.db.ExecContext(r.Context(),
			`UPDATE users SET plan = $1 WHERE id = $2`, req.PlanID, userID,
		)
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"message": "subscription updated"})
		return
	}

	if h.paymongo == nil {
		httpx.WriteError(w, http.StatusServiceUnavailable, "payment system not configured")
		return
	}

	if req.PlanID != "pro" && req.PlanID != "starter" {
		httpx.WriteError(w, http.StatusBadRequest, "invalid plan")
		return
	}

	priceID := h.proPriceID
	if req.PlanID == "starter" {
		if h.starterPriceID != "" {
			priceID = h.starterPriceID
		} else {
			httpx.WriteError(w, http.StatusServiceUnavailable, "starter plan pricing not configured")
			return
		}
	}

	successURL := h.frontendURL + "/billing?upgraded=true"
	cancelURL := h.frontendURL + "/billing?cancelled=true"

	session, err := h.paymongo.CreateCheckoutSession(r.Context(), "", priceID, successURL, cancelURL)
	if err != nil {
		log.Printf("PayMongo checkout error: %v", err)
		httpx.WriteError(w, http.StatusInternalServerError, "failed to create checkout session")
		return
	}

	_, _ = h.db.ExecContext(r.Context(),
		`UPDATE subscriptions SET paymongo_customer_id = $1 WHERE user_id = $2`,
		session.ID, userID,
	)

	httpx.WriteJSON(w, http.StatusOK, map[string]string{
		"checkout_url": session.Attributes.CheckoutURL,
		"session_id":   session.ID,
	})
}

func (h *Handler) Cancel(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	var paymongoSubID string
	_ = h.db.QueryRowContext(r.Context(),
		`SELECT paymongo_subscription_id FROM subscriptions WHERE user_id = $1`, userID,
	).Scan(&paymongoSubID)

	if paymongoSubID != "" && h.paymongo != nil {
		if err := h.paymongo.CancelSubscription(r.Context(), paymongoSubID); err != nil {
			log.Printf("PayMongo cancel error: %v", err)
		}
	}

	_, err := h.db.ExecContext(r.Context(),
		`UPDATE subscriptions SET cancel_at_period_end = true WHERE user_id = $1 AND plan != 'free'`, userID,
	)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to cancel subscription")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]string{"message": "subscription will be canceled at period end"})
}

func (h *Handler) Webhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "failed to read body")
		return
	}
	defer r.Body.Close()

	signature := r.Header.Get("PayMongo-Signature")
	if !VerifyWebhookSignature(body, signature, h.webhookSec) {
		httpx.WriteError(w, http.StatusUnauthorized, "invalid webhook signature")
		return
	}

	var event struct {
		Data struct {
			ID         string `json:"id"`
			Attributes struct {
				Type    string `json:"type"`
				Livemode bool   `json:"livemode"`
				Data    struct {
					Object struct {
						ID         string `json:"id"`
						Attributes struct {
							Status          string `json:"status"`
							PlanID          string `json:"plan_id"`
							CustomerID      string `json:"customer_id"`
							CurrentPeriodEnd string `json:"current_period_end"`
						} `json:"attributes"`
					} `json:"object"`
				} `json:"data"`
			} `json:"attributes"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &event); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid event payload")
		return
	}

	eventType := event.Data.Attributes.Type
	data := event.Data.Attributes.Data.Object

	switch eventType {
	case "checkout_session.completed":
		if data.Attributes.Status == "paid" {
			_, _ = h.db.ExecContext(r.Context(),
				`UPDATE subscriptions SET status = 'active', paymongo_subscription_id = $1,
				 current_period_end = $2, paymongo_customer_id = $3
				 WHERE paymongo_customer_id = $3`,
				data.ID, data.Attributes.CurrentPeriodEnd, data.Attributes.CustomerID,
			)
			_, _ = h.db.ExecContext(r.Context(),
				`UPDATE users SET plan = 'pro' FROM subscriptions
				 WHERE users.id = subscriptions.user_id AND subscriptions.paymongo_customer_id = $1`,
				data.Attributes.CustomerID,
			)
		}

	case "subscription.updated":
		_, _ = h.db.ExecContext(r.Context(),
			`UPDATE subscriptions SET status = $1, current_period_end = $2
			 WHERE paymongo_subscription_id = $3`,
			data.Attributes.Status, data.Attributes.CurrentPeriodEnd, data.ID,
		)

	case "subscription.cancelled":
		_, _ = h.db.ExecContext(r.Context(),
			`UPDATE subscriptions SET status = 'canceled', cancel_at_period_end = false
			 WHERE paymongo_subscription_id = $1`, data.ID,
		)
		_, _ = h.db.ExecContext(r.Context(),
			`UPDATE users SET plan = 'free' FROM subscriptions
			 WHERE users.id = subscriptions.user_id AND subscriptions.paymongo_subscription_id = $1`,
			data.ID,
		)
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]string{"received": "ok"})
}

type planLimits struct {
	ProjectsLimit  int64
	StorageLimit   int64
	BandwidthLimit int64
}

func getPlanLimits(plan string) planLimits {
	switch plan {
	case "pro":
		return planLimits{ProjectsLimit: 2, StorageLimit: 20 * 1024 * 1024 * 1024, BandwidthLimit: 50 * 1024 * 1024 * 1024}
	case "starter":
		return planLimits{ProjectsLimit: 1, StorageLimit: 5 * 1024 * 1024 * 1024, BandwidthLimit: 10 * 1024 * 1024 * 1024}
	case "enterprise":
		return planLimits{ProjectsLimit: -1, StorageLimit: -1, BandwidthLimit: -1}
	default: // free
		return planLimits{ProjectsLimit: 1, StorageLimit: 2 * 1024 * 1024 * 1024, BandwidthLimit: 1 * 1024 * 1024 * 1024}
	}
}
