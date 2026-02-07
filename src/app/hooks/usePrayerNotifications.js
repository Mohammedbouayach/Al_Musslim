// hooks/usePrayerNotifications.js
// هوك مخصص لإدارة إشعارات الصلاة

import { useEffect, useState } from 'react';
import moment from 'moment';

export function usePrayerNotifications() {
    const [notificationPermission, setNotificationPermission] = useState(false);
    const [scheduledPrayers, setScheduledPrayers] = useState([]);

    // طلب إذن الإشعارات وتسجيل Service Worker
    useEffect(() => {
        const initializeNotifications = async () => {
            if (!('serviceWorker' in navigator) || !('Notification' in window)) {
                console.warn('Notifications not supported');
                return;
            }

            try {
                // تسجيل Service Worker
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered:', registration.scope);

                // طلب إذن الإشعارات
                const permission = await Notification.requestPermission();
                setNotificationPermission(permission === 'granted');

                if (permission === 'granted') {
                    console.log('✅ Notification permission granted');
                } else {
                    console.warn('⚠️ Notification permission denied');
                }
            } catch (error) {
                console.error('❌ Error initializing notifications:', error);
            }
        };

        initializeNotifications();
    }, []);

    // دالة لجدولة إشعار صلاة واحدة
    const scheduleNotification = async (prayerName, prayerTime) => {
        if (!notificationPermission || Notification.permission !== 'granted') {
            console.warn('Cannot schedule notification - permission not granted');
            return null;
        }

        try {
            const now = moment();
            const prayerMoment = moment(prayerTime, 'HH:mm');

            // إذا مضى وقت الصلاة اليوم، جدولها للغد
            if (prayerMoment.isBefore(now)) {
                prayerMoment.add(1, 'day');
            }

            const msUntilPrayer = prayerMoment.diff(now);
            const minutesUntilPrayer = Math.floor(msUntilPrayer / 60000);

            console.log(`📅 Scheduling ${prayerName} in ${minutesUntilPrayer} minutes`);

            // جدولة الإشعار
            const timeoutId = setTimeout(async () => {
                const registration = await navigator.serviceWorker.ready;
                
                await registration.showNotification(`🕌 حان وقت صلاة ${prayerName}`, {
                    body: `الوقت: ${moment(prayerTime, 'HH:mm').format('hh:mm A')}\n\nالصلاة خير من النوم 🤲`,
                    icon: '/icon-192x192.png',
                    badge: '/icon-192x192.png',
                    tag: `prayer-${prayerName}-${Date.now()}`,
                    requireInteraction: true,
                    vibrate: [200, 100, 200, 100, 200, 100, 200],
                    timestamp: prayerMoment.valueOf(),
                    data: {
                        prayer: prayerName,
                        time: prayerTime,
                        url: '/salah'
                    },
                    actions: [
                        {
                            action: 'view',
                            title: '👁️ عرض الأوقات',
                            icon: '/icon-192x192.png'
                        },
                        {
                            action: 'close',
                            title: '✖️ إغلاق',
                        }
                    ]
                });

                console.log(`✅ Notification shown for ${prayerName}`);

                // إزالة من قائمة المجدولة
                setScheduledPrayers(prev => 
                    prev.filter(p => p.name !== prayerName)
                );
            }, msUntilPrayer);

            // إضافة للقائمة المجدولة
            setScheduledPrayers(prev => [
                ...prev.filter(p => p.name !== prayerName),
                { name: prayerName, time: prayerTime, timeoutId }
            ]);

            return timeoutId;
        } catch (error) {
            console.error(`❌ Error scheduling notification for ${prayerName}:`, error);
            return null;
        }
    };

    // دالة لجدولة كل الصلوات
    const scheduleAllPrayers = async (timings) => {
        if (!notificationPermission) {
            console.warn('Cannot schedule prayers - permission not granted');
            return;
        }

        const prayers = [
            { name: 'الفجر', key: 'Fajr' },
            { name: 'الظهر', key: 'Dhuhr' },
            { name: 'العصر', key: 'Asr' },
            { name: 'المغرب', key: 'Sunset' },
            { name: 'العشاء', key: 'Isha' }
        ];

        console.log('📅 Scheduling all prayers...');

        for (const prayer of prayers) {
            if (timings[prayer.key] && timings[prayer.key] !== '00:00') {
                await scheduleNotification(prayer.name, timings[prayer.key]);
            }
        }

        console.log('✅ All prayers scheduled successfully');
    };

    // دالة لجدولة أوقات رمضان
    const scheduleRamadanTimings = async (timings) => {
        if (!notificationPermission) return;

        const ramadanTimings = [
            { name: 'السحور', key: 'Lastthird' },
            { name: 'الإمساك', key: 'Imsak' },
            { name: 'الإفطار', key: 'Sunset' }
        ];

        console.log('🌙 Scheduling Ramadan timings...');

        for (const timing of ramadanTimings) {
            if (timings[timing.key] && timings[timing.key] !== '00:00') {
                await scheduleNotification(timing.name, timings[timing.key]);
            }
        }

        console.log('✅ Ramadan timings scheduled');
    };

    // إلغاء كل الإشعارات المجدولة
    const cancelAllNotifications = () => {
        scheduledPrayers.forEach(prayer => {
            if (prayer.timeoutId) {
                clearTimeout(prayer.timeoutId);
            }
        });
        setScheduledPrayers([]);
        console.log('🚫 All scheduled notifications cancelled');
    };

    // دالة لإرسال إشعار تجريبي
    const sendTestNotification = async () => {
        if (!notificationPermission) {
            alert('يرجى السماح بالإشعارات أولاً!');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification('🕌 إشعار تجريبي', {
                body: 'هذا إشعار تجريبي للتأكد من عمل الإشعارات ✅',
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                vibrate: [200, 100, 200],
                tag: 'test-notification'
            });
            console.log('✅ Test notification sent');
        } catch (error) {
            console.error('❌ Error sending test notification:', error);
        }
    };

    return {
        notificationPermission,
        scheduledPrayers,
        scheduleNotification,
        scheduleAllPrayers,
        scheduleRamadanTimings,
        cancelAllNotifications,
        sendTestNotification
    };
}
