FROM golang:1.26-alpine AS builder
RUN apk add --no-cache git
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY src/internal/ src/internal/
COPY src/api-gateway/ src/api-gateway/
RUN CGO_ENABLED=0 go build -o /api-gateway ./src/api-gateway

FROM alpine:3.20
RUN apk add --no-cache ca-certificates wget
COPY --from=builder /api-gateway /api-gateway
EXPOSE 3000
CMD ["/api-gateway"]
