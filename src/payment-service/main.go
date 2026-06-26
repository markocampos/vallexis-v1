package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/markocampos/vallexis-v1/src/internal/config"
	"github.com/markocampos/vallexis-v1/src/internal/httpx"
)

func main() {
	cfg := config.Load()

	r := httpx.NewRouter(cfg.CORSAllowedOrigins)
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]string{
			"status":  "ok",
			"service": "payment-service",
		})
	})

	srv := &http.Server{
		Addr:         ":" + cfg.PaymentPort,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
		<-sig
		log.Println("shutting down payment-service")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("shutdown error: %v", err)
		}
	}()

	log.Printf("payment-service listening on :%s", cfg.PaymentPort)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("payment-service failed: %v", err)
	}
}
