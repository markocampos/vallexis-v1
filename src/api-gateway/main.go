package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jmoiron/sqlx"
	"github.com/redis/go-redis/v9"

	"github.com/markocampos/vallexis-v1/src/api-gateway/auth"
	"github.com/markocampos/vallexis-v1/src/api-gateway/billing"
	"github.com/markocampos/vallexis-v1/src/api-gateway/deploys"
	"github.com/markocampos/vallexis-v1/src/api-gateway/projects"
	"github.com/markocampos/vallexis-v1/src/api-gateway/seo"
	"github.com/markocampos/vallexis-v1/src/api-gateway/storage"
	"github.com/markocampos/vallexis-v1/src/api-gateway/users"
	"github.com/markocampos/vallexis-v1/src/internal/cache"
	"github.com/markocampos/vallexis-v1/src/internal/config"
	"github.com/markocampos/vallexis-v1/src/internal/database"
	"github.com/markocampos/vallexis-v1/src/internal/httpx"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database unavailable: %v", err)
	}
	defer db.Close()

	rdb, err := cache.Connect(cfg.RedisURL)
	if err != nil {
		log.Printf("WARNING: redis unavailable: %v", err)
	}
	if rdb != nil {
		defer rdb.Close()
	}

	// Background job to clean up stale builds
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			ctx := context.Background()
			// Mark stale deployments as failed
			// (We assume builds running for more than 15 minutes are crashed/stuck)
			staleTime := time.Now().Add(-15 * time.Minute)

			var staleProjectIDs []string
			err := db.SelectContext(ctx, &staleProjectIDs,
				`SELECT DISTINCT project_id FROM deployments 
				 WHERE status IN ('building', 'queued', 'pending') AND created_at < $1`,
				staleTime,
			)
			if err != nil {
				log.Printf("cleanup job: failed to query stale project IDs: %v", err)
				continue
			}

			if len(staleProjectIDs) > 0 {
				res, err := db.ExecContext(ctx,
					`UPDATE deployments 
					 SET status = 'failed', completed_at = NOW()
					 WHERE status IN ('building', 'queued', 'pending') AND created_at < $1`,
					staleTime,
				)
				if err != nil {
					log.Printf("cleanup job: failed to update stale deployments: %v", err)
					continue
				}
				rowsAffected, _ := res.RowsAffected()
				if rowsAffected > 0 {
					log.Printf("cleanup job: marked %d stale deployments as failed", rowsAffected)
				}

				_, err = db.ExecContext(ctx,
					`UPDATE projects SET status = 'failed' 
					 WHERE id IN (
						SELECT DISTINCT project_id FROM deployments 
						WHERE status IN ('building', 'queued', 'pending') AND created_at < $1
					 )`,
					staleTime,
				)
				if err != nil {
					log.Printf("cleanup job: failed to update project statuses: %v", err)
				}
			}
		}
	}()

	keyData, err := os.ReadFile(cfg.JWTPrivateKeyPath)
	if err != nil {
		log.Fatalf("JWT private key not found at %s: %v", cfg.JWTPrivateKeyPath, err)
	}
	privateKey, err := jwt.ParseRSAPrivateKeyFromPEM(keyData)
	if err != nil {
		log.Fatalf("JWT private key parse error: %v", err)
	}

	pubKeyData, err := os.ReadFile(cfg.JWTPublicKeyPath)
	if err != nil {
		log.Fatalf("JWT public key not found at %s: %v", cfg.JWTPublicKeyPath, err)
	}
	publicKey, err := jwt.ParseRSAPublicKeyFromPEM(pubKeyData)
	if err != nil {
		log.Fatalf("JWT public key parse error: %v", err)
	}

	r := httpx.NewRouter(cfg.CORSAllowedOrigins)

	health := healthHandler(db, rdb)
	r.Get("/api/health", health)
	r.Head("/api/health", health)

	r.Route("/api/v1", func(v1 chi.Router) {
		authSvc := auth.NewService(auth.DefaultConfig())
		oauthCfg := auth.OauthConfig{
			OAuthRedirectBase:  cfg.OAuthRedirectBase,
			GitHubClientID:     cfg.GitHubClientID,
			GitHubClientSecret: cfg.GitHubClientSecret,
			GoogleClientID:     cfg.GoogleClientID,
			GoogleClientSecret: cfg.GoogleClientSecret,
		}
		authH := auth.NewHandler(authSvc, db, privateKey, rdb, cfg.FrontendURL, oauthCfg)
		v1.With(httpx.LimitBodySize(1024 * 1024)).Post("/auth/register", authH.Register)
		v1.With(httpx.LimitBodySize(1024 * 1024)).Post("/auth/login", authH.Login)
		v1.With(httpx.LimitBodySize(1024 * 1024)).Post("/auth/refresh", authH.Refresh)
		v1.Get("/auth/oauth/{provider}", authH.OAuthStart)
		v1.Get("/auth/oauth/{provider}/callback", authH.OAuthCallback)

		billingCfg := billing.HandlerConfig{
			PayMongoSecretKey:    cfg.PayMongoSecretKey,
			FrontendURL:          cfg.FrontendURL,
			PayMongoWebhook:      cfg.PayMongoWebhookSec,
			PayMongoProPrice:     cfg.PayMongoProPriceID,
			PayMongoStarterPrice: cfg.PayMongoStarterPriceID,
		}
		billingH := billing.NewHandler(db, billingCfg)
		v1.With(httpx.LimitBodySize(1024 * 1024)).Post("/billing/webhook", billingH.Webhook)

		v1.Group(func(protected chi.Router) {
			protected.Use(auth.RequireAuth(publicKey))
			protected.Use(auth.Blocklist(rdb))
			if rdb != nil {
				protected.Use(httpx.GeneralRateLimit(100, time.Minute, func(ctx context.Context, key string) (bool, error) {
					return cache.Allow(ctx, rdb, key, 100, time.Minute)
				}))
			}

			protected.Post("/auth/logout", authH.Logout)

			// Standard API routes limited to 1MB request bodies
			protected.Group(func(api chi.Router) {
				api.Use(httpx.LimitBodySize(1024 * 1024))

				projH := projects.NewHandler(db)
				api.Post("/projects", projH.Create)
				api.Get("/projects", projH.List)
				api.Delete("/projects/{id}", projH.Delete)

				deployH := deploys.NewHandler(db)
				api.Get("/projects/{projectId}/deploys", deployH.List)
				api.Post("/projects/{projectId}/deploys", deployH.Create)
				api.Get("/projects/{projectId}/deploys/current", deployH.GetCurrent)
				api.Get("/projects/{projectId}/deploys/stream", deployH.Stream)

				api.Get("/billing/subscription", billingH.GetSubscription)
				api.Get("/billing/usage", billingH.GetUsage)
				api.Post("/billing/subscribe", billingH.Subscribe)
				api.Post("/billing/cancel", billingH.Cancel)

				storageH := storage.NewHandler(db)
				api.Get("/storage/files", storageH.ListFiles)
				api.Get("/storage/stats", storageH.GetStats)
				api.Get("/storage/files/{id}", storageH.GetFile)
				api.Delete("/storage/files/{id}", storageH.Delete)

				seoH := seo.NewHandler(db)
				api.Get("/seo/audits", seoH.ListAudits)
				api.Post("/seo/audit", seoH.RunAudit)
				api.Get("/seo/audits/{id}", seoH.GetAudit)

				userH := users.NewHandler(db)
				api.Get("/users/me", userH.GetMe)
				api.Patch("/users/me", userH.UpdateMe)
				api.Get("/users/settings", userH.GetSettings)
				api.Put("/users/settings", userH.UpdateSettings)
				api.Put("/users/password", userH.UpdatePassword)
				api.Delete("/users/account", userH.DeleteAccount)
			})

			// Storage upload gets its own separate 100MB body size limit
			storageH := storage.NewHandler(db)
			protected.With(httpx.LimitBodySize(100 * 1024 * 1024)).Post("/storage/upload", storageH.Upload)
		})
	})

	srv := &http.Server{
		Addr:              ":" + cfg.APIPort,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
		<-sig
		log.Println("shutting down api-gateway")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("shutdown error: %v", err)
		}
	}()

	log.Printf("api-gateway listening on :%s", cfg.APIPort)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("api-gateway failed: %v", err)
	}
}

func healthHandler(db *sqlx.DB, rdb *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		status := "ok"

		dbStatus := "ok"
		if db == nil {
			dbStatus = "unavailable"
			status = "degraded"
		} else if err := db.PingContext(r.Context()); err != nil {
			dbStatus = "down"
			status = "degraded"
		}

		redisStatus := "ok"
		if rdb == nil {
			redisStatus = "unavailable"
			status = "degraded"
		} else if err := rdb.Ping(r.Context()).Err(); err != nil {
			redisStatus = "down"
			status = "degraded"
		}

		code := http.StatusOK
		if status != "ok" {
			code = http.StatusServiceUnavailable
		}

		httpx.WriteJSON(w, code, map[string]string{
			"status":  status,
			"service": "api-gateway",
			"db":      dbStatus,
			"redis":   redisStatus,
		})
	}
}
