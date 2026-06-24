package users

import (
	"testing"
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

func TestStorageLimit(t *testing.T) {
	tests := []struct {
		plan    string
		want    int64
		wantErr bool
	}{
		{PlanFree, StorageLimitFree, false},
		{PlanPro, StorageLimitPro, false},
		{PlanEnterprise, StorageLimitEnterprise, false},
		{"invalid", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.plan, func(t *testing.T) {
			got, err := StorageLimit(tt.plan)
			if (err != nil) != tt.wantErr {
				t.Errorf("StorageLimit(%q) error = %v, wantErr %v", tt.plan, err, tt.wantErr)
			}
			if got != tt.want {
				t.Errorf("StorageLimit(%q) = %d, want %d", tt.plan, got, tt.want)
			}
		})
	}
}

func TestCheckStorageQuota(t *testing.T) {
	tests := []struct {
		name       string
		plan       string
		used       int64
		additional int64
		wantErr    error
	}{
		{"free plan - within limit", PlanFree, 1024, 1024, nil},
		{"free plan - at limit", PlanFree, StorageLimitFree - 1, 1, nil},
		{"free plan - exceeds", PlanFree, StorageLimitFree, 1, ErrStorageExceed},
		{"free plan - zero additional", PlanFree, 0, 0, nil},
		{"pro plan - within limit", PlanPro, 1024 * 1024 * 1024, 1024, nil},
		{"pro plan - exceeds", PlanPro, StorageLimitPro, 1, ErrStorageExceed},
		{"invalid plan", "invalid", 0, 0, ErrInvalidPlan},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := CheckStorageQuota(tt.plan, tt.used, tt.additional)
			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("CheckStorageQuota() = %v, want nil", err)
				}
			} else if err != tt.wantErr {
				t.Errorf("CheckStorageQuota() = %v, want %v", err, tt.wantErr)
			}
		})
	}
}

func TestFormatBytes(t *testing.T) {
	tests := []struct {
		bytes int64
		want  string
	}{
		{0, "0 B"},
		{500, "500 B"},
		{1024, "1.0 KB"},
		{1536, "1.5 KB"},
		{1048576, "1.0 MB"},
		{1073741824, "1.0 GB"},
		{2147483648, "2.0 GB"},
		{1099511627776, "1.0 TB"},
	}

	for _, tt := range tests {
		t.Run(tt.want, func(t *testing.T) {
			got := FormatBytes(tt.bytes)
			if got != tt.want {
				t.Errorf("FormatBytes(%d) = %q, want %q", tt.bytes, got, tt.want)
			}
		})
	}
}

func TestStorageUsagePercent(t *testing.T) {
	tests := []struct {
		name    string
		used    int64
		plan    string
		want    float64
		wantErr bool
	}{
		{"zero usage free", 0, PlanFree, 0, false},
		{"half usage free", StorageLimitFree / 2, PlanFree, 50, false},
		{"full usage free", StorageLimitFree, PlanFree, 100, false},
		{"invalid plan", 0, "invalid", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := StorageUsagePercent(tt.used, tt.plan)
			if (err != nil) != tt.wantErr {
				t.Errorf("StorageUsagePercent() error = %v, wantErr %v", err, tt.wantErr)
			}
			if got != tt.want {
				t.Errorf("StorageUsagePercent() = %f, want %f", got, tt.want)
			}
		})
	}
}

func TestValidateUpdateProfile(t *testing.T) {
	tests := []struct {
		name    string
		req     UpdateProfileRequest
		wantErr bool
	}{
		{"valid name", UpdateProfileRequest{Name: "Jane"}, false},
		{"empty name (optional)", UpdateProfileRequest{Name: ""}, false},
		{"name too long", UpdateProfileRequest{Name: string(make([]byte, 129))}, true},
		{"exactly 128 chars", UpdateProfileRequest{Name: string(make([]byte, 128))}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateUpdateProfile(tt.req)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateUpdateProfile() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
