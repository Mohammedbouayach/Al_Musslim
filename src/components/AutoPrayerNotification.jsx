// src/components/AutoPrayerNotification.jsx
"use client";

import { useEffect, useState } from 'react';
import { useRemainingTimeNotification } from '@/hooks/useRemainingTimeNotification';

export default function AutoPrayerNotification() {
  const [timings, setTimings] = useState(null);
  const [loading, setLoading] = useState(true);

  // جلب أوقات الصلاة
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        const date = new Date();
        
        // محاولة استخدام الموقع المحفوظ
        const savedLat = localStorage.getItem('latitude');
        const savedLng = localStorage.getItem('longitude');

        let url;
        if (savedLat && savedLng) {
          url = `https://api.aladhan.com/v1/calendar/${date.getFullYear()}?latitude=${savedLat}&longitude=${savedLng}`;
        } else {
          // استخدام موقع افتراضي (الدار البيضاء)
          url = `https://api.aladhan.com/v1/timingsByCity?city=Casablanca&country=Morocco`;
        }

        const response = await fetch(url);
        const data = await response.json();

        let prayerData;
        if (savedLat && savedLng) {
          prayerData = data.data[date.getMonth() + 1][date.getDate() - 1];
        } else {
          prayerData = data.data;
        }

        setTimings({
          Fajr: prayerData.timings.Fajr.slice(0, 5),
          Dhuhr: prayerData.timings.Dhuhr.slice(0, 5),
          Asr: prayerData.timings.Asr.slice(0, 5),
          Sunset: prayerData.timings.Maghrib.slice(0, 5),
          Isha: prayerData.timings.Isha.slice(0, 5),
        });

        setLoading(false);
      } catch (error) {
        console.error('خطأ في جلب أوقات الصلاة:', error);
        setLoading(false);
      }
    };

    fetchPrayerTimes();
  }, []);

  // استخدام Hook الإشعار
  useRemainingTimeNotification(timings, !loading);

  // هذا المكون لا يعرض أي شيء
  return null;
}
