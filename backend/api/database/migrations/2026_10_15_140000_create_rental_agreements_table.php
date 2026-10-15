<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_agreements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('house_id')->constrained()->cascadeOnDelete();
            $table->foreignId('unit_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('tenancy_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('landlord_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained('users')->nullOnDelete();
            
            // Contract identifiers & language
            $table->string('agreement_number', 50)->unique();
            $table->string('language', 10)->default('sw'); // 'sw' for Kiswahili, 'en' for English
            $table->unsignedInteger('version')->default(1);
            $table->string('status', 40)->default('draft')->index(); 
            // draft | pending_tenant_signature | pending_landlord_signature | signed | active | amended | cancelled

            // Verified party & property summary
            $table->string('tenant_name', 150);
            $table->string('tenant_phone', 40);
            $table->string('tenant_email', 150)->nullable();
            $table->string('tenant_nida', 40)->nullable();
            $table->string('property_name', 150);
            $table->string('unit_number', 50);

            // Financial & tenancy terms
            $table->decimal('monthly_rent', 12, 2);
            $table->decimal('security_deposit', 12, 2)->default(0);
            $table->string('payment_frequency', 40)->default('monthly'); // monthly | quarterly | semi-annually | annually
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->unsignedInteger('duration_months')->default(6);
            $table->string('payment_method', 50)->default('mobile_money');

            // Complete structured terms (bilingual clauses, inventory, occupancy rules, utilities, dispute terms)
            $table->json('terms')->nullable();
            $table->json('inventory')->nullable();
            $table->json('meter_readings')->nullable();

            // Signatures & verification
            $table->longText('tenant_signature')->nullable();
            $table->timestamp('tenant_signed_at')->nullable();
            $table->string('tenant_signed_ip', 50)->nullable();
            $table->string('tenant_signer_name', 150)->nullable();

            $table->longText('landlord_signature')->nullable();
            $table->timestamp('landlord_signed_at')->nullable();
            $table->string('landlord_signed_ip', 50)->nullable();
            $table->string('landlord_signer_name', 150)->nullable();

            $table->timestamp('activated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_agreements');
    }
};
