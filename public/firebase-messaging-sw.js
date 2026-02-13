// public/firebase-messaging-sw.js
// Service Worker مع Periodic Background Sync

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

console.log('🕌 Prayer SW loaded');

// Install & Activate
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// استقبال أوقات الصلاة
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_PRAYER_TIMINGS') {
    prayerTimings = event.data.timings;
    console.log('📅 Prayer times:', prayerTimings);
    
    // حفظ في IndexedDB للاستمرارية
    saveToIndexedDB('prayerTimings', prayerTimings);
  }
});

// ⚠️ Periodic Background Sync - يعمل حتى بعد إغلاق التطبيق
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-prayer-time') {
    event.waitUntil(checkPrayerTime());
  }
});

// ⚠️ استيقاظ عند Push من Firebase
self.addEventListener('push', (event) => {
  console.log('🔔 Push received');
  event.waitUntil(checkPrayerTime());
});

// فحص وقت الصلاة
async function checkPrayerTime() {
  // استرجاع الأوقات من IndexedDB
  if (Object.keys(prayerTimings).length === 0) {
    prayerTimings = await getFromIndexedDB('prayerTimings') || {};
  }
  
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2,'0') + ':' + 
                      now.getMinutes().toString().padStart(2,'0');
  
  console.log('🕐 Check:', currentTime);
  
  const prayers = {
    Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر',
    Sunset: 'المغرب', Isha: 'العشاء',
    Lastthird: 'السحور', Imsak: 'الإمساك',
  };

  for (const [key, name] of Object.entries(prayers)) {
    if (prayerTimings[key] === currentTime) {
      await showPrayerNotification(name, currentTime);
    }
  }
}

// إظهار الإشعار
async function showPrayerNotification(prayerName, time) {
  console.log('🔔 Prayer time:', prayerName);
  
  const options = {
    body: 'الوقت: ' + time + '\nالصلاة خير من النوم 🤲',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'prayer-' + prayerName + '-' + Date.now(),
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 300],
    data: { url: '/salah', time: time, prayer: prayerName },
    silent: false,
  };
  
  await self.registration.showNotification('🕌 حان وقت صلاة ' + prayerName, options);
}

// النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/salah';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});

// رسائل Firebase
messaging.onBackgroundMessage((payload) => {
  console.log('📬 Firebase:', payload);
  const title = payload.notification?.title || 'إشعار';
  const options = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png',
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

// ============================================
// IndexedDB للحفظ الدائم
// ============================================
function saveToIndexedDB(key, value) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PrayerDB', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data');
      }
    };
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction('data', 'readwrite');
      const store = tx.objectStore('data');
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

function getFromIndexedDB(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PrayerDB', 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('data')) {
        resolve(null);
        return;
      }
      const tx = db.transaction('data', 'readonly');
      const store = tx.objectStore('data');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    };
    request.onerror = () => reject(request.error);
  });
}

console.log('✅ Prayer SW ready! 🕌');