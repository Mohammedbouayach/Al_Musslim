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

console.log('🕌 Prayer SW loaded');

// Install & Activate
self.addEventListener('install', (event) => {
  console.log('📦 Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Activated');
  event.waitUntil(self.clients.claim());
});

// ============================================
// استقبال أوقات الصلاة
// ============================================
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_PRAYER_TIMINGS') {
    prayerTimings = event.data.timings;
    console.log('📅 Prayer times:', prayerTimings);
    
    // إيقاف الفحص القديم
    if (checkInterval) {
      clearInterval(checkInterval);
      console.log('🛑 Stopped old interval');
    }
    
    // ⚠️ بدء فحص دوري كل دقيقة
    checkInterval = setInterval(() => {
      checkPrayerTime();
    }, 60000); // كل 60 ثانية
    
    console.log('✅ Started new interval - checking every 60 seconds');
    
    // فحص فوري
    checkPrayerTime();
    
    // رد على الرسالة
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ success: true });
    }
  }
  
  // Keep-alive ping
  if (event.data?.type === 'KEEP_ALIVE') {
    console.log('💓 Keep-alive ping received');
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
  
  console.log('🕐 Checking time:', currentTime, '| Prayer times:', prayerTimings);
  
  const prayers = {
    Fajr: 'الفجر',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Sunset: 'المغرب',
    Isha: 'العشاء',
    Lastthird: 'السحور',
    Imsak: 'الإمساك',
  };

  for (const [key, name] of Object.entries(prayers)) {
    if (prayerTimings[key] === currentTime) {
      console.log('🔔 MATCH FOUND! Prayer:', name, 'Time:', currentTime);
      showPrayerNotification(name, currentTime);
    }
  }
}

// ============================================
// إظهار الإشعار
// ============================================
function showPrayerNotification(prayerName, time) {
  console.log('🔔 Showing notification for:', prayerName, 'at', time);
  
  const title = '🕌 حان وقت صلاة ' + prayerName;
  const options = {
    body: 'الوقت: ' + time + '\nالصلاة خير من النوم 🤲',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'prayer-' + prayerName + '-' + Date.now(),
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 300],
    data: { 
      url: '/salah', 
      time: time, 
      prayer: prayerName 
    },
    silent: false,
  };
  
  self.registration.showNotification(title, options)
    .then(() => {
      console.log('✅ Notification shown successfully!');
    })
    .catch((error) => {
      console.error('❌ Failed to show notification:', error);
    });
}

// ============================================
// النقر على الإشعار
// ============================================
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');
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
// رسائل Firebase في الخلفية
// ============================================
messaging.onBackgroundMessage((payload) => {
  console.log('📬 Firebase message:', payload);
  
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

// ============================================
// ⚠️ فحص دوري احتياطي (يعمل حتى لو لم تُرسل رسالة)
// ============================================
setInterval(() => {
  if (Object.keys(prayerTimings).length > 0) {
    checkPrayerTime();
  }
}, 60000);

console.log('✅ Prayer SW ready! 🕌');