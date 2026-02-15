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

self.addEventListener('install', (event) => {
  console.log('📦 Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_PRAYER_TIMINGS') {
    prayerTimings = event.data.timings;
    console.log('📅 Prayer times:', prayerTimings);
    
    if (checkInterval) {
      clearInterval(checkInterval);
      console.log('🛑 Stopped old interval');
    }
    
    checkInterval = setInterval(() => {
      checkPrayerTime();
    }, 60000);
    
    console.log('✅ Started new interval');
    checkPrayerTime();
    
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ success: true });
    }
  }
  
  if (event.data?.type === 'SHOW_REMAINING_TIME') {
    const { prayerName, timeText, prayerTime } = event.data;
    showRemainingTimeNotification(prayerName, timeText, prayerTime);
    
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ success: true });
    }
  }
  
  if (event.data?.type === 'KEEP_ALIVE') {
    console.log('💓 Keep-alive');
  }
});

function checkPrayerTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = hours + ':' + minutes;
  
  console.log('🕐 Checking time:', currentTime);
  
  const prayers = {
    Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر',
    Sunset: 'المغرب', Isha: 'العشاء',
    Lastthird: 'السحور', Imsak: 'الإمساك',
  };

  for (const [key, name] of Object.entries(prayers)) {
    if (prayerTimings[key] === currentTime) {
      console.log('🔔 MATCH FOUND! Prayer:', name, 'Time:', currentTime);
      showPrayerNotification(name, currentTime);
    }
  }
}

// ============================================
// ⚠️ إشعار الصلاة - أولوية عالية
// ============================================
function showPrayerNotification(prayerName, time) {
  console.log('🔔 Showing notification for:', prayerName);
  
  const title = '🕌 حان وقت صلاة ' + prayerName;
  const options = {
    body: 'الوقت: ' + time + '\nالصلاة خير من النوم 🤲',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    
    // ⚠️ إعدادات للظهور المنبثق على Android
    tag: 'prayer-' + Date.now(), // tag فريد في كل مرة
    requireInteraction: true, // يبقى حتى يتفاعل المستخدم
    silent: false, // صوت مفعّل
    vibrate: [500, 200, 500, 200, 500], // اهتزاز قوي
    
    // ⚠️ أولوية عالية (مهم جداً للـ Android)
    // هذا غير رسمي لكن بعض المتصفحات تستخدمه
    priority: 'high',
    
    // بيانات إضافية
    data: { 
      url: '/salah', 
      time: time, 
      prayer: prayerName,
      timestamp: Date.now(),
    },
    
    // ⚠️ أزرار تفاعلية (تزيد الأولوية)
    actions: [
      {
        action: 'open',
        title: '👁️ فتح التطبيق',
      },
      {
        action: 'dismiss',
        title: '✕ إغلاق',
      }
    ],
    
    // صورة كبيرة (اختياري - يزيد الوضوح)
    image: '/icon-192x192.png',
  };
  
  self.registration.showNotification(title, options)
    .then(() => {
      console.log('✅ Prayer notification shown!');
      
      // ⚠️ تشغيل صوت إضافي (اختياري)
      // يمكن إضافة ملف صوت لاحقاً
    })
    .catch((error) => console.error('❌ Failed:', error));
}

// ============================================
// ⚠️ إشعار الوقت المتبقي - أولوية عالية
// ============================================
function showRemainingTimeNotification(prayerName, timeText, prayerTime) {
  console.log('⏰ Showing remaining time notification:', prayerName, timeText);
  
  const title = '⏰ الصلاة القادمة: ' + prayerName;
  const options = {
    body: 'باقي ' + timeText + ' على وقت ' + prayerName + '\nالوقت: ' + prayerTime,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    
    // ⚠️ إعدادات للظهور المنبثق
    tag: 'remaining-' + Date.now(),
    requireInteraction: false, // يختفي تلقائياً
    silent: false,
    vibrate: [300, 100, 300], // اهتزاز متوسط
    
    // ⚠️ أولوية عالية
    priority: 'high',
    
    data: { 
      url: '/salah', 
      prayer: prayerName,
      timestamp: Date.now(),
    },
    
    // ⚠️ أزرار
    actions: [
      {
        action: 'open',
        title: '📱 فتح',
      }
    ],
    
    // صورة
    image: '/icon-192x192.png',
  };
  
  self.registration.showNotification(title, options)
    .then(() => {
      console.log('✅ Remaining time notification shown!');
    })
    .catch((error) => console.error('❌ Failed:', error));
}

// ============================================
// التعامل مع النقر على الإشعار
// ============================================
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked, action:', event.action);
  event.notification.close();
  
  // إذا ضغط "dismiss" لا تفعل شيء
  if (event.action === 'dismiss') {
    return;
  }
  
  const url = event.notification.data?.url || '/salah';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // البحث عن نافذة مفتوحة
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        // فتح نافذة جديدة
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

messaging.onBackgroundMessage((payload) => {
  console.log('📬 Firebase message:', payload);
  
  const title = payload.notification?.title || 'إشعار جديد';
  const options = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'firebase-' + Date.now(),
    requireInteraction: true,
    silent: false,
    vibrate: [300, 100, 300],
    priority: 'high',
    data: payload.data || {},
  };
  
  self.registration.showNotification(title, options);
});

setInterval(() => {
  if (Object.keys(prayerTimings).length > 0) {
    checkPrayerTime();
  }
}, 60000);

console.log('✅ Prayer SW ready! 🕌');