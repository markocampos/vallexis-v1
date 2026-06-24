package deploy

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	ErrInvalidSignature  = errors.New("invalid webhook signature")
	ErrEmptyPayload      = errors.New("webhook payload must not be empty")
	ErrEmptySecret       = errors.New("webhook secret must not be empty")
	ErrInvalidStatus     = errors.New("invalid deploy status")
	ErrInvalidTransition = errors.New("invalid status transition")
	ErrDeployInProgress  = errors.New("a deploy is already running for this project")
	ErrCommitSHAEmpty    = errors.New("commit SHA must not be empty")
	ErrCommitSHAInvalid  = errors.New("commit SHA must be a valid hex string (7-40 characters)")
	ErrProjectIDEmpty    = errors.New("project ID must not be empty")
)

const (
	StatusQueued  = "queued"
	StatusRunning = "running"
	StatusSuccess = "success"
	StatusFailed  = "failed"

	SignaturePrefix = "sha256="
)

var validTransitions = map[string][]string{
	StatusQueued:  {StatusRunning, StatusFailed},
	StatusRunning: {StatusSuccess, StatusFailed},
}

type Deploy struct {
	ID            string
	ProjectID     string
	CommitSHA     string
	CommitMessage string
	Status        string
	BuildLog      string
	DurationSecs  int
	StartedAt     *time.Time
	CompletedAt   *time.Time
	CreatedAt     time.Time
}

type WebhookPayload struct {
	Ref        string `json:"ref"`
	After      string `json:"after"`
	Repository struct {
		FullName string `json:"full_name"`
		CloneURL string `json:"clone_url"`
	} `json:"repository"`
	HeadCommit struct {
		Message string `json:"message"`
	} `json:"head_commit"`
}

func VerifyWebhookSignature(payload []byte, signature, secret string) error {
	if len(payload) == 0 {
		return ErrEmptyPayload
	}
	if secret == "" {
		return ErrEmptySecret
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expectedSig := SignaturePrefix + hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(signature), []byte(expectedSig)) {
		return ErrInvalidSignature
	}
	return nil
}

func ComputeSignature(payload []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	return SignaturePrefix + hex.EncodeToString(mac.Sum(nil))
}

func ValidateStatus(status string) error {
	switch status {
	case StatusQueued, StatusRunning, StatusSuccess, StatusFailed:
		return nil
	default:
		return ErrInvalidStatus
	}
}

func ValidateTransition(from, to string) error {
	if err := ValidateStatus(from); err != nil {
		return err
	}
	if err := ValidateStatus(to); err != nil {
		return err
	}
	allowed, ok := validTransitions[from]
	if !ok {
		return ErrInvalidTransition
	}
	for _, s := range allowed {
		if s == to {
			return nil
		}
	}
	return fmt.Errorf("%w: %s -> %s", ErrInvalidTransition, from, to)
}

func IsTerminal(status string) bool {
	return status == StatusSuccess || status == StatusFailed
}

func ValidateCommitSHA(sha string) error {
	if sha == "" {
		return ErrCommitSHAEmpty
	}
	if len(sha) < 7 || len(sha) > 40 {
		return ErrCommitSHAInvalid
	}
	for _, c := range sha {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')) {
			return ErrCommitSHAInvalid
		}
	}
	return nil
}

func ExtractBranch(ref string) string {
	const prefix = "refs/heads/"
	if strings.HasPrefix(ref, prefix) {
		return strings.TrimPrefix(ref, prefix)
	}
	return ref
}

func FormatDuration(secs int) string {
	if secs < 60 {
		return fmt.Sprintf("%ds", secs)
	}
	m := secs / 60
	s := secs % 60
	if s == 0 {
		return fmt.Sprintf("%dm", m)
	}
	return fmt.Sprintf("%dm%ds", m, s)
}

func FormatLogLine(ts time.Time, message string) string {
	return fmt.Sprintf("[%s] %s", ts.Format("15:04:05"), message)
}
