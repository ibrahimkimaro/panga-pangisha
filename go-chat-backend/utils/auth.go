package utils

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type AuthResponse struct {
	UserID   int    `json:"id"`
	Username string `json:"name"`
}

// Read implements io.Reader.
func (a AuthResponse) Read(p []byte) (n int, err error) {
	panic("unimplemented")
}

func ValidateToken(token string) (*AuthResponse, error) {
	req, _ := http.NewRequest("GET", "http://192.168.1.154:8000/api/chatApp/validate-user/", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		return nil, fmt.Errorf("authenticatoion failed with status code %d", res.StatusCode)
	}
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("invalid token")
	}

	var auth AuthResponse
	if err := json.NewDecoder(res.Body).Decode(&auth); err != nil {
		return nil, err
	}

	return &auth, nil
}
