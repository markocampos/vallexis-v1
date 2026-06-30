package billing

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

const payMongoBase = "https://api.paymongo.com/v1"

type payMongoClient struct {
	secretKey string
}

func newPayMongoClient(secretKey string) *payMongoClient {
	return &payMongoClient{secretKey: secretKey}
}

type CheckoutSession struct {
	ID         string `json:"id"`
	CheckoutID string `json:"checkout_session_id"`
	Attributes struct {
		CheckoutURL string `json:"checkout_url"`
		Status      string `json:"status"`
	} `json:"attributes"`
}

type checkoutSessionRequest struct {
	Data struct {
		Type       string `json:"type"`
		Attributes struct {
			LineItems []struct {
				Name     string `json:"name"`
				Quantity int    `json:"quantity"`
				Amount   int    `json:"amount"`
				Currency string `json:"currency"`
			} `json:"line_items"`
			SendEmailReceipt     bool   `json:"send_email_receipt"`
			ShowDescription      bool   `json:"show_description"`
			ShowLineItems        bool   `json:"show_line_items"`
			SuccessURL           string `json:"success_url"`
			CancelURL            string `json:"cancel_url"`
			ReferenceNumber      string `json:"reference_number"`
			Description          string `json:"description"`
			PaymentMethodTypes   []string `json:"payment_method_types"`
		} `json:"attributes"`
	} `json:"data"`
}

func (c *payMongoClient) CreateCheckoutSession(ctx context.Context, email, priceID, successURL, cancelURL string) (*CheckoutSession, error) {
	payload := checkoutSessionRequest{}
	payload.Data.Type = "checkout_session"
	payload.Data.Attributes.SendEmailReceipt = true
	payload.Data.Attributes.ShowDescription = false
	payload.Data.Attributes.ShowLineItems = true
	payload.Data.Attributes.SuccessURL = successURL
	payload.Data.Attributes.CancelURL = cancelURL
	payload.Data.Attributes.ReferenceNumber = "vallexis-" + priceID
	payload.Data.Attributes.Description = "Vallexis Pro Subscription"
	payload.Data.Attributes.PaymentMethodTypes = []string{"card"}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal checkout request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", payMongoBase+"/checkout_sessions", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create checkout request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.SetBasicAuth(c.secretKey, "")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("paymongo checkout request: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("paymongo checkout error (%d): %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Data CheckoutSession `json:"data"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("parse checkout response: %w", err)
	}

	return &result.Data, nil
}

func VerifyWebhookSignature(body []byte, signature, secret string) bool {
	if secret == "" {
		log.Printf("CRITICAL: PAYMONGO_WEBHOOK_SECRET is not set — webhook signature verification is disabled")
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(signature), []byte(expected))
}

func (c *payMongoClient) GetSubscription(ctx context.Context, subscriptionID string) (map[string]any, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", payMongoBase+"/subscriptions/"+subscriptionID, nil)
	if err != nil {
		return nil, fmt.Errorf("create get subscription request: %w", err)
	}
	req.Header.Set("Accept", "application/json")
	req.SetBasicAuth(c.secretKey, "")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("paymongo get subscription: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("paymongo get subscription error (%d): %s", resp.StatusCode, string(body))
	}

	var result map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("parse subscription response: %w", err)
	}
	return result, nil
}

func (c *payMongoClient) CancelSubscription(ctx context.Context, subscriptionID string) error {
	payload := map[string]any{
		"data": map[string]any{
			"attributes": map[string]any{
				"cancel_at_period_end": true,
			},
		},
	}
	body, _ := json.Marshal(payload)

	req, err := http.NewRequestWithContext(ctx, "POST", payMongoBase+"/subscriptions/"+subscriptionID+"/cancel", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create cancel request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.SetBasicAuth(c.secretKey, "")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("paymongo cancel subscription: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("paymongo cancel error (%d): %s", resp.StatusCode, string(respBody))
	}
	return nil
}
