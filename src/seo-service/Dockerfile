FROM golang:1.26-alpine AS builder
RUN apk add --no-cache git
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY src/internal/ src/internal/
COPY src/seo-service/ src/seo-service/
RUN CGO_ENABLED=0 go build -o /seo-service ./src/seo-service

FROM alpine:3.20
RUN apk add --no-cache ca-certificates wget
COPY --from=builder /seo-service /seo-service
EXPOSE 3003
CMD ["/seo-service"]
