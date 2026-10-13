<?php

namespace App\Services\Ai;

use RuntimeException;

/** A call was refused (limit, rate limit, AI off) or failed. The message is safe to show to the user. */
class AiBlocked extends RuntimeException
{
    public function __construct(string $message, public readonly int $status = 429)
    {
        parent::__construct($message);
    }
}
