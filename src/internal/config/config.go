package config

import "os"

type Config struct {
	DatabaseURL        string
	RedisURL           string
	APIPort            string
	DeployPort         string
	PaymentPort        string
	SEOPort            string
	APIEnv             string
	JWTPrivateKeyPath  string
	JWTPublicKeyPath   string
	CORSAllowedOrigins string
}

func Load() Config {
	return Config{
		DatabaseURL:        envOrDefault("DATABASE_URL", "postgres://vallexis:vallexis@localhost:5432/vallexis_db?sslmode=disable"),
		RedisURL:           envOrDefault("REDIS_URL", "redis://localhost:6379/0"),
		APIPort:            envOrDefault("API_PORT", "3000"),
		DeployPort:         envOrDefault("DEPLOY_PORT", "3001"),
		PaymentPort:        envOrDefault("PAYMENT_PORT", "3002"),
		SEOPort:            envOrDefault("SEO_PORT", "3003"),
		APIEnv:             envOrDefault("API_ENV", "development"),
		JWTPrivateKeyPath:  envOrDefault("JWT_PRIVATE_KEY_PATH", "./secrets/jwt_private.pem"),
		JWTPublicKeyPath:   envOrDefault("JWT_PUBLIC_KEY_PATH", "./secrets/jwt_public.pem"),
		CORSAllowedOrigins: envOrDefault("CORS_ALLOWED_ORIGINS", "http://localhost:5173"),
	}
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
