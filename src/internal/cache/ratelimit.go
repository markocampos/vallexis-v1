package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

var incrWithExpireScript = redis.NewScript(`
local count = redis.call("INCR", KEYS[1])
if count == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return count
`)

func Allow(ctx context.Context, rdb *redis.Client, key string, limit int64, window time.Duration) (bool, error) {
	if rdb == nil {
		return true, nil
	}

	count, err := incrWithExpireScript.Run(ctx, rdb, []string{key}, int64(window.Seconds())).Int64()
	if err != nil {
		return false, fmt.Errorf("rate limit: %w", err)
	}

	return count <= limit, nil
}
