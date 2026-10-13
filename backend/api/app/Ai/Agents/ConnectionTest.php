<?php

namespace App\Ai\Agents;

use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Promptable;
use Stringable;

/** Used by the admin "Test connection" button. */
class ConnectionTest implements Agent
{
    use Promptable;

    public function instructions(): Stringable|string
    {
        return 'Reply with the single word OK and nothing else.';
    }
}
