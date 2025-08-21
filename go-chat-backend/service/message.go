package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"go-chat-backend/models"
	"io"
	"log"

	// "mime/multipart"
	"net/http"
	// "os"
	// "path/filepath"
	// "strconv"
	"time"
)

func SendMessageToDjango(msg models.Message, jwtToken string) error {
	apiUrl := "http://192.168.1.154:8000/api/chatApp/messages/"

	// body := &bytes.Buffer{}
	// writer := multipart.NewWriter(body)

	message := map[string]interface{}{
		"room_id":       msg.RoomID,
		"sender_id":     msg.SenderID,
		"text":          msg.Content,
		"voice_message": msg.Audio,
		"image_message": msg.Image,
		"status":        msg.Status,
	}
	reqBody, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	// // Required fields
	// writer.WriteField("room_id", strconv.Itoa(msg.RoomID))
	// writer.WriteField("sender_id", strconv.Itoa(msg.SenderID))
	// writer.WriteField("status", msg.Status)
	// writer.WriteField("timestamp", msg.TimeStamp)

	// Optional fields (only include if not empty)
	// if msg.Content != "" {
	// 	writer.WriteField("text", msg.Content)
	// }
	// if msg.Audio != "" {
	// 	audioFile, err := os.Open(msg.Audio)
	// 	if err != nil {
	// 		return err
	// 	}
	// 	defer audioFile.Close()
	// 	part, _ := writer.CreateFormFile("voice_message", filepath.Base(msg.Audio))
	// 	io.Copy(part, audioFile)
	// }
	// if msg.Image != "" {
	// 	imageFile, err := os.Open(msg.Image)
	// 	if err != nil {
	// 		return err
	// 	}
	// 	defer imageFile.Close()
	// 	part, _ := writer.CreateFormFile("image_message", filepath.Base(msg.Image))
	// 	log.Println("image imekua save", part)
	// 	io.Copy(part, imageFile)
	// }

	// writer.Close()

	req, err := http.NewRequest("POST", apiUrl, bytes.NewBuffer(reqBody))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+jwtToken)
	req.Header.Set("Content-Type", "application/json") // multipart/form-data

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respoBody, _ := io.ReadAll(resp.Body)
	log.Println("Responde from Djnago", string(respoBody))
	if resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("Django error: %d", resp.StatusCode)
	} else {
		log.Println(" ✅ Message saved!")
	}
	return nil
}
