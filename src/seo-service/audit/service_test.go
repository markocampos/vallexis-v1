package audit

import (
	"testing"
)

func TestValidateScore(t *testing.T) {
	tests := []struct {
		name    string
		score   int
		wantErr bool
	}{
		{"zero", 0, false},
		{"hundred", 100, false},
		{"mid range", 50, false},
		{"negative", -1, true},
		{"over max", 101, true},
		{"way over", 999, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateScore(tt.score)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateScore(%d) error = %v, wantErr %v", tt.score, err, tt.wantErr)
			}
		})
	}
}

func TestValidateScores(t *testing.T) {
	tests := []struct {
		name       string
		scores     Scores
		wantErrCnt int
	}{
		{
			"all valid",
			Scores{Performance: 90, Accessibility: 85, SEO: 95, BestPractices: 88},
			0,
		},
		{
			"all zero (valid)",
			Scores{},
			0,
		},
		{
			"one invalid",
			Scores{Performance: 101, Accessibility: 85, SEO: 95, BestPractices: 88},
			1,
		},
		{
			"all invalid",
			Scores{Performance: -1, Accessibility: 101, SEO: -5, BestPractices: 200},
			4,
		},
		{
			"boundary valid",
			Scores{Performance: 0, Accessibility: 100, SEO: 0, BestPractices: 100},
			0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := ValidateScores(tt.scores)
			if len(errs) != tt.wantErrCnt {
				t.Errorf("ValidateScores() returned %d errors, want %d: %v", len(errs), tt.wantErrCnt, errs)
			}
		})
	}
}

func TestScoreRating(t *testing.T) {
	tests := []struct {
		score int
		want  string
	}{
		{100, "good"},
		{90, "good"},
		{89, "needs-improvement"},
		{50, "needs-improvement"},
		{49, "poor"},
		{0, "poor"},
	}

	for _, tt := range tests {
		t.Run(tt.want, func(t *testing.T) {
			got := ScoreRating(tt.score)
			if got != tt.want {
				t.Errorf("ScoreRating(%d) = %q, want %q", tt.score, got, tt.want)
			}
		})
	}
}

func TestOverallScore(t *testing.T) {
	tests := []struct {
		name   string
		scores Scores
		want   int
	}{
		{
			"all same",
			Scores{Performance: 80, Accessibility: 80, SEO: 80, BestPractices: 80},
			80,
		},
		{
			"mixed",
			Scores{Performance: 87, Accessibility: 92, SEO: 95, BestPractices: 90},
			91, // (87+92+95+90)/4 = 91
		},
		{
			"all zero",
			Scores{},
			0,
		},
		{
			"all max",
			Scores{Performance: 100, Accessibility: 100, SEO: 100, BestPractices: 100},
			100,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := OverallScore(tt.scores)
			if got != tt.want {
				t.Errorf("OverallScore() = %d, want %d", got, tt.want)
			}
		})
	}
}

func TestValidateURL(t *testing.T) {
	tests := []struct {
		name    string
		url     string
		wantErr error
	}{
		{"valid https", "https://example.com", nil},
		{"valid http", "http://example.com", nil},
		{"valid with path", "https://example.com/path", nil},
		{"empty", "", ErrURLEmpty},
		{"no scheme", "example.com", ErrURLInvalid},
		{"ftp scheme", "ftp://example.com", ErrURLInvalid},
		{"just scheme", "https://", ErrURLInvalid},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateURL(tt.url)
			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("ValidateURL(%q) = %v, want nil", tt.url, err)
				}
			} else if err != tt.wantErr {
				t.Errorf("ValidateURL(%q) = %v, want %v", tt.url, err, tt.wantErr)
			}
		})
	}
}

func TestValidateSitemapURL(t *testing.T) {
	tests := []struct {
		name    string
		url     string
		wantErr bool
	}{
		{"valid sitemap", "https://example.com/sitemap.xml", false},
		{"valid sitemap index", "https://example.com/sitemap_index.xml", false},
		{"missing sitemap suffix", "https://example.com/page", true},
		{"empty", "", true},
		{"not http", "ftp://example.com/sitemap.xml", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateSitemapURL(tt.url)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateSitemapURL(%q) error = %v, wantErr %v", tt.url, err, tt.wantErr)
			}
		})
	}
}

func TestShouldAlert(t *testing.T) {
	tests := []struct {
		name     string
		previous Scores
		current  Scores
		want     bool
	}{
		{
			"no change",
			Scores{Performance: 90, Accessibility: 90, SEO: 90, BestPractices: 90},
			Scores{Performance: 90, Accessibility: 90, SEO: 90, BestPractices: 90},
			false,
		},
		{
			"small drop",
			Scores{Performance: 90, Accessibility: 90, SEO: 90, BestPractices: 90},
			Scores{Performance: 85, Accessibility: 90, SEO: 90, BestPractices: 90},
			false,
		},
		{
			"exactly threshold drop in performance",
			Scores{Performance: 90, Accessibility: 90, SEO: 90, BestPractices: 90},
			Scores{Performance: 80, Accessibility: 90, SEO: 90, BestPractices: 90},
			true,
		},
		{
			"big drop in SEO",
			Scores{Performance: 90, Accessibility: 90, SEO: 95, BestPractices: 90},
			Scores{Performance: 90, Accessibility: 90, SEO: 50, BestPractices: 90},
			true,
		},
		{
			"improvement (not a drop)",
			Scores{Performance: 70, Accessibility: 70, SEO: 70, BestPractices: 70},
			Scores{Performance: 90, Accessibility: 90, SEO: 90, BestPractices: 90},
			false,
		},
		{
			"drop in best practices",
			Scores{Performance: 90, Accessibility: 90, SEO: 90, BestPractices: 90},
			Scores{Performance: 90, Accessibility: 90, SEO: 90, BestPractices: 75},
			true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ShouldAlert(tt.previous, tt.current)
			if got != tt.want {
				t.Errorf("ShouldAlert() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestScoreDelta(t *testing.T) {
	tests := []struct {
		previous int
		current  int
		want     int
	}{
		{90, 95, 5},
		{90, 80, -10},
		{90, 90, 0},
		{0, 100, 100},
	}

	for _, tt := range tests {
		got := ScoreDelta(tt.previous, tt.current)
		if got != tt.want {
			t.Errorf("ScoreDelta(%d, %d) = %d, want %d", tt.previous, tt.current, got, tt.want)
		}
	}
}

func TestFormatScoreDelta(t *testing.T) {
	tests := []struct {
		delta int
		want  string
	}{
		{5, "+5"},
		{-10, "-10"},
		{0, "0"},
		{100, "+100"},
	}

	for _, tt := range tests {
		t.Run(tt.want, func(t *testing.T) {
			got := FormatScoreDelta(tt.delta)
			if got != tt.want {
				t.Errorf("FormatScoreDelta(%d) = %q, want %q", tt.delta, got, tt.want)
			}
		})
	}
}

func TestCategorizeIssues(t *testing.T) {
	issues := []Issue{
		{Category: CategoryPerformance, Message: "LCP too slow", Impact: ImpactHigh},
		{Category: CategoryPerformance, Message: "No image lazy-load", Impact: ImpactMedium},
		{Category: CategorySEO, Message: "Missing meta description", Impact: ImpactHigh},
		{Category: CategoryAccessibility, Message: "Low contrast", Impact: ImpactLow},
	}

	result := CategorizeIssues(issues)

	if len(result[CategoryPerformance]) != 2 {
		t.Errorf("performance issues = %d, want 2", len(result[CategoryPerformance]))
	}
	if len(result[CategorySEO]) != 1 {
		t.Errorf("SEO issues = %d, want 1", len(result[CategorySEO]))
	}
	if len(result[CategoryAccessibility]) != 1 {
		t.Errorf("accessibility issues = %d, want 1", len(result[CategoryAccessibility]))
	}
	if len(result[CategoryBestPractices]) != 0 {
		t.Errorf("best practices issues = %d, want 0", len(result[CategoryBestPractices]))
	}
}

func TestCategorizeIssues_Empty(t *testing.T) {
	result := CategorizeIssues(nil)
	if len(result) != 0 {
		t.Errorf("CategorizeIssues(nil) = %v, want empty map", result)
	}
}

func TestCountByImpact(t *testing.T) {
	issues := []Issue{
		{Impact: ImpactHigh},
		{Impact: ImpactHigh},
		{Impact: ImpactMedium},
		{Impact: ImpactLow},
		{Impact: ImpactLow},
		{Impact: ImpactLow},
	}

	counts := CountByImpact(issues)
	if counts[ImpactHigh] != 2 {
		t.Errorf("high = %d, want 2", counts[ImpactHigh])
	}
	if counts[ImpactMedium] != 1 {
		t.Errorf("medium = %d, want 1", counts[ImpactMedium])
	}
	if counts[ImpactLow] != 3 {
		t.Errorf("low = %d, want 3", counts[ImpactLow])
	}
}

func TestCountByImpact_Empty(t *testing.T) {
	counts := CountByImpact(nil)
	if len(counts) != 0 {
		t.Errorf("CountByImpact(nil) = %v, want empty map", counts)
	}
}
