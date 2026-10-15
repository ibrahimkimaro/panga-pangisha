<!DOCTYPE html>
<html lang="sw">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ankara ya Malipo - {{ $invoice->invoice_number }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #0f172a;
            --accent: #0284c7;
            --success: #16a34a;
            --warning: #ea580c;
            --danger: #dc2626;
            --border: #e2e8f0;
            --bg-light: #f8fafc;
            --text-main: #1e293b;
            --text-muted: #64748b;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: var(--text-main);
            background-color: #f1f5f9;
            line-height: 1.5;
            font-size: 13px;
            padding: 40px 15px;
        }
        .invoice-card {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            padding: 50px 55px;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
            position: relative;
        }
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid var(--border);
            padding-bottom: 25px;
            margin-bottom: 25px;
        }
        .brand-logo {
            font-size: 24px;
            font-weight: 800;
            color: var(--primary);
            letter-spacing: -0.5px;
        }
        .brand-logo span {
            color: var(--accent);
        }
        .brand-tagline {
            font-size: 11px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            margin-top: 2px;
        }
        .invoice-meta {
            text-align: right;
        }
        .invoice-title {
            font-size: 20px;
            font-weight: 800;
            color: var(--primary);
            text-transform: uppercase;
        }
        .invoice-num {
            font-family: 'JetBrains Mono', monospace;
            font-size: 14px;
            font-weight: 700;
            color: var(--accent);
            margin-top: 3px;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-bottom: 25px;
        }
        .meta-box {
            background: var(--bg-light);
            border-radius: 8px;
            padding: 14px 18px;
            border: 1px solid var(--border);
        }
        .meta-label {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: var(--text-muted);
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }
        .meta-name {
            font-size: 14px;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 3px;
        }
        .meta-detail {
            font-size: 12px;
            color: #475569;
            margin-bottom: 2px;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 50px;
            font-weight: 800;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-paid {
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
        }
        .status-partially_paid {
            background: #fef9c3;
            color: #a16207;
            border: 1px solid #fde047;
        }
        .status-issued, .status-delivered {
            background: #e0f2fe;
            color: #0369a1;
            border: 1px solid #bae6fd;
        }
        .status-overdue {
            background: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fca5a5;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0 15px;
        }
        .items-table th {
            background: var(--primary);
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 14px;
            text-align: left;
        }
        .items-table th:last-child {
            text-align: right;
        }
        .items-table td {
            padding: 12px 14px;
            border-bottom: 1px solid var(--border);
            color: #334155;
            font-size: 13px;
        }
        .items-table td:last-child {
            text-align: right;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
        }
        .items-table tr:hover {
            background: #f8fafc;
        }
        .summary-wrap {
            display: flex;
            justify-content: flex-end;
            margin-top: 15px;
            margin-bottom: 30px;
        }
        .summary-table {
            width: 320px;
            border-collapse: collapse;
        }
        .summary-table td {
            padding: 6px 12px;
            font-size: 13px;
        }
        .summary-table td:last-child {
            text-align: right;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 600;
        }
        .summary-table tr.total-row td {
            border-top: 2px solid var(--primary);
            font-size: 16px;
            font-weight: 800;
            color: var(--primary);
            padding-top: 10px;
        }
        .summary-table tr.balance-row td {
            font-size: 15px;
            font-weight: 800;
            color: var(--danger);
            border-top: 1px dashed var(--border);
            padding-top: 8px;
        }
        .summary-table tr.paid-row td {
            font-size: 14px;
            font-weight: 700;
            color: var(--success);
        }
        .payment-instructions {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 18px 20px;
            margin-bottom: 25px;
        }
        .payment-title {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            color: #166534;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .payment-channels {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            font-size: 12px;
            color: #166534;
        }
        .floating-print-btn {
            position: fixed;
            bottom: 25px;
            right: 25px;
            background: #0f172a;
            color: #ffffff;
            border: none;
            border-radius: 50px;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 700;
            box-shadow: 0 4px 15px rgba(15, 23, 42, 0.4);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            z-index: 999;
        }
        .floating-print-btn:hover {
            background: #1e293b;
            transform: translateY(-2px);
        }
        @media print {
            body {
                background: none;
                padding: 0;
            }
            .invoice-card {
                box-shadow: none;
                padding: 20px 25px;
                max-width: 100%;
            }
            .floating-print-btn {
                display: none;
            }
        }
    </style>
</head>
<body>

    <button class="floating-print-btn" onclick="window.print()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        <span>Chapisha / Print Invoice</span>
    </button>

    <div class="invoice-card">
        <!-- Top header -->
        <div class="header-top">
            <div>
                <div class="brand-logo">PANGA <span>PANGISHA</span></div>
                <div class="brand-tagline">Mfumo wa Nyumba na Upangishaji &bull; Tanzania</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
                    Mkataba: <strong>{{ $invoice->agreement?->agreement_number ?? 'MKT-STANDARD' }}</strong>
                </div>
            </div>
            <div class="invoice-meta">
                <div class="invoice-title">ANKARA YA MALIPO</div>
                <div class="invoice-num">{{ $invoice->invoice_number }}</div>
                <div style="margin-top: 8px;">
                    <span class="status-badge status-{{ $invoice->status }}">
                        {{ $invoice->status === 'paid' ? 'IMELIPWA / PAID' : ($invoice->status === 'partially_paid' ? 'IMELIPWA NUSU' : strtoupper($invoice->status)) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Meta Grid -->
        <div class="grid-2">
            <div class="meta-box">
                <div class="meta-label">Mwenye Nyumba (Billed From)</div>
                <div class="meta-name">{{ $invoice->landlord?->fullname ?? 'Ibrahim Kimaro' }}</div>
                <div class="meta-detail">Nyumba: <strong>{{ $invoice->property_name }}</strong></div>
                <div class="meta-detail">Chumba: <strong>{{ $invoice->unit_number }}</strong></div>
                <div class="meta-detail">Simu: {{ $invoice->landlord?->phone ?? '+255 712 345 678' }}</div>
            </div>
            <div class="meta-box">
                <div class="meta-label">Mpangaji (Billed To)</div>
                <div class="meta-name">{{ $invoice->tenant_name }}</div>
                <div class="meta-detail">Simu: {{ $invoice->tenant_phone }}</div>
                <div class="meta-detail">Barua Pepe: {{ $invoice->tenant_email ?? 'Haikutajwa' }}</div>
                @if($invoice->check_in_at)
                    <div class="meta-detail">Tarehe ya Kuingia: <strong>{{ \Carbon\Carbon::parse($invoice->check_in_at)->format('d/m/Y H:i') }}</strong></div>
                @endif
            </div>
        </div>

        <!-- Dates row -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
            <div>
                <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Tarehe ya Ankara</div>
                <div style="font-size: 13px; font-weight: 700; color: var(--primary);">{{ \Carbon\Carbon::parse($invoice->issue_date)->format('d/m/Y') }}</div>
            </div>
            <div>
                <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Mwisho wa Kulipa</div>
                <div style="font-size: 13px; font-weight: 700; color: var(--danger);">{{ \Carbon\Carbon::parse($invoice->due_date)->format('d/m/Y') }}</div>
            </div>
            <div>
                <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Kipindi cha Kodi</div>
                <div style="font-size: 13px; font-weight: 700; color: var(--primary);">
                    {{ \Carbon\Carbon::parse($invoice->period_start)->format('d/m/Y') }} - {{ \Carbon\Carbon::parse($invoice->period_end)->format('d/m/Y') }}
                </div>
            </div>
            <div>
                <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Njia ya Malipo</div>
                <div style="font-size: 13px; font-weight: 700; color: var(--accent);">{{ $invoice->payment_method ?? 'M-Pesa / Tigo Pesa' }}</div>
            </div>
        </div>

        <!-- Line items table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 50px;">#</th>
                    <th>Maelezo ya Huduma / Item Description</th>
                    <th style="width: 140px;">Kitengo</th>
                    <th style="width: 150px;">Kiasi (TZS)</th>
                </tr>
            </thead>
            <tbody>
                @forelse(($invoice->line_items ?? []) as $idx => $item)
                    <tr>
                        <td style="color: var(--text-muted);">{{ $idx + 1 }}</td>
                        <td>
                            <strong>{{ $item['description'] ?? 'Malipo' }}</strong>
                        </td>
                        <td style="text-transform: uppercase; font-size: 11px; color: var(--text-muted);">
                            {{ $item['category'] ?? 'huduma' }}
                        </td>
                        <td>{{ number_format($item['amount'] ?? 0) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td>1</td>
                        <td><strong>Kodi ya Makazi (Rent)</strong></td>
                        <td>RENT</td>
                        <td>{{ number_format($invoice->amount_due) }}</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <!-- Summary -->
        <div class="summary-wrap">
            <table class="summary-table">
                <tr>
                    <td style="color: var(--text-muted);">Jumla Ndogo (Subtotal):</td>
                    <td>TZS {{ number_format($invoice->subtotal ?? $invoice->amount_due) }}</td>
                </tr>
                @if(($invoice->tax ?? 0) > 0)
                    <tr>
                        <td style="color: var(--text-muted);">Kodi ya Ongezeko (Tax):</td>
                        <td>TZS {{ number_format($invoice->tax) }}</td>
                    </tr>
                @endif
                <tr class="total-row">
                    <td>Jumla Inayotakiwa:</td>
                    <td>TZS {{ number_format($invoice->amount_due) }}</td>
                </tr>
                @if($invoice->amount_paid > 0)
                    <tr class="paid-row">
                        <td>Kiasi Kilicholipwa:</td>
                        <td>- TZS {{ number_format($invoice->amount_paid) }}</td>
                    </tr>
                @endif
                <tr class="balance-row">
                    <td>Salio Lililobaki (Balance):</td>
                    <td>TZS {{ number_format($invoice->outstanding_balance) }}</td>
                </tr>
            </table>
        </div>

        <!-- Payment Channels & Instructions -->
        <div class="payment-instructions">
            <div class="payment-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Njia Zilizoidhinishwa za Malipo / Payment Channels</span>
            </div>
            <div class="payment-channels">
                <div>
                    <strong>1. M-Pesa / Tigo Pesa Lipa Namba:</strong><br>
                    Lipa Namba: <strong>5521901</strong> (Panga Pangisha - Kimaro)<br>
                    Weka Kumbukumbu: <strong>{{ $invoice->invoice_number }}</strong>
                </div>
                <div>
                    <strong>2. Benki (CRDB / NMB):</strong><br>
                    CRDB A/C: <strong>0152489102900</strong><br>
                    Jina: <strong>PANGA PANGISHA COLLECTION</strong>
                </div>
            </div>
            @if($invoice->late_fee_policy)
                <div style="margin-top: 10px; font-size: 11px; color: #b45309; border-top: 1px dashed #86efac; padding-top: 6px;">
                    &bull; Sera ya Kuchelewa: {{ $invoice->late_fee_policy }}
                </div>
            @endif
        </div>

        @if($invoice->status === 'paid' || !empty($invoice->payment_reference))
            <div style="background: #f0fdf4; border: 1.5px solid #22c55e; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
                <div style="font-weight: 800; color: #15803d; font-size: 13px; text-transform: uppercase;">
                    &#10004; Uthibitisho wa Malipo Yaliyopokelewa
                </div>
                <div style="font-size: 12px; color: #166534; margin-top: 4px;">
                    Nambari ya Muamala: <strong>{{ $invoice->payment_reference ?? 'PAY-VERIFIED' }}</strong> &bull;
                    Tarehe: <strong>{{ $invoice->paid_at ? \Carbon\Carbon::parse($invoice->paid_at)->format('d/m/Y H:i') : now()->format('d/m/Y') }}</strong> &bull;
                    Njia: <strong>{{ strtoupper($invoice->payment_method ?? 'M-PESA') }}</strong>
                </div>
            </div>
        @endif

        <div style="text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid var(--border); padding-top: 15px;">
            Ankara hii imetolewa kiotomatiki na Mfumo wa Panga Pangisha Tanzania.<br>
            Haitaji muhuri wa mkono iwapo imethibitishwa kidijitali. &bull; Stakabadhi Halali.
        </div>
    </div>

</body>
</html>
