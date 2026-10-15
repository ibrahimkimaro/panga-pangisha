import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Home, ShieldCheck, AlertTriangle,
    Clock, CheckCircle, UserCheck, FileText,
    MoreVertical, Bell, Search, LogOut, ChevronRight
} from 'lucide-react';
import { Logo } from '@/components/ui';

type QueueItem = {
    id: string;
    label: string;
    count: number;
    status: 'critical' | 'warning' | 'info';
    description: string;
};

const ATTENTION_QUEUE: QueueItem[] = [
    { id: 'id-check', label: 'Identity Checks', count: 3, status: 'critical', description: 'New landlords awaiting KYC verification' },
    { id: 'biz-verify', label: 'Business Verifications', count: 1, status: 'warning', description: 'Company registration docs pending review' },
    { id: 'unverified', label: 'Unverified Listings', count: 5, status: 'info', description: 'Properties listed without right-to-let' },
    { id: 'reports', label: 'Open Reports', count: 0, status: 'info', description: 'No active dispute reports' },
    { id: 'stale', label: 'Stale Listings', count: 2, status: 'warning', description: 'Availability not confirmed in 14 days' },
];

export default function LandlordHome() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <div className="min-h-screen bg-[#0A192F] text-white font-sans selection:bg-teal/30">
            <Head title="Landlord Command Center | Panga Pangisha" />

            <aside className="fixed left-0 top-0 h-full w-64 bg-navy-raised border-r border-white/10 z-20 hidden lg:flex flex-col">
                <div className="p-6">
                    <Logo onDark className="text-2xl" />
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <NavItem icon={<LayoutDashboard className="size-5" />} label="Dashboard" active />
                    <NavItem icon={<Home className="size-5" />} label="My Properties" />
                    <NavItem icon={<UserCheck className="size-5" />} label="Verification" />
                    <NavItem icon={<FileText className="size-5" />} label="Documents" />
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button className="flex items-center gap-3 w-full px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm font-medium group">
                        <LogOut className="size-5 group-hover:translate-x-1 transition-transform" />
                        Sign Out
                    </button>
                </div>
            </aside>

            <main className="lg:pl-64 min-h-screen">
                <header className="sticky top-0 z-10 backdrop-blur-md bg-[#0A192F]/80 border-b border-white/10 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Command Center</h1>
                        <p className="text-xs text-white/50">Welcome back, Landlord</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                            <input
                                type="text"
                                placeholder="Search properties..."
                                className="pl-10 pr-4 py-2 rounded-lg bg-white/5 ring-1 ring-white/10 focus:ring-teal outline-none text-sm w-64 transition-all"
                            />
                        </div>
                        <button className="p-2 rounded-lg bg-white/5 ring-1 ring-white/10 hover:bg-white/10 relative transition-all">
                            <Bell className="size-5 text-white/70" />
                            <span className="absolute top-2 right-2 size-2 rounded-full bg-teal animate-pulse" />
                        </button>
                        <div className="size-9 rounded-full bg-gradient-to-br from-teal to-navy-raised ring-2 ring-white/20" />
                    </div>
                </header>

                <div className="p-6 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <AlertTriangle className="size-5 text-teal" />
                                Attention Queue
                            </h2>
                            <span className="text-xs text-white/40 font-medium">Priority Actions</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            {ATTENTION_QUEUE.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                                    transition={{ delay: i * 0.05 }}
                                    className="group relative p-5 rounded-3xl bg-white/5 ring-1 ring-white/10 hover:ring-teal/50 hover:bg-white/[0.08] transition-all cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-2 rounded-lg ${
                                            item.status === 'critical' ? 'bg-hibiscus/20 text-hibiscus' :
                                            item.status === 'warning' ? 'bg-brass/20 text-brass' :
                                            'bg-teal/20 text-teal'
                                        }`}>
                                            {item.status === 'critical' ? <ShieldCheck className="size-5" /> :
                                             item.status === 'warning' ? <Clock className="size-5" /> :
                                             <CheckCircle className="size-5" />}
                                        </div>
                                        <span className={`text-2xl font-black ${
                                            item.count > 0 ? 'text-white' : 'text-white/20'
                                        }`}>
                                            {item.count}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-sm mb-1 group-hover:text-teal transition-colors">{item.label}</h3>
                                    <p className="text-xs text-white/40 leading-relaxed">{item.description}</p>

                                    {item.count > 0 && (
                                        <div className="absolute bottom-4 right-4">
                                            <div className="size-1.5 rounded-full bg-teal animate-ping" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="p-6 rounded-3xl bg-white/5 ring-1 ring-white/10">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold">Recent Activity</h3>
                                    <button className="text-xs text-teal font-bold flex items-center gap-1 hover:underline">
                                        View All <ChevronRight className="size-3" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-full bg-navy-raised flex items-center justify-center ring-1 ring-white/10">
                                                    <Home className="size-5 text-white/50" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Property <span className="text-white/40">#P-{1024 + i}</span> updated</p>
                                                    <p className="text-[10px] text-white/30">2 hours ago</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 rounded-md bg-teal/10 text-teal text-[10px] font-bold">Verified</span>
                                                <MoreVertical className="size-4 text-white/20 group-hover:text-white transition-colors" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-teal to-teal-bright text-navy">
                                <h3 className="font-black text-lg mb-1">Trust Score</h3>
                                <p className="text-sm font-medium opacity-80 mb-6">Your account is high-trust</p>
                                <div className="text-5xl font-black mb-6">98%</div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span>Identity Verified</span>
                                        <CheckCircle className="size-4" />
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span>Business Docs</span>
                                        <CheckCircle className="size-4" />
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-bold opacity-60">
                                        <span>Avg. Response Time</span>
                                        <span className="font-black">4h</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <button className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            active
                ? 'bg-teal text-navy font-bold shadow-lg shadow-teal/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
        }`}>
            {icon}
            {label}
        </button>
    );
}
