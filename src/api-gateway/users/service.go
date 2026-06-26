package users

import (
	"errors"
	"fmt"
)

var (
	ErrNameEmpty     = errors.New("name must not be empty")
	ErrNameTooLong   = errors.New("name must be 128 characters or fewer")
	ErrInvalidPlan   = errors.New("invalid plan")
	ErrStorageExceed = errors.New("storage limit exceeded")
)

const (
	MaxNameLength = 128

	PlanFree       = "free"
	PlanStarter    = "starter"
	PlanPro        = "pro"
	PlanEnterprise = "enterprise"

	StorageLimitFree       int64 = 2 * 1024 * 1024 * 1024   // 2 GB
	StorageLimitStarter    int64 = 5 * 1024 * 1024 * 1024   // 5 GB
	StorageLimitPro        int64 = 20 * 1024 * 1024 * 1024  // 10 GB per project, 2 projects = 20 GB
	StorageLimitEnterprise int64 = 50 * 1024 * 1024 * 1024  // 50 GB
)

var validPlans = map[string]bool{
	PlanFree: true, PlanStarter: true, PlanPro: true, PlanEnterprise: true,
}

func ValidatePlan(plan string) error {
	if !validPlans[plan] {
		return ErrInvalidPlan
	}
	return nil
}

func StorageLimit(plan string) (int64, error) {
	switch plan {
	case PlanFree:
		return StorageLimitFree, nil
	case PlanStarter:
		return StorageLimitStarter, nil
	case PlanPro:
		return StorageLimitPro, nil
	case PlanEnterprise:
		return StorageLimitEnterprise, nil
	default:
		return 0, ErrInvalidPlan
	}
}

func CheckStorageQuota(plan string, usedBytes, additionalBytes int64) error {
	limit, err := StorageLimit(plan)
	if err != nil {
		return err
	}
	if usedBytes+additionalBytes > limit {
		return ErrStorageExceed
	}
	return nil
}

func FormatBytes(b int64) string {
	const (
		kb = 1024
		mb = kb * 1024
		gb = mb * 1024
		tb = gb * 1024
	)
	switch {
	case b >= tb:
		return fmt.Sprintf("%.1f TB", float64(b)/float64(tb))
	case b >= gb:
		return fmt.Sprintf("%.1f GB", float64(b)/float64(gb))
	case b >= mb:
		return fmt.Sprintf("%.1f MB", float64(b)/float64(mb))
	case b >= kb:
		return fmt.Sprintf("%.1f KB", float64(b)/float64(kb))
	default:
		return fmt.Sprintf("%d B", b)
	}
}

func StorageUsagePercent(usedBytes int64, plan string) (float64, error) {
	limit, err := StorageLimit(plan)
	if err != nil {
		return 0, err
	}
	if limit == 0 {
		return 0, nil
	}
	return float64(usedBytes) / float64(limit) * 100, nil
}

type UpdateProfileRequest struct {
	Name string
}

func ValidateUpdateProfile(req UpdateProfileRequest) error {
	if req.Name != "" && len(req.Name) > MaxNameLength {
		return ErrNameTooLong
	}
	return nil
}
