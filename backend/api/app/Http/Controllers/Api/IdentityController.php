<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class IdentityController extends Controller
{
    /** GET /api/identity: where my verification stands. The app polls this while it waits. */
    public function show(Request $r)
    {
        return $r->user()->identity?->summary() ?? ['status' => 'none'];
    }

    /** POST /api/identity: a NIDA number, or a photo of the NIDA card. */
    public function store(Request $r)
    {
        $user = $r->user();
        abort_if(in_array($user->identityStatus(), ['pending', 'approved']), 409, 'Your identity is already submitted.');

        $r->merge(['nida_number' => preg_replace('/\D/', '', (string) $r->input('nida_number')) ?: null]);
        $d = $r->validate([
            'method' => 'required|in:nida_number,nida_card',
            'nida_number' => ['required_if:method,nida_number', 'nullable', 'digits:20'],
            'nida_card' => 'required_if:method,nida_card|nullable|image|max:8192',
        ], ['nida_number.digits' => 'A NIDA number has 20 digits.']);

        $v = $user->identities()->create($d['method'] === 'nida_number'
            ? ['method' => 'nida_number', 'nida_number' => $d['nida_number']]
            : ['method' => 'nida_card', 'document_path' => $r->file('nida_card')->store("identity/{$user->id}", 'local')]);
        return response()->json($v->fresh()->summary(), 201);
    }
}
