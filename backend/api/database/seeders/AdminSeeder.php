<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/** Creates (or resets the password of) the website admin from ADMIN_EMAIL / ADMIN_PASSWORD in backend/.env. */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = strtolower((string) env('ADMIN_EMAIL'));
        $password = (string) env('ADMIN_PASSWORD');
        if ($email === '' || $password === '') return;

        User::updateOrCreate(['email' => $email], ['fullname' => env('ADMIN_NAME', 'Panga Admin'), 'role' => 'admin', 'password' => $password]);
    }
}
