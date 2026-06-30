package config

import (
	"log"
	"os"
)

type Config struct {
	DatabaseURL            string
	RedisURL               string
	APIPort                string
	DeployPort             string
	PaymentPort            string
	SEOPort                string
	APIEnv                 string
	JWTPrivateKeyPath      string
	JWTPublicKeyPath       string
	CORSAllowedOrigins     string
	FrontendURL            string
	OAuthRedirectBase      string
	GitHubClientID         string
	GitHubClientSecret     string
	GoogleClientID         string
	GoogleClientSecret     string
	PayMongoSecretKey      string
	PayMongoPublicKey      string
	PayMongoWebhookSec     string
	PayMongoProPriceID     string
	PayMongoStarterPriceID string
}

func Load() Config {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Println("WARNING: DATABASE_URL not set, using default development value")
		dbURL = "postgres://vallexis:vallexis@localhost:5432/vallexis_db?sslmode=disable"
	}

	return Config{
		DatabaseURL:        dbURL,
		RedisURL:           envOrDefault("REDIS_URL", "redis://localhost:6379/0"),
		APIPort:            envOrDefault("API_PORT", "3000"),
		DeployPort:         envOrDefault("DEPLOY_PORT", "3001"),
		PaymentPort:        envOrDefault("PAYMENT_PORT", "3002"),
		SEOPort:            envOrDefault("SEO_PORT", "3003"),
		APIEnv:             envOrDefault("API_ENV", "development"),
		JWTPrivateKeyPath:  envOrDefault("JWT_PRIVATE_KEY_PATH", "./secrets/jwt_private.pem"),
		JWTPublicKeyPath:   envOrDefault("JWT_PUBLIC_KEY_PATH", "./secrets/jwt_public.pem"),
		CORSAllowedOrigins: envOrDefault("CORS_ALLOWED_ORIGINS", "http://localhost:5173"),
		FrontendURL:        envOrDefault("FRONTEND_URL", "http://localhost:5173"),
		OAuthRedirectBase:  envOrDefault("OAUTH_REDIRECT_BASE_URL", "http://localhost:3000"),
		GitHubClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		GitHubClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		PayMongoSecretKey:  os.Getenv("PAYMONGO_SECRET_KEY"),
		PayMongoPublicKey:  os.Getenv("PAYMONGO_PUBLIC_KEY"),
		PayMongoWebhookSec: os.Getenv("PAYMONGO_WEBHOOK_SECRET"),
		PayMongoProPriceID:     os.Getenv("PAYMONGO_PRO_PRICE_ID"),
		PayMongoStarterPriceID: os.Getenv("PAYMONGO_STARTER_PRICE_ID"),
	}
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
