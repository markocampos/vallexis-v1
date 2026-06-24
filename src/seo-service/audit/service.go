package audit

import (
	"errors"
	"fmt"
	"net/url"
	"strings"
)

var (
	ErrScoreOutOfRange = errors.New("score must be between 0 and 100")
	ErrURLEmpty        = errors.New("URL must not be empty")
	ErrURLInvalid      = errors.New("URL must be a valid HTTP or HTTPS URL")
	ErrProjectIDEmpty  = errors.New("project ID must not be empty")
)

const (
	ScoreMin = 0
	ScoreMax = 100

	ThresholdGood   = 90
	ThresholdMedium = 50

	CategoryPerformance   = "performance"
	CategoryAccessibility = "accessibility"
	CategorySEO           = "seo"
	CategoryBestPractices = "best_practices"

	ImpactHigh   = "high"
	ImpactMedium = "medium"
	ImpactLow    = "low"

	IssueTypeError   = "error"
	IssueTypeWarning = "warning"
	IssueTypeInfo    = "info"

	AlertThresholdDrop = 10
)

type Scores struct {
	Performance   int `json:"performance"`
	Accessibility int `json:"accessibility"`
	SEO           int `json:"seo"`
	BestPractices int `json:"best_practices"`
}

type Issue struct {
	Type     string `json:"type"`
	Category string `json:"category"`
	Message  string `json:"message"`
	Impact   string `json:"impact"`
}

type AuditResult struct {
	ProjectID  string
	URL        string
	Scores     Scores
	Issues     []Issue
	SitemapURL string
}

func ValidateScore(score int) error {
	if score < ScoreMin || score > ScoreMax {
		return fmt.Errorf("%w: got %d", ErrScoreOutOfRange, score)
	}
	return nil
}

func ValidateScores(s Scores) []error {
	var errs []error
	for _, pair := range []struct {
		name  string
		score int
	}{
		{"performance", s.Performance},
		{"accessibility", s.Accessibility},
		{"seo", s.SEO},
		{"best_practices", s.BestPractices},
	} {
		if err := ValidateScore(pair.score); err != nil {
			errs = append(errs, fmt.Errorf("%s: %w", pair.name, err))
		}
	}
	return errs
}

func ScoreRating(score int) string {
	switch {
	case score >= ThresholdGood:
		return "good"
	case score >= ThresholdMedium:
		return "needs-improvement"
	default:
		return "poor"
	}
}

func OverallScore(s Scores) int {
	return (s.Performance + s.Accessibility + s.SEO + s.BestPractices) / 4
}

func ValidateURL(rawURL string) error {
	if rawURL == "" {
		return ErrURLEmpty
	}
	u, err := url.Parse(rawURL)
	if err != nil {
		return ErrURLInvalid
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return ErrURLInvalid
	}
	if u.Host == "" {
		return ErrURLInvalid
	}
	return nil
}

func ValidateSitemapURL(rawURL string) error {
	if err := ValidateURL(rawURL); err != nil {
		return err
	}
	if !strings.HasSuffix(rawURL, "/sitemap.xml") && !strings.HasSuffix(rawURL, "/sitemap_index.xml") {
		return fmt.Errorf("sitemap URL should end with /sitemap.xml or /sitemap_index.xml")
	}
	return nil
}

func ShouldAlert(previous, current Scores) bool {
	checks := []struct{ prev, curr int }{
		{previous.Performance, current.Performance},
		{previous.Accessibility, current.Accessibility},
		{previous.SEO, current.SEO},
		{previous.BestPractices, current.BestPractices},
	}
	for _, c := range checks {
		if c.prev-c.curr >= AlertThresholdDrop {
			return true
		}
	}
	return false
}

func ScoreDelta(previous, current int) int {
	return current - previous
}

func FormatScoreDelta(delta int) string {
	if delta > 0 {
		return fmt.Sprintf("+%d", delta)
	}
	return fmt.Sprintf("%d", delta)
}

func CategorizeIssues(issues []Issue) map[string][]Issue {
	result := make(map[string][]Issue)
	for _, issue := range issues {
		result[issue.Category] = append(result[issue.Category], issue)
	}
	return result
}

func CountByImpact(issues []Issue) map[string]int {
	counts := make(map[string]int)
	for _, issue := range issues {
		counts[issue.Impact]++
	}
	return counts
}
