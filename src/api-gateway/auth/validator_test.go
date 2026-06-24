package auth

import (
	"testing"
)

func TestValidateEmail(t *testing.T) {
	tests := []struct {
		name    string
		email   string
		wantErr error
	}{
		{"valid email", "user@example.com", nil},
		{"valid with subdomain", "user@sub.example.com", nil},
		{"valid with plus", "user+tag@example.com", nil},
		{"empty", "", ErrEmailEmpty},
		{"no at sign", "userexample.com", ErrInvalidEmail},
		{"no domain", "user@", ErrInvalidEmail},
		{"only at sign", "@", ErrInvalidEmail},
		{"spaces", "user @example.com", ErrInvalidEmail},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateEmail(tt.email)
			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("ValidateEmail(%q) = %v, want nil", tt.email, err)
				}
			} else if err != tt.wantErr {
				t.Errorf("ValidateEmail(%q) = %v, want %v", tt.email, err, tt.wantErr)
			}
		})
	}
}

func TestValidateRegisterRequest(t *testing.T) {
	tests := []struct {
		name       string
		req        RegisterRequest
		wantErrCnt int
	}{
		{
			"valid request",
			RegisterRequest{Email: "user@example.com", Password: "SecurePass123!", Name: "Jane Doe"},
			0,
		},
		{
			"all fields empty",
			RegisterRequest{},
			3, // email + password + name
		},
		{
			"bad email only",
			RegisterRequest{Email: "bad", Password: "SecurePass123!", Name: "Jane"},
			1,
		},
		{
			"bad password only",
			RegisterRequest{Email: "a@b.com", Password: "short", Name: "Jane"},
			1,
		},
		{
			"whitespace name",
			RegisterRequest{Email: "a@b.com", Password: "SecurePass123!", Name: "   "},
			1,
		},
		{
			"multiple errors",
			RegisterRequest{Email: "", Password: "", Name: ""},
			3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := ValidateRegisterRequest(tt.req)
			if len(errs) != tt.wantErrCnt {
				t.Errorf("ValidateRegisterRequest() returned %d errors, want %d: %v", len(errs), tt.wantErrCnt, errs)
			}
		})
	}
}

func TestValidateLoginRequest(t *testing.T) {
	tests := []struct {
		name       string
		req        LoginRequest
		wantErrCnt int
	}{
		{
			"valid request",
			LoginRequest{Email: "user@example.com", Password: "anything"},
			0,
		},
		{
			"empty email",
			LoginRequest{Email: "", Password: "pass"},
			1,
		},
		{
			"empty password",
			LoginRequest{Email: "a@b.com", Password: ""},
			1,
		},
		{
			"both empty",
			LoginRequest{Email: "", Password: ""},
			2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := ValidateLoginRequest(tt.req)
			if len(errs) != tt.wantErrCnt {
				t.Errorf("ValidateLoginRequest() returned %d errors, want %d: %v", len(errs), tt.wantErrCnt, errs)
			}
		})
	}
}
