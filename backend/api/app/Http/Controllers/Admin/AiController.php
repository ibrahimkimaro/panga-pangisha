<?php

namespace App\Http\Controllers\Admin;

use App\Ai\Agents\ConnectionTest;
use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\AiSetting;
use App\Models\AiUsageLog;
use App\Services\Ai\AiBlocked;
use App\Services\Ai\AiGateway;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/** AI settings, limits and usage monitoring. Provider keys stay in .env; this page only shows whether each is set. */
class AiController extends Controller
{
    public function index(Request $r)
    {
        $s = AiSetting::current();
        $ok = AiUsageLog::where('status', 'ok');
        $sum = fn ($q) => ['tokens' => (int) (clone $q)->selectRaw('coalesce(sum(input_tokens + output_tokens),0) t')->value('t'), 'cost' => round((float) (clone $q)->sum('cost'), 4), 'calls' => (clone $q)->count()];
        $today = $sum((clone $ok)->where('created_at', '>=', now()->startOfDay()));
        $month = $sum((clone $ok)->where('created_at', '>=', now()->startOfMonth()));

        $daily = AiUsageLog::where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->selectRaw("date(created_at) as day, sum(case when status = 'ok' then input_tokens + output_tokens else 0 end) as tokens, sum(case when status = 'ok' then 1 else 0 end) as calls, sum(case when status = 'error' then 1 else 0 end) as errors, sum(case when status = 'blocked' then 1 else 0 end) as blocked")
            ->groupBy('day')->orderBy('day')->get();

        $calls = AiUsageLog::where('created_at', '>=', now()->startOfMonth());

        return Inertia::render('Admin/Ai', [
            'settings' => $s->only(['enabled', 'provider', 'timeout_seconds', 'rate_per_minute', 'user_daily_tokens', 'global_daily_tokens', 'global_monthly_tokens', 'monthly_cost_cap', 'input_price_per_million', 'output_price_per_million', 'alert_percent']) + ['model' => $s->model, 'active_model' => $s->activeModel()],
            'providers' => collect(config('panga_ai.providers'))->map(fn ($p, $k) => $p + ['id' => $k, 'configured' => AiSetting::configured($k)])->values(),
            'today' => $today,
            'month' => $month,
            'daily' => $daily,
            'status' => [
                'ok' => (clone $calls)->where('status', 'ok')->count(),
                'error' => (clone $calls)->where('status', 'error')->count(),
                'blocked' => (clone $calls)->where('status', 'blocked')->count(),
                'avg_latency_ms' => (int) AiUsageLog::where('status', 'ok')->where('created_at', '>=', now()->startOfMonth())->avg('latency_ms'),
            ],
            'top_users' => AiUsageLog::with('user:id,fullname,email')->where('status', 'ok')->where('created_at', '>=', now()->startOfMonth())->whereNotNull('user_id')
                ->selectRaw('user_id, count(*) as calls, sum(input_tokens + output_tokens) as tokens, sum(cost) as cost')->groupBy('user_id')->orderByDesc('tokens')->limit(8)->get(),
            'by_feature' => AiUsageLog::where('status', 'ok')->where('created_at', '>=', now()->startOfMonth())
                ->selectRaw('feature, count(*) as calls, sum(input_tokens + output_tokens) as tokens, sum(cost) as cost')->groupBy('feature')->orderByDesc('tokens')->get(),
            'recent' => AiUsageLog::with('user:id,fullname')->latest('id')->limit(25)->get(),
        ]);
    }

    public function update(Request $r)
    {
        $d = $r->validate([
            'enabled' => 'required|boolean',
            'provider' => ['required', Rule::in(array_keys(config('panga_ai.providers')))],
            'model' => 'nullable|string|max:120',
            'timeout_seconds' => 'required|integer|between:5,300',
            'rate_per_minute' => 'required|integer|between:0,600',
            'user_daily_tokens' => 'required|integer|min:0',
            'global_daily_tokens' => 'required|integer|min:0',
            'global_monthly_tokens' => 'required|integer|min:0',
            'monthly_cost_cap' => 'required|numeric|min:0',
            'input_price_per_million' => 'required|numeric|min:0',
            'output_price_per_million' => 'required|numeric|min:0',
            'alert_percent' => 'required|integer|between:1,100',
        ]);
        $d['model'] = filled($d['model'] ?? null) ? trim($d['model']) : null;
        $s = AiSetting::current();
        $s->update($d);
        AdminAction::record('ai.updated', $s, "Changed AI settings: {$s->provider} / " . ($s->activeModel() ?: 'no model') . ($s->enabled ? '' : ' (switched off)'));

        return back()->with('flash', 'AI settings saved.');
    }

    /** Sends one tiny prompt through the real gateway, so the limits and the log apply to the test too. */
    public function test(Request $r, AiGateway $gateway)
    {
        try {
            $res = $gateway->ask($r->user(), 'admin_test', new ConnectionTest, 'Reply with OK.');
            $s = AiSetting::current();

            return back()->with('flash', "Connected to {$s->provider} / {$s->activeModel()}. It answered: " . mb_substr(trim($res->text), 0, 60));
        } catch (AiBlocked $e) {
            return back()->with('flash', 'Test failed: ' . $e->getMessage());
        }
    }
}
