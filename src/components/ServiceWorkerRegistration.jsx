"use client";

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator)) return;

        const registerSW = async () => {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const reg of registrations) {
                    const url = reg.active?.scriptURL || '';
                    if (url.includes('/sw.js') && !url.includes('firebase-messaging-sw')) {
                        await reg.unregister();
                    }
                }

                const registration = await navigator.serviceWorker.register(
                    '/firebase-messaging-sw.js',
                    { scope: '/', updateViaCache: 'none' }
                );


                if ('periodicSync' in registration) {
                    try {
                        await registration.periodicSync.register('check-prayer-time', {
                            minInterval: 60 * 1000
                        });
                        console.log('✅ Periodic sync OK');
                    } catch (e) {
                        console.log('⚠️ Periodic sync not supported');
                    }
                }

                setInterval(() => {
                    registration.update();
                    if (navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({ type: 'KEEP_ALIVE' });
                    }
                }, 30000);

            } catch (error) {
                console.error('❌ SW error:', error);
            }
        };

        if (document.readyState === 'complete') {
            registerSW();
        } else {
            window.addEventListener('load', registerSW);
            return () => window.removeEventListener('load', registerSW);
        }
    }, []);

    return null;
}