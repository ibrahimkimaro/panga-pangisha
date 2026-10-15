<?php

namespace App\Mcp\Servers;

use App\Mcp\Prompts\PropertyRegistrationPrompt;
use App\Mcp\Resources\EcosystemOverviewResource;
use App\Mcp\Resources\WorkflowGuideResource;
use App\Mcp\Tools\Account\GetUserProfileTool;
use App\Mcp\Tools\Financial\GetPaymentHistoryTool;
use App\Mcp\Tools\Maintenance\ListMaintenanceTool;
use App\Mcp\Tools\Property\GetPropertyDetailsTool;
use App\Mcp\Tools\Property\ListMyPropertiesTool;
use App\Mcp\Tools\Property\SearchPropertiesTool;
use App\Mcp\Tools\Tenancy\ListTenanciesTool;
use Laravel\Mcp\Server;

class VeyoraMcpServer extends Server
{
    protected string $name = 'Veyora Housing MCP Server';

    protected string $version = '1.0.0';

    protected string $instructions = <<<'MARKDOWN'
    Official Model Context Protocol server for the Veyora (Panga na Kupangisha) Housing Platform.
    Exposes authorized property search, unit inspection, landlord management, tenancy records,
    rent payment ledgers, and maintenance requests. Every tool is strictly bounded to the
    authenticated user's server-side permissions and role.
    MARKDOWN;

    protected array $tools = [
        SearchPropertiesTool::class,
        GetPropertyDetailsTool::class,
        ListMyPropertiesTool::class,
        ListTenanciesTool::class,
        GetPaymentHistoryTool::class,
        ListMaintenanceTool::class,
        GetUserProfileTool::class,
        \App\Mcp\Tools\Property\CreatePropertyDraftTool::class,
        \App\Mcp\Tools\Maintenance\CreateMaintenanceTicketTool::class,
        \App\Mcp\Tools\Rental\PrepareRentalAgreementTool::class,
        \App\Mcp\Tools\Rental\UpdateAgreementTermsTool::class,
        \App\Mcp\Tools\Rental\GenerateInvoiceTool::class,
        \App\Mcp\Tools\Rental\GetOccupancyDurationTool::class,
        \App\Mcp\Tools\Rental\CheckPendingSignaturesTool::class,
    ];

    protected array $resources = [
        EcosystemOverviewResource::class,
        WorkflowGuideResource::class,
    ];

    protected array $prompts = [
        PropertyRegistrationPrompt::class,
    ];
}
