package projects

import (
	"errors"
	"regexp"
	"strings"
)

var (
	ErrNameEmpty         = errors.New("project name must not be empty")
	ErrNameTooLong       = errors.New("project name must be 64 characters or fewer")
	ErrGitRepoEmpty      = errors.New("git repository URL must not be empty")
	ErrGitRepoInvalid    = errors.New("git repository URL must be a valid HTTPS URL")
	ErrSubdomainInvalid  = errors.New("subdomain must contain only lowercase letters, numbers, and hyphens")
	ErrSubdomainTooShort = errors.New("subdomain must be at least 3 characters")
	ErrSubdomainTooLong  = errors.New("subdomain must be 63 characters or fewer")
	ErrPlanLimitReached  = errors.New("project limit reached for current plan")
	ErrInvalidStatus     = errors.New("invalid project status")
	ErrInvalidBranch     = errors.New("git branch must not be empty")
)

const (
	MaxNameLength      = 64
	MinSubdomainLength = 3
	MaxSubdomainLength = 63
	DefaultBranch      = "main"

	StatusIdle     = "idle"
	StatusBuilding = "building"
	StatusDeployed = "deployed"
	StatusFailed   = "failed"

	PlanFree       = "free"
	PlanPro        = "pro"
	PlanEnterprise = "enterprise"
)

var (
	subdomainRegexp = regexp.MustCompile(`^[a-z0-9][a-z0-9-]*[a-z0-9]$`)
	gitRepoRegexp   = regexp.MustCompile(`^https://[^\s]+$`)
	validStatuses   = map[string]bool{
		StatusIdle: true, StatusBuilding: true,
		StatusDeployed: true, StatusFailed: true,
	}
	planProjectLimits = map[string]int{
		PlanFree:       1,
		PlanPro:        2,
		PlanEnterprise: 10,
	}
)

type CreateRequest struct {
	Name      string
	GitRepo   string
	GitBranch string
}

func ValidateCreateRequest(req CreateRequest) []error {
	var errs []error
	if strings.TrimSpace(req.Name) == "" {
		errs = append(errs, ErrNameEmpty)
	} else if len(req.Name) > MaxNameLength {
		errs = append(errs, ErrNameTooLong)
	}

	if req.GitRepo == "" {
		errs = append(errs, ErrGitRepoEmpty)
	} else if !gitRepoRegexp.MatchString(req.GitRepo) {
		errs = append(errs, ErrGitRepoInvalid)
	}

	if req.GitBranch != "" && strings.TrimSpace(req.GitBranch) == "" {
		errs = append(errs, ErrInvalidBranch)
	}

	return errs
}

func GenerateSubdomain(name string) string {
	s := strings.ToLower(name)
	s = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			return r
		}
		return '-'
	}, s)

	// Collapse consecutive hyphens
	for strings.Contains(s, "--") {
		s = strings.ReplaceAll(s, "--", "-")
	}
	s = strings.Trim(s, "-")

	if len(s) > MaxSubdomainLength {
		s = s[:MaxSubdomainLength]
		s = strings.TrimRight(s, "-")
	}

	if s == "" {
		s = "project"
	}

	return s
}

func ValidateSubdomain(subdomain string) error {
	if len(subdomain) < MinSubdomainLength {
		return ErrSubdomainTooShort
	}
	if len(subdomain) > MaxSubdomainLength {
		return ErrSubdomainTooLong
	}
	if !subdomainRegexp.MatchString(subdomain) {
		return ErrSubdomainInvalid
	}
	return nil
}

func ValidateStatus(status string) error {
	if !validStatuses[status] {
		return ErrInvalidStatus
	}
	return nil
}

func CanCreateProject(plan string, currentCount int) error {
	limit, ok := planProjectLimits[plan]
	if !ok {
		return ErrPlanLimitReached
	}
	if currentCount >= limit {
		return ErrPlanLimitReached
	}
	return nil
}

func ProjectLimit(plan string) int {
	if limit, ok := planProjectLimits[plan]; ok {
		return limit
	}
	return 0
}

func DefaultBranchName(branch string) string {
	if branch == "" {
		return DefaultBranch
	}
	return branch
}
