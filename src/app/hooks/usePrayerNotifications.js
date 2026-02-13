// src/hooks/usePrayerNotifications.js
import { useEffect, useCallback } from 'react';

export const usePrayerNotifications = (timings, enabled) => {
  
  // إرسال للـ SW
  const sendToSW = useCallback((data) => {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_PRAYER_TIMINGS',
        timings: data,
      });
      console.log('📤 Sent to SW:', data);
    }
  }, []);

  // ⚠️ JavaScript Timer كـ Fallback
  useEffect(() => {
    if (!enabled || !timings.Fajr || timings.Fajr === '00:00') return;

    sendToSW(timings);

    // فحص كل دقيقة من JavaScript مباشرة (backup)
    const interval = setInterval(() => {
      checkAndNotify(timings);
    }, 60000);

    // فحص فوري
    checkAndNotify(timings);

    return () => clearInterval(interval);
  }, [timings, enabled, sendToSW]);

  // دالة الفحص والإشعار
  const checkAndNotify = (times) => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2,'0') + ':' + 
                        now.getMinutes().toString().padStart(2,'0');
    
    const prayers = {
      Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر',
      Sunset: 'المغرب', Isha: 'العشاء',
      Lastthird: 'السحور', Imsak: 'الإمساك',
    };

    for (const [key, name] of Object.entries(prayers)) {
      if (times[key] === currentTime) {
        // تحقق من عدم إرسال نفس الإشعار مرتين
        const lastNotif = localStorage.getItem('lastNotif');
        const notifKey = key + '-' + currentTime;
        
        if (lastNotif !== notifKey) {
          showNotification(name, currentTime);
          localStorage.setItem('lastNotif', notifKey);
        }
      }
    }
  };

  // إظهار الإشعار مباشرة من JavaScript
  const showNotification = (prayerName, time) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      console.log('🔔 JS Notification:', prayerName);
      
      new Notification('🕌 حان وقت صلاة ' + prayerName, {
        body: 'الوقت: ' + time + '\nالصلاة خير من النوم 🤲',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'prayer-js-' + prayerName,
        requireInteraction: true,
        silent: false,
      });
      
      // محاولة تشغيل صوت (اختياري)
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});
      } catch (e) {}
    }
  };

  return { sendToSW };
};
