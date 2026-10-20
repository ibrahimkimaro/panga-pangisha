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

    /** POST /api/identity: a NIDA number, or a photo of ID (NIDA, driving licence, voter ID). */
    public function store(Request $r)
    {
        $user = $r->user();
        abort_if(in_array($user->identityStatus(), ['pending', 'approved']), 409, 'Your identity is already submitted.');

        $r->merge(['nida_number' => preg_replace('/\D/', '', (string) $r->input('nida_number')) ?: null]);
        $d = $r->validate([
            'method' => 'required|in:nida_number,nida_card,driving_licence,voter_id',
            'nida_number' => ['required_if:method,nida_number', 'nullable', 'digits:20'],
            'nida_card' => 'nullable|image|max:10240',
            'document' => 'nullable|image|max:10240',
            'driving_licence' => 'nullable|image|max:10240',
            'voter_id' => 'nullable|image|max:10240',
        ], ['nida_number.digits' => 'A NIDA number has 20 digits.']);

        $file = $r->file('document')
            ?? $r->file('nida_card')
            ?? $r->file('driving_licence')
            ?? $r->file('voter_id')
            ?? $r->file('file');

        $existing = $user->identities()->where('status', 'pending')->first();

        if ($d['method'] !== 'nida_number' && !$file) {
            abort_unless($existing?->document_path, 422, 'Please attach an image of your document.');
        }

        $path = $file ? $file->store("identity/{$user->id}", 'local') : $existing?->document_path;

        $payload = [
            'method' => $d['method'],
            'nida_number' => $d['method'] === 'nida_number' ? $d['nida_number'] : null,
            'document_path' => $d['method'] === 'nida_number' ? null : $path,
            'status' => 'pending',
            'rejection_reason' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ];

        if ($existing) {
            if ($existing->document_path && $path && $existing->document_path !== $path) {
                \Illuminate\Support\Facades\Storage::disk('local')->delete($existing->document_path);
            }
            $existing->update($payload);
            $v = $existing;
        } else {
            $v = $user->identities()->create($payload);
        }

        return response()->json($v->fresh()->summary(), 201);
    }
}
