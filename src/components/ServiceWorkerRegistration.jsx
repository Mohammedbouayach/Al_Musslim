"use client";

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator)) return;

        const registerSW = async () => {
            try {
                // ✅ الخطوة 1: إلغاء sw.js القديم (Workbox) الذي يسبب خطأ 404
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const reg of registrations) {
                    const url = reg.active?.scriptURL
                             || reg.installing?.scriptURL
                             || reg.waiting?.scriptURL
                             || '';
                    if (url.includes('/sw.js') && !url.includes('firebase-messaging-sw')) {
                        await reg.unregister();
                        console.log('🧹 تم إلغاء sw.js القديم');
                    }
                }

                // ✅ الخطوة 2: تسجيل firebase-messaging-sw.js الجديد
                const registration = await navigator.serviceWorker.register(
                    '/firebase-messaging-sw.js',
                    { scope: '/', updateViaCache: 'none' }
                );

                console.log('✅ Firebase SW مسجل بنجاح:', registration.scope);

                // الاستماع للتحديثات
                registration.addEventListener('updatefound', () => {
                    console.log('🔄 يوجد تحديث للـ Service Worker');
                });

                // الاستماع لتغييرات الحالة
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('🔄 تم تحديث Service Worker');
                });

            } catch (error) {
                console.error('❌ فشل تسجيل Service Worker:', error);
            }
        };

        // انتظر تحميل الصفحة كاملاً قبل التسجيل
        if (document.readyState === 'complete') {
            registerSW();
        } else {
            window.addEventListener('load', registerSW);
            return () => window.removeEventListener('load', registerSW);
        }
    }, []);

    return null;
}