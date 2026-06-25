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
	"github.com/markocampos/vallexis-v1/src/api-gateway/projects"
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

	r := httpx.NewRouter()

	r.Get("/api/health", healthHandler(db, rdb))

	r.Route("/api/v1", func(v1 chi.Router) {
		authSvc := auth.NewService(auth.DefaultConfig())
		authH := auth.NewHandler(authSvc, db, privateKey)
		v1.Post("/auth/register", authH.Register)
		v1.Post("/auth/login", authH.Login)

		v1.Group(func(protected chi.Router) {
			protected.Use(auth.RequireAuth(publicKey))

			projH := projects.NewHandler(db)
			protected.Post("/projects", projH.Create)

			userH := users.NewHandler(db)
			protected.Get("/users/me", userH.GetMe)
			protected.Patch("/users/me", userH.UpdateMe)
		})
	})

	srv := &http.Server{
		Addr:         ":" + cfg.APIPort,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
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
