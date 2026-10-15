<?php

use App\Http\Controllers\Admin\{AiController, AnnouncementController, AuthController, BusinessController, DashboardController, IdentityController, ListingController, TeamController, UserController};
use App\Models\House;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public landing page. Location is ward-level only, as in the app.
Route::get('/', fn () => Inertia::render('Home', [
    'homes' => House::live()->orderByRaw('verified_at is null')->latest()->limit(6)->get([
        'id', 'property_name', 'property_type', 'district', 'ward', 'bedrooms', 'bathrooms', 'monthly_rent',
        'cover_image', 'advertiser_role', 'verified_at', 'availability_confirmed_at',
    ]),
    'stats' => ['homes' => House::live()->count(), 'districts' => House::live()->distinct()->count('district')],
    'downloadUrl' => config('services.app_download_url'),
]));

// Universal Authentication routes (for all users: renters, landlords, managers, investors)
Route::get('login', fn () => Inertia::render('Auth/Login'))->name('login');
Route::post('login', [\App\Http\Controllers\Landlord\DashboardController::class, 'webLogin'])->name('web.login');
Route::post('logout', [\App\Http\Controllers\Landlord\DashboardController::class, 'webLogout'])->name('web.logout');
Route::get('signup', fn () => Inertia::render('Auth/Signup'))->name('signup');

// Tenant space
Route::prefix('tenant')->group(function () {
    Route::get('dashboard', fn () => Inertia::render('Tenant/Dashboard'))->name('tenant.dashboard');
});

// Landlord space
Route::prefix('landlord')->group(function () {
    Route::get('login', fn () => Inertia::render('Auth/Login', ['initialRole' => 'landlord']))->name('landlord.login');
    Route::get('signup', fn () => Inertia::render('Auth/Signup', ['initialRole' => 'landlord']))->name('landlord.signup');
    Route::get('auth', fn () => Inertia::render('Landlord/Auth'))->name('landlord.auth');
    Route::get('dashboard', [\App\Http\Controllers\Landlord\DashboardController::class, 'index'])->name('landlord.dashboard');
    Route::get('home', [\App\Http\Controllers\Landlord\DashboardController::class, 'index'])->name('landlord.home');
    Route::post('profile/update', [\App\Http\Controllers\Landlord\DashboardController::class, 'updateProfile'])->name('landlord.profile.update');
    Route::post('profile/avatar', [\App\Http\Controllers\Landlord\DashboardController::class, 'updateAvatar'])->name('landlord.profile.avatar');
    Route::post('profile/password', [\App\Http\Controllers\Landlord\DashboardController::class, 'updatePassword'])->name('landlord.profile.password');
    Route::post('settings/update', [\App\Http\Controllers\Landlord\DashboardController::class, 'updateSettings'])->name('landlord.settings.update');
});

Route::prefix('admin')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('login', [AuthController::class, 'create'])->name('login');
        Route::post('login', [AuthController::class, 'store'])->middleware('throttle:5,1');
    });

    Route::middleware(['auth', 'admin'])->group(function () {
        Route::post('logout', [AuthController::class, 'destroy']);
        Route::get('/', [DashboardController::class, 'index']);
        Route::get('viewings', [DashboardController::class, 'viewings']);
        Route::get('activity', [DashboardController::class, 'activity']);

        Route::get('search', [DashboardController::class, 'search']);

        Route::get('identity', [IdentityController::class, 'index']);
        Route::get('identity/{verification}/document', [IdentityController::class, 'document']);
        Route::post('identity/{verification}', [IdentityController::class, 'decide']);
        Route::post('identity/{verification}/revoke', [IdentityController::class, 'revoke']);

        Route::get('business', [BusinessController::class, 'index']);
        Route::post('business/{business}', [BusinessController::class, 'decide']);

        Route::get('users', [UserController::class, 'index']);
        Route::get('users/export', [UserController::class, 'export']);
        Route::get('users/{user}', [UserController::class, 'show']);
        Route::patch('users/{user}', [UserController::class, 'update']);
        Route::post('users/{user}/message', [UserController::class, 'message'])->middleware('throttle:60,1');
        Route::post('users/{user}/suspend', [UserController::class, 'suspend']);
        Route::post('users/{user}/reactivate', [UserController::class, 'reactivate']);

        Route::get('listings', [ListingController::class, 'index']);
        Route::get('listings/export', [ListingController::class, 'export']);
        Route::get('listings/{house}', [ListingController::class, 'show']);
        Route::post('listings/{house}/{action}', [ListingController::class, 'act'])->whereIn('action', ['verify', 'unverify', 'suspend', 'restore']);
        Route::delete('listings/{house}', [ListingController::class, 'destroy']);

        Route::get('ai', [AiController::class, 'index']);
        Route::patch('ai', [AiController::class, 'update']);
        Route::post('ai/test', [AiController::class, 'test'])->middleware('throttle:10,1');

        Route::get('announcements', [AnnouncementController::class, 'index']);
        Route::post('announcements', [AnnouncementController::class, 'store'])->middleware('throttle:10,1');
        Route::get('team', [TeamController::class, 'index']);
        Route::post('team', [TeamController::class, 'store']);
        Route::post('team/{user}/toggle', [TeamController::class, 'toggle']);

        Route::get('reports', [ListingController::class, 'reports']);
        Route::patch('reports/{report}', [ListingController::class, 'resolveReport']);
    });
});

\Laravel\Mcp\Facades\Mcp::web('mcp/veyora', \App\Mcp\Servers\VeyoraMcpServer::class)->middleware(['auth:sanctum']);

