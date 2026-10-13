<?php

namespace App\Http\Controllers\Api;

use App\Ai\Agents\PropertyAssistant;
use App\Http\Controllers\Controller;
use App\Services\Ai\AiBlocked;
use App\Services\Ai\AiGateway;
use Illuminate\Http\Request;

/** The mobile app's AI helper. The app never sees a provider key: it only sends text and receives suggested fields. */
class AiAssistController extends Controller
{
    public function property(Request $r, AiGateway $gateway)
    {
        $d = $r->validate(['text' => 'required|string|min:10|max:2000']);

        try {
            $res = $gateway->ask($r->user(), 'property_assist', new PropertyAssistant, $d['text']);
        } catch (AiBlocked $e) {
            return response()->json(['message' => $e->getMessage()], $e->status);
        }

        return response()->json(['suggestion' => $res->toArray()]);
    }
}
