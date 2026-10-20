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
    Route::get('agreements', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'listAgreements']);
    Route::get('agreements/{id}', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'showAgreement']);
    Route::get('agreements/{id}/print', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'printAgreementHtml'])->name('tenant.agreements.print');
    Route::post('agreements/{id}/sign-tenant', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'tenantSign']);
    Route::get('invoices', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'listInvoices']);
    Route::get('invoices/{id}', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'showInvoice']);
    Route::get('invoices/{id}/print', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'printInvoiceHtml'])->name('tenant.invoices.print');
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
    Route::match(['post', 'delete'], 'profile/avatar/remove', [\App\Http\Controllers\Landlord\DashboardController::class, 'removeAvatar'])->name('landlord.profile.avatar.remove');
    Route::post('profile/password', [\App\Http\Controllers\Landlord\DashboardController::class, 'updatePassword'])->name('landlord.profile.password');
    Route::post('settings/update', [\App\Http\Controllers\Landlord\DashboardController::class, 'updateSettings'])->name('landlord.settings.update');

    // Rental Agreements (Mkataba wa Nyumba)
    Route::get('agreements', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'listAgreements']);
    Route::post('agreements/draft', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'prepareDraft']);
    Route::get('agreements/{id}', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'showAgreement']);
    Route::patch('agreements/{id}', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'updateDraft']);
    Route::post('agreements/{id}/sign-landlord', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'landlordSign']);
    Route::get('agreements/{id}/print', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'printAgreementHtml'])->name('landlord.agreements.print');

    // Invoices Ledger & Payments
    Route::get('invoices', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'listInvoices']);
    Route::post('invoices/generate', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'generateInvoice']);
    Route::get('invoices/{id}', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'showInvoice']);
    Route::post('invoices/{id}/pay', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'recordPayment']);
    Route::post('invoices/{id}/share', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'shareInvoice'])->name('landlord.invoices.share');
    Route::get('invoices/{id}/print', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'printInvoiceHtml'])->name('landlord.invoices.print');

    // Occupancy & Duration tracking
    Route::get('occupancy-metrics', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'occupancyMetrics']);
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
        Route::post('users/{user}/password', [UserController::class, 'updatePassword']);
        Route::post('users/{user}/message', [UserController::class, 'message'])->middleware('throttle:60,1');
        Route::post('users/{user}/suspend', [UserController::class, 'suspend']);
        Route::post('users/{user}/reactivate', [UserController::class, 'reactivate']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);

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

