import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { Button, Logo } from '@/components/ui';

export default function Login() {
    const form = useForm({ email: '', password: '' });
    const [show, setShow] = useState(false);
    const field = 'mt-1.5 h-12 w-full rounded-xl bg-white px-4 text-base ring-1 ring-inset ring-line';

    return (
        <div className="grid min-h-screen lg:grid-cols-[5fr_6fr]">
            <Head title="Admin sign in" />

            <div className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col lg:justify-between">
                <div className="absolute -right-24 -top-24 size-96 rounded-full bg-teal/25 blur-3xl" aria-hidden="true" />
                <Logo onDark />
                <div className="relative">
                    <p className="font-display text-4xl font-extrabold leading-tight">Every listing a renter trusts was checked by someone here.</p>
                    <p className="mt-4 max-w-md text-white/70">Verify advertisers, act on reports and keep stale homes out of search.</p>
                </div>
                <p className="relative text-sm text-white/50">Panga na Kupangisha admin</p>
            </div>

            <div className="flex items-center justify-center px-6 py-12">
                <form
                    className="w-full max-w-sm"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post('/admin/login', { onFinish: () => form.reset('password') });
                    }}
                >
                    <Logo className="lg:hidden" />
                    <h1 className="mt-8 text-3xl font-extrabold lg:mt-0">Sign in</h1>
                    <p className="mt-2 text-sm text-muted">Use your admin email. Renter and owner accounts sign in on the app.</p>

                    <label className="mt-8 block text-sm font-semibold">
                        Email
                        <input type="email" autoComplete="username" required autoFocus value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} className={field} aria-invalid={!!form.errors.email} aria-describedby="login-error" />
                    </label>
                    <label className="mt-4 block text-sm font-semibold">
                        Password
                        <span className="relative block">
                            <input type={show ? 'text' : 'password'} autoComplete="current-password" required value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} className={`${field} pr-12`} />
                            <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-3.5 rounded-lg p-2 text-muted" aria-label={show ? 'Hide password' : 'Show password'}>
                                {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                            </button>
                        </span>
                    </label>

                    <p id="login-error" role="alert" className="mt-3 min-h-5 text-sm font-semibold text-hibiscus">
                        {form.errors.email ?? form.errors.password}
                    </p>

                    <Button type="submit" variant="primary" disabled={form.processing} className="mt-3 h-12 w-full rounded-xl text-base">
                        {form.processing && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
                        Sign in
                    </Button>
                </form>
            </div>
        </div>
    );
}
