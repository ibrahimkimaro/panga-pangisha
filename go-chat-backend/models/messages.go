package models

type Message struct {
	MessageId int    `json:"id"`
	RoomID    int    `json:"room_id"`
	SenderID  int    `json:"sender_id"`
	Content   string `json:"text"`
	Audio     string `json:"voice_message,omitempty"`
	Image     string `json:"image_message,omitempty"`
	Status    string `json:"status"`
	TimeStamp string `json:"timestamp"`
	// FromServer bool   `json:"from_server"`
}
