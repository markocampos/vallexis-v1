package deploys

import (
	"fmt"

	"github.com/jmoiron/sqlx"
)

func ValidateProjectAccess(db *sqlx.DB, userID, projectID string) error {
	var count int
	err := db.QueryRow(
		`SELECT COUNT(*) FROM projects WHERE id = $1 AND user_id = $2`, projectID, userID,
	).Scan(&count)
	if err != nil || count == 0 {
		return fmt.Errorf("project not found or access denied")
	}
	return nil
}
