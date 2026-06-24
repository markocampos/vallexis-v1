package auth

import (
	"net/mail"
	"strings"
)

type RegisterRequest struct {
	Email    string
	Password string
	Name     string
}

type LoginRequest struct {
	Email    string
	Password string
}

func ValidateEmail(email string) error {
	if email == "" {
		return ErrEmailEmpty
	}
	if _, err := mail.ParseAddress(email); err != nil {
		return ErrInvalidEmail
	}
	return nil
}

func ValidateRegisterRequest(req RegisterRequest) []error {
	var errs []error
	if err := ValidateEmail(req.Email); err != nil {
		errs = append(errs, err)
	}
	if err := ValidatePassword(req.Password); err != nil {
		errs = append(errs, err)
	}
	if strings.TrimSpace(req.Name) == "" {
		errs = append(errs, ErrNameEmpty)
	}
	return errs
}

func ValidateLoginRequest(req LoginRequest) []error {
	var errs []error
	if err := ValidateEmail(req.Email); err != nil {
		errs = append(errs, err)
	}
	if req.Password == "" {
		errs = append(errs, ErrPasswordEmpty)
	}
	return errs
}
