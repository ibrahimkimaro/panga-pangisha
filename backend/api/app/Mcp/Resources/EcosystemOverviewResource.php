<?php

namespace App\Mcp\Resources;

use App\Ai\Knowledge\VeyoraKnowledge;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Resource;

class EcosystemOverviewResource extends Resource
{
    public function uri(): string
    {
        return 'veyora://ecosystem/overview';
    }

    public function name(): string
    {
        return 'Veyora Housing Ecosystem Overview';
    }

    public function description(): string
    {
        return 'Official technical and domain documentation for the Veyora ecosystem, entity hierarchy, and business rules.';
    }

    public function mimeType(): string
    {
        return 'text/markdown';
    }

    public function handle(Request $request): Response
    {
        return Response::text(VeyoraKnowledge::systemOverview());
    }
}
