package deploy

import (
	"errors"
	"testing"
	"time"
)

func TestVerifyWebhookSignature(t *testing.T) {
	secret := "webhook-secret-key"
	payload := []byte(`{"ref":"refs/heads/main","after":"abc1234"}`)
	validSig := ComputeSignature(payload, secret)

	tests := []struct {
		name      string
		payload   []byte
		signature string
		secret    string
		wantErr   error
	}{
		{"valid signature", payload, validSig, secret, nil},
		{"empty payload", nil, validSig, secret, ErrEmptyPayload},
		{"empty payload bytes", []byte{}, validSig, secret, ErrEmptyPayload},
		{"empty secret", payload, validSig, "", ErrEmptySecret},
		{"wrong signature", payload, "sha256=0000000000", secret, ErrInvalidSignature},
		{"missing prefix", payload, "abc123", secret, ErrInvalidSignature},
		{"wrong secret", payload, validSig, "wrong-secret", ErrInvalidSignature},
		{"tampered payload", []byte(`{"ref":"refs/heads/dev"}`), validSig, secret, ErrInvalidSignature},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := VerifyWebhookSignature(tt.payload, tt.signature, tt.secret)
			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("VerifyWebhookSignature() = %v, want nil", err)
				}
			} else if err != tt.wantErr {
				t.Errorf("VerifyWebhookSignature() = %v, want %v", err, tt.wantErr)
			}
		})
	}
}

func TestComputeSignature(t *testing.T) {
	payload := []byte("test payload")
	secret := "secret"

	sig := ComputeSignature(payload, secret)
	if sig == "" {
		t.Error("ComputeSignature returned empty string")
	}
	if len(sig) <= len(SignaturePrefix) {
		t.Error("signature too short")
	}
	if sig[:len(SignaturePrefix)] != SignaturePrefix {
		t.Errorf("signature prefix = %q, want %q", sig[:len(SignaturePrefix)], SignaturePrefix)
	}

	// Same inputs produce same output
	sig2 := ComputeSignature(payload, secret)
	if sig != sig2 {
		t.Error("ComputeSignature is not deterministic")
	}

	// Different payload produces different signature
	sig3 := ComputeSignature([]byte("different"), secret)
	if sig == sig3 {
		t.Error("different payloads should produce different signatures")
	}
}

func TestValidateStatus(t *testing.T) {
	tests := []struct {
		status  string
		wantErr bool
	}{
		{StatusQueued, false},
		{StatusRunning, false},
		{StatusSuccess, false},
		{StatusFailed, false},
		{"invalid", true},
		{"", true},
	}

	for _, tt := range tests {
		t.Run(tt.status, func(t *testing.T) {
			err := ValidateStatus(tt.status)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateStatus(%q) error = %v, wantErr %v", tt.status, err, tt.wantErr)
			}
		})
	}
}

func TestValidateTransition(t *testing.T) {
	tests := []struct {
		name    string
		from    string
		to      string
		wantErr bool
	}{
		{"queued to running", StatusQueued, StatusRunning, false},
		{"queued to failed", StatusQueued, StatusFailed, false},
		{"running to success", StatusRunning, StatusSuccess, false},
		{"running to failed", StatusRunning, StatusFailed, false},
		{"queued to success", StatusQueued, StatusSuccess, true},
		{"success to running", StatusSuccess, StatusRunning, true},
		{"failed to running", StatusFailed, StatusRunning, true},
		{"success to failed", StatusSuccess, StatusFailed, true},
		{"invalid from", "invalid", StatusRunning, true},
		{"invalid to", StatusQueued, "invalid", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateTransition(tt.from, tt.to)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateTransition(%q, %q) error = %v, wantErr %v", tt.from, tt.to, err, tt.wantErr)
			}
		})
	}
}

func TestValidateTransition_ErrorWrapping(t *testing.T) {
	err := ValidateTransition(StatusQueued, StatusSuccess)
	if !errors.Is(err, ErrInvalidTransition) {
		t.Errorf("expected error to wrap ErrInvalidTransition, got %v", err)
	}
}

func TestIsTerminal(t *testing.T) {
	tests := []struct {
		status string
		want   bool
	}{
		{StatusQueued, false},
		{StatusRunning, false},
		{StatusSuccess, true},
		{StatusFailed, true},
	}

	for _, tt := range tests {
		t.Run(tt.status, func(t *testing.T) {
			got := IsTerminal(tt.status)
			if got != tt.want {
				t.Errorf("IsTerminal(%q) = %v, want %v", tt.status, got, tt.want)
			}
		})
	}
}

func TestValidateCommitSHA(t *testing.T) {
	tests := []struct {
		name    string
		sha     string
		wantErr error
	}{
		{"valid short SHA", "abc1234", nil},
		{"valid full SHA", "abc1234567890abc1234567890abc1234567890a", nil},
		{"empty", "", ErrCommitSHAEmpty},
		{"too short", "abc12", ErrCommitSHAInvalid},
		{"too long", "abc1234567890abc1234567890abc1234567890ab", ErrCommitSHAInvalid},
		{"uppercase hex", "ABC1234", ErrCommitSHAInvalid},
		{"non-hex chars", "xyz1234", ErrCommitSHAInvalid},
		{"spaces", "abc 123", ErrCommitSHAInvalid},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateCommitSHA(tt.sha)
			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("ValidateCommitSHA(%q) = %v, want nil", tt.sha, err)
				}
			} else if err != tt.wantErr {
				t.Errorf("ValidateCommitSHA(%q) = %v, want %v", tt.sha, err, tt.wantErr)
			}
		})
	}
}

func TestExtractBranch(t *testing.T) {
	tests := []struct {
		ref  string
		want string
	}{
		{"refs/heads/main", "main"},
		{"refs/heads/feature/login", "feature/login"},
		{"refs/heads/develop", "develop"},
		{"main", "main"},
		{"", ""},
	}

	for _, tt := range tests {
		t.Run(tt.ref, func(t *testing.T) {
			got := ExtractBranch(tt.ref)
			if got != tt.want {
				t.Errorf("ExtractBranch(%q) = %q, want %q", tt.ref, got, tt.want)
			}
		})
	}
}

func TestFormatDuration(t *testing.T) {
	tests := []struct {
		secs int
		want string
	}{
		{0, "0s"},
		{5, "5s"},
		{59, "59s"},
		{60, "1m"},
		{61, "1m1s"},
		{120, "2m"},
		{125, "2m5s"},
		{3600, "60m"},
	}

	for _, tt := range tests {
		t.Run(tt.want, func(t *testing.T) {
			got := FormatDuration(tt.secs)
			if got != tt.want {
				t.Errorf("FormatDuration(%d) = %q, want %q", tt.secs, got, tt.want)
			}
		})
	}
}

func TestFormatLogLine(t *testing.T) {
	ts := time.Date(2026, 6, 23, 15, 30, 5, 0, time.UTC)
	got := FormatLogLine(ts, "Building Docker image...")
	want := "[15:30:05] Building Docker image..."
	if got != want {
		t.Errorf("FormatLogLine() = %q, want %q", got, want)
	}
}
