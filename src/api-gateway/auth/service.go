package auth

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"time"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrPasswordTooShort   = errors.New("password must be at least 12 characters")
	ErrPasswordEmpty      = errors.New("password must not be empty")
	ErrPasswordNoUpper    = errors.New("password must include at least one uppercase letter")
	ErrPasswordNoLower    = errors.New("password must include at least one lowercase letter")
	ErrPasswordNoDigit    = errors.New("password must include at least one number")
	ErrPasswordNoSpecial  = errors.New("password must include at least one special character")
	ErrInvalidCredentials = errors.New("email or password is incorrect")
	ErrTokenExpired       = errors.New("token has expired")
	ErrInvalidEmail       = errors.New("invalid email address")
	ErrEmailEmpty         = errors.New("email must not be empty")
	ErrNameEmpty          = errors.New("name must not be empty")
)

const (
	DefaultBcryptCost     = 12
	DefaultAccessTokenTTL = 15 * time.Minute
	DefaultRefreshTTLDays = 7
	MinPasswordLength     = 12
	RefreshTokenBytes     = 32
)

type Config struct {
	BcryptCost     int
	AccessTokenTTL time.Duration
	RefreshTTLDays int
}

func DefaultConfig() Config {
	return Config{
		BcryptCost:     DefaultBcryptCost,
		AccessTokenTTL: DefaultAccessTokenTTL,
		RefreshTTLDays: DefaultRefreshTTLDays,
	}
}

type TokenPair struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    int
}

type Service struct {
	cfg Config
}

func NewService(cfg Config) *Service {
	if cfg.BcryptCost == 0 {
		cfg.BcryptCost = DefaultBcryptCost
	}
	if cfg.AccessTokenTTL == 0 {
		cfg.AccessTokenTTL = DefaultAccessTokenTTL
	}
	if cfg.RefreshTTLDays == 0 {
		cfg.RefreshTTLDays = DefaultRefreshTTLDays
	}
	return &Service{cfg: cfg}
}

func ValidatePassword(password string) error {
	if password == "" {
		return ErrPasswordEmpty
	}
	if len(password) < MinPasswordLength {
		return ErrPasswordTooShort
	}

	var hasUpper, hasLower, hasDigit, hasSpecial bool
	for _, ch := range password {
		switch {
		case unicode.IsUpper(ch):
			hasUpper = true
		case unicode.IsLower(ch):
			hasLower = true
		case unicode.IsDigit(ch):
			hasDigit = true
		case unicode.IsPunct(ch) || unicode.IsSymbol(ch):
			hasSpecial = true
		}
	}

	if !hasUpper {
		return ErrPasswordNoUpper
	}
	if !hasLower {
		return ErrPasswordNoLower
	}
	if !hasDigit {
		return ErrPasswordNoDigit
	}
	if !hasSpecial {
		return ErrPasswordNoSpecial
	}
	return nil
}

func (s *Service) HashPassword(password string) (string, error) {
	if err := ValidatePassword(password); err != nil {
		return "", err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), s.cfg.BcryptCost)
	if err != nil {
		return "", fmt.Errorf("bcrypt hash: %w", err)
	}
	return string(hash), nil
}

func (s *Service) VerifyPassword(hash, password string) error {
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		return ErrInvalidCredentials
	}
	return nil
}

func GenerateRefreshToken() (string, error) {
	b := make([]byte, RefreshTokenBytes)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate refresh token: %w", err)
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func (s *Service) AccessTokenTTLSeconds() int {
	return int(s.cfg.AccessTokenTTL.Seconds())
}

func (s *Service) RefreshTokenExpiry() time.Time {
	return time.Now().Add(time.Duration(s.cfg.RefreshTTLDays) * 24 * time.Hour)
}
