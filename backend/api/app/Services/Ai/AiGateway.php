<?php

namespace App\Services\Ai;

use App\Models\AiSetting;
use App\Models\AiUsageLog;
use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Ai\Contracts\Agent;
use Throwable;

/**
 * The only door to an AI model. Every call goes through here so the admin's limits, the rate limit, the
 * timeout and the usage log apply to all features, whichever provider or model is configured.
 */
class AiGateway
{
    /** @return \Laravel\Ai\Responses\AgentResponse */
    public function ask(?User $user, string $feature, Agent $agent, string $prompt)
    {
        $s = AiSetting::current();
        $model = $s->activeModel();

        $this->guard($user, $feature, $s, $model);

        $start = microtime(true);
        try {
            $response = $agent->prompt($prompt, provider: $s->provider, model: $model, timeout: $s->timeout_seconds);
        } catch (Throwable $e) {
            $this->log($user, $feature, $s, $model, 0, 0, $start, 'error', $this->scrub($e->getMessage()));
            report($e);
            throw new AiBlocked('The AI assistant is not available right now. Please try again, or fill the details in yourself.', 503);
        }

        $in = (int) ($response->usage->inputTokens ?? 0);
        $out = (int) ($response->usage->outputTokens ?? 0);
        $this->log($user, $feature, $s, $model, $in, $out, $start, 'ok');

        return $response;
    }

    /** Refuse the call, and record that it was refused, when AI is off or any limit is reached. */
    private function guard(?User $user, string $feature, AiSetting $s, ?string $model): void
    {
        $block = function (string $why, string $shown, int $status = 429) use ($user, $feature, $s, $model) {
            $this->log($user, $feature, $s, $model, 0, 0, microtime(true), 'blocked', $why);
            throw new AiBlocked($shown, $status);
        };

        if (! $s->enabled) $block('AI is switched off', 'The AI assistant is switched off.', 503);
        if (! AiSetting::configured($s->provider)) $block("Provider {$s->provider} has no key or URL in .env", 'The AI assistant is not set up yet.', 503);

        if ($user && $s->rate_per_minute > 0) {
            $key = "ai:user:{$user->id}";
            if (! RateLimiter::attempt($key, $s->rate_per_minute, fn () => true, 60)) {
                $block('Rate limit', 'You are asking too fast. Wait a minute and try again.');
            }
        }

        $used = fn ($since, $userId = null) => (int) AiUsageLog::where('status', 'ok')->where('created_at', '>=', $since)
            ->when($userId, fn ($q) => $q->where('user_id', $userId))->selectRaw('coalesce(sum(input_tokens + output_tokens), 0) as t')->value('t');

        if ($user && $s->user_daily_tokens > 0 && $used(now()->startOfDay(), $user->id) >= $s->user_daily_tokens) {
            $block('User daily token limit', 'You have used today\'s AI allowance. It resets tomorrow.');
        }
        if ($s->global_daily_tokens > 0 && $used(now()->startOfDay()) >= $s->global_daily_tokens) {
            $block('Global daily token limit', 'The AI assistant has reached its limit for today.', 503);
        }
        if ($s->global_monthly_tokens > 0 && $used(now()->startOfMonth()) >= $s->global_monthly_tokens) {
            $block('Global monthly token limit', 'The AI assistant has reached its limit for this month.', 503);
        }
        if ($s->monthly_cost_cap > 0 && (float) AiUsageLog::where('status', 'ok')->where('created_at', '>=', now()->startOfMonth())->sum('cost') >= $s->monthly_cost_cap) {
            $block('Monthly cost cap', 'The AI assistant has reached its spending limit for this month.', 503);
        }
    }

    private function log(?User $user, string $feature, AiSetting $s, ?string $model, int $in, int $out, float $start, string $status, ?string $error = null): void
    {
        AiUsageLog::create([
            'user_id' => $user?->id, 'feature' => $feature, 'provider' => $s->provider, 'model' => $model,
            'input_tokens' => $in, 'output_tokens' => $out,
            'cost' => round($in / 1e6 * $s->input_price_per_million + $out / 1e6 * $s->output_price_per_million, 6),
            'latency_ms' => (int) round((microtime(true) - $start) * 1000),
            'status' => $status, 'error' => $error ? mb_substr($error, 0, 500) : null,
        ]);
    }

    /** Provider errors can echo the request URL, which carries the key. Never store it. */
    private function scrub(string $message): string
    {
        return preg_replace('/([?&]key=|Bearer\s+|api[_-]?key["\':= ]+)[A-Za-z0-9._\-]+/i', '$1***', $message);
    }
}
