FROM golang:1.22-alpine AS builder
RUN apk add --no-cache git
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY src/payment-service/ src/payment-service/
RUN CGO_ENABLED=0 go build -o /payment-service ./src/payment-service

FROM alpine:3.20
RUN apk add --no-cache ca-certificates wget
COPY --from=builder /payment-service /payment-service
EXPOSE 3002
CMD ["/payment-service"]
