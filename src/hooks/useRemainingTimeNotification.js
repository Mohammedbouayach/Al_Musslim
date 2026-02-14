// src/hooks/useRemainingTimeNotification.js
import { useEffect } from 'react';
import moment from 'moment';

export const useRemainingTimeNotification = (timings, enabled = true) => {
  useEffect(() => {
    // التحقق من الشروط
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!timings || timings.Fajr === '00:00') return;

    // التحقق من الإعداد في localStorage
    const autoNotifyEnabled = localStorage.getItem('autoNotifyEnabled') === 'true';
    if (!autoNotifyEnabled) return;

    // حساب الصلاة القادمة
    const prayersArray = [
      { key: 'Fajr', displayName: 'الفجر' },
      { key: 'Dhuhr', displayName: 'الظهر' },
      { key: 'Asr', displayName: 'العصر' },
      { key: 'Sunset', displayName: 'المغرب' },
      { key: 'Isha', displayName: 'العشاء' },
    ];

    const momentNow = moment();
    let nextPrayerIndex = 0;

    // تحديد الصلاة القادمة
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

    // حساب الوقت المتبقي
    let remainingTime = moment(nextPrayerTime, 'HH:mm').diff(momentNow);
    if (nextPrayerIndex === 0) {
      remainingTime =
        moment('23:59:59', 'HH:mm:ss').diff(momentNow) +
        moment(nextPrayerTime, 'HH:mm').diff(moment('00:00:00', 'HH:mm:ss'));
    }

    const duration = moment.duration(remainingTime);
    const hours = duration.hours();
    const minutes = duration.minutes();

    // تنسيق النص
    let timeText = '';
    if (hours > 0 && minutes > 0) {
      timeText = `${hours} ساعة و ${minutes} دقيقة`;
    } else if (hours > 0) {
      timeText = `${hours} ساعة`;
    } else {
      timeText = `${minutes} دقيقة`;
    }

    // التحقق من عدم إرسال نفس الإشعار مرتين
    const lastNotifKey = `last-remaining-time-notif`;
    const lastNotifTime = localStorage.getItem(lastNotifKey);
    const currentMinute = momentNow.format('YYYY-MM-DD HH:mm');

    if (lastNotifTime === currentMinute) {
      console.log('⏭️ تم إرسال الإشعار مسبقاً في هذه الدقيقة');
      return;
    }

    // إرسال الإشعار بعد تأخير بسيط
    const timer = setTimeout(() => {
      try {
        new Notification(`⏰ الصلاة القادمة: ${nextPrayer.displayName}`, {
          body: `باقي ${timeText} على وقت ${nextPrayer.displayName}\nالوقت: ${nextPrayerTime}`,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'remaining-time',
          silent: false,
          requireInteraction: false,
        });

        // حفظ وقت الإشعار
        localStorage.setItem(lastNotifKey, currentMinute);
        console.log('✅ تم إرسال إشعار الوقت المتبقي:', timeText);
      } catch (error) {
        console.error('❌ خطأ في إرسال الإشعار:', error);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [timings, enabled]);
};
