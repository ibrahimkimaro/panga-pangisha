<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $t) {
            $t->id();
            $t->uuid('uuid')->unique(); // identity on the Phoenix chat server
            $t->string('fullname');
            $t->string('email')->nullable()->unique();
            $t->string('phone')->unique();
            $t->string('role'); // landlord | renter | investor
            $t->string('password');
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
