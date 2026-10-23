<?php

use App\Http\Controllers\Api\{AiAssistController, AuthController, BusinessController, ChatController, HouseController, IdentityController, InternalController, NotificationController, ProfileController, RentalController, ViewingController};
use Illuminate\Support\Facades\Route;

Route::post('user/register/', [AuthController::class, 'register'])->middleware('throttle:10,1,auth');
Route::post('user/api/token/', [AuthController::class, 'login'])->middleware('throttle:10,1,auth');
Route::post('user/password/forgot/', [AuthController::class, 'forgot'])->middleware('throttle:5,10,forgot');
Route::post('user/password/reset/', [AuthController::class, 'reset'])->middleware('throttle:10,10,reset');
Route::post('internal/push', [InternalController::class, 'push']); // called by Phoenix

// Public Guest Support AI Agent & House Inquiry Routes
Route::post('ai/support', [\App\Http\Controllers\Api\GuestSupportController::class, 'chat'])->middleware('throttle:30,15');
Route::post('guest/inquiry', [\App\Http\Controllers\Api\GuestSupportController::class, 'inquiry'])->middleware('throttle:15,10');
Route::post('houses/{house}/guest-inquiry', [\App\Http\Controllers\Api\GuestSupportController::class, 'inquiry'])->middleware('throttle:15,10');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('user/api/token/refresh/', [AuthController::class, 'refresh']);
    Route::get('user/me/', [AuthController::class, 'me']);
    Route::patch('user/me/', [AuthController::class, 'updateMe']);
    Route::post('user/logout/', [AuthController::class, 'logout']);

    Route::get('identity', [IdentityController::class, 'show']);
    Route::post('identity', [IdentityController::class, 'store'])->middleware('throttle:10,60,identity');
    Route::post('identity/simulate-approval', [IdentityController::class, 'simulateApproval']);
    Route::get('business', [BusinessController::class, 'show']);
    Route::post('business', [BusinessController::class, 'store'])->middleware('throttle:10,60,business');

    Route::get('profile/UserUpdateProfile/', [ProfileController::class, 'show']);
    Route::match(['post', 'patch'], 'profile/update_profile_pic/', [ProfileController::class, 'update']);

    Route::get('landlord/getAllHouses/', [HouseController::class, 'mine']);
    Route::get('landlord/getAvailableHouse/', [HouseController::class, 'index']);
    Route::get('landlord/search_house/', [HouseController::class, 'index']);
    Route::post('landlord/add-nyumba/', [HouseController::class, 'store']);
    Route::get('landlord/houses/{house}', [HouseController::class, 'show']);
    Route::match(['put', 'patch'], 'landlord/houses/{house}', [HouseController::class, 'update']);
    Route::delete('landlord/houses/{house}', [HouseController::class, 'destroy']);
    Route::get('landlord/houses/{house}/units', [HouseController::class, 'units']);
    Route::post('landlord/houses/{house}/units', [HouseController::class, 'storeUnit']);
    Route::match(['put', 'patch'], 'landlord/units/{unit}', [HouseController::class, 'updateUnit']);
    Route::delete('landlord/units/{unit}', [HouseController::class, 'destroyUnit']);

    Route::post('ai/property-assist', [AiAssistController::class, 'property'])->middleware('throttle:30,1');
    Route::get('ai/assistant/conversations', [\App\Http\Controllers\Api\VeyoraAssistantController::class, 'indexConversations']);
    Route::post('ai/assistant/conversations', [\App\Http\Controllers\Api\VeyoraAssistantController::class, 'createConversation']);
    Route::post('ai/assistant/message', [\App\Http\Controllers\Api\VeyoraAssistantController::class, 'message'])->middleware('throttle:30,1');
    Route::get('ai/assistant/conversations/{id}', [\App\Http\Controllers\Api\VeyoraAssistantController::class, 'history']);
    Route::delete('ai/assistant/conversations/{id}', [\App\Http\Controllers\Api\VeyoraAssistantController::class, 'deleteConversation']);

    Route::get('property-drafts/active', [\App\Http\Controllers\Api\PropertyDraftController::class, 'showActive']);
    Route::post('property-drafts/chat', [\App\Http\Controllers\Api\PropertyDraftController::class, 'chat'])->middleware('throttle:30,1');
    Route::patch('property-drafts/{id}', [\App\Http\Controllers\Api\PropertyDraftController::class, 'update']);
    Route::post('property-drafts/{id}/finalize', [\App\Http\Controllers\Api\PropertyDraftController::class, 'finalize']);

    Route::get('favorites', [HouseController::class, 'favorites']);
    Route::post('houses/{house}/favorite', [HouseController::class, 'toggleFavorite']);
    Route::post('houses/{house}/report', [HouseController::class, 'report'])->middleware('throttle:10,60,report');
    Route::post('houses/{house}/viewing-requests', [ViewingController::class, 'store']);
    Route::get('viewing-requests', [ViewingController::class, 'index']);
    Route::patch('viewing-requests/{viewing}', [ViewingController::class, 'update']);

    // A landlord's own records. Every one is limited to homes the caller owns; ?house=ID narrows the lists to one home.
    Route::get('tenants', [RentalController::class, 'tenants']);
    Route::post('tenants', [RentalController::class, 'storeTenant']);
    Route::get('tenants/{id}', [RentalController::class, 'showTenant']);
    Route::patch('tenants/{id}', [RentalController::class, 'updateTenant']);
    Route::post('tenants/{id}/payments', [RentalController::class, 'pay']);
    Route::get('rent-payments', [RentalController::class, 'payments']);
    Route::delete('rent-payments/{payment}', [RentalController::class, 'unpay']);
    // Agreements, Invoices, and Occupancy
    Route::get('agreements', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'listAgreements']);
    Route::post('agreements/draft', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'prepareDraft']);
    Route::get('agreements/{id}', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'showAgreement']);
    Route::patch('agreements/{id}', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'updateDraft']);
    Route::post('agreements/{id}/sign-tenant', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'tenantSign']);
    Route::post('agreements/{id}/sign-landlord', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'landlordSign']);
    Route::get('agreements/{id}/print', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'printAgreementHtml']);

    Route::get('invoices', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'listInvoices']);
    Route::post('invoices/generate', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'generateInvoice']);
    Route::get('invoices/{id}', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'showInvoice']);
    Route::post('invoices/{id}/pay', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'recordPayment']);
    Route::post('invoices/{id}/share', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'shareInvoice']);
    Route::get('invoices/{id}/print', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'printInvoiceHtml']);

    Route::get('occupancy/metrics', [\App\Http\Controllers\Api\AgreementAndInvoiceController::class, 'occupancyMetrics']);

    Route::get('maintenance', [RentalController::class, 'requests']);
    Route::post('maintenance', [RentalController::class, 'storeRequest']);
    Route::patch('maintenance/{maintenance}', [RentalController::class, 'updateRequest']);

    Route::get('chatApp/token/', [ChatController::class, 'token']);
    Route::get('conversations', [ChatController::class, 'conversations']);
    Route::get('people', [ChatController::class, 'people'])->middleware('throttle:60,1,people');
    Route::post('chat/groups', [ChatController::class, 'createGroup'])->middleware('throttle:10,60,groups');
    Route::get('chat/groups/{slug}', [ChatController::class, 'group']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/read-all', [NotificationController::class, 'readAll']);
    Route::post('notifications/{id}/read', [NotificationController::class, 'read']);
    Route::post('notifications/device', [NotificationController::class, 'registerDevice']);
});
