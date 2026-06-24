package auth

import (
	"testing"
)

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  error
	}{
		{"valid password", "SecurePass123!", nil},
		{"valid complex", "MyP@ssw0rd!!xy", nil},
		{"empty", "", ErrPasswordEmpty},
		{"too short", "Short1!aB", ErrPasswordTooShort},
		{"exactly 11 chars", "Abcdefgh1!x", ErrPasswordTooShort},
		{"exactly 12 chars", "Abcdefgh1!xy", nil},
		{"no uppercase", "securepass123!", ErrPasswordNoUpper},
		{"no lowercase", "SECUREPASS123!", ErrPasswordNoLower},
		{"no digit", "SecurePassword!", ErrPasswordNoDigit},
		{"no special char", "SecurePass1234", ErrPasswordNoSpecial},
		{"unicode special", "SecurePass123§", nil},
		{"long password", "ABCDefgh1234!@#$%^&*()", nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePassword(tt.password)
			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("ValidatePassword(%q) = %v, want nil", tt.password, err)
				}
			} else {
				if err == nil {
					t.Errorf("ValidatePassword(%q) = nil, want %v", tt.password, tt.wantErr)
				} else if err != tt.wantErr {
					t.Errorf("ValidatePassword(%q) = %v, want %v", tt.password, err, tt.wantErr)
				}
			}
		})
	}
}

func TestHashPassword(t *testing.T) {
	svc := NewService(Config{BcryptCost: 4}) // low cost for fast tests

	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{"valid password", "SecurePass123!", false},
		{"empty password", "", true},
		{"too short", "abc", true},
		{"no special char", "SecurePass1234", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := svc.HashPassword(tt.password)
			if tt.wantErr {
				if err == nil {
					t.Errorf("HashPassword(%q) = nil error, want error", tt.password)
				}
				if hash != "" {
					t.Errorf("HashPassword(%q) returned non-empty hash on error", tt.password)
				}
			} else {
				if err != nil {
					t.Errorf("HashPassword(%q) = %v, want nil", tt.password, err)
				}
				if hash == "" {
					t.Error("HashPassword returned empty hash")
				}
			}
		})
	}
}

func TestVerifyPassword(t *testing.T) {
	svc := NewService(Config{BcryptCost: 4})

	password := "SecurePass123!"
	hash, err := svc.HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	tests := []struct {
		name     string
		hash     string
		password string
		wantErr  error
	}{
		{"correct password", hash, password, nil},
		{"wrong password", hash, "WrongPass123!", ErrInvalidCredentials},
		{"empty password", hash, "", ErrInvalidCredentials},
		{"invalid hash", "not-a-hash", password, ErrInvalidCredentials},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := svc.VerifyPassword(tt.hash, tt.password)
			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("VerifyPassword() = %v, want nil", err)
				}
			} else if err != tt.wantErr {
				t.Errorf("VerifyPassword() = %v, want %v", err, tt.wantErr)
			}
		})
	}
}

func TestHashPassword_UniqueHashes(t *testing.T) {
	svc := NewService(Config{BcryptCost: 4})
	password := "SecurePass123!"

	hash1, err := svc.HashPassword(password)
	if err != nil {
		t.Fatal(err)
	}
	hash2, err := svc.HashPassword(password)
	if err != nil {
		t.Fatal(err)
	}

	if hash1 == hash2 {
		t.Error("same password should produce different hashes (bcrypt salt)")
	}
}

func TestGenerateRefreshToken(t *testing.T) {
	token1, err := GenerateRefreshToken()
	if err != nil {
		t.Fatalf("GenerateRefreshToken() error: %v", err)
	}
	if token1 == "" {
		t.Error("GenerateRefreshToken() returned empty string")
	}

	token2, err := GenerateRefreshToken()
	if err != nil {
		t.Fatal(err)
	}
	if token1 == token2 {
		t.Error("two calls should produce different tokens")
	}

	// base64url encoded 32 bytes = 44 chars
	if len(token1) != 44 {
		t.Errorf("token length = %d, want 44", len(token1))
	}
}

func TestNewService_Defaults(t *testing.T) {
	svc := NewService(Config{})
	if svc.cfg.BcryptCost != DefaultBcryptCost {
		t.Errorf("BcryptCost = %d, want %d", svc.cfg.BcryptCost, DefaultBcryptCost)
	}
	if svc.cfg.AccessTokenTTL != DefaultAccessTokenTTL {
		t.Errorf("AccessTokenTTL = %v, want %v", svc.cfg.AccessTokenTTL, DefaultAccessTokenTTL)
	}
	if svc.cfg.RefreshTTLDays != DefaultRefreshTTLDays {
		t.Errorf("RefreshTTLDays = %d, want %d", svc.cfg.RefreshTTLDays, DefaultRefreshTTLDays)
	}
}

func TestAccessTokenTTLSeconds(t *testing.T) {
	svc := NewService(DefaultConfig())
	got := svc.AccessTokenTTLSeconds()
	want := 900 // 15 minutes
	if got != want {
		t.Errorf("AccessTokenTTLSeconds() = %d, want %d", got, want)
	}
}

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()
	if cfg.BcryptCost != DefaultBcryptCost {
		t.Errorf("BcryptCost = %d, want %d", cfg.BcryptCost, DefaultBcryptCost)
	}
	if cfg.AccessTokenTTL != DefaultAccessTokenTTL {
		t.Errorf("AccessTokenTTL = %v, want %v", cfg.AccessTokenTTL, DefaultAccessTokenTTL)
	}
	if cfg.RefreshTTLDays != DefaultRefreshTTLDays {
		t.Errorf("RefreshTTLDays = %d, want %d", cfg.RefreshTTLDays, DefaultRefreshTTLDays)
	}
}
