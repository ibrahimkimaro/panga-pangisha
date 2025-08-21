package main

import (
	"go-chat-backend/handlers"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/ws", handlers.HandleWebSocket)
	log.Println("✅ WebSocket server running at ws://192.168.1.154:8080/ws")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
