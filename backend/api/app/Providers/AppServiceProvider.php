<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Foundation\Vite as BaseVite;

class NetworkAwareVite extends BaseVite
{
    /**
     * Get the URL of the running Vite development server.
     * When accessed via Wi-Fi / LAN IP (e.g. 192.168.x.x from a phone or other laptop),
     * dynamically rewrite the dev server URL host to match the exact host IP or domain
     * of the incoming HTTP request.
     */
    public function devServerUrl()
    {
        $url = parent::devServerUrl();
        if (! $url) {
            return null;
        }

        try {
            $host = request()->getHost();
            if ($host) {
                return preg_replace('#https?://[^:/]+#', 'http://' . $host, $url);
            }
        } catch (\Throwable) {}

        return $url;
    }
}

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(\Illuminate\Foundation\Vite::class, NetworkAwareVite::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
