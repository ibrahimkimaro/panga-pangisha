<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\House;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HouseController extends Controller
{
    private const WITH = ['units', 'images', 'owner.profile'];

    /** Landlord: my houses. */
    public function mine(Request $r)
    {
        return $this->out($r->user()->houses()->with(self::WITH)->latest()->get());
    }

    /** Anyone logged in: browse + filter available houses. */
    public function index(Request $r)
    {
        $q = House::with(self::WITH)->live(); // available, and the advertiser is not suspended
        foreach (['property_type', 'region', 'district', 'bedrooms'] as $f) {
            if ($r->filled($f)) $q->where($f, $r->input($f));
        }
        if ($r->filled('min_bedrooms')) $q->where('bedrooms', '>=', (int) $r->input('min_bedrooms'));
        if ($r->filled('min_price')) $q->where('monthly_rent', '>=', $r->input('min_price'));
        if ($r->filled('max_price')) $q->where('monthly_rent', '<=', $r->input('max_price'));
        if ($r->boolean('verified')) $q->whereNotNull('verified_at');
        if ($r->filled('q')) {
            $like = '%' . $r->input('q') . '%';
            $q->where(fn ($w) => $w->whereLike('property_name', $like)->orWhereLike('district', $like)
                ->orWhereLike('ward', $like)->orWhereLike('street', $like));
        }
        return $this->out($q->latest()->paginate(min((int) $r->input('per_page', 20), 100))->items());
    }

    public function show(House $house) { return $this->one($house->load(self::WITH)); }

    public function favorites(Request $r)
    {
        return $this->out($r->user()->favorites()->with(self::WITH)->latest('favorites.created_at')->get());
    }

    public function toggleFavorite(Request $r, House $house)
    {
        $changes = $r->user()->favorites()->toggle($house->id);
        return ['is_favorite' => count($changes['attached']) > 0];
    }

    public function report(Request $r, House $house)
    {
        $d = $r->validate([
            'reason' => 'required|in:not_available,wrong_info,suspected_scam,asked_for_money,duplicate,other',
            'details' => 'nullable|string|max:1000',
        ]);
        DB::table('listing_reports')->insert($d + [
            'house_id' => $house->id, 'user_id' => $r->user()->id, 'created_at' => now(), 'updated_at' => now(),
        ]);
        return response()->noContent();
    }

    public function store(Request $r)
    {
        abort_unless($r->user()->identityStatus() === 'approved', 403, 'Verify your identity before you list a home.');
        $d = $r->validate([
            'property_name' => 'required|string|max:255', 'property_type' => 'required|string', 'property_category' => 'nullable|string',
            'furnishing_status' => 'nullable|string', 'description' => 'nullable|string',
            'region' => 'required|string', 'district' => 'required|string', 'ward' => 'nullable|string', 'street' => 'nullable|string',
            'house_number' => 'nullable|string', 'napa_number' => 'nullable|string|max:50', 'landmark' => 'nullable|string',
            'bedrooms' => 'nullable|integer|min:0', 'bathrooms' => 'nullable|integer|min:0', 'square_feet' => 'nullable|integer',
            'monthly_rent' => 'required|numeric|min:0', 'security_deposit' => 'nullable|numeric', 'maintenance_fee' => 'nullable|numeric',
            'amenities' => 'nullable|array', 'amenities.*' => 'string',
            'contact_name' => 'nullable|string', 'contact_phone' => 'nullable|string', 'contact_email' => 'nullable|email',
            'lease_duration' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90', 'longitude' => 'nullable|numeric|between:-180,180',
            'advertiser_role' => 'nullable|in:owner,representative',
            'total_units' => 'nullable|integer|min:1|max:500',
            'units' => 'nullable|array',
            'units.*.unit_number' => 'required|string|max:100',
            'units.*.unit_type' => 'nullable|string|max:100',
            'units.*.monthly_rent' => 'required|numeric|min:0',
            'units.*.payment_terms' => 'nullable|string|max:100',
            'units.*.bedrooms' => 'nullable|integer|min:0',
            'units.*.bathrooms' => 'nullable|integer|min:0',
            'units.*.image_path' => 'nullable|string',
            'units.*.description' => 'nullable|string',
            'cover_image' => 'nullable|image|max:10240', 'images.*' => 'image|max:10240',
        ]);

        $house = DB::transaction(function () use ($r, $d) {
            $units = $d['total_units'] ?? 1;
            $customUnits = $d['units'] ?? null;
            unset($d['total_units'], $d['units'], $d['images']);
            if ($r->hasFile('cover_image')) $d['cover_image'] = $r->file('cover_image')->store('houses', 'public');
            $house = $r->user()->houses()->create(array_filter($d, fn ($v) => $v !== null) + ['availability_confirmed_at' => now()]);
            foreach ($r->file('images', []) as $img) $house->images()->create(['path' => $img->store('houses', 'public')]);
            if (!empty($customUnits) && is_array($customUnits)) {
                foreach ($customUnits as $cu) {
                    $house->units()->create([
                        'unit_number' => $cu['unit_number'],
                        'unit_type' => $cu['unit_type'] ?? null,
                        'monthly_rent' => $cu['monthly_rent'],
                        'payment_terms' => $cu['payment_terms'] ?? null,
                        'bedrooms' => $cu['bedrooms'] ?? 1,
                        'bathrooms' => $cu['bathrooms'] ?? 1,
                        'image_path' => $cu['image_path'] ?? null,
                        'description' => $cu['description'] ?? null,
                        'status' => 'available',
                    ]);
                }
            } else {
                for ($i = 1; $i <= $units; $i++) $house->units()->create(['unit_number' => "U$i", 'monthly_rent' => $house->monthly_rent, 'status' => 'available']);
            }
            return $house;
        });
        return response()->json($this->one($house->load(self::WITH)), 201);
    }

    public function update(Request $r, House $house)
    {
        abort_unless($house->owner_id === $r->user()->id, 403);
        abort_if($house->status === 'suspended', 403, 'This listing was suspended by Panga. Contact support.');
        $d = $r->validate([
            'property_name' => 'sometimes|string|max:255',
            'property_type' => 'sometimes|nullable|string',
            'property_category' => 'sometimes|nullable|string',
            'furnishing_status' => 'sometimes|nullable|string',
            'description' => 'sometimes|nullable|string',
            'region' => 'sometimes|nullable|string',
            'district' => 'sometimes|nullable|string',
            'ward' => 'sometimes|nullable|string',
            'street' => 'sometimes|nullable|string',
            'house_number' => 'sometimes|nullable|string',
            'landmark' => 'sometimes|nullable|string',
            'bedrooms' => 'sometimes|nullable|integer|min:0',
            'bathrooms' => 'sometimes|nullable|integer|min:0',
            'square_feet' => 'sometimes|nullable|integer',
            'monthly_rent' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:available,rented,reserved,maintenance',
            'amenities' => 'sometimes|array',
            'confirm_available' => 'sometimes|boolean',
            'napa_number' => 'sometimes|nullable|string|max:50',
        ]);
        if ($r->boolean('confirm_available')) $d['availability_confirmed_at'] = now();
        unset($d['confirm_available']);
        $house->update($d);
        return $this->one($house->load(self::WITH));
    }

    public function destroy(Request $r, House $house)
    {
        abort_unless($house->owner_id === $r->user()->id, 403);
        // Deleting a home takes its tenants and their payment records with it, so not while someone lives there.
        abort_if($house->tenancies()->where('status', 'active')->exists(), 422, 'A tenant still lives here. End the tenancy first.');
        $house->delete();
        return response()->noContent();
    }

    public function units(Request $r, House $house)
    {
        abort_unless($house->owner_id === $r->user()->id, 403);
        return response()->json($house->units()->latest('id')->get());
    }

    public function storeUnit(Request $r, House $house)
    {
        abort_unless($house->owner_id === $r->user()->id, 403);
        $d = $r->validate([
            'unit_number' => 'required|string|max:100',
            'unit_type' => 'nullable|string|max:100',
            'monthly_rent' => 'required|numeric|min:0',
            'payment_terms' => 'nullable|string|max:100',
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'image' => 'nullable|image|max:10240',
            'image_path' => 'nullable|string',
            'description' => 'nullable|string',
            'status' => 'nullable|in:available,rented,reserved,maintenance',
        ]);
        if ($r->hasFile('image')) {
            $d['image_path'] = $r->file('image')->store('houses', 'public');
        }
        unset($d['image']);
        $unit = $house->units()->create($d + ['status' => $d['status'] ?? 'available']);
        return response()->json($unit, 201);
    }

    public function updateUnit(Request $r, \App\Models\Unit $unit)
    {
        abort_unless($unit->house->owner_id === $r->user()->id, 403);
        $d = $r->validate([
            'unit_number' => 'sometimes|string|max:100',
            'unit_type' => 'sometimes|nullable|string|max:100',
            'monthly_rent' => 'sometimes|numeric|min:0',
            'payment_terms' => 'sometimes|nullable|string|max:100',
            'bedrooms' => 'sometimes|nullable|integer|min:0',
            'bathrooms' => 'sometimes|nullable|integer|min:0',
            'image' => 'sometimes|nullable|image|max:10240',
            'image_path' => 'sometimes|nullable|string',
            'description' => 'sometimes|nullable|string',
            'status' => 'sometimes|in:available,rented,reserved,maintenance',
        ]);
        if ($r->hasFile('image')) {
            $d['image_path'] = $r->file('image')->store('houses', 'public');
        }
        unset($d['image']);
        $unit->update($d);
        return response()->json($unit->fresh());
    }

    public function destroyUnit(Request $r, \App\Models\Unit $unit)
    {
        abort_unless($unit->house->owner_id === $r->user()->id, 403);
        $unit->delete();
        return response()->noContent();
    }

    private function out($houses)
    {
        $favs = request()->user()?->favorites()->pluck('houses.id')->flip();
        return collect($houses)->map(fn ($h) => $this->one($h, $favs))->values();
    }

    /** Adds the url fields the app reads next to the model, and hides the exact pin from everyone but the owner. */
    private function one(House $h, $favs = null): array
    {
        $me = request()->user();
        $favs ??= $me?->favorites()->whereKey($h->id)->pluck('houses.id')->flip();
        $url = fn ($p) => $p ? '/storage/' . $p : null;
        $a = $h->toArray();
        unset($a['owner'], $a['images']);
        if ($h->owner_id !== $me?->id) {
            // SRS PROP-006 / API-008: public location is approximate (~100 m) until the owner shares the address.
            foreach (['latitude', 'longitude'] as $k) $a[$k] = $h->$k === null ? null : round((float) $h->$k, 3);
            unset($a['house_number']);
        }
        return $a + [
            'house_profile_image' => $url($h->cover_image),
            'image_urls' => $h->relationLoaded('images') ? $h->images->map(fn ($i) => $url($i->path))->all() : [],
            'is_favorite' => (bool) $favs?->has($h->id),
            'is_mine' => $h->owner_id === $me?->id,
            'owner' => $h->relationLoaded('owner') && $h->owner ? [
                'id' => $h->owner->id, 'fullname' => $h->owner->fullname,
                'profile_image' => $url($h->owner->profile?->profile_image),
                'member_since' => $h->owner->created_at?->toDateString(),
            ] : null,
        ];
    }
}
