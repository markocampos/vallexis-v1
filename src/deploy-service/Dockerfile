FROM golang:1.22-alpine AS builder
RUN apk add --no-cache git
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY src/deploy-service/ src/deploy-service/
RUN CGO_ENABLED=0 go build -o /deploy-service ./src/deploy-service

FROM alpine:3.20
RUN apk add --no-cache ca-certificates wget
COPY --from=builder /deploy-service /deploy-service
EXPOSE 3001
CMD ["/deploy-service"]
