import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Lock, Wallet, Bell, Camera, Trash2, Check, AlertCircle,
    Eye, EyeOff, Save, ShieldCheck, Smartphone, Building, RefreshCw,
    Sun, Moon, Monitor, Palette
} from 'lucide-react';
import { useTheme, ThemeMode } from '../../../lib/theme';

interface SettingsViewProps {
    user: {
        id?: number;
        name: string;
        email?: string;
        phone?: string;
        country?: string;
        location?: string;
        bio?: string;
        avatar: string;
        business_name?: string;
        identity_status?: string;
    };
    onUserUpdated: (updatedUser: any) => void;
}

export default function SettingsView({ user, onUserUpdated }: SettingsViewProps) {
    const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'payout' | 'security' | 'notifications'>('profile');
    const { theme, isDark, setTheme } = useTheme();

    // Profile state
    const [profileForm, setProfileForm] = useState({
        name: user.name || 'Ibrahim Kimaro',
        email: user.email || 'ibrahimkimaro01@gmail.com',
        phone: user.phone || '+255712345678',
        location: user.location || 'Dar es Salaam, Tanzania',
        bio: user.bio || 'Commercial & residential landlord with 18+ units across Dar es Salaam.',
        business_name: user.business_name || 'Kimaro Real Estate Holdings',
    });

    // Payout state
    const [payoutForm, setPayoutForm] = useState({
        method: 'mpesa',
        accountNumber: '255712345678',
        accountHolder: 'Ibrahim Kimaro',
        bankName: 'CRDB Bank',
        disbursementSchedule: 'instant',
    });

    // Password state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Notification toggles
    const [notifications, setNotifications] = useState({
        smsRentAlerts: true,
        whatsappReceipts: true,
        emailMaintenanceAlerts: true,
        aiLeaseAlerts: true,
    });

    const [avatarLoading, setAvatarLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setFeedback({ type, text });
        setTimeout(() => setFeedback(null), 5000);
    };

    // Handle Profile Save
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveLoading(true);
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            const token = localStorage.getItem('auth_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/landlord/profile/update', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify(profileForm),
            });
            const data = await res.json();
            if (res.ok) {
                showMessage('success', 'Profile information updated successfully!');
                onUserUpdated({ ...user, ...profileForm });
            } else {
                showMessage('error', data.message || 'Failed to update profile.');
            }
        } catch {
            showMessage('error', 'Network error while updating profile.');
        } finally {
            setSaveLoading(false);
        }
    };

    // Handle Avatar Upload
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 8 * 1024 * 1024) {
            showMessage('error', 'Image size must be less than 8MB.');
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        onUserUpdated({ ...user, avatar: previewUrl });
        setAvatarLoading(true);

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const headers: Record<string, string> = {
                'X-Requested-With': 'XMLHttpRequest',
            };
            const token = localStorage.getItem('auth_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/landlord/profile/avatar', {
                method: 'POST',
                body: formData,
                headers,
                credentials: 'include',
            });
            const data = await res.json();
            if (data.avatar) {
                showMessage('success', 'Profile photo updated successfully.');
                onUserUpdated({ ...user, avatar: data.avatar });
            }
        } catch {
            showMessage('error', 'Failed to upload profile picture.');
        } finally {
            setAvatarLoading(false);
        }
    };

    // Handle Avatar Remove
    const handleAvatarRemove = async () => {
        setAvatarLoading(true);
        try {
            const headers: Record<string, string> = {
                'X-Requested-With': 'XMLHttpRequest',
            };
            const token = localStorage.getItem('auth_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            await fetch('/landlord/profile/avatar/remove', {
                method: 'POST',
                headers,
                credentials: 'include',
            });
            const defaultAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80';
            showMessage('success', 'Profile picture reset to default.');
            onUserUpdated({ ...user, avatar: defaultAvatar });
        } catch {
            showMessage('error', 'Could not remove avatar.');
        } finally {
            setAvatarLoading(false);
        }
    };

    // Handle Password Change
    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showMessage('error', 'New passwords do not match.');
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            showMessage('error', 'Password must be at least 8 characters long.');
            return;
        }

        setSaveLoading(true);
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            const token = localStorage.getItem('auth_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/landlord/profile/password', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    current_password: passwordForm.currentPassword,
                    password: passwordForm.newPassword,
                    password_confirmation: passwordForm.confirmPassword,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                showMessage('success', 'Security password updated successfully.');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                showMessage('error', data.message || 'Incorrect current password.');
            }
        } catch {
            showMessage('error', 'Failed to update password.');
        } finally {
            setSaveLoading(false);
        }
    };

    // Handle Payout Settings Save
    const handleSavePayout = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveLoading(true);
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            const token = localStorage.getItem('auth_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            await fetch('/landlord/settings/update', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify(payoutForm),
            });
            showMessage('success', 'Disbursement payout accounts updated successfully.');
        } catch {
            showMessage('error', 'Failed to save payout settings.');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleThemeSelect = async (nextTheme: ThemeMode) => {
        setTheme(nextTheme);
        showMessage('success', `Appearance switched to ${nextTheme === 'dark' ? 'Dark' : nextTheme === 'light' ? 'Light' : 'System'} theme.`);
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            const token = localStorage.getItem('auth_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            await fetch('/landlord/settings/update', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ theme: nextTheme }),
            });
        } catch {}
    };

    return (
        <div className="space-y-6 pb-12 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Host Settings & Account</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                    Manage your landlord profile, dark & light appearance theme, disbursement accounts, security credentials, and alerts
                </p>
            </div>

            {/* Feedback Alert */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2 ${
                            feedback.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800'
                                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-200 dark:border-red-800'
                        }`}
                    >
                        {feedback.type === 'success' ? (
                            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                        )}
                        <span>{feedback.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabbed Navigation (Stripe Style) */}
            <div className="flex flex-wrap border-b border-slate-200 text-xs font-semibold">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 border-b-2 py-3 px-4 transition-all cursor-pointer ${
                        activeTab === 'profile'
                            ? 'border-slate-900 dark:border-teal-400 text-slate-900 dark:text-white font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <User className="h-4 w-4" />
                    Host Profile
                </button>
                <button
                    onClick={() => setActiveTab('appearance')}
                    className={`flex items-center gap-2 border-b-2 py-3 px-4 transition-all cursor-pointer ${
                        activeTab === 'appearance'
                            ? 'border-slate-900 dark:border-teal-400 text-slate-900 dark:text-white font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Palette className="h-4 w-4" />
                    Dark & Light Theme
                </button>
                <button
                    onClick={() => setActiveTab('payout')}
                    className={`flex items-center gap-2 border-b-2 py-3 px-4 transition-all cursor-pointer ${
                        activeTab === 'payout'
                            ? 'border-slate-900 dark:border-teal-400 text-slate-900 dark:text-white font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Wallet className="h-4 w-4" />
                    Payout & Disbursements
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 border-b-2 py-3 px-4 transition-all cursor-pointer ${
                        activeTab === 'security'
                            ? 'border-slate-900 dark:border-teal-400 text-slate-900 dark:text-white font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Lock className="h-4 w-4" />
                    Security & Password
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center gap-2 border-b-2 py-3 px-4 transition-all cursor-pointer ${
                        activeTab === 'notifications'
                            ? 'border-slate-900 dark:border-teal-400 text-slate-900 dark:text-white font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Bell className="h-4 w-4" />
                    Notifications
                </button>
            </div>

            {/* TAB 1: Profile Details */}
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    {/* Quick Appearance / Dark & Light Theme Card right in Profile Settings */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Palette className="h-4 w-4 text-teal-600" />
                                <h3 className="text-sm font-bold text-slate-900">Display Appearance (Dark & Light Theme)</h3>
                            </div>
                            <p className="text-xs text-slate-500">
                                Switch between Light Mode, Dark Mode, or automatic system preference across the portal
                            </p>
                        </div>
                        <div className="inline-flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1 gap-1 shrink-0">
                            {[
                                { id: 'light' as ThemeMode, label: 'Light', icon: Sun },
                                { id: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
                                { id: 'system' as ThemeMode, label: 'System', icon: Monitor },
                            ].map((opt) => {
                                const Icon = opt.icon;
                                const active = theme === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => handleThemeSelect(opt.id)}
                                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                                            active
                                                ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-2xs'
                                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                                        }`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        <span>{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Avatar Card (Airbnb warmth) */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                        <h3 className="text-sm font-bold text-slate-900 mb-4">Profile Photo</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                            <div className="relative group">
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="h-20 w-20 rounded-full object-cover border-2 border-slate-200 shadow-xs"
                                />
                                {avatarLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-xs">
                                        <RefreshCw className="h-5 w-5 text-white animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-3">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={avatarLoading}
                                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-xs transition-all active:scale-95"
                                    >
                                        <Camera className="h-3.5 w-3.5" />
                                        Upload New Photo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAvatarRemove}
                                        disabled={avatarLoading}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                        Remove
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    JPG, PNG, or WebP up to 8MB. Clear front-facing photos enhance trust with tenants.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Information Form */}
                    <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 mb-2">Host Personal Information</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                                <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Business / Brand Name</label>
                                <input
                                    type="text"
                                    value={profileForm.business_name}
                                    onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile / WhatsApp Number</label>
                                <input
                                    type="text"
                                    value={profileForm.phone}
                                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Operating Location</label>
                                <input
                                    type="text"
                                    value={profileForm.location}
                                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Landlord Bio</label>
                                <textarea
                                    rows={3}
                                    value={profileForm.bio}
                                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={saveLoading}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-xs transition-all active:scale-95"
                            >
                                <Save className="h-4 w-4" />
                                {saveLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* TAB 1B: Appearance (Dark & Light Theme) */}
            {activeTab === 'appearance' && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Interface Theme & Color Scheme</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Choose how Panga Pangisha looks to you. Your preference is saved immediately and applies across all dashboard views and Phoenix Realtime Chat.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            {
                                id: 'light' as ThemeMode,
                                title: 'Light Mode',
                                subtitle: 'Warm ivory background with crisp white executive cards',
                                icon: Sun,
                                previewBg: 'bg-[#FBF9F5] border-stone-200',
                                previewCard: 'bg-white border-stone-200 text-slate-900',
                            },
                            {
                                id: 'dark' as ThemeMode,
                                title: 'Dark Mode',
                                subtitle: 'Deep midnight slate surfaces optimized for low-light work',
                                icon: Moon,
                                previewBg: 'bg-[#0B1120] border-slate-800',
                                previewCard: 'bg-[#111827] border-slate-700 text-white',
                            },
                            {
                                id: 'system' as ThemeMode,
                                title: 'System Preference',
                                subtitle: 'Automatically switches between Light and Dark with your OS',
                                icon: Monitor,
                                previewBg: 'bg-gradient-to-r from-[#FBF9F5] to-[#0B1120] border-slate-300',
                                previewCard: 'bg-slate-800 border-slate-600 text-white',
                            },
                        ].map((item) => {
                            const Icon = item.icon;
                            const isSelected = theme === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleThemeSelect(item.id)}
                                    className={`text-left rounded-2xl border-2 p-4 transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                                        isSelected
                                            ? 'border-teal-600 dark:border-teal-400 ring-2 ring-teal-500/20'
                                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                    }`}
                                >
                                    <div className={`h-24 w-full rounded-xl border p-3 flex flex-col justify-between ${item.previewBg}`}>
                                        <div className="flex items-center justify-between">
                                            <div className={`h-6 w-6 rounded-lg flex items-center justify-center border ${item.previewCard}`}>
                                                <Icon className="h-3.5 w-3.5" />
                                            </div>
                                            {isSelected && (
                                                <span className="h-5 w-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                                                    <Check className="h-3 w-3" />
                                                </span>
                                            )}
                                        </div>
                                        <div className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold ${item.previewCard}`}>
                                            Panga Pangisha UI
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-extrabold text-slate-900">{item.title}</span>
                                            {isSelected && (
                                                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">Active</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.subtitle}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>
                            Currently active appearance: <strong className="text-slate-900">{isDark ? 'Dark Theme' : 'Light Theme'}</strong>
                        </span>
                    </div>
                </div>
            )}

            {/* TAB 2: Payout & Banking */}
            {activeTab === 'payout' && (
                <form onSubmit={handleSavePayout} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Automated Rent Disbursement</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Where tenant rent collections and STS utility token earnings are paid out
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">Disbursement Channel</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['mpesa', 'airtel', 'bank'].map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setPayoutForm({ ...payoutForm, method: m })}
                                        className={`rounded-xl border p-3 text-center text-xs font-bold uppercase transition-all ${
                                            payoutForm.method === m
                                                ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        {m === 'mpesa' ? 'Vodacom M-Pesa' : m === 'airtel' ? 'Airtel Money' : 'Bank Account'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {payoutForm.method === 'bank' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                                    <select
                                        value={payoutForm.bankName}
                                        onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:outline-none"
                                    >
                                        <option value="CRDB Bank">CRDB Bank</option>
                                        <option value="NMB Bank">NMB Bank</option>
                                        <option value="Stanbic Bank">Stanbic Bank</option>
                                        <option value="Standard Chartered">Standard Chartered</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        value={payoutForm.accountNumber}
                                        onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:outline-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Money Number</label>
                                <input
                                    type="text"
                                    value={payoutForm.accountNumber}
                                    onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:outline-none"
                                    placeholder="255712345678"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Full Name</label>
                            <input
                                type="text"
                                value={payoutForm.accountHolder}
                                onChange={(e) => setPayoutForm({ ...payoutForm, accountHolder: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={saveLoading}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-xs transition-all active:scale-95"
                        >
                            <Save className="h-4 w-4" />
                            {saveLoading ? 'Saving...' : 'Save Payout Details'}
                        </button>
                    </div>
                </form>
            )}

            {/* TAB 3: Security & Passwords */}
            {activeTab === 'security' && (
                <form onSubmit={handleSavePassword} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Change Security Password</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Ensure your account uses a strong, unique password</p>
                    </div>

                    <div className="space-y-3 max-w-md">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 pr-10 text-xs focus:outline-none"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 pr-10 text-xs focus:outline-none"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 pr-10 text-xs focus:outline-none"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 flex justify-start">
                        <button
                            type="submit"
                            disabled={saveLoading}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-xs transition-all active:scale-95"
                        >
                            <Lock className="h-4 w-4" />
                            {saveLoading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            )}

            {/* TAB 4: Notifications */}
            {activeTab === 'notifications' && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Communication & Alert Preferences</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Control how you and your tenants receive automated updates</p>
                    </div>

                    <div className="divide-y divide-slate-100">
                        <div className="py-3.5 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-slate-800">SMS Rent Payment Confirmations</span>
                                <p className="text-[11px] text-slate-500">Send automated SMS confirmation to tenant when rent is logged</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={notifications.smsRentAlerts}
                                onChange={(e) => setNotifications({ ...notifications, smsRentAlerts: e.target.checked })}
                                className="h-4 w-4 rounded-md border-slate-300 text-slate-900 focus:ring-0"
                            />
                        </div>

                        <div className="py-3.5 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-slate-800">WhatsApp Digital Invoices</span>
                                <p className="text-[11px] text-slate-500">Allow instant WhatsApp share links for generated invoices</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={notifications.whatsappReceipts}
                                onChange={(e) => setNotifications({ ...notifications, whatsappReceipts: e.target.checked })}
                                className="h-4 w-4 rounded-md border-slate-300 text-slate-900 focus:ring-0"
                            />
                        </div>

                        <div className="py-3.5 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-slate-800">Veyora AI Lease Expiry Reminders</span>
                                <p className="text-[11px] text-slate-500">Get 30-day advance notice before any tenancy agreement expires</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={notifications.aiLeaseAlerts}
                                onChange={(e) => setNotifications({ ...notifications, aiLeaseAlerts: e.target.checked })}
                                className="h-4 w-4 rounded-md border-slate-300 text-slate-900 focus:ring-0"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
