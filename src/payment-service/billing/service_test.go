package billing

import (
	"errors"
	"testing"
	"time"
)

func TestValidatePlan(t *testing.T) {
	tests := []struct {
		plan    string
		wantErr bool
	}{
		{PlanFree, false},
		{PlanPro, false},
		{PlanEnterprise, false},
		{"invalid", true},
		{"", true},
		{"FREE", true},
	}

	for _, tt := range tests {
		t.Run(tt.plan, func(t *testing.T) {
			err := ValidatePlan(tt.plan)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePlan(%q) error = %v, wantErr %v", tt.plan, err, tt.wantErr)
			}
		})
	}
}

func TestValidateInterval(t *testing.T) {
	tests := []struct {
		interval string
		wantErr  bool
	}{
		{IntervalMonthly, false},
		{IntervalYearly, false},
		{"weekly", true},
		{"", true},
	}

	for _, tt := range tests {
		t.Run(tt.interval, func(t *testing.T) {
			err := ValidateInterval(tt.interval)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateInterval(%q) error = %v, wantErr %v", tt.interval, err, tt.wantErr)
			}
		})
	}
}

func TestValidateCheckoutRequest(t *testing.T) {
	tests := []struct {
		name       string
		req        CheckoutRequest
		wantErrCnt int
	}{
		{
			"valid pro monthly",
			CheckoutRequest{Plan: PlanPro, Interval: IntervalMonthly},
			0,
		},
		{
			"valid enterprise yearly",
			CheckoutRequest{Plan: PlanEnterprise, Interval: IntervalYearly},
			0,
		},
		{
			"free plan not allowed",
			CheckoutRequest{Plan: PlanFree, Interval: IntervalMonthly},
			1,
		},
		{
			"invalid plan",
			CheckoutRequest{Plan: "invalid", Interval: IntervalMonthly},
			1,
		},
		{
			"invalid interval",
			CheckoutRequest{Plan: PlanPro, Interval: "weekly"},
			1,
		},
		{
			"both invalid",
			CheckoutRequest{Plan: "invalid", Interval: "weekly"},
			2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := ValidateCheckoutRequest(tt.req)
			if len(errs) != tt.wantErrCnt {
				t.Errorf("ValidateCheckoutRequest() returned %d errors, want %d: %v", len(errs), tt.wantErrCnt, errs)
			}
		})
	}
}

func TestPlanAmount(t *testing.T) {
	tests := []struct {
		name     string
		plan     string
		interval string
		want     int
		wantErr  bool
	}{
		{"pro monthly", PlanPro, IntervalMonthly, ProMonthlyCents, false},
		{"pro yearly", PlanPro, IntervalYearly, ProYearlyCents, false},
		{"enterprise monthly", PlanEnterprise, IntervalMonthly, EnterpriseMonthlyCents, false},
		{"enterprise yearly", PlanEnterprise, IntervalYearly, EnterpriseYearlyCents, false},
		{"free plan", PlanFree, IntervalMonthly, 0, false},
		{"invalid plan", "invalid", IntervalMonthly, 0, true},
		{"invalid interval", PlanPro, "weekly", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := PlanAmount(tt.plan, tt.interval)
			if (err != nil) != tt.wantErr {
				t.Errorf("PlanAmount() error = %v, wantErr %v", err, tt.wantErr)
			}
			if got != tt.want {
				t.Errorf("PlanAmount() = %d, want %d", got, tt.want)
			}
		})
	}
}

func TestFormatAmount(t *testing.T) {
	tests := []struct {
		cents    int
		currency string
		want     string
	}{
		{49900, CurrencyPHP, "₱499.00"},
		{100, CurrencyUSD, "$1.00"},
		{9999, CurrencyPHP, "₱99.99"},
		{0, CurrencyUSD, "$0.00"},
		{1, CurrencyPHP, "₱0.01"},
		{100, "eur", "EUR 1.00"},
	}

	for _, tt := range tests {
		t.Run(tt.want, func(t *testing.T) {
			got := FormatAmount(tt.cents, tt.currency)
			if got != tt.want {
				t.Errorf("FormatAmount(%d, %q) = %q, want %q", tt.cents, tt.currency, got, tt.want)
			}
		})
	}
}

func TestCurrencySymbol(t *testing.T) {
	tests := []struct {
		currency string
		want     string
	}{
		{CurrencyPHP, "₱"},
		{CurrencyUSD, "$"},
		{"PHP", "₱"},
		{"USD", "$"},
		{"eur", "EUR "},
		{"", " "},
	}

	for _, tt := range tests {
		t.Run(tt.currency, func(t *testing.T) {
			got := CurrencySymbol(tt.currency)
			if got != tt.want {
				t.Errorf("CurrencySymbol(%q) = %q, want %q", tt.currency, got, tt.want)
			}
		})
	}
}

func TestValidateSubscriptionStatus(t *testing.T) {
	tests := []struct {
		status  string
		wantErr bool
	}{
		{StatusActive, false},
		{StatusPastDue, false},
		{StatusCanceled, false},
		{StatusTrialing, false},
		{"invalid", true},
		{"", true},
	}

	for _, tt := range tests {
		t.Run(tt.status, func(t *testing.T) {
			err := ValidateSubscriptionStatus(tt.status)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateSubscriptionStatus(%q) error = %v, wantErr %v", tt.status, err, tt.wantErr)
			}
		})
	}
}

func TestValidateStatusTransition(t *testing.T) {
	tests := []struct {
		name    string
		from    string
		to      string
		wantErr bool
	}{
		{"trialing to active", StatusTrialing, StatusActive, false},
		{"trialing to canceled", StatusTrialing, StatusCanceled, false},
		{"active to past_due", StatusActive, StatusPastDue, false},
		{"active to canceled", StatusActive, StatusCanceled, false},
		{"past_due to active", StatusPastDue, StatusActive, false},
		{"past_due to canceled", StatusPastDue, StatusCanceled, false},
		{"canceled to active", StatusCanceled, StatusActive, true},
		{"active to trialing", StatusActive, StatusTrialing, true},
		{"invalid from", "invalid", StatusActive, true},
		{"invalid to", StatusActive, "invalid", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateStatusTransition(tt.from, tt.to)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateStatusTransition(%q, %q) error = %v, wantErr %v", tt.from, tt.to, err, tt.wantErr)
			}
		})
	}
}

func TestValidateStatusTransition_ErrorWrapping(t *testing.T) {
	err := ValidateStatusTransition(StatusCanceled, StatusActive)
	if !errors.Is(err, ErrInvalidTransition) {
		t.Errorf("expected error to wrap ErrInvalidTransition, got %v", err)
	}
}

func TestCanUpgrade(t *testing.T) {
	tests := []struct {
		name    string
		current string
		target  string
		wantErr error
	}{
		{"free to pro", PlanFree, PlanPro, nil},
		{"free to enterprise", PlanFree, PlanEnterprise, nil},
		{"pro to enterprise", PlanPro, PlanEnterprise, nil},
		{"same plan", PlanPro, PlanPro, ErrAlreadyOnPlan},
		{"downgrade pro to free", PlanPro, PlanFree, ErrDowngradeNotImpl},
		{"downgrade enterprise to pro", PlanEnterprise, PlanPro, ErrDowngradeNotImpl},
		{"invalid current", "invalid", PlanPro, ErrInvalidPlan},
		{"invalid target", PlanFree, "invalid", ErrInvalidPlan},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := CanUpgrade(tt.current, tt.target)
			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("CanUpgrade(%q, %q) = %v, want nil", tt.current, tt.target, err)
				}
			} else if err != tt.wantErr {
				t.Errorf("CanUpgrade(%q, %q) = %v, want %v", tt.current, tt.target, err, tt.wantErr)
			}
		})
	}
}

func TestValidateCurrency(t *testing.T) {
	tests := []struct {
		currency string
		wantErr  bool
	}{
		{"php", false},
		{"usd", false},
		{"PHP", false},
		{"USD", false},
		{"eur", true},
		{"", true},
	}

	for _, tt := range tests {
		t.Run(tt.currency, func(t *testing.T) {
			err := ValidateCurrency(tt.currency)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateCurrency(%q) error = %v, wantErr %v", tt.currency, err, tt.wantErr)
			}
		})
	}
}

func TestNextBillingDate(t *testing.T) {
	base := time.Date(2026, 6, 23, 0, 0, 0, 0, time.UTC)

	tests := []struct {
		interval string
		want     time.Time
	}{
		{IntervalMonthly, time.Date(2026, 7, 23, 0, 0, 0, 0, time.UTC)},
		{IntervalYearly, time.Date(2027, 6, 23, 0, 0, 0, 0, time.UTC)},
		{"invalid", base}, // returns unchanged
	}

	for _, tt := range tests {
		t.Run(tt.interval, func(t *testing.T) {
			got := NextBillingDate(base, tt.interval)
			if !got.Equal(tt.want) {
				t.Errorf("NextBillingDate() = %v, want %v", got, tt.want)
			}
		})
	}
}
