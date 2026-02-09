// src/lib/firebase-config.js
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// إعدادات Firebase من .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// تهيئة Firebase (مرة واحدة فقط)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// الحصول على Messaging instance
let messaging = null;

// دالة للتحقق من دعم المتصفح والحصول على messaging
export const getMessagingInstance = async () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase Messaging غير مدعوم في هذا المتصفح');
    return null;
  }

  if (!messaging) {
    messaging = getMessaging(app);
  }

  return messaging;
};

// الحصول على FCM Token
export const getFCMToken = async () => {
  try {
    const messagingInstance = await getMessagingInstance();
    if (!messagingInstance) return null;

    // طلب إذن الإشعارات
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('إذن الإشعارات مرفوض');
      return null;
    }

    // الحصول على Token
    const currentToken = await getToken(messagingInstance, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (currentToken) {
      console.log('✅ FCM Token:', currentToken);
      return currentToken;
    } else {
      console.log('لا يوجد registration token');
      return null;
    }
  } catch (error) {
    console.error('خطأ في الحصول على FCM token:', error);
    return null;
  }
};

// الاستماع للرسائل في المقدمة (Foreground)
export const onMessageListener = async (callback) => {
  const messagingInstance = await getMessagingInstance();
  if (!messagingInstance) return;

  onMessage(messagingInstance, (payload) => {
    console.log('📬 رسالة واردة (Foreground):', payload);
    callback(payload);
  });
};

export default app;
