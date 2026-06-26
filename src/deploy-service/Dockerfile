# syntax=docker/dockerfile:1
FROM golang:1.26-alpine AS builder
RUN apk add --no-cache git
WORKDIR /build
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download
COPY src/internal/ src/internal/
COPY src/deploy-service/ src/deploy-service/
RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 go build -o /deploy-service ./src/deploy-service

FROM alpine:3.20
RUN apk add --no-cache ca-certificates wget
COPY --from=builder /deploy-service /deploy-service
EXPOSE 3001
CMD ["/deploy-service"]
