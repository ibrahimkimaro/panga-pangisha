<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],


    // Phoenix realtime chat: `secret` must equal the chat server's SECRET_KEY.
    'chat' => [
        'secret' => env('CHAT_SECRET_KEY', 'dev-only-change-me'),
        'ws_url' => env('CHAT_WS_URL', 'ws://10.0.2.2:4100/socket'),
        'internal_url' => env('CHAT_INTERNAL_URL', 'http://chat:4000'),
    ],

    // Shown as the "Get the app" button on the landing page once the app is published.
    'app_download_url' => env('APP_DOWNLOAD_URL'),

];
