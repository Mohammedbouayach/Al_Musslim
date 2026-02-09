// src/hooks/useFirebaseNotifications.js
import { useState, useEffect } from 'react';
import { getFCMToken, onMessageListener } from '@/lib/firebase-config';
import { toast } from 'react-toastify';

export const useFirebaseNotifications = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  // تهيئة Firebase Messaging
  useEffect(() => {
    const initializeNotifications = async () => {
      if (typeof window === 'undefined') return;

      try {
        // التحقق من دعم المتصفح
        if (!('Notification' in window)) {
          console.warn('المتصفح لا يدعم الإشعارات');
          toast.warn('⚠️ متصفحك لا يدعم الإشعارات', {
            position: toast.POSITION.TOP_CENTER,
          });
          setLoading(false);
          return;
        }

        // التحقق من الإذن الحالي
        if (Notification.permission === 'granted') {
          setNotificationPermission(true);
          
          // الحصول على FCM Token
          const token = await getFCMToken();
          if (token) {
            setFcmToken(token);
            
            // حفظ Token في localStorage للاستخدام لاحقاً
            localStorage.setItem('fcmToken', token);
            
            toast.success('✅ الإشعارات مفعلة!', {
              position: toast.POSITION.TOP_CENTER,
              autoClose: 3000,
            });
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('خطأ في تهيئة الإشعارات:', error);
        setLoading(false);
      }
    };

    initializeNotifications();
  }, []);

  // طلب إذن الإشعارات والحصول على Token
  const requestPermission = async () => {
    try {
      const token = await getFCMToken();
      
      if (token) {
        setFcmToken(token);
        setNotificationPermission(true);
        
        // حفظ Token
        localStorage.setItem('fcmToken', token);
        
        toast.success('✅ تم تفعيل الإشعارات بنجاح!', {
          position: toast.POSITION.TOP_CENTER,
        });
        
        return token;
      } else {
        toast.error('❌ فشل الحصول على إذن الإشعارات', {
          position: toast.POSITION.TOP_CENTER,
        });
        return null;
      }
    } catch (error) {
      console.error('خطأ في طلب الإذن:', error);
      toast.error('❌ خطأ في تفعيل الإشعارات', {
        position: toast.POSITION.TOP_CENTER,
      });
      return null;
    }
  };

  // الاستماع للرسائل في المقدمة
  const listenForMessages = (callback) => {
    onMessageListener((payload) => {
      console.log('📬 رسالة جديدة:', payload);
      
      // إظهار إشعار في التطبيق
      toast.info(
        <div>
          <strong>{payload.notification?.title}</strong>
          <p>{payload.notification?.body}</p>
        </div>,
        {
          position: toast.POSITION.TOP_CENTER,
          autoClose: 5000,
        }
      );
      
      // استدعاء callback إذا وُجد
      if (callback) callback(payload);
    });
  };

  return {
    fcmToken,
    notificationPermission,
    loading,
    requestPermission,
    listenForMessages,
  };
};
