<?php

namespace App\Notifications\Channels;

use App\Services\Phoenix;
use Illuminate\Notifications\Notification;

class PhoenixChannel
{
    public function send(object $notifiable, Notification $n): void
    {
        // After the HTTP response is sent: the person who triggered it never waits on the chat server.
        $payload = $n->toArray($notifiable);
        defer(fn () => Phoenix::pushToUser($notifiable, 'notification', $payload));
    }
}
