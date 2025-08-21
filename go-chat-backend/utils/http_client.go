package utils

import (
	"fmt"
	"go-chat-backend/models"

	"github.com/go-resty/resty/v2"
)

var client = resty.New()

const djangoBase = "http://192.168.1.154:8000/api/chatApp/messages/"

func SendMessageToDjango(msg models.Message) error {
	resp, err := client.R().
		SetBody(msg).
		SetHeader("Content-Type", "application/json").
		Post(fmt.Sprintf("%s/messages/", djangoBase))

	if err != nil {
		return err
	}

	if resp.IsError() {
		return fmt.Errorf("Django error: %s", resp.String())
	}
	return nil
}
