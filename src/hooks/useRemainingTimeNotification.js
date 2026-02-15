// src/hooks/useRemainingTimeNotification.js
import { useEffect } from 'react';
import moment from 'moment';

export const useRemainingTimeNotification = (timings, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'granted') return;
    if (!timings || timings.Fajr === '00:00') return;

    const autoNotifyEnabled = localStorage.getItem('autoNotifyEnabled') === 'true';
    if (!autoNotifyEnabled) return;

    // ⚠️ التحقق من Session - إشعار واحد فقط في كل جلسة
    const sessionKey = 'notificationShownThisSession';
    const alreadyShown = sessionStorage.getItem(sessionKey);
    
    if (alreadyShown === 'true') {
      console.log('⏭️ تم إرسال الإشعار مسبقاً في هذه الجلسة');
      return;
    }

    const prayersArray = [
      { key: 'Fajr', displayName: 'الفجر' },
      { key: 'Dhuhr', displayName: 'الظهر' },
      { key: 'Asr', displayName: 'العصر' },
      { key: 'Sunset', displayName: 'المغرب' },
      { key: 'Isha', displayName: 'العشاء' },
    ];

    const momentNow = moment();
    let nextPrayerIndex = 0;

    if (momentNow.isAfter(moment(timings.Fajr, 'HH:mm')) && momentNow.isBefore(moment(timings.Dhuhr, 'HH:mm'))) {
      nextPrayerIndex = 1;
    } else if (momentNow.isAfter(moment(timings.Dhuhr, 'HH:mm')) && momentNow.isBefore(moment(timings.Asr, 'HH:mm'))) {
      nextPrayerIndex = 2;
    } else if (momentNow.isAfter(moment(timings.Asr, 'HH:mm')) && momentNow.isBefore(moment(timings.Sunset, 'HH:mm'))) {
      nextPrayerIndex = 3;
    } else if (momentNow.isAfter(moment(timings.Sunset, 'HH:mm')) && momentNow.isBefore(moment(timings.Isha, 'HH:mm'))) {
      nextPrayerIndex = 4;
    }

    const nextPrayer = prayersArray[nextPrayerIndex];
    const nextPrayerTime = timings[nextPrayer.key];

    let remainingTime = moment(nextPrayerTime, 'HH:mm').diff(momentNow);
    if (nextPrayerIndex === 0) {
      remainingTime =
        moment('23:59:59', 'HH:mm:ss').diff(momentNow) +
        moment(nextPrayerTime, 'HH:mm').diff(moment('00:00:00', 'HH:mm:ss'));
    }

    const duration = moment.duration(remainingTime);
    const hours = duration.hours();
    const minutes = duration.minutes();

    let timeText = '';
    if (hours > 0 && minutes > 0) {
      timeText = `${hours} ساعة و ${minutes} دقيقة`;
    } else if (hours > 0) {
      timeText = `${hours} ساعة`;
    } else {
      timeText = `${minutes} دقيقة`;
    }

    // إرسال للـ Service Worker
    const timer = setTimeout(async () => {
      try {
        if (!navigator.serviceWorker.controller) {
          console.warn('⚠️ SW غير نشط');
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const messageChannel = new MessageChannel();
        
        registration.active.postMessage(
          {
            type: 'SHOW_REMAINING_TIME',
            prayerName: nextPrayer.displayName,
            timeText: timeText,
            prayerTime: nextPrayerTime,
          },
          [messageChannel.port2]
        );

        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            // ⚠️ حفظ في sessionStorage (يُمسح عند إغلاق التطبيق)
            sessionStorage.setItem(sessionKey, 'true');
            console.log('✅ تم إرسال إشعار الوقت المتبقي:', timeText);
          }
        };

        setTimeout(() => {
          console.log('⏱️ انتهت مهلة الانتظار');
        }, 3000);

      } catch (error) {
        console.error('❌ خطأ:', error);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [timings, enabled]);
};