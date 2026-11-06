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
            ->subject("{$this->code} — Your Panga Pangisha Password Reset Code")
            ->greeting("Habari {$notifiable->fullname},")
            ->line('We received a request to reset the password for your Panga na Kupangisha account.')
            ->line('Enter the 6-digit verification code below on the password reset screen:')
            ->line("# **{$this->code}**")
            ->line('This verification code will expire in **10 minutes**.')
            ->line('If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.');
    }

    public static function sms(string $phone, string $text): void
    {
        Log::info("SMS to $phone: $text");
    }
}
