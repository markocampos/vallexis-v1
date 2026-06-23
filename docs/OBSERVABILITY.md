# OBSERVABILITY.md — Monitoring & Observability Setup

> **Last Updated:** June 23, 2026

This guide covers setting up and using the Vallexis observability stack: Prometheus, Grafana, log aggregation, alerting, and uptime monitoring.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prometheus Setup](#prometheus-setup)
3. [Grafana Setup](#grafana-setup)
4. [Alert Rules](#alert-rules)
5. [Log Aggregation](#log-aggregation)
6. [Custom Metrics](#custom-metrics)
7. [Uptime Monitoring](#uptime-monitoring)

---

## Architecture

```
Go Services (/metrics) ──► Prometheus ──► Grafana (dashboards + alerts)
Docker logs ──► JSON driver ──► Loki ──► Grafana (log queries)
uptime-pulse agent ──► GET /api/health ──► Slack + email alerts
```

| Component | Port | Purpose |
|---|---|---|
| Prometheus | 9090 | Metrics scraping and storage (30-day retention) |
| Grafana | 3100 | Dashboards, alerting, log queries |
| Loki | 3100 (internal) | Log aggregation |
| uptime-pulse | — | HTTP health check agent (60s interval) |

---

## Prometheus Setup

### Configuration

Create `prometheus.yml` at the project root:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:3000']
    metrics_path: '/metrics'

  - job_name: 'deploy-service'
    static_configs:
      - targets: ['deploy-service:3001']
    metrics_path: '/metrics'

  - job_name: 'payment-service'
    static_configs:
      - targets: ['payment-service:3002']
    metrics_path: '/metrics'

  - job_name: 'seo-service'
    static_configs:
      - targets: ['seo-service:3003']
    metrics_path: '/metrics'
```

### Exposing Metrics from Go Services

Every Go service should expose a `/metrics` endpoint:

```go
import "github.com/prometheus/client_golang/prometheus/promhttp"

func main() {
    // Expose Prometheus metrics
    http.Handle("/metrics", promhttp.Handler())
    http.ListenAndServe(":3000", nil)
}
```

Standard metrics provided by `promhttp`:
- `go_goroutines` — active goroutines
- `go_memstats_alloc_bytes` — memory usage
- `http_requests_total` — request count by status
- `http_request_duration_seconds` — request latency histogram

---

## Grafana Setup

### First-Time Setup

1. Open Grafana: `http://<SERVER_IP>:3100`
2. Login: `admin` / your `GRAFANA_ADMIN_PASSWORD`
3. Change password on first login

### Add Prometheus Data Source

1. **Configuration** → **Data Sources** → **Add data source**
2. Select **Prometheus**
3. URL: `http://prometheus:9090`
4. Click **Save & Test**

### Add Loki Data Source (for logs)

1. **Configuration** → **Data Sources** → **Add data source**
2. Select **Loki**
3. URL: `http://loki:3100`
4. Click **Save & Test`

### Import Dashboards

Import pre-built dashboards from Grafana.com:

| Dashboard | ID | Purpose |
|---|---|---|
| Node Exporter Full | 1860 | System metrics (CPU, RAM, disk) |
| Docker Container | 893 | Container resource usage |
| PostgreSQL Database | 9628 | Database connections, queries, locks |
| Redis Dashboard | 763 | Redis memory, hits, operations |

Import via: **+** → **Import** → Enter dashboard ID → **Load**

---

## Alert Rules

### Prometheus Alert Rules

Create `prometheus/alerts.yml`:

```yaml
groups:
  - name: vallexis
    rules:
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "{{ $labels.instance }} is down"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Container {{ $labels.name }} memory > 90%"

      - alert: HighCPUUsage
        expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Container {{ $labels.name }} CPU > 80%"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space < 10% on {{ $labels.mountpoint }}"
```

### Notification Channels

Configure in Grafana → **Alerting** → **Contact Points**:

| Channel | Severity | Configuration |
|---|---|---|
| Slack `#alerts` | P0, P1, P2 | Webhook URL from Slack app |
| Email `oncall@vallexis.io` | P0, P1 | SMTP settings in `grafana.ini` |

---

## Log Aggregation

### Docker Logging Driver

Configure in `docker-compose.yml`:

```yaml
services:
  api-gateway:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

### Loki Integration

For centralized log querying, deploy Loki alongside Grafana:

```yaml
# Add to docker-compose.yml
loki:
  image: grafana/loki:latest
  ports:
    - "3100:3100"
  volumes:
    - loki_data:/loki
  restart: unless-stopped
```

Query logs in Grafana → **Explore** → Select **Loki** data source:

```logql
# All errors from api-gateway
{job="api-gateway"} |= "error"

# Deploy failures
{job="deploy-service"} | json | status="failed"

# Last 5 minutes of payment-service logs
{job="payment-service"} | json | [5m]
```

---

## Custom Metrics

Add application-specific metrics to Go services:

```go
import "github.com/prometheus/client_golang/prometheus"

var (
    deploysTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "vallexis_deploys_total",
            Help: "Total number of deploys",
        },
        []string{"project_id", "status"},
    )

    deployDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "vallexis_deploy_duration_seconds",
            Help:    "Deploy duration in seconds",
            Buckets: []float64{10, 30, 60, 120, 300},
        },
        []string{"project_id"},
    )
)

func init() {
    prometheus.MustRegister(deploysTotal, deployDuration)
}
```

---

## Uptime Monitoring

The `uptime-pulse` agent runs every 60 seconds:

| Check | Endpoint | Alert After |
|---|---|---|
| api-gateway | `GET /api/health` | 3 consecutive failures |
| deploy-service | `GET /health` | 3 consecutive failures |
| payment-service | `GET /health` | 3 consecutive failures |
| seo-service | `GET /health` | 3 consecutive failures |

**Alert channels:**
- P0/P1: Email (`oncall@vallexis.io`) + Slack (`#alerts`)
- P2: Slack (`#alerts`)
- P3: Slack (`#notifications`)

See [AGENTS.md](AGENTS.md) for full agent catalog and thresholds.

---

## References

- [ARCHITECTURE.md](ARCHITECTURE.md) — Service ports and resource budget
- [AGENTS.md](AGENTS.md) — Automated monitoring agents
- [RUNBOOK.md](RUNBOOK.md) — Incident response procedures
- [SECURITY.md](SECURITY.md) — Security monitoring
