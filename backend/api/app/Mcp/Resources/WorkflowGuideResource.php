<?php

namespace App\Mcp\Resources;

use App\Ai\Knowledge\VeyoraKnowledge;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Resource;

class WorkflowGuideResource extends Resource
{
    public function uri(): string
    {
        return 'veyora://guides/workflows';
    }

    public function name(): string
    {
        return 'Veyora Standard Workflows & Recovery Guide';
    }

    public function description(): string
    {
        return 'Step-by-step procedures for property onboarding, tenant leases, rent payments, and maintenance lifecycle.';
    }

    public function mimeType(): string
    {
        return 'text/markdown';
    }

    public function handle(Request $request): Response
    {
        return Response::text(<<<'MARKDOWN'
# Veyora Workflow & Procedures Guide

## 1. Landlord Property Registration & Unit Setup
1. **Property Basics**: Collect Property Name, Type (House, Apartment, Hostel, Commercial), and Mode (Entire House vs Multi-Unit).
2. **Location & Addressing**: Set Region, District, Ward, Street, and NAPA National Physical Addressing code. Map coordinates are resolved.
3. **Unit Inventory**: Add each independently rentable space with its own rent amount, bedrooms, and bathrooms.
4. **Safety & Verification**: Ensure NIDA verification is completed before publishing to the live marketplace.

## 2. Rental Agreements (Tenancies)
- Created by a landlord or accepted from a viewing application.
- Must specify tenant name, phone, agreed monthly rent, start date, and end date.
- Tenancies default to `active` and cannot overlap for the exact same unit.

## 3. Rent Payment Ledger
- Each payment is logged with exact amount, date, and payment method.
- Ledger entries cannot be modified destructively; corrections require explicit admin/landlord adjustments.
- Ledgers display running balances against the agreed monthly rent.

## 4. Maintenance Requests
- Lifecycle: `open` -> `in_progress` -> `completed` (or `cancelled`).
- Clear notes and work descriptions must be recorded upon status change.
MARKDOWN);
    }
}
