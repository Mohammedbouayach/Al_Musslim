// public/firebase-messaging-sw.js
// Service Worker خاص بـ Firebase Cloud Messaging

// استيراد Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ============================================
// ⚠️ هـــام جداً: استبدل القيم التالية
// ============================================
// 
// احصل على القيم من:
// Firebase Console → Project Settings → General → Your apps → Web app
// 
// انسخ نفس القيم الموجودة في ملف .env.local
// (لكن بدون NEXT_PUBLIC_)
//
// ============================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",                    // من .env.local
  authDomain: "YOUR_AUTH_DOMAIN_HERE",            // من .env.local  
  projectId: "YOUR_PROJECT_ID_HERE",              // من .env.local
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",      // من .env.local
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",  // من .env.local
  appId: "YOUR_APP_ID_HERE"                       // من .env.local
};

// ⚠️ بعد التحديث، احفظ الملف وأعد تحميل التطبيق بـ Ctrl+Shift+R

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// الحصول على messaging instance
const messaging = firebase.messaging();

// ============================================
// نظام إشعارات الصلاة
// ============================================

let prayerTimings = {};
let checkInterval = null;

console.log('✅ Firebase Service Worker محمّل!');

// استقبال أوقات الصلاة من التطبيق
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_PRAYER_TIMINGS') {
    console.log('📅 تم استلام أوقات الصلاة:', event.data.timings);
    prayerTimings = event.data.timings;
    
    // إيقاف الفحص القديم
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    
    // بدء فحص دوري كل دقيقة
    checkInterval = setInterval(() => {
      checkPrayerTime();
    }, 60000);
    
    // فحص فوري
    checkPrayerTime();
  }
});

// التحقق من وقت الصلاة
function checkPrayerTime() {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  console.log(`🕐 الوقت الحالي: ${currentTime}`);
  
  // الصلوات الخمس
  if (prayerTimings.Fajr === currentTime) {
    showNotification('الفجر', currentTime);
  } else if (prayerTimings.Dhuhr === currentTime) {
    showNotification('الظهر', currentTime);
  } else if (prayerTimings.Asr === currentTime) {
    showNotification('العصر', currentTime);
  } else if (prayerTimings.Sunset === currentTime) {
    showNotification('المغرب', currentTime);
  } else if (prayerTimings.Isha === currentTime) {
    showNotification('العشاء', currentTime);
  }
  
  // أوقات رمضان (اختياري)
  if (prayerTimings.Lastthird === currentTime) {
    showNotification('السحور', currentTime);
  } else if (prayerTimings.Imsak === currentTime) {
    showNotification('الإمساك', currentTime);
  }
}

// إظهار الإشعار
function showNotification(prayerName, time) {
  console.log(`🕌 حان وقت صلاة ${prayerName}!`);
  
  const notificationOptions = {
    body: `الوقت: ${time}\n\nالصلاة خير من النوم 🤲`,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: `prayer-${prayerName}`,
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 300],
    data: {
      prayer: prayerName,
      time: time,
      url: '/salah'
    },
    actions: [
      {
        action: 'open',
        title: '👁️ فتح التطبيق'
      }
    ]
  };
  
  self.registration.showNotification(
    `🕌 حان وقت صلاة ${prayerName}`,
    notificationOptions
  );
}

// ============================================
// معالجة الرسائل الواردة من Firebase (Background)
// ============================================

messaging.onBackgroundMessage((payload) => {
  console.log('📬 رسالة Firebase في الخلفية:', payload);
  
  const notificationTitle = payload.notification?.title || 'إشعار جديد';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: payload.data || {},
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ============================================
// معالجة النقر على الإشعار
// ============================================

self.addEventListener('notificationclick', (event) => {
  console.log('🔔 تم النقر على الإشعار');
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/salah';
  
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // البحث عن نافذة مفتوحة
      for (let client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // فتح نافذة جديدة
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// عند إغلاق الإشعار
self.addEventListener('notificationclose', (event) => {
  console.log('❌ تم إغلاق الإشعار:', event.notification.tag);
});

// تفعيل Service Worker فوراً
self.addEventListener('activate', (event) => {
  console.log('✅ Firebase Service Worker مفعّل!');
  event.waitUntil(self.clients.claim());
});

console.log('✅ نظام إشعارات Firebase جاهز! 🕌');
