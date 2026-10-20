import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Plus, Search, Filter, Phone, Mail, MessageSquare,
    ShieldCheck, Calendar, ArrowRight, ExternalLink, FileText,
    Receipt, CheckCircle, Clock
} from 'lucide-react';

interface Tenant {
    id: number;
    name: string;
    phone: string;
    email?: string;
    property: string;
    unit: string;
    rent: string;
    status: string;
    since: string;
}

interface TenantsViewProps {
    tenants: Tenant[];
    onOpenAddTenant: () => void;
    onNavigateInvoices: () => void;
    onNavigateAgreements: () => void;
}

export default function TenantsView({
    tenants,
    onOpenAddTenant,
    onNavigateInvoices,
    onNavigateAgreements,
}: TenantsViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterProperty, setFilterProperty] = useState('all');

    const uniqueProperties = Array.from(new Set(tenants.map((t) => t.property)));

    const filtered = tenants.filter((t) => {
        const matchesProp = filterProperty === 'all' || t.property === filterProperty;
        const matchesSearch =
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.phone.includes(searchQuery) ||
            t.unit.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesProp && matchesSearch;
    });

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tenants & Residents Directory</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Active occupancies, digital contact details, lease statuses, and payment records
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onOpenAddTenant}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        Add Tenant
                    </button>
                </div>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Active Residents</span>
                    <div className="text-lg font-extrabold text-slate-900 mt-0.5">{tenants.length} Tenants</div>
                    <span className="text-[10px] text-emerald-600 font-semibold">100% Verified Identifiers</span>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Payment Frequency</span>
                    <div className="text-lg font-extrabold text-blue-600 mt-0.5">Monthly STS</div>
                    <span className="text-[10px] text-slate-500">M-Pesa / Automated Split</span>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Active Leases</span>
                    <div className="text-lg font-extrabold text-slate-900 mt-0.5">{tenants.length} Signed</div>
                    <span className="text-[10px] text-slate-500">Legally binding digital agreements</span>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Collection Health</span>
                    <div className="text-lg font-extrabold text-emerald-600 mt-0.5">98.5% On-Time</div>
                    <span className="text-[10px] text-slate-500">Zero default arrears</span>
                </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by resident name, phone number, or room..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={filterProperty}
                        onChange={(e) => setFilterProperty(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
                    >
                        <option value="all">All Properties ({tenants.length})</option>
                        {uniqueProperties.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Linear-Style Data Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <th className="py-3 px-4">Resident</th>
                            <th className="py-3 px-4">Contact</th>
                            <th className="py-3 px-4">Property & Room</th>
                            <th className="py-3 px-4">Monthly Rent</th>
                            <th className="py-3 px-4">Resident Since</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Quick Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((tenant) => (
                            <tr key={tenant.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3.5 px-4 font-semibold text-slate-900">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                                            {tenant.name.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-900">{tenant.name}</span>
                                            <span className="block text-[11px] text-slate-400">ID: TN-{tenant.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3.5 px-4 text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                                        <a
                                            href={`https://wa.me/${tenant.phone.replace(/[^0-9]/g, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-medium text-blue-600 hover:underline"
                                        >
                                            {tenant.phone}
                                        </a>
                                    </div>
                                </td>
                                <td className="py-3.5 px-4">
                                    <span className="font-semibold text-slate-800">{tenant.property}</span>
                                    <span className="block text-[11px] font-medium text-slate-400">{tenant.unit}</span>
                                </td>
                                <td className="py-3.5 px-4 font-bold text-slate-900">{tenant.rent}</td>
                                <td className="py-3.5 px-4 text-slate-500">{tenant.since}</td>
                                <td className="py-3.5 px-4">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Active
                                    </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                    <div className="inline-flex items-center gap-1.5">
                                        <button
                                            onClick={onNavigateInvoices}
                                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
                                            title="Issue Invoice"
                                        >
                                            Invoice
                                        </button>
                                        <button
                                            onClick={onNavigateAgreements}
                                            className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-800 transition-all shadow-2xs"
                                            title="View Lease"
                                        >
                                            Lease
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
