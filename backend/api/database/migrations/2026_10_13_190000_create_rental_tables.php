<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** What a landlord keeps about a let home: who lives there, the rent they paid, and repairs. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenancies', function (Blueprint $t) {
            $t->id();
            $t->foreignId('house_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // the tenant's own Panga account, when their phone matches one
            $t->string('name', 120);
            $t->string('phone', 30)->nullable();
            $t->string('email', 190)->nullable();
            $t->string('unit', 30)->nullable(); // free text ("T23"), not tied to the units table
            $t->decimal('monthly_rent', 12, 2);
            $t->date('starts_on');
            $t->date('ends_on')->nullable();
            $t->string('status')->default('active')->index(); // active | ended
            $t->timestamps();
        });

        // The landlord's own record of money received; Panga does not move the money.
        Schema::create('rent_payments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('tenancy_id')->constrained()->cascadeOnDelete();
            $t->decimal('amount', 12, 2);
            $t->date('paid_on')->index();
            $t->string('method', 20)->nullable(); // cash | mobile | bank
            $t->string('note', 300)->nullable();
            $t->timestamps();
        });

        Schema::create('maintenance_requests', function (Blueprint $t) {
            $t->id();
            $t->foreignId('house_id')->constrained()->cascadeOnDelete();
            $t->foreignId('tenancy_id')->nullable()->constrained()->nullOnDelete();
            $t->string('title', 120);
            $t->text('details')->nullable();
            $t->string('status')->default('open')->index(); // open | in_progress | resolved
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_requests');
        Schema::dropIfExists('rent_payments');
        Schema::dropIfExists('tenancies');
    }
};
