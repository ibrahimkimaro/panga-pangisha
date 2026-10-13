<?php

namespace App\Ai\Agents;

use App\Ai\Knowledge\VeyoraKnowledge;
use App\Mcp\Tools\Account\GetUserProfileTool;
use App\Mcp\Tools\Financial\GetPaymentHistoryTool;
use App\Mcp\Tools\Maintenance\ListMaintenanceTool;
use App\Mcp\Tools\Property\GetPropertyDetailsTool;
use App\Mcp\Tools\Property\ListMyPropertiesTool;
use App\Mcp\Tools\Property\SearchPropertiesTool;
use App\Mcp\Tools\Tenancy\ListTenanciesTool;
use App\Models\User;
use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\RemembersConversations as RemembersConversationsContract;
use Laravel\Ai\Promptable;
use Laravel\Ai\Tools\McpServerTool;
use Stringable;

/**
 * Production-ready Veyora Application-Aware Assistant.
 * Integrates application knowledge, user capability enforcement, conversation continuity,
 * and scoped MCP tools via Laravel AI SDK.
 */
class VeyoraAssistant implements Agent, HasTools, RemembersConversationsContract
{
    use Promptable, RemembersConversations;

    protected ?User $activeUser = null;
    protected array $clientContext = [];

    public function withContext(?User $user, array $context = []): static
    {
        $this->activeUser = $user;
        $this->clientContext = $context;
        if ($user) {
            $this->forUser($user);
        }
        return $this;
    }

    public function instructions(): Stringable|string
    {
        $overview = VeyoraKnowledge::systemOverview();
        $userRole = $this->activeUser?->role ?? 'guest';
        $roleInfo = VeyoraKnowledge::roleGuidelines($userRole);
        $userSummary = $this->activeUser
            ? "User ID: {$this->activeUser->id}, Name: {$this->activeUser->fullname}, Role: {$this->activeUser->role}, Identity Status: {$this->activeUser->identityStatus()}"
            : "Guest User (unauthenticated)";

        $contextSummary = empty($this->clientContext)
            ? "No client screen context provided."
            : "Client-Reported Screen Context: " . json_encode($this->clientContext);

        return <<<MARKDOWN
You are Veyora, the official Veyora Housing AI Assistant (Panga na Kupangisha).
Introduce yourself as Veyora whenever greeted or asked for your name.
You understand the complete housing ecosystem in Tanzania: rentals, landlords, tenants, leases, rent payments, maintenance, and verification.

# Current Authentication & Access Boundaries
{$userSummary}
{$contextSummary}

# Role Rules
{$roleInfo}

# System Domain Knowledge
{$overview}

# Mandatory Behavioral Directives
1. **Never Invent Facts or Financial Transactions**: When asked about available houses, rent payments, tenancies, or maintenance, use your tools to query the verified database. Never guess amounts, tenant names, or dates.
2. **Permission Boundaries**:
   - A landlord can only inspect and manage their own properties, units, tenancies, and maintenance.
   - A tenant can only see public available listings or their own lease agreements and payments.
   - Never expose another user's personal phone number, National ID (NIDA), or financial ledger.
3. **Structured Guidance**:
   - For landlords creating properties, guide them progressively: Property Type -> Location & NAPA Code -> Unit breakdown with rent -> Amenities.
   - For tenants looking for homes, clarify location, budget (in TZS), and room requirements.
4. **Consequential Operations**:
   - If the user asks to save a property draft, modify rent, delete a unit, or register a payment, present a clear, structured summary and ask for their confirmation before performing the final action.
5. **Language**:
   - Support both English and Swahili (Kiswahili) naturally according to user preference, while maintaining identical business rules and financial precision.
6. **No Emojis in Property Records**: Keep property descriptions and names professional and factual.
MARKDOWN;
    }

    public function tools(): iterable
    {
        return [
            new McpServerTool(new SearchPropertiesTool),
            new McpServerTool(new GetPropertyDetailsTool),
            new McpServerTool(new ListMyPropertiesTool),
            new McpServerTool(new ListTenanciesTool),
            new McpServerTool(new GetPaymentHistoryTool),
            new McpServerTool(new ListMaintenanceTool),
            new McpServerTool(new GetUserProfileTool),
            new McpServerTool(new \App\Mcp\Tools\Property\CreatePropertyDraftTool),
            new McpServerTool(new \App\Mcp\Tools\Maintenance\CreateMaintenanceTicketTool),
        ];
    }
}
