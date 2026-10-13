<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

/**
 * A one-time code: emailed when the account has an email; AuthController also "sends" it by SMS.
 * ponytail: no SMS provider chosen yet, so the SMS is only written to the log; replace sms() with the provider call.
 */
class CodeNotification extends Notification
{
    public function __construct(public string $code) {}

    public function via(object $notifiable): array
    {
        return $notifiable->email ? ['mail'] : [];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("{$this->code} is your Panga na Kupangisha code")
            ->greeting("Habari {$notifiable->fullname},")
            ->line('Use this code to reset your password:')
            ->line("**{$this->code}**")
            ->line('It expires in 10 minutes. If you did not ask for it, ignore this email and your password stays the same.');
    }

    public static function sms(string $phone, string $text): void
    {
        Log::info("SMS to $phone: $text");
    }
}
