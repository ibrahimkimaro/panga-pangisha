---
domain: invoices_and_payments
title: Rent Invoices, Payment Tracking, Receipts & Arrears Management
features: [invoicing, rent_ledgers, payment_methods, mobile_money, receipts, arrears_alerts, trusted_financials]
roles: [landlord, renter, admin]
status: implemented
sources: [backend/api/app/Models/Invoice.php, backend/api/app/Models/RentPayment.php, backend/api/app/Http/Controllers/Api/AgreementAndInvoiceController.php, panga_pangisha/lib/screens/owner/invoices_screen.dart]
version: 2.0.0
---

# Invoices and Payments

## 1. Rent Invoices (`invoices` table)
Panga Pangisha maintains an authoritative, audit-ready billing ledger.
- **Invoice Structure**:
  - `invoice_number`: Unique sequential identifier (e.g., `INV-2026-10-0042`).
  - Linked to `house_id`, `unit_id`, `tenancy_id`, and `rental_agreement_id`.
  - Billing Period: `period_start` and `period_end` defining the exact lease coverage cycle.
  - Due Date (`due_date`): Specific date by which rent must be received.
  - Financial Breakdown:
    * `subtotal`: Base monthly rent (or multi-month advance amount).
    * `line_items`: Itemized charges (Monthly Rent, Security Deposit, Service Charge, Water Fee).
    * `amount_due`: Total billed amount in Tanzanian Shillings (TZS).
    * `amount_paid`: Cumulative confirmed payments logged against this invoice.
    * `outstanding_balance`: Remaining balance (`amount_due - amount_paid`).
  - Statuses: `draft`, `unpaid`, `partially_paid`, `paid`, `overdue`, `cancelled`.

## 2. Supported Payment Methods in Tanzania
Tenants pay rent through recognized, traceable channels:
1. **Mobile Money**:
   - **M-Pesa** (Vodacom Tanzania)
   - **Tigo Pesa** (Yas Tanzania)
   - **Airtel Money** (Airtel Tanzania)
   - **HaloPesa** (Halotel)
2. **Bank Transfers / Lipa Namba**:
   - Direct bank transfer to landlord's account (NMB, CRDB, Stanbic, NBC, etc.) or merchant Lipa Namba.
3. **Cash**:
   - Permitted when accompanied by a signed physical or digital receipt.

## 3. Trusted Financial Principle: ZERO Hallucination
- **Absolute Rule**: Veyora AI must **NEVER** invent payment figures, generate fake payment receipts, or state that a payment succeeded without verified backend records.
- If asked: "How much rent is outstanding?", Veyora queries the trusted database via `get_rent_summary` or `get_arrears_alerts` and presents exact TZS figures with billing period context.
- If no payments are logged, Veyora states that clearly: "Zero payments have been recorded for this billing cycle."

## 4. Payment Receipts & PDF Printing
- Once a payment is recorded via `POST /api/invoices/{id}/pay` or `POST /api/tenants/{id}/payments`, the invoice updates its `amount_paid`, `outstanding_balance`, and `paid_at` timestamp.
- A printable digital receipt / invoice HTML is accessible at `GET /api/invoices/{id}/print`.
- Landlords can share digital invoice summaries via WhatsApp or SMS using `POST /api/invoices/{id}/share`.

## 5. Arrears & Overdue Alerts
- Landlords can review overdue tenancies using the arrears alert tool (`get_arrears_alerts`).
- Flags tenancies where current date exceeds `due_date` and `outstanding_balance > 0`, providing days in arrears and severity indicators (warning vs critical).
