<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** The single row of admin-controlled AI settings. Keys are never stored here. */
class AiSetting extends Model
{
    protected $guarded = ['id'];
    protected $casts = [
        'enabled' => 'boolean',
        'monthly_cost_cap' => 'float',
        'input_price_per_million' => 'float',
        'output_price_per_million' => 'float',
    ];

    public static function current(): static
    {
        return static::first() ?? static::create(['provider' => config('ai.default', 'gemini')])->fresh();
    }

    /** The model in use: the admin's override, else the provider's default from config. */
    public function activeModel(): ?string
    {
        return $this->model ?: config("panga_ai.providers.{$this->provider}.model");
    }

    /** True when the provider has what it needs to be called (a key, or a URL for local servers). */
    public static function configured(string $provider): bool
    {
        $c = config("ai.providers.$provider");
        if (! $c) return false;
        return in_array($provider, ['ollama', 'openai-compatible'], true) ? ! empty($c['url']) : ! empty($c['key']);
    }
}
