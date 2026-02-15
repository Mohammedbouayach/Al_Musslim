// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC8IapFk7JPPcrAQ78xaOPVbz9RlUwR_ag",
  authDomain: "almuslim-b308c.firebaseapp.com",
  projectId: "almuslim-b308c",
  storageBucket: "almuslim-b308c.firebasestorage.app",
  messagingSenderId: "874573656499",
  appId: "1:874573656499:web:a22b11c52d4444abbe9bc6"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

let prayerTimings = {};
let checkInterval = null;


self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ============================================
// استقبال الرسائل
// ============================================
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_PRAYER_TIMINGS') {
    prayerTimings = event.data.timings;
    
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    
    checkInterval = setInterval(() => {
      checkPrayerTime();
    }, 60000);
    
    checkPrayerTime();
    
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ success: true });
    }
  }
  
  // ⚠️ رسالة جديدة: إشعار الوقت المتبقي
  if (event.data?.type === 'SHOW_REMAINING_TIME') {
    const { prayerName, timeText, prayerTime } = event.data;
    showRemainingTimeNotification(prayerName, timeText, prayerTime);
    
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ success: true });
    }
  }
  
});

// ============================================
// فحص وقت الصلاة
// ============================================
function checkPrayerTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = hours + ':' + minutes;
  
  
  const prayers = {
    Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر',
    Sunset: 'المغرب', Isha: 'العشاء',
    Lastthird: 'السحور', Imsak: 'الإمساك',
  };

  for (const [key, name] of Object.entries(prayers)) {
    if (prayerTimings[key] === currentTime) {
      showPrayerNotification(name, currentTime);
    }
  }
}

// ============================================
// إظهار إشعار الصلاة
// ============================================
function showPrayerNotification(prayerName, time) {
  
  const title = '🕌 حان وقت صلاة ' + prayerName;
  const options = {
    body: 'الوقت: ' + time,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'prayer-' + prayerName + '-' + Date.now(),
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 300],
    data: { url: '/salah', time: time, prayer: prayerName },
    silent: false,
  };
  
  self.registration.showNotification(title, options)
    .then(() => console.log('✅ Prayer notification shown!'))
    .catch((error) => console.error('❌ Failed:', error));
}

// ============================================
// ⚠️ إظهار إشعار الوقت المتبقي (من SW)
// ============================================
function showRemainingTimeNotification(prayerName, timeText, prayerTime) {
  
  const title = '⏰ الصلاة القادمة: ' + prayerName;
  const options = {
    body: 'باقي ' + timeText + ' على وقت ' + prayerName + '\nالوقت: ' + prayerTime,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'remaining-time-' + Date.now(),
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { url: '/salah', prayer: prayerName },
    silent: false,
  };
  
  self.registration.showNotification(title, options)
    .then(() => console.log('✅ Remaining time notification shown!'))
    .catch((error) => console.error('❌ Failed:', error));
}

// ============================================
// النقر على الإشعار
// ============================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/salah';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// ============================================
// رسائل Firebase
// ============================================
messaging.onBackgroundMessage((payload) => {
  
  const title = payload.notification?.title || 'إشعار جديد';
  const options = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: payload.data || {},
    requireInteraction: true,
  };
  
  self.registration.showNotification(title, options);
});

setInterval(() => {
  if (Object.keys(prayerTimings).length > 0) {
    checkPrayerTime();
  }
}, 60000);

