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

        $propertyDrafts = \App\Models\PropertyDraft::with('user:id,fullname,email')
            ->latest('updated_at')
            ->limit(10)
            ->get()
            ->map(fn ($d) => [
                'id' => $d->id,
                'user' => $d->user ? ['id' => $d->user->id, 'fullname' => $d->user->fullname, 'email' => $d->user->email] : null,
                'title' => $d->data['title'] ?? 'Untitled Property',
                'property_type' => $d->data['property_type'] ?? null,
                'city' => $d->data['city'] ?? null,
                'units_count' => count($d->data['units'] ?? []),
                'monthly_rent' => $d->data['monthly_rent'] ?? null,
                'status' => $d->status,
                'revision' => $d->revision,
                'completion_percent' => $d->validation_state['completion_percent'] ?? 0,
                'is_valid' => $d->validation_state['is_valid'] ?? false,
                'updated_at' => $d->updated_at->toIso8601String(),
            ]);

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
            'property_drafts' => $propertyDrafts,
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

    /** Sends a prompt through the gateway; supports connection ping or English/Swahili property registration test. */
    public function test(Request $r, AiGateway $gateway)
    {
        try {
            $testType = $r->input('type', 'connection');
            $s = AiSetting::current();

            if ($testType === 'swahili_property') {
                $agent = new \App\Ai\Agents\PropertyRegistrationAgent([
                    'draft' => [],
                    'rules' => (new \App\Ai\PropertyDraft\PropertyDraftService())->getFieldDefinitions(),
                ]);
                $prompt = "Nina nyumba ya vyumba vitatu Mwenge, kodi laki nne kila mwezi, umeme luku na maji dawasa yapo.";
                $res = $gateway->ask($r->user(), 'admin_test_swahili', $agent, $prompt);
                $extracted = is_array($res->structured) ? json_encode($res->structured, JSON_UNESCAPED_UNICODE) : $res->text;
                return back()->with('flash', "Swahili property test OK! Model ({$s->activeModel()}): " . mb_substr($extracted, 0, 160));
            } elseif ($testType === 'english_property') {
                $agent = new \App\Ai\Agents\PropertyRegistrationAgent([
                    'draft' => [],
                    'rules' => (new \App\Ai\PropertyDraft\PropertyDraftService())->getFieldDefinitions(),
                ]);
                $prompt = "3-bedroom house in Mwenge with private Luku meter and Dawasa water, rent 400,000 TZS per month.";
                $res = $gateway->ask($r->user(), 'admin_test_english', $agent, $prompt);
                $extracted = is_array($res->structured) ? json_encode($res->structured, JSON_UNESCAPED_UNICODE) : $res->text;
                return back()->with('flash', "English property test OK! Model ({$s->activeModel()}): " . mb_substr($extracted, 0, 160));
            }

            $res = $gateway->ask($r->user(), 'admin_test', new ConnectionTest, 'Reply with OK.');

            return back()->with('flash', "Connected to {$s->provider} / {$s->activeModel()}. It answered: " . mb_substr(trim($res->text), 0, 60));
        } catch (\Throwable $e) {
            return back()->with('flash', 'Test failed: ' . $e->getMessage());
        }
    }
}
