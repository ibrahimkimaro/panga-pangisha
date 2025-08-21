package handlers

import (
	"encoding/json"
	"go-chat-backend/models"
	service "go-chat-backend/service"
	"go-chat-backend/utils"
	"log"
	"net/http"

	// "strings"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

var clientsPerRoom = make(map[int][]*websocket.Conn)
var mu sync.Mutex

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {

	authHeader := r.Header.Get("Authorization")
	// Get JWT token from URL query
	isRoom := r.URL.Query().Get("room_id")
	if authHeader == "" || isRoom == "" {
		log.Println("Missing Authorization header or room_id query parameter")
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}

	auth, err := utils.ValidateToken(authHeader)
	if err != nil {
		log.Printf("Authentication failed: %v", err)
		http.Error(w, `{"Error": "`+err.Error()+`"}`, http.StatusUnauthorized)
		return
	}

	log.Printf("Authenticatied User: %s (ID: %d)", auth.Username, auth.UserID)

	// here we upgrading websocket if user authenticated
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	log.Println(" ✅ WebSocket connected")

	// userData := map[string]interface{}{
	// 	"user_id":  auth.UserID,
	// 	"username": auth.Username,
	// }
	// userDataJson, _ := json.Marshal(userData)
	// if err := conn.WriteMessage(websocket.TextMessage, userDataJson); err != nil {
	// 	log.Println("Failed to sender user data", err)
	// 	return
	// }

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			break
		}

		var msg models.Message
		if err := json.Unmarshal(msgBytes, &msg); err != nil {
			log.Println("Unmarshal error:", err)
			continue
		}

		log.Println(msg)

		// ✅ Save only if not already saved
		// if !msg.FromServer || msg.Content != "" {
		// 	go service.SendMessageToDjango(msg, authHeader)
		// }
		if msg.Content != "" && msg.Image == "" && msg.Audio == "" {
			go service.SendMessageToDjango(msg, authHeader)
		}

		// ✅ Join room if new
		mu.Lock()
		if !connInRoom(msg.RoomID, conn) {
			clientsPerRoom[msg.RoomID] = append(clientsPerRoom[msg.RoomID], conn)
		}
		mu.Unlock()

		// ✅ Mark as from server before broadcasting
		newMsgBytes, _ := json.Marshal(msg)

		// ✅ Broadcast
		mu.Lock()
		for _, c := range clientsPerRoom[msg.RoomID] {
			if c != conn {
				if err := c.WriteMessage(websocket.TextMessage, newMsgBytes); err != nil {
					log.Println("Broadcast error:", err)
				}
			}
		}
		mu.Unlock()
	}

}

func connInRoom(roomID int, conn *websocket.Conn) bool {
	for _, c := range clientsPerRoom[roomID] {
		if c == conn {
			return true
		}
	}
	return false
}
