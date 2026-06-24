package projects

import (
	"testing"
)

func TestValidateCreateRequest(t *testing.T) {
	tests := []struct {
		name       string
		req        CreateRequest
		wantErrCnt int
	}{
		{
			"valid request",
			CreateRequest{Name: "My App", GitRepo: "https://github.com/user/app", GitBranch: "main"},
			0,
		},
		{
			"valid without branch",
			CreateRequest{Name: "My App", GitRepo: "https://github.com/user/app"},
			0,
		},
		{
			"empty name",
			CreateRequest{Name: "", GitRepo: "https://github.com/user/app"},
			1,
		},
		{
			"name too long",
			CreateRequest{Name: string(make([]byte, 65)), GitRepo: "https://github.com/user/app"},
			1,
		},
		{
			"empty git repo",
			CreateRequest{Name: "App", GitRepo: ""},
			1,
		},
		{
			"invalid git repo - no https",
			CreateRequest{Name: "App", GitRepo: "git@github.com:user/app.git"},
			1,
		},
		{
			"multiple errors",
			CreateRequest{Name: "", GitRepo: ""},
			2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := ValidateCreateRequest(tt.req)
			if len(errs) != tt.wantErrCnt {
				t.Errorf("ValidateCreateRequest() returned %d errors, want %d: %v", len(errs), tt.wantErrCnt, errs)
			}
		})
	}
}

func TestGenerateSubdomain(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{"simple lowercase", "myapp", "myapp"},
		{"with spaces", "My Cool App", "my-cool-app"},
		{"with special chars", "My App! @#$", "my-app"},
		{"consecutive spaces", "my   app", "my-app"},
		{"leading trailing spaces", "  my app  ", "my-app"},
		{"uppercase", "MyApp", "myapp"},
		{"numbers", "app123", "app123"},
		{"all special", "!@#$%", "project"},
		{"empty string", "", "project"},
		{"long name", string(make([]byte, 100)), "project"}, // all null bytes → hyphens → trimmed → "project"
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := GenerateSubdomain(tt.input)
			if got != tt.want {
				t.Errorf("GenerateSubdomain(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestValidateSubdomain(t *testing.T) {
	tests := []struct {
		name      string
		subdomain string
		wantErr   error
	}{
		{"valid", "my-app", nil},
		{"valid no hyphens", "myapp", nil},
		{"valid with numbers", "app123", nil},
		{"too short - 1 char", "a", ErrSubdomainTooShort},
		{"too short - 2 chars", "ab", ErrSubdomainTooShort},
		{"exactly 3 chars", "abc", nil},
		{"too long", string(make([]byte, 64)), ErrSubdomainTooLong},
		{"uppercase", "MyApp", ErrSubdomainInvalid},
		{"starts with hyphen", "-myapp", ErrSubdomainInvalid},
		{"ends with hyphen", "myapp-", ErrSubdomainInvalid},
		{"has spaces", "my app", ErrSubdomainInvalid},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateSubdomain(tt.subdomain)
			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("ValidateSubdomain(%q) = %v, want nil", tt.subdomain, err)
				}
			} else if err != tt.wantErr {
				t.Errorf("ValidateSubdomain(%q) = %v, want %v", tt.subdomain, err, tt.wantErr)
			}
		})
	}
}

func TestValidateStatus(t *testing.T) {
	tests := []struct {
		status  string
		wantErr bool
	}{
		{StatusIdle, false},
		{StatusBuilding, false},
		{StatusDeployed, false},
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

func TestCanCreateProject(t *testing.T) {
	tests := []struct {
		name         string
		plan         string
		currentCount int
		wantErr      bool
	}{
		{"free plan - 0 projects", PlanFree, 0, false},
		{"free plan - at limit", PlanFree, 1, true},
		{"free plan - over limit", PlanFree, 2, true},
		{"pro plan - 0 projects", PlanPro, 0, false},
		{"pro plan - 1 project", PlanPro, 1, false},
		{"pro plan - at limit", PlanPro, 2, true},
		{"enterprise - many projects", PlanEnterprise, 5, false},
		{"enterprise - at limit", PlanEnterprise, 10, true},
		{"unknown plan", "unknown", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := CanCreateProject(tt.plan, tt.currentCount)
			if (err != nil) != tt.wantErr {
				t.Errorf("CanCreateProject(%q, %d) error = %v, wantErr %v", tt.plan, tt.currentCount, err, tt.wantErr)
			}
		})
	}
}

func TestProjectLimit(t *testing.T) {
	tests := []struct {
		plan string
		want int
	}{
		{PlanFree, 1},
		{PlanPro, 2},
		{PlanEnterprise, 10},
		{"unknown", 0},
	}

	for _, tt := range tests {
		t.Run(tt.plan, func(t *testing.T) {
			got := ProjectLimit(tt.plan)
			if got != tt.want {
				t.Errorf("ProjectLimit(%q) = %d, want %d", tt.plan, got, tt.want)
			}
		})
	}
}

func TestDefaultBranchName(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"", "main"},
		{"develop", "develop"},
		{"production", "production"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := DefaultBranchName(tt.input)
			if got != tt.want {
				t.Errorf("DefaultBranchName(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}
