<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 50)->unique();
            $table->foreignId('house_id')->constrained()->cascadeOnDelete();
            $table->foreignId('unit_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('tenancy_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('rental_agreement_id')->nullable()->constrained('rental_agreements')->nullOnDelete();
            $table->foreignId('landlord_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained('users')->nullOnDelete();

            // Tenant & property snapshots
            $table->string('property_name', 150);
            $table->string('unit_number', 50);
            $table->string('tenant_name', 150);
            $table->string('tenant_phone', 40)->nullable();
            $table->string('tenant_email', 150)->nullable();

            // Dates & billing period
            $table->date('issue_date');
            $table->date('due_date');
            $table->date('period_start');
            $table->date('period_end');
            $table->dateTime('check_in_at')->nullable();
            $table->dateTime('check_out_at')->nullable();

            // Financials
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('amount_due', 12, 2);
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->decimal('outstanding_balance', 12, 2);
            $table->string('currency', 10)->default('TZS');

            // Status: issued | delivered | partially_paid | paid | overdue | cancelled
            $table->string('status', 40)->default('issued')->index();

            // Itemized line items: Base rent, security deposit, electricity, water, maintenance fee, late fee
            $table->json('line_items');

            // Late payment terms & utility readings
            $table->json('utility_readings')->nullable(); // e.g. electricity units, water meter
            $table->string('late_fee_policy', 255)->nullable();
            $table->text('notes')->nullable();

            // Payment verification & screenshot
            $table->string('payment_method', 50)->nullable(); // mpesa | tigopesa | airtel | bank | cash
            $table->string('payment_reference', 100)->nullable();
            $table->text('receipt_screenshot_url')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('delivered_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
