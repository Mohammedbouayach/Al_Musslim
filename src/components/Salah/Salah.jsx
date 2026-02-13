"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import moment from "moment";
import "moment/dist/locale/ar-dz";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "@/components/Layout/Loader";
import Landing from "../Layout/Landing";
import { useRamadan } from "@/context/ramadanContext";
import { useFirebaseNotifications } from "@/hooks/useFirebaseNotifications";
import { usePrayerNotifications } from "@/app/hooks/usePrayerNotifications";

moment.locale("ar");

export default function Salah() {
    const { ramadan } = useRamadan();
    
    // Firebase Notifications Hook
    const { 
        fcmToken, 
        notificationPermission, 
        loading: fcmLoading,
        requestPermission,
        listenForMessages 
    } = useFirebaseNotifications();

    const [timings, setTimings] = useState({
        Fajr: "00:00",
        Dhuhr: "00:00",
        Asr: "00:00",
        Sunset: "00:00",
        Isha: "00:00",
        Lastthird: "00:00",
        Imsak: "00:00",
    });
  

    const prayersArray = [
        { key: "Fajr", css: "Fajr", displayName: "الفجر" },
        { key: "Dhuhr", css: "Dhuhr", displayName: "الظهر" },
        { key: "Asr", css: "Asr", displayName: "العصر" },
        { key: "Sunset", css: "Sunset", displayName: "المغرب" },
        { key: "Isha", css: "Isha", displayName: "العشاء" },
    ];

    const ramadanTimingsArray = [
        { key: "Lastthird", css: "Lastthird", displayName: "سحور" },
        { key: "Imsak", css: "Imsak", displayName: "إمساك" },
        { key: "Sunset", css: "Aftar", displayName: "إفطار" },
    ];

    const [remainingPrayerTime, setRemainingPrayerTime] = useState({
        h: "00",
        m: "00",
        s: "00",
    });

    const [remainingRamadanTime, setRemainingRamadanTime] = useState({
        h: "00",
        m: "00",
        s: "00",
    });

    const [nextPrayerIndex, setNextPrayerIndex] = useState(0);
    const [nextRamadanIndex, setNextRamadanIndex] = useState(0);
    const [refreshGps, setRefreshGps] = useState(true);
    const [btnError, setBtnError] = useState(null);
    const [loadingScreen, setLoadingScreen] = useState(true);
    const [testScheduled, setTestScheduled] = useState(false);
    const [testTime, setTestTime] = useState("");
    const [swReady, setSwReady] = useState(false);
    const { sendToSW } = usePrayerNotifications(timings, notificationPermission);

    // ============================================
    // تسجيل Service Worker بشكل صحيح
    // ============================================
    
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator)) {
            console.log('❌ المتصفح لا يدعم Service Workers');
            return;
        }

        const registerSW = async () => {
            try {
                // 1. إلغاء جميع Service Workers القديمة
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const reg of registrations) {
                    const url = reg.active?.scriptURL || '';
                    if (url.includes('/sw.js') || url.includes('workbox')) {
                        await reg.unregister();
                        console.log('🧹 تم إلغاء SW قديم:', url);
                    }
                }

                // 2. تسجيل Service Worker الجديد
                const registration = await navigator.serviceWorker.register(
                    '/firebase-messaging-sw.js',
                    { 
                        scope: '/',
                        updateViaCache: 'none' 
                    }
                );

                console.log('✅ Firebase SW مسجل:', registration.scope);

                // 3. انتظار التفعيل الكامل
                await navigator.serviceWorker.ready;
                console.log('✅ Service Worker جاهز للعمل!');
                
                setSwReady(true);

                // 4. الاستماع للتحديثات
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker?.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated') {
                            console.log('🔄 تم تحديث Service Worker');
                            window.location.reload();
                        }
                    });
                });

            } catch (error) {
                console.error('❌ فشل تسجيل Service Worker:', error);
                toast.error('خطأ في تفعيل نظام الإشعارات', {
                    position: toast.POSITION.TOP_CENTER,
                });
            }
        };

        // تسجيل عند تحميل الصفحة
        if (document.readyState === 'complete') {
            registerSW();
        } else {
            window.addEventListener('load', registerSW);
            return () => window.removeEventListener('load', registerSW);
        }
    }, []);

    // ============================================
    // إرسال أوقات الصلاة للـ Service Worker
    // ============================================
    
    const sendTimingsToSW = async (timingsToSend) => {
        if (!swReady) {
            console.log('⚠️ Service Worker ليس جاهزاً بعد');
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            
            if (!registration.active) {
                console.log('⚠️ لا يوجد Service Worker نشط');
                return false;
            }

            // إنشاء قناة اتصال
            const messageChannel = new MessageChannel();

            // إرسال الرسالة
            registration.active.postMessage(
                {
                    type: 'SET_PRAYER_TIMINGS',
                    timings: timingsToSend
                },
                [messageChannel.port2]
            );

            console.log('📤 تم إرسال الأوقات:', timingsToSend);

            // انتظار التأكيد
            return new Promise((resolve) => {
                messageChannel.port1.onmessage = (event) => {
                    console.log('📨 رد من Service Worker:', event.data);
                    if (event.data.success) {
                        toast.success('✅ تم تفعيل نظام الإشعارات!', {
                            position: toast.POSITION.TOP_CENTER,
                            autoClose: 2000,
                        });
                    }
                    resolve(event.data.success);
                };

                // timeout بعد 5 ثواني
                setTimeout(() => {
                    console.log('⏱️ انتهت مهلة الانتظار');
                    resolve(false);
                }, 5000);
            });

        } catch (error) {
            console.error('❌ فشل إرسال الأوقات:', error);
            return false;
        }
    };

    // ============================================
    // إرسال الأوقات عند التحديث
    // ============================================
    
    useEffect(() => {
        if (
            swReady && 
            notificationPermission && 
            timings.Fajr !== "00:00"
        ) {
            // تأخير بسيط للتأكد من جاهزية كل شيء
            const timer = setTimeout(() => {
                sendTimingsToSW(timings);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [swReady, notificationPermission, timings]);

    // ============================================
    // الاستماع للرسائل في المقدمة
    // ============================================
    
    useEffect(() => {
        if (notificationPermission) {
            listenForMessages((payload) => {
                console.log('📬 رسالة واردة في المقدمة:', payload);
                toast.info(payload.notification?.title || 'رسالة جديدة', {
                    position: toast.POSITION.TOP_CENTER,
                });
            });
        }
    }, [notificationPermission, listenForMessages]);

    // ============================================
    // زر تفعيل الإشعارات
    // ============================================
    
    const enableNotifications = async () => {
        if (!swReady) {
            toast.warn('⚠️ Service Worker لم يتم تحميله بعد...', {
                position: toast.POSITION.TOP_CENTER,
            });
            return;
        }

        const token = await requestPermission();
        if (token) {
            console.log('✅ FCM Token:', token);
            toast.success('🔥 تم تفعيل Firebase بنجاح!', {
                position: toast.POSITION.TOP_CENTER,
            });
            
            // إرسال الأوقات فوراً
            if (timings.Fajr !== "00:00") {
                await sendTimingsToSW(timings);
            }
        } else {
            toast.error('❌ فشل الحصول على الأذونات', {
                position: toast.POSITION.TOP_CENTER,
            });
        }
    };

    // ============================================
    // زر الاختبار الفوري
    // ============================================
    
    const scheduleTestNotification = async () => {
        if (!notificationPermission) {
            toast.warn('⚠️ قم بتفعيل الإشعارات أولاً!', {
                position: toast.POSITION.TOP_CENTER,
            });
            return;
        }

        if (!swReady) {
            toast.warn('⚠️ Service Worker ليس جاهزاً...', {
                position: toast.POSITION.TOP_CENTER,
            });
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            if (!registration.active) {
                toast.error('❌ Service Worker غير نشط!', {
                    position: toast.POSITION.TOP_CENTER,
                });
                return;
            }

            // حساب الوقت بعد دقيقة واحدة
            const now = new Date();
            now.setMinutes(now.getMinutes() + 1);
            const testTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            // إرسال أوقات اختبار
            const messageChannel = new MessageChannel();

            registration.active.postMessage(
                {
                    type: 'SET_PRAYER_TIMINGS',
                    timings: {
                        Fajr: testTimeStr,
                        Dhuhr: "12:00",
                        Asr: "15:00",
                        Sunset: "18:00",
                        Isha: "19:30"
                    }
                },
                [messageChannel.port2]
            );

            messageChannel.port1.onmessage = (event) => {
                if (event.data.success) {
                    setTestScheduled(true);
                    setTestTime(testTimeStr);

                    toast.success(
                        `⏰ تم جدولة إشعار اختبار!\n\nسيظهر إشعار "الفجر" على: ${testTimeStr}\n\n✅ انتظر دقيقة واحدة...`,
                        {
                            position: toast.POSITION.TOP_CENTER,
                            autoClose: 8000,
                        }
                    );

                    console.log(`🧪 اختبار مجدول على: ${testTimeStr}`);
                }
            };

        } catch (error) {
            console.error("❌ خطأ في الاختبار:", error);
            toast.error("❌ حدث خطأ! جرب إعادة تحميل الصفحة", {
                position: toast.POSITION.TOP_CENTER,
            });
        }
    };

    // ============================================
    // إلغاء الاختبار
    // ============================================
    
    const cancelTest = async () => {
        setTestScheduled(false);
        setTestTime("");
        
        await sendTimingsToSW(timings);

        toast.info("✅ تم إلغاء الاختبار وإعادة الأوقات الحقيقية", {
            position: toast.POSITION.TOP_CENTER,
        });
    };

    // ============================================
    // باقي الكود (عداد الوقت، جلب الأوقات، إلخ)
    // ============================================

    const setupPrayerCountdownTimer = () => {
        const momentNow = moment();
        let prayerIndex = 0;
        if (
            momentNow.isAfter(moment(timings["Fajr"], "HH:mm")) &&
            momentNow.isBefore(moment(timings["Dhuhr"], "HH:mm"))
        ) {
            prayerIndex = 1;
        } else if (
            momentNow.isAfter(moment(timings["Dhuhr"], "HH:mm")) &&
            momentNow.isBefore(moment(timings["Asr"], "HH:mm"))
        ) {
            prayerIndex = 2;
        } else if (
            momentNow.isAfter(moment(timings["Asr"], "HH:mm")) &&
            momentNow.isBefore(moment(timings["Sunset"], "HH:mm"))
        ) {
            prayerIndex = 3;
        } else if (
            momentNow.isAfter(moment(timings["Sunset"], "HH:mm")) &&
            momentNow.isBefore(moment(timings["Isha"], "HH:mm"))
        ) {
            prayerIndex = 4;
        }
        setNextPrayerIndex(prayerIndex);
        const nextPrayerTime = timings[prayersArray[prayerIndex].key];
        let remainingTime = moment(nextPrayerTime, "HH:mm").diff(momentNow);
        if (prayerIndex === 0) {
            remainingTime =
                moment("23:59:59", "HH:mm:ss").diff(momentNow) +
                moment(nextPrayerTime, "HH:mm").diff(moment("00:00:00", "HH:mm:ss"));
        }
        const durationRemainingTime = moment.duration(remainingTime);
        setRemainingPrayerTime({
            h: durationRemainingTime.hours().toString().padStart(2, "0"),
            m: durationRemainingTime.minutes().toString().padStart(2, "0"),
            s: durationRemainingTime.seconds().toString().padStart(2, "0"),
        });
    };

    const setupRamadanCountdownTimer = () => {
        const momentNow = moment();
        let ramadanIndex = 0;
        if (
            momentNow.isAfter(moment(timings["Lastthird"], "HH:mm")) &&
            momentNow.isBefore(moment(timings["Imsak"], "HH:mm"))
        ) {
            ramadanIndex = 1;
        } else if (
            momentNow.isAfter(moment(timings["Imsak"], "HH:mm")) &&
            momentNow.isBefore(moment(timings["Sunset"], "HH:mm"))
        ) {
            ramadanIndex = 2;
        }
        setNextRamadanIndex(ramadanIndex);
        const nextRamadanTime = timings[ramadanTimingsArray[ramadanIndex].key];
        let remainingTime = moment(nextRamadanTime, "HH:mm").diff(momentNow);
        if (ramadanIndex === 0) {
            remainingTime =
                moment("23:59:59", "HH:mm:ss").diff(momentNow) +
                moment(nextRamadanTime, "HH:mm").diff(moment("00:00:00", "HH:mm:ss"));
        }
        const durationRemainingTime = moment.duration(remainingTime);
        setRemainingRamadanTime({
            h: durationRemainingTime.hours().toString().padStart(2, "0"),
            m: durationRemainingTime.minutes().toString().padStart(2, "0"),
            s: durationRemainingTime.seconds().toString().padStart(2, "0"),
        });
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setupPrayerCountdownTimer();
            if (ramadan) setupRamadanCountdownTimer();
        }, 1000);
        return () => clearInterval(interval);
    }, [timings]);

    // جلب أوقات الصلاة
    useEffect(() => {
        setLoadingScreen(true);
        let date = new Date();

        async function getPlayer(latitude, longitude) {
            try {
                const response = await fetch(
                    `https://api.aladhan.com/v1/calendar/${date.getFullYear()}?latitude=${latitude}&longitude=${longitude}`
                );
                const pray = await response.json();
                let time = pray.data[date.getMonth() + 1][date.getDate() - 1];
                setTimings({
                    Fajr: time.timings.Fajr.slice(0, 5),
                    Dhuhr: time.timings.Dhuhr.slice(0, 5),
                    Asr: time.timings.Asr.slice(0, 5),
                    Sunset: time.timings.Maghrib.slice(0, 5),
                    Isha: time.timings.Isha.slice(0, 5),
                    Lastthird: time.timings.Lastthird.slice(0, 5),
                    Imsak: time.timings.Imsak.slice(0, 5),
                });
                setBtnError(null);
            } catch (error) {
                toast.error("تحقق من اتصال الانترنت", {
                    position: toast.POSITION.TOP_RIGHT,
                });
                console.log(error);
            }
            setLoadingScreen(false);
        }

        function onSuccess(PositionCallback) {
            const { latitude, longitude } = PositionCallback.coords;
            localStorage.setItem("latitude", latitude);
            localStorage.setItem("longitude", longitude);
            getPlayer(latitude, longitude);
        }

        async function onErrors(PositionErrorCallback) {
            toast.warn("فشل تحديد الموقع", {
                position: toast.POSITION.TOP_RIGHT,
            });
            if (PositionErrorCallback.code === 1) {
                try {
                    const response = await fetch(
                        "https://api.aladhan.com/v1/timingsByCity?city=Casablanca&country=morocco"
                    );
                    const data = await response.json();
                    let timings = data.data.timings;
                    setTimings({
                        Fajr: timings.Fajr,
                        Dhuhr: timings.Dhuhr,
                        Asr: timings.Asr,
                        Sunset: timings.Maghrib,
                        Isha: timings.Isha,
                        Lastthird: timings.Lastthird,
                        Imsak: timings.Imsak,
                    });
                } catch (error) {
                    toast.error("تحقق من اتصال الانترنت", {
                        position: toast.POSITION.TOP_RIGHT,
                    });
                    console.log(error);
                }
                setBtnError(
                    <div className="container px-5 m-auto text-center">
                        <button
                            onClick={() => setRefreshGps(!refreshGps)}
                            className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-6 rounded-lg mt-4 transition-colors"
                        >
                            🔄 تحديث الموقع
                        </button>
                    </div>
                );
                setLoadingScreen(false);
            }
        }

        function getPlayerLocalStorage() {
            const latitude = localStorage.getItem("latitude");
            const longitude = localStorage.getItem("longitude");
            getPlayer(latitude, longitude);
        }

        if (
            localStorage.getItem("latitude") !== null &&
            localStorage.getItem("longitude") !== null
        ) {
            getPlayerLocalStorage();
        } else {
            navigator.geolocation
                ? navigator.geolocation.getCurrentPosition(onSuccess, onErrors)
                : console.log("Not Found Location");
        }
    }, [refreshGps]);

    return (
        <>
            <Landing title="أوقات الصلاة" />
            <ToastContainer rtl={true} />
            <section className="pt-15 mt-4 salah pb-5 relative">
                <Image
                    width={100}
                    height={100}
                    src="/img.png"
                    className="absolute w-32 top-16 left-0 -z-40"
                    alt="img"
                />
                {loadingScreen || timings.Fajr === "00:00" ? (
                    <Loader />
                ) : (
                    <>
                        {/* شريط الإشعارات */}
                        <div className="container px-5 m-auto mb-5">
                            <div className={`p-4 rounded-xl shadow-lg transition-all ${
                                testScheduled 
                                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse" 
                                    : notificationPermission && swReady
                                    ? "bg-gradient-to-r from-green-500 to-orange-500 text-white"
                                    : "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                            }`}>
                                {testScheduled ? (
                                    <div className="text-center">
                                        <div className="text-2xl font-bold mb-2">
                                            ⏰ اختبار جاري...
                                        </div>
                                        <div className="text-lg mb-3">
                                            سيظهر إشعار "صلاة الفجر" على الساعة: <span className="font-mono font-bold">{testTime}</span>
                                        </div>
                                        <div className="text-sm opacity-90 mb-3">
                                            ⏳ انتظر دقيقة واحدة... (حتى لو أغلقت المتصفح!)
                                        </div>
                                        <button
                                            onClick={cancelTest}
                                            className="bg-white/30 hover:bg-white/50 px-6 py-2 rounded-lg font-bold transition-all"
                                        >
                                            ❌ إلغاء الاختبار
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-3 flex-wrap">
                                        <span className="text-2xl">
                                            {swReady ? "✅" : "⏳"}
                                        </span>
                                        <div className="flex-1 min-w-[200px] text-center">
                                            <div className="font-bold text-lg">
                                                {!swReady 
                                                    ? "⏳ جاري تحميل النظام..."
                                                    : notificationPermission 
                                                    ? "🔥 Firebase مفعل ونشط" 
                                                    : "قم بتفعيل الإشعارات"}
                                            </div>
                                            <div className="text-sm opacity-90">
                                                {!swReady
                                                    ? "انتظر قليلاً..."
                                                    : notificationPermission 
                                                    ? "ستتلقى إشعاراً عند كل صلاة - نظام قوي وموثوق"
                                                    : "إشعارات قوية من Firebase Cloud Messaging"}
                                            </div>
                                            {fcmToken && (
                                                <div className="text-xs opacity-75 mt-1 font-mono truncate">
                                                    Token: {fcmToken.substring(0, 20)}...
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {swReady && !notificationPermission && (
                                                <button
                                                    onClick={enableNotifications}
                                                    className="bg-white/30 hover:bg-white/50 px-6 py-3 rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg"
                                                >
                                                    🔔 تفعيل الإشعارات
                                                </button>
                                            )}
                                            {swReady && notificationPermission && (
                                                <button
                                                    onClick={scheduleTestNotification}
                                                    className="bg-white/30 hover:bg-white/50 px-6 py-3 rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg"
                                                >
                                                    🧪 اختبار الآن<br/>
                                                    <span className="text-sm">(إشعار بعد دقيقة)</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="prayer-times-section">
                            <div className="container px-5 m-auto mb-10 text-white md:grid lg:grid-cols-5 md:grid-cols-3 gap-5 justify-center items-center">
                                {prayersArray.map((prayer, index) => (
                                    <div
                                        key={prayer.key}
                                        className={`p-5 w-full ${prayer.css} time rounded-md mb-5 md:mb-0 bg-gradient-to-r from-orange-600 to-orange-500 flex flex-col justify-center text-xl transition-all duration-300 ${
                                            nextPrayerIndex === index
                                                ? "md:scale-110 sm:scale-105 shadow-2xl ring-4 ring-white/50"
                                                : "text-gray-300 py-8 opacity-80"
                                        }`}
                                    >
                                        <span className="block mb-1 flex items-center justify-center gap-2">
                                            <span>🕌</span>
                                            <span>أذان {prayer.displayName}</span>
                                        </span>
                                        <span className="block font-sans text-2xl">
                                            {moment(timings[prayer.key], ["HH:mm"]).format(
                                                "hh:mm A"
                                            )}
                                        </span>
                                        {nextPrayerIndex === index && (
                                            <>
                                                <span className="block mt-3 text-sm opacity-90">
                                                    ⏰ الصلاة التالية
                                                </span>
                                                <span className="block font-sans text-3xl font-bold animate-pulse">
                                                    {remainingPrayerTime.h}:
                                                    {remainingPrayerTime.m}:
                                                    {remainingPrayerTime.s}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {ramadan && (
                            <div className="ramadan-times-section mt-10">
                                <h2 className="text-2xl text-center mb-5 font-bold flex items-center justify-center gap-2">
                                    <span>🌙</span>
                                    <span>أوقات رمضان المبارك</span>
                                    <span>✨</span>
                                </h2>
                                <div className="container px-5 m-auto flex-wrap text-white flex gap-5 justify-center items-center">
                                    {ramadanTimingsArray.map((ramadanTime, index) => (
                                        <div
                                            key={ramadanTime.key}
                                            className={`p-5 min-w-fit max-md:w-full pe-32 ${ramadanTime.css} time rounded-md mb-5 md:mb-0 bg-gradient-to-r from-blue-600 to-cyan-500 flex flex-col justify-center text-xl transition-all duration-300 ${
                                                nextRamadanIndex === index
                                                    ? "md:scale-110 sm:scale-105 shadow-2xl ring-4 ring-white/50"
                                                    : "text-gray-300 py-8 opacity-80"
                                            }`}
                                        >
                                            <span className="block mb-1">
                                                {ramadanTime.displayName === "سحور" && "🍽️"}
                                                {ramadanTime.displayName === "إمساك" && "⏸️"}
                                                {ramadanTime.displayName === "إفطار" && "🌅"}{" "}
                                                {ramadanTime.displayName}
                                            </span>
                                            <span className="block font-sans text-2xl">
                                                {moment(timings[ramadanTime.key], [
                                                    "HH:mm",
                                                ]).format("hh:mm A")}
                                            </span>
                                            {nextRamadanIndex === index && (
                                                <>
                                                    <span className="block mt-3 text-sm opacity-90">
                                                        ⏰ الوقت التالي
                                                    </span>
                                                    <span className="block font-sans text-3xl font-bold animate-pulse">
                                                        {remainingRamadanTime.h}:
                                                        {remainingRamadanTime.m}:
                                                        {remainingRamadanTime.s}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {btnError}
                    </>
                )}
            </section>
        </>
    );
}