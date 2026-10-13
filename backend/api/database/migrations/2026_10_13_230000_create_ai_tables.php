<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** What the admin controls about AI (one row), and one log row per AI call. API keys are never stored here. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_settings', function (Blueprint $t) {
            $t->id();
            $t->boolean('enabled')->default(true);
            $t->string('provider', 40)->default('gemini');
            $t->string('model', 120)->nullable();            // null = the provider's default from config
            $t->unsignedSmallInteger('timeout_seconds')->default(30);
            $t->unsignedSmallInteger('rate_per_minute')->default(10);      // calls per user per minute
            $t->unsignedInteger('user_daily_tokens')->default(50000);      // 0 = unlimited
            $t->unsignedBigInteger('global_daily_tokens')->default(2000000);
            $t->unsignedBigInteger('global_monthly_tokens')->default(40000000);
            $t->decimal('monthly_cost_cap', 10, 2)->default(0);            // USD, 0 = no cap
            $t->decimal('input_price_per_million', 10, 4)->default(0);     // USD per 1M tokens, 0 for local models
            $t->decimal('output_price_per_million', 10, 4)->default(0);
            $t->unsignedSmallInteger('alert_percent')->default(80);        // warn on the dashboard at this % of a limit
            $t->timestamps();
        });

        Schema::create('ai_usage_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('feature', 60)->index();               // e.g. property_assist, admin_test
            $t->string('provider', 40);
            $t->string('model', 120)->nullable();
            $t->unsignedInteger('input_tokens')->default(0);
            $t->unsignedInteger('output_tokens')->default(0);
            $t->decimal('cost', 12, 6)->default(0);
            $t->unsignedInteger('latency_ms')->default(0);
            $t->string('status', 20)->index();                // ok | error | blocked
            $t->string('error', 500)->nullable();
            $t->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage_logs');
        Schema::dropIfExists('ai_settings');
    }
};
