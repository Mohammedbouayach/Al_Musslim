"use client";

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // تسجيل Service Worker
            navigator.serviceWorker
                .register('/sw.js', { scope: '/' })
                .then((registration) => {
                    console.log('✅ Service Worker مسجل بنجاح:', registration.scope);
                    
                    // تحديث Service Worker إذا كان هناك تحديث
                    registration.addEventListener('updatefound', () => {
                        console.log('🔄 تم العثور على تحديث للـ Service Worker');
                    });
                })
                .catch((error) => {
                    console.error('❌ فشل تسجيل Service Worker:', error);
                });

            // الاستماع لتغييرات حالة Service Worker
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('🔄 تم تحديث Service Worker');
            });
        }
    }, []);

    return null; // هذا الكومبوننت لا يعرض شيء
}
