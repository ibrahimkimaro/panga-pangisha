<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** What the admin panel (panga_pangisha_website) needs: suspension, phone-less admin accounts, an audit trail. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->timestampTz('suspended_at')->nullable();
            $t->string('phone')->nullable()->change(); // admins sign in on the website with an email only
        });

        Schema::create('admin_actions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('action');         // e.g. user.suspended, listing.verified
            $t->string('subject_type');   // user | listing | report
            $t->unsignedBigInteger('subject_id');
            $t->string('summary');
            $t->timestampTz('created_at')->useCurrent();
            $t->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_actions');
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('suspended_at'));
    }
};
