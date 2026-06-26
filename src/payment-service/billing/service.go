package billing

import (
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	ErrInvalidPlan       = errors.New("invalid plan")
	ErrInvalidInterval   = errors.New("interval must be 'monthly' or 'yearly'")
	ErrInvalidStatus     = errors.New("invalid subscription status")
	ErrInvalidTransition = errors.New("invalid subscription status transition")
	ErrAlreadyOnPlan     = errors.New("user is already on the requested plan")
	ErrDowngradeNotImpl  = errors.New("direct downgrades are not supported; cancel and re-subscribe")
	ErrInvalidAmount     = errors.New("amount must be positive")
	ErrInvalidCurrency   = errors.New("unsupported currency")
)

const (
	PlanFree       = "free"
	PlanPro        = "pro"
	PlanEnterprise = "enterprise"

	IntervalMonthly = "monthly"
	IntervalYearly  = "yearly"

	StatusActive   = "active"
	StatusPastDue  = "past_due"
	StatusCanceled = "canceled"
	StatusTrialing = "trialing"

	CurrencyPHP = "php"
	CurrencyUSD = "usd"

	ProMonthlyCents        = 49900  // ₱499
	ProYearlyCents         = 499000 // ₱4,990 (2 months free)
	EnterpriseMonthlyCents = 99900
	EnterpriseYearlyCents  = 999000
)

var (
	validPlans = map[string]bool{
		PlanFree: true, PlanPro: true, PlanEnterprise: true,
	}
	validIntervals = map[string]bool{
		IntervalMonthly: true, IntervalYearly: true,
	}
	validStatuses = map[string]bool{
		StatusActive: true, StatusPastDue: true,
		StatusCanceled: true, StatusTrialing: true,
	}
	validCurrencies = map[string]bool{
		CurrencyPHP: true, CurrencyUSD: true,
	}
	planRank = map[string]int{
		PlanFree: 0, PlanPro: 1, PlanEnterprise: 2,
	}
	validSubTransitions = map[string][]string{
		StatusTrialing: {StatusActive, StatusCanceled},
		StatusActive:   {StatusPastDue, StatusCanceled},
		StatusPastDue:  {StatusActive, StatusCanceled},
	}
)

type CheckoutRequest struct {
	Plan     string
	Interval string
}

type Invoice struct {
	ID          string
	UserID      string
	AmountCents int
	Currency    string
	Status      string
	CreatedAt   time.Time
}

func ValidatePlan(plan string) error {
	if !validPlans[plan] {
		return ErrInvalidPlan
	}
	return nil
}

func ValidateInterval(interval string) error {
	if !validIntervals[interval] {
		return ErrInvalidInterval
	}
	return nil
}

func ValidateCheckoutRequest(req CheckoutRequest) []error {
	var errs []error
	if err := ValidatePlan(req.Plan); err != nil {
		errs = append(errs, err)
	} else if req.Plan == PlanFree {
		errs = append(errs, fmt.Errorf("cannot checkout for free plan"))
	}
	if err := ValidateInterval(req.Interval); err != nil {
		errs = append(errs, err)
	}
	return errs
}

func PlanAmount(plan, interval string) (int, error) {
	if err := ValidatePlan(plan); err != nil {
		return 0, err
	}
	if err := ValidateInterval(interval); err != nil {
		return 0, err
	}
	switch {
	case plan == PlanPro && interval == IntervalMonthly:
		return ProMonthlyCents, nil
	case plan == PlanPro && interval == IntervalYearly:
		return ProYearlyCents, nil
	case plan == PlanEnterprise && interval == IntervalMonthly:
		return EnterpriseMonthlyCents, nil
	case plan == PlanEnterprise && interval == IntervalYearly:
		return EnterpriseYearlyCents, nil
	case plan == PlanFree:
		return 0, nil
	default:
		return 0, ErrInvalidPlan
	}
}

func FormatAmount(cents int, currency string) string {
	major := cents / 100
	minor := cents % 100
	symbol := CurrencySymbol(currency)
	return fmt.Sprintf("%s%d.%02d", symbol, major, minor)
}

func CurrencySymbol(currency string) string {
	switch strings.ToLower(currency) {
	case CurrencyPHP:
		return "₱"
	case CurrencyUSD:
		return "$"
	default:
		return strings.ToUpper(currency) + " "
	}
}

func ValidateSubscriptionStatus(status string) error {
	if !validStatuses[status] {
		return ErrInvalidStatus
	}
	return nil
}

func ValidateStatusTransition(from, to string) error {
	if err := ValidateSubscriptionStatus(from); err != nil {
		return err
	}
	if err := ValidateSubscriptionStatus(to); err != nil {
		return err
	}
	allowed, ok := validSubTransitions[from]
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

func CanUpgrade(currentPlan, targetPlan string) error {
	if err := ValidatePlan(currentPlan); err != nil {
		return err
	}
	if err := ValidatePlan(targetPlan); err != nil {
		return err
	}
	if currentPlan == targetPlan {
		return ErrAlreadyOnPlan
	}
	if planRank[targetPlan] < planRank[currentPlan] {
		return ErrDowngradeNotImpl
	}
	return nil
}

func ValidateCurrency(currency string) error {
	if !validCurrencies[strings.ToLower(currency)] {
		return ErrInvalidCurrency
	}
	return nil
}

func NextBillingDate(from time.Time, interval string) time.Time {
	switch interval {
	case IntervalMonthly:
		return from.AddDate(0, 1, 0)
	case IntervalYearly:
		return from.AddDate(1, 0, 0)
	default:
		return from
	}
}
