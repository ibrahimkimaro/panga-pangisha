<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenancies', function (Blueprint $table) {
            if (!Schema::hasColumn('tenancies', 'unit_id')) {
                $table->foreignId('unit_id')->nullable()->after('house_id')->constrained()->nullOnDelete();
            }
            if (!Schema::hasColumn('tenancies', 'deposit_amount')) {
                $table->decimal('deposit_amount', 12, 2)->default(0)->after('monthly_rent');
            }
            if (!Schema::hasColumn('tenancies', 'payment_frequency')) {
                $table->string('payment_frequency', 40)->default('monthly')->after('deposit_amount');
            }
            if (!Schema::hasColumn('tenancies', 'nida')) {
                $table->string('nida', 40)->nullable()->after('email');
            }
            if (!Schema::hasColumn('tenancies', 'check_in_at')) {
                $table->dateTime('check_in_at')->nullable()->after('starts_on');
            }
            if (!Schema::hasColumn('tenancies', 'check_out_at')) {
                $table->dateTime('check_out_at')->nullable()->after('ends_on');
            }
            if (!Schema::hasColumn('tenancies', 'agreement_status')) {
                $table->string('agreement_status', 40)->default('pending')->after('status');
            }
        });

        Schema::table('units', function (Blueprint $table) {
            if (!Schema::hasColumn('units', 'current_tenancy_id')) {
                $table->foreignId('current_tenancy_id')->nullable()->after('status')->constrained('tenancies')->nullOnDelete();
            }
            if (!Schema::hasColumn('units', 'last_move_out')) {
                $table->date('last_move_out')->nullable()->after('current_tenancy_id');
            }
            if (!Schema::hasColumn('units', 'deposit_required')) {
                $table->decimal('deposit_required', 12, 2)->nullable()->after('monthly_rent');
            }
        });
    }

    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->dropForeign(['current_tenancy_id']);
            $table->dropColumn(['current_tenancy_id', 'last_move_out', 'deposit_required']);
        });

        Schema::table('tenancies', function (Blueprint $table) {
            $table->dropForeign(['unit_id']);
            $table->dropColumn(['unit_id', 'deposit_amount', 'payment_frequency', 'nida', 'check_in_at', 'check_out_at', 'agreement_status']);
        });
    }
};
