<!DOCTYPE html>
<html lang="{{ $lang ?? 'sw' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mkataba wa Upangishaji - {{ $agreement->agreement_number }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Cinzel:wght@700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #0f172a;
            --accent: #0284c7;
            --accent-dark: #0369a1;
            --border: #cbd5e1;
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
            background-color: #e2e8f0;
            line-height: 1.6;
            font-size: 13px;
            padding: 30px 15px;
        }
        .page-container {
            max-width: 820px;
            margin: 0 auto;
            background: #ffffff;
            padding: 50px 60px;
            border-radius: 8px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            position: relative;
        }
        .header-seal {
            text-align: center;
            border-bottom: 2px solid var(--primary);
            padding-bottom: 20px;
            margin-bottom: 28px;
        }
        .national-badge {
            font-family: 'Cinzel', serif;
            letter-spacing: 2px;
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .sub-badge {
            font-size: 11px;
            color: var(--text-muted);
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 12px;
        }
        .doc-title {
            font-size: 20px;
            font-weight: 800;
            color: var(--primary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .doc-meta {
            margin-top: 10px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: var(--text-muted);
            font-weight: 600;
        }
        .preamble {
            background: var(--bg-light);
            padding: 14px 18px;
            border-left: 4px solid var(--accent);
            border-radius: 4px;
            margin-bottom: 25px;
            font-style: italic;
            color: #334155;
        }
        .section-block {
            margin-bottom: 22px;
        }
        .section-heading {
            font-size: 13px;
            font-weight: 700;
            color: var(--primary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid var(--border);
            padding-bottom: 6px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .section-number {
            background: var(--primary);
            color: #fff;
            font-size: 10px;
            font-weight: 800;
            width: 20px;
            height: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .party-box {
            background: var(--bg-light);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 14px 16px;
        }
        .party-role {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            color: var(--accent);
            margin-bottom: 6px;
        }
        .party-name {
            font-size: 14px;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 4px;
        }
        .party-detail {
            font-size: 12px;
            color: #475569;
            margin-bottom: 2px;
        }
        .clause-text {
            color: #334155;
            margin-bottom: 6px;
            text-align: justify;
        }
        .clause-list {
            padding-left: 18px;
            color: #334155;
            margin-bottom: 8px;
        }
        .clause-list li {
            margin-bottom: 4px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            font-size: 12px;
        }
        .data-table th, .data-table td {
            border: 1px solid var(--border);
            padding: 8px 12px;
            text-align: left;
        }
        .data-table th {
            background: var(--bg-light);
            font-weight: 700;
            color: var(--primary);
        }
        .badge-verified {
            display: inline-block;
            background: #dcfce7;
            color: #15803d;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 12px;
            border: 1px solid #86efac;
            text-transform: uppercase;
        }
        .signatures-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 35px;
            page-break-inside: avoid;
        }
        .sig-box {
            border: 1.5px dashed var(--border);
            border-radius: 8px;
            padding: 16px;
            background: #fbfcfd;
        }
        .sig-box.signed {
            border-style: solid;
            border-color: #22c55e;
            background: #f0fdf4;
        }
        .sig-header {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--text-muted);
            margin-bottom: 12px;
        }
        .sig-stamp {
            font-family: 'Courier New', Courier, monospace;
            font-weight: bold;
            font-size: 14px;
            color: #166534;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        .sig-info {
            font-size: 11px;
            color: #475569;
            line-height: 1.4;
        }
        .floating-print-btn {
            position: fixed;
            bottom: 25px;
            right: 25px;
            background: #0284c7;
            color: #ffffff;
            border: none;
            border-radius: 50px;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 700;
            box-shadow: 0 4px 15px rgba(2, 132, 199, 0.4);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            z-index: 999;
        }
        .floating-print-btn:hover {
            background: #0369a1;
            transform: translateY(-2px);
        }
        @media print {
            body {
                background: none;
                padding: 0;
            }
            .page-container {
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
        <span>Chapisha / Print (PDF)</span>
    </button>

    <div class="page-container">
        <!-- Header -->
        <div class="header-seal">
            <div class="national-badge">Jamhuri ya Muungano wa Tanzania</div>
            <div class="sub-badge">United Republic of Tanzania &bull; Landlords & Tenants Legal Framework</div>
            <h1 class="doc-title">{{ $terms['title'] ?? 'MKATABA WA UPANGISHAJI WA MAKAZI' }}</h1>
            <div class="doc-meta">
                <span>Nambari ya Mkataba: <strong>{{ $agreement->agreement_number }}</strong></span>
                <span>Toleo / Version: <strong>v{{ $agreement->version }}.0</strong></span>
                <span>Hali: <span class="badge-verified">{{ $agreement->status === 'active' ? 'Imethibitishwa & Active' : strtoupper($agreement->status) }}</span></span>
            </div>
        </div>

        <!-- Preamble -->
        <div class="preamble">
            {{ $terms['legal_preamble'] ?? 'Mkataba huu unafanywa rasmi leo chini ya Sheria za Tanzania kati ya Mwenye Nyumba (Landlord) na Mpangaji (Tenant).' }}
        </div>

        <!-- 1. Pande Zinazohusika (Parties) -->
        <div class="section-block">
            <div class="section-heading">
                <span class="section-number">1</span>
                <span>Pande Zinazohusika / Parties to the Agreement</span>
            </div>
            <div class="grid-2">
                <div class="party-box">
                    <div class="party-role">Mwenye Nyumba (Landlord)</div>
                    <div class="party-name">{{ $landlord['name'] ?? $agreement->landlord?->fullname ?? 'Ibrahim Kimaro' }}</div>
                    <div class="party-detail">Simu: {{ $landlord['phone'] ?? $agreement->landlord?->phone ?? '+255 712 345 678' }}</div>
                    <div class="party-detail">Barua Pepe: {{ $landlord['email'] ?? $agreement->landlord?->email ?? 'landlord@pangapangisha.com' }}</div>
                </div>
                <div class="party-box">
                    <div class="party-role">Mpangaji (Tenant)</div>
                    <div class="party-name">{{ $tenant['name'] ?? $agreement->tenant_name }}</div>
                    <div class="party-detail">Simu: {{ $tenant['phone'] ?? $agreement->tenant_phone }}</div>
                    <div class="party-detail">Barua Pepe: {{ $tenant['email'] ?? $agreement->tenant_email ?? 'Haikutajwa' }}</div>
                    <div class="party-detail">Kitambulisho cha NIDA: {{ $tenant['nida'] ?? $agreement->tenant_nida ?? 'Haikutolewa' }}</div>
                </div>
            </div>
        </div>

        <!-- 2. Taarifa za Nyumba na Chumba (Property) -->
        <div class="section-block">
            <div class="section-heading">
                <span class="section-number">2</span>
                <span>Nyumba na Chumba / Property & Unit Description</span>
            </div>
            <p class="clause-text">
                Mwenye nyumba anakubali kumpangisha mpangaji, na mpangaji anakubali kupanga chumba/eneo la <strong>{{ $property['unit_number'] ?? $agreement->unit_number }}</strong> ndani ya jengo la <strong>{{ $property['name'] ?? $agreement->property_name }}</strong> lililopo <strong>{{ $property['location'] ?? 'Dar es Salaam, Tanzania' }}</strong>.
            </p>
            <p class="clause-text"><em>Maelezo ya Chumba: {{ $property['description'] ?? 'Chumba cha makazi chenye huduma za msingi.' }}</em></p>
        </div>

        <!-- 3. Muda wa Upangishaji (Tenancy Period) -->
        <div class="section-block">
            <div class="section-heading">
                <span class="section-number">3</span>
                <span>Muda wa Upangishaji / Tenancy Period & Duration</span>
            </div>
            <p class="clause-text">
                Mkataba huu ni wa muda wa miezi <strong>{{ $agreement->duration_months }}</strong> kuanzia tarehe <strong>{{ $agreement->starts_on?->format('d/m/Y') }}</strong> hadi tarehe <strong>{{ $agreement->ends_on?->format('d/m/Y') }}</strong>.
            </p>
            <p class="clause-text">{{ $terms['period']['renewal'] ?? 'Mkataba unaweza kufanywa upya kwa taarifa ya maandishi ya mwezi mmoja kabla ya kuisha.' }}</p>
        </div>

        <!-- 4. Kodi ya Pango na Malipo (Rent & Payment) -->
        <div class="section-block">
            <div class="section-heading">
                <span class="section-number">4</span>
                <span>Kodi ya Pango / Rent & Financial Obligations</span>
            </div>
            <p class="clause-text">
                Kodi ya pango iliyokubaliwa ni <strong>TZS {{ number_format($agreement->monthly_rent) }}</strong> kwa mwezi mmoja, inayolipwa kwa utaratibu wa <strong>{{ strtoupper($agreement->payment_frequency) }}</strong>.
            </p>
            <p class="clause-text">Tarehe ya Malipo: {{ $rent['due_date'] ?? 'Tarehe 1 ya kila mwezi husika.' }}</p>
            <p class="clause-text">Njia ya Malipo: {{ $rent['payment_method'] ?? $agreement->payment_method ?? 'M-Pesa / Tigo Pesa / Benki' }}</p>
            <p class="clause-text">Faini ya Kuchelewa: {{ $rent['late_fee_rule'] ?? 'Faini ya 5% huongezwa malipo yakichelewa zaidi ya siku 5.' }}</p>
        </div>

        <!-- 5. Dhamana ya Usalama (Security Deposit) -->
        <div class="section-block">
            <div class="section-heading">
                <span class="section-number">5</span>
                <span>Dhamana ya Nyumba / Security Deposit</span>
            </div>
            <p class="clause-text">
                Mpangaji ameweka kiasi cha dhamana ya <strong>TZS {{ number_format($agreement->security_deposit) }}</strong>.
            </p>
            <p class="clause-text">{{ $deposit['purpose'] ?? 'Dhamana hii inalinda uharibifu wa nyumba na bili zilizosalia wakati wa kuhama.' }}</p>
            <p class="clause-text">{{ $deposit['refund_terms'] ?? 'Itarudishwa yote ndani ya siku 14 baada ya kukabidhi chumba kikiwa kizima.' }}</p>
        </div>

        <!-- 6. Huduma za Umeme na Maji (Utilities) -->
        <div class="section-block">
            <div class="section-heading">
                <span class="section-number">6</span>
                <span>Huduma za Maji na Umeme / Utilities</span>
            </div>
            <ul class="clause-list">
                <li><strong>Umeme (LUKU):</strong> {{ $utilities['electricity'] ?? 'Mpangaji anawajibika kununua umeme kulingana na matumizi yake.' }}</li>
                <li><strong>Maji (DAWASA):</strong> {{ $utilities['water'] ?? 'Maji yatalipwa kulingana na bili au mita ya chumba.' }}</li>
                <li><strong>Usafi na Taka:</strong> {{ $utilities['waste_management'] ?? 'Ushuru wa taka utalipwa kulingana na utaratibu wa jengo.' }}</li>
            </ul>
        </div>

        <!-- 7. Kanuni za Ukaaji na Matumizi (Occupancy Rules) -->
        <div class="section-block">
            <div class="section-heading">
                <span class="section-number">7</span>
                <span>Kanuni za Ukaaji / Occupancy Rules & Permitted Use</span>
            </div>
            <ul class="clause-list">
                @foreach(($rules ?: [
                    'Chumba kitatumika kwa matumizi ya makazi binafsi pekee, si kwa biashara haramu au usumbufu.',
                    'Hairuhusiwi kupangisha mtu mwingine (Subletting) bila idhini ya maandishi ya mwenye nyumba.',
                    'Kuzingatia utulivu na amani kwa majirani kuanzia saa 4:00 usiku.'
                ]) as $rule)
                    <li>{{ $rule }}</li>
                @endforeach
            </ul>
        </div>

        <!-- 8. Matengenezo (Maintenance) -->
        <div class="section-block">
            <div class="section-heading">
                <span class="section-number">8</span>
                <span>Majukumu ya Matengenezo / Maintenance Responsibilities</span>
            </div>
            <p class="clause-text"><strong>Mwenye Nyumba:</strong> {{ $maintenance['landlord'] ?? 'Anawajibika kwa matengenezo makuu ya paa, kuta na miundombinu mikuu.' }}</p>
            <p class="clause-text"><strong>Mpangaji:</strong> {{ $maintenance['tenant'] ?? 'Anawajibika kwa usafi na marekebisho madogo yanayotokana na matumizi yake (kama balbu, kufuli).' }}</p>
        </div>

        <!-- 9. Orodha ya Mali na Vifaa vya Chumba (Inventory Handover) -->
        <div class="section-block">
            <div class="section-heading">
                <span class="section-number">9</span>
                <span>Orodha ya Vifaa vya Chumba / Handover Inventory</span>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Kifaa / Item Description</th>
                        <th style="width: 80px; text-align: center;">Idadi</th>
                        <th>Hali Wakati wa Kukabidhi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($inventory as $item)
                        <tr>
                            <td>{{ $item['item'] ?? 'Kifaa' }}</td>
                            <td style="text-align: center;">{{ $item['quantity'] ?? 1 }}</td>
                            <td>{{ $item['condition'] ?? 'Nzuri / Inafanya kazi' }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td>Ufunguo wa Chumba na Geti Kuu</td>
                            <td style="text-align: center;">2</td>
                            <td>Nzuri & Mpya</td>
                        </tr>
                        <tr>
                            <td>Soketi na Balbu za Umeme</td>
                            <td style="text-align: center;">4</td>
                            <td>Zinafanya kazi vizuri</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <!-- 10. Vipimo vya Mita (Meter Readings at Move-in) -->
        <div class="section-block">
            <div class="section-heading">
                <span class="section-number">10</span>
                <span>Mita za Umeme na Maji / Utility Meter Readings</span>
            </div>
            <div class="grid-2">
                <div class="party-box">
                    <div class="party-role">Mita ya LUKU (Umeme)</div>
                    <div class="party-detail">Nambari ya Mita: <strong>{{ $meterReadings['luku_meter_number'] ?? '14238910291' }}</strong></div>
                    <div class="party-detail">Unit Zilizopo Awali: <strong>{{ $meterReadings['luku_initial_units'] ?? '45.2 kWh' }}</strong></div>
                </div>
                <div class="party-box">
                    <div class="party-role">Mita ya Maji (DAWASA)</div>
                    <div class="party-detail">Usomaji wa Awali: <strong>{{ $meterReadings['water_meter_reading'] ?? '0142 m³' }}</strong></div>
                </div>
            </div>
        </div>

        <!-- 11. Kusitisha Mkataba na Migogoro (Termination & Disputes) -->
        <div class="section-block">
            <div class="section-heading">
                <span class="section-number">11</span>
                <span>Kusitisha Mkataba na Utatuzi wa Migogoro</span>
            </div>
            <p class="clause-text">
                Upande wowote unaweza kusitisha mkataba huu kwa kutoa taarifa ya maandishi ya mwezi mmoja (1) kabla. Migogoro yote itatatuliwa kwa mashauriano ya amani, na ikishindikana itapelekwa kwenye Mabaraza ya Ardhi na Nyumba au Mahakama za Jamhuri ya Muungano wa Tanzania.
            </p>
        </div>

        <!-- 12. Saini Rasmi za Pande Zote (Signatures) -->
        <div class="section-block">
            <div class="section-heading">
                <span class="section-number">12</span>
                <span>Uthibitisho na Saini za Pande Zote / Signatures</span>
            </div>
            <div class="signatures-grid">
                <!-- Tenant Signature -->
                <div class="sig-box {{ !empty($agreement->tenant_signature) ? 'signed' : '' }}">
                    <div class="sig-header">Saini ya Mpangaji (Tenant)</div>
                    @if(!empty($agreement->tenant_signature))
                        <div class="sig-stamp">&#10004; {{ $agreement->tenant_signer_name ?? $agreement->tenant_name }}</div>
                        <div class="sig-info">
                            Imesainiwa Kidijitali (Electronic Signature)<br>
                            Tarehe: <strong>{{ $agreement->tenant_signed_at?->format('d/m/Y H:i:s') }}</strong><br>
                            Anwani ya IP: {{ $agreement->tenant_signed_ip ?? '127.0.0.1' }}<br>
                            Uthibitisho: <span class="badge-verified">Imethibitishwa</span>
                        </div>
                    @else
                        <div style="color: #94a3b8; font-style: italic; margin-top: 15px;">
                            Bado haijasainiwa na mpangaji.<br>
                            Inasubiri uthibitisho wa mpangaji.
                        </div>
                    @endif
                </div>

                <!-- Landlord Signature -->
                <div class="sig-box {{ !empty($agreement->landlord_signature) ? 'signed' : '' }}">
                    <div class="sig-header">Saini ya Mwenye Nyumba (Landlord)</div>
                    @if(!empty($agreement->landlord_signature))
                        <div class="sig-stamp">&#10004; {{ $agreement->landlord_signer_name ?? ($agreement->landlord?->fullname ?? 'Ibrahim Kimaro') }}</div>
                        <div class="sig-info">
                            Imesainiwa Kidijitali (Countersigned)<br>
                            Tarehe: <strong>{{ $agreement->landlord_signed_at?->format('d/m/Y H:i:s') }}</strong><br>
                            Anwani ya IP: {{ $agreement->landlord_signed_ip ?? '127.0.0.1' }}<br>
                            Uthibitisho: <span class="badge-verified">Imethibitishwa</span>
                        </div>
                    @else
                        <div style="color: #94a3b8; font-style: italic; margin-top: 15px;">
                            Inasubiri saini ya Mwenye Nyumba (Landlord) baada ya mpangaji kusaini.
                        </div>
                    @endif
                </div>
            </div>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid var(--border); padding-top: 15px;">
            Hati hii imetolewa na kuhifadhiwa kidijitali kupitia Mfumo wa Panga Pangisha Tanzania.<br>
            Nambari ya Usajili wa Hati: {{ $agreement->agreement_number }} &bull; Timestamp: {{ now()->toIso8601String() }}
        </div>
    </div>

</body>
</html>
