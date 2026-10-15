# Veyora Knowledge Base & Conversation Developer Guide

Welcome to the internal knowledge repository for **Veyora**, the conversational AI companion for Panga Pangisha.

## 1. Directory Structure
```
backend/api/knowledge/
├── assistant_identity.md             # Veyora identity, persona, mission, multilingual support
├── conversation_principles.md        # Core conversational rules and minimal sufficient path
├── product_overview.md               # Product components, Flutter app, backend API, user roles
├── housing_domain.md                 # Tanzania rental geography, property types, NAPA codes
├── rental_workflows.md               # Tenant and landlord end-to-end lifecycles
├── property_management.md            # Multi-unit structures, room types, vacancy tracking
├── tenant_guidance.md                # Tenant rights, lease agreements, disputes, utilities
├── landlord_guidance.md              # Landlord responsibilities, rent collection, legal notice
├── rent_and_payment_explanations.md  # Rent ledgers, security deposits, payment channels
├── savings_and_financing.md          # 30% rule, advance rent saving, financial disclaimer
├── privacy_and_security.md           # Tenant isolation, zero cross-user leakage, prompt injection
├── platform_capabilities.md          # Genuinely implemented features vs future roadmap
├── escalation_and_limitations.md     # Emergency triggers, legal disclaimer, support channels
├── tool_usage_policy.md              # 6-step decision ladder: direct vs knowledge vs memory vs tools
├── response_examples.md              # Benchmark examples for each query type
└── README.md                         # This developer guide
```

## 2. How to Add or Update Knowledge
1. **Choose the Right File**: Match your change to the specific topic file (e.g. update `tenant_guidance.md` for new tenancy regulations).
2. **Review for Accuracy**:
   - Ensure the information reflects real platform features or accurate Tanzanian customs/laws.
   - Never document unimplemented features as live without adding a disclaimer in `platform_capabilities.md`.
3. **Keep Sections Structured**:
   - Use clear markdown headers (`## Topic Name`) and bullet points.
   - The `VeyoraKnowledgeRetriever` indexes files by section headers and keywords for fast, targeted injection.

## 3. How to Add a New Tool
1. Create your tool under `backend/api/app/Mcp/Tools/<Category>/<ToolName>.php`.
2. Implement `name()`, `description()`, `schema()`, and `handle(Request $request)`.
3. **Always Enforce Authorization**:
   ```php
   $user = $request->user();
   if (! $user) {
       return Response::text(json_encode(['error' => 'Authentication required.']));
   }
   // Always verify property or tenancy ownership:
   // $house = House::where('id', $houseId)->where('owner_id', $user->id)->firstOrFail();
   ```
4. Register the tool in `VeyoraAssistant::tools()` and update `tool_usage_policy.md`.

## 4. How the Intelligent Orchestrator Selects Paths
- **Greeting / Casual**: Handled directly with zero MCP calls or database queries.
- **Platform Knowledge**: Retrieved from these markdown files without database tool calls.
- **Memory**: Scoped strictly to the authenticated user's session history.
- **Authoritative Data**: Invokes authenticated MCP tools with strict role and tenancy boundaries.
- **Ambiguous Request**: Prompts the user with a concise clarification question rather than guessing.
