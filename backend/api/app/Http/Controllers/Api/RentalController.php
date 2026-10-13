<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\House;
use App\Models\MaintenanceRequest;
use App\Models\RentPayment;
use App\Models\Tenancy;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;

/** A landlord's rental records: who lives where, the rent they paid, and repairs. Only for homes the caller owns. */
class RentalController extends Controller
{
    /** Months are counted in Tanzanian time, so a payment at 1 a.m. on the 1st is not last month's. */
    private const TZ = 'Africa/Dar_es_Salaam';

    public function tenants(Request $r)
    {
        return $this->mine($r)->orderBy('status')->latest()->get()->map(fn ($t) => $this->tenant($t));
    }

    public function storeTenant(Request $r)
    {
        $house = $r->user()->houses()->findOrFail($r->validate(['house_id' => 'required|integer'])['house_id']);
        return response()->json($this->tenant($house->tenancies()->create($this->tenantData($r, true))->load('house')), 201);
    }

    /** One tenant with their payments and repair requests. */
    public function showTenant(Request $r, int $id)
    {
        $t = $this->mine($r)->findOrFail($id);
        return $this->tenant($t) + [
            // ponytail: the latest 100 payments; add paging when a tenancy outlives that.
            'payments' => $t->payments()->latest('paid_on')->latest('id')->limit(100)->get()->map(fn ($p) => $this->payment($p->setRelation('tenancy', $t))),
            'maintenance' => $t->maintenance()->latest()->get()->map(fn ($m) => $this->request($m->setRelation('tenancy', $t)->setRelation('house', $t->house))),
        ];
    }

    public function updateTenant(Request $r, int $id)
    {
        $t = $this->mine($r)->findOrFail($id);
        $d = $this->tenantData($r, false);
        if (($d['status'] ?? null) === 'ended') $d['ends_on'] ??= now(self::TZ)->toDateString();
        $t->update($d);
        return $this->tenant($t);
    }

    public function pay(Request $r, int $id)
    {
        $t = $this->mine($r)->findOrFail($id);
        $d = $r->validate([
            'amount' => 'required|numeric|min:1|max:9999999999',
            'paid_on' => 'required|date|before_or_equal:tomorrow', // the phone's "today" can be a day ahead of the server's
            'method' => 'nullable|in:cash,mobile,bank', 'note' => 'nullable|string|max:300',
        ]);
        $p = $t->payments()->create($d);
        $t->user?->notify(new AppNotification('Rent received',
            "{$r->user()->fullname} recorded your payment of TSh " . number_format($p->amount) . " for {$t->house->property_name}.", "house:{$t->house_id}", 'rent'));
        return response()->json($this->payment($p->setRelation('tenancy', $t)), 201);
    }

    /** Takes back a payment recorded by mistake. */
    public function unpay(Request $r, RentPayment $payment)
    {
        abort_unless($payment->tenancy->house->owner_id === $r->user()->id, 404);
        $payment->delete();
        return response()->noContent();
    }

    /** This month's total against what is due, the last six months, and the payments behind them. */
    public function payments(Request $r)
    {
        $houses = $this->houses($r);
        $first = now(self::TZ)->startOfMonth(); // startOfMonth first: "31 March minus one month" is not February
        // ponytail: the list covers six months; older payments show on each tenant. Page it when landlords ask for more.
        $all = RentPayment::whereHas('tenancy', fn ($t) => $t->whereIn('house_id', $houses))->with('tenancy.house')
            ->where('paid_on', '>=', $first->copy()->subMonths(5)->toDateString())->latest('paid_on')->latest('id')->get();
        $byMonth = $all->groupBy(fn ($p) => $p->paid_on->format('Y-m'));
        $active = Tenancy::whereIn('house_id', $houses)->where('status', 'active')->get(['id', 'monthly_rent']);
        $now = $first->format('Y-m');
        return [
            'collected' => (float) $byMonth->get($now)?->sum('amount'),
            'expected' => (float) $active->sum('monthly_rent'),
            'tenants' => $active->count(),
            'tenants_paid' => $active->pluck('id')->intersect($byMonth->get($now)?->pluck('tenancy_id') ?? [])->count(),
            'months' => collect(range(5, 0))->map(fn ($i) => $first->copy()->subMonths($i)->format('Y-m'))
                ->map(fn ($m) => ['month' => $m, 'total' => (float) $byMonth->get($m)?->sum('amount')])->all(),
            'payments' => $all->map(fn ($p) => $this->payment($p))->all(),
        ];
    }

    public function requests(Request $r)
    {
        return MaintenanceRequest::whereIn('house_id', $this->houses($r))->with(['house', 'tenancy'])
            ->latest()->limit(200)->get()->map(fn ($m) => $this->request($m));
    }

    public function storeRequest(Request $r)
    {
        $d = $r->validate(['house_id' => 'required|integer', 'tenancy_id' => 'nullable|integer',
            'title' => 'required|string|max:120', 'details' => 'nullable|string|max:1000']);
        $house = $r->user()->houses()->findOrFail($d['house_id']);
        abort_if(isset($d['tenancy_id']) && !$house->tenancies()->whereKey($d['tenancy_id'])->exists(), 422, 'That tenant does not live in this property.');
        return response()->json($this->request($house->maintenance()->create($d)->load(['house', 'tenancy'])), 201);
    }

    public function updateRequest(Request $r, MaintenanceRequest $maintenance)
    {
        abort_unless($maintenance->house->owner_id === $r->user()->id, 404);
        $maintenance->update($r->validate(['status' => 'required|in:open,in_progress,resolved']));
        $state = str_replace('_', ' ', $maintenance->status);
        $maintenance->tenancy?->user?->notify(new AppNotification('Repair update',
            "\"{$maintenance->title}\" is now $state.", "house:{$maintenance->house_id}", 'maintenance'));
        return $this->request($maintenance->load('tenancy'));
    }

    /** Ids of the caller's homes, or just the one named in ?house=. */
    private function houses(Request $r)
    {
        return $r->user()->houses()->when($r->query('house'), fn ($q, $h) => $q->whereKey($h))->pluck('id');
    }

    /** The caller's tenancies, each with its home and what it has paid this month. */
    private function mine(Request $r)
    {
        return Tenancy::whereIn('house_id', $this->houses($r))->with('house')->withSum(
            ['payments as paid_this_month' => fn ($p) => $p->where('paid_on', '>=', now(self::TZ)->startOfMonth()->toDateString())], 'amount');
    }

    private function tenantData(Request $r, bool $new): array
    {
        $need = $new ? 'required' : 'sometimes';
        $d = $r->validate([
            'name' => "$need|string|max:120", 'phone' => 'nullable|string|max:30', 'email' => 'nullable|email|max:190',
            'unit' => 'nullable|string|max:30', 'monthly_rent' => "$need|numeric|min:0|max:9999999999",
            'starts_on' => "$need|date", 'ends_on' => 'nullable|date', 'status' => 'sometimes|in:active,ended',
        ]);
        if (!empty($d['phone'])) {
            $d['phone'] = AuthController::phone($d['phone']);
            $d['user_id'] = User::where('phone', $d['phone'])->value('id'); // a tenant who uses Panga can be messaged and notified
        }
        return $d;
    }

    private function home(House $h): array
    {
        return ['id' => $h->id, 'property_name' => $h->property_name, 'district' => $h->district,
            'house_profile_image' => $h->cover_image ? '/storage/' . $h->cover_image : null];
    }

    private function tenant(Tenancy $t): array
    {
        return $t->only(['id', 'user_id', 'name', 'phone', 'email', 'unit', 'status']) + [
            'monthly_rent' => (float) $t->monthly_rent, 'starts_on' => $t->starts_on->toDateString(), 'ends_on' => $t->ends_on?->toDateString(),
            'paid_this_month' => (float) $t->paid_this_month, 'house' => $this->home($t->house),
        ];
    }

    private function payment(RentPayment $p): array
    {
        return ['id' => $p->id, 'amount' => (float) $p->amount, 'paid_on' => $p->paid_on->toDateString(), 'method' => $p->method, 'note' => $p->note,
            'tenant' => $this->who($p->tenancy), 'house' => $this->home($p->tenancy->house)];
    }

    private function request(MaintenanceRequest $m): array
    {
        return $m->only(['id', 'title', 'details', 'status']) + ['created_at' => $m->created_at,
            'tenant' => $m->tenancy ? $this->who($m->tenancy) : null, 'house' => $this->home($m->house)];
    }

    private function who(Tenancy $t): array { return $t->only(['id', 'name', 'unit']); }
}
