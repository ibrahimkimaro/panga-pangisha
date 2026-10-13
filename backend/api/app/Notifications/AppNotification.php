<?php

namespace App\Notifications;

use App\Notifications\Channels\PhoenixChannel;
use Illuminate\Notifications\Notification;

/**
 * One generic notification: stored in the DB (bell list) and pushed live over Phoenix.
 * ponytail: FCM (phone locked / app closed) not wired; add a channel using device_tokens once Firebase credentials exist.
 */
class AppNotification extends Notification
{
    public function __construct(
        public string $title,
        public string $body,
        public ?string $link = null,   // e.g. "direct:<a>_<b>" or "house:12"
        public string $kind = 'general',
    ) {}

    public function via(object $notifiable): array { return ['database', PhoenixChannel::class]; }

    public function toArray(object $notifiable): array
    {
        return ['kind' => $this->kind, 'title' => $this->title, 'body' => $this->body, 'link' => $this->link,
            // Who it is for and which app sent it: the phone shows these in the notification's header.
            'user_id' => $notifiable->id, 'user_name' => $notifiable->fullname, 'app' => config('app.name')];
    }
}
