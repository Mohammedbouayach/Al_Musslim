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

moment.locale("ar");

export default function Salah() {
    const { ramadan } = useRamadan();

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
    const [notificationPermission, setNotificationPermission] = useState(false);
    const [swReady, setSwReady] = useState(false);
    const [swStatus, setSwStatus] = useState("جاري التحميل...");

    // تسجيل Service Worker - النسخة النهائية المحسّنة
    useEffect(() => {
        const initSW = async () => {
            console.log('🚀 بدء تسجيل Service Worker...');
            
            if (!("serviceWorker" in navigator) || !("Notification" in window)) {
                setSwStatus("❌ متصفحك لا يدعم الإشعارات");
                toast.error("❌ متصفحك لا يدعم الإشعارات", {
                    position: toast.POSITION.TOP_CENTER,
                });
                return;
            }

            try {
                setSwStatus("🧹 مسح Service Workers القديمة...");
                console.log('🧹 مسح SW القديمة...');
                
                // حذف SW القديمة
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let reg of registrations) {
                    await reg.unregister();
                }
                console.log('✅ تم مسح SW القديمة');
                
                // انتظار قليل
                await new Promise(resolve => setTimeout(resolve, 500));

                setSwStatus("📝 تسجيل Service Worker...");
                console.log('📝 تسجيل SW جديد...');
                
                // تسجيل جديد
                const registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                    updateViaCache: "none"
                });
                console.log('✅ تم التسجيل:', registration);

                setSwStatus("⏳ انتظار التفعيل...");
                console.log('⏳ انتظار التفعيل...');
                
                // انتظار حتى يصبح ready
                await navigator.serviceWorker.ready;
                console.log('✅ SW جاهز (ready)!');

                setSwStatus("🔗 انتظار Controller...");
                console.log('🔗 البحث عن controller...');
                
                // الانتظار حتى يتوفر controller
                let controller = navigator.serviceWorker.controller;
                let attempts = 0;
                const maxAttempts = 20;
                
                while (!controller && attempts < maxAttempts) {
                    console.log(`🔍 محاولة ${attempts + 1}/${maxAttempts} للحصول على controller...`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    controller = navigator.serviceWorker.controller;
                    attempts++;
                }

                if (controller) {
                    console.log('✅✅✅ Controller متصل بنجاح!');
                    setSwReady(true);
                    setSwStatus("✅ جاهز للعمل!");
                    
                    toast.success("✅ نظام الإشعارات جاهز!", {
                        position: toast.POSITION.TOP_CENTER,
                        autoClose: 2000,
                    });
                } else {
                    // إذا لم ينجح، نحاول إعادة تحميل الصفحة مرة واحدة
                    const reloadAttempted = sessionStorage.getItem('sw_reload_attempted');
                    if (!reloadAttempted) {
                        console.log('⚠️ Controller غير متصل، سنعيد تحميل الصفحة...');
                        sessionStorage.setItem('sw_reload_attempted', 'true');
                        setSwStatus("🔄 إعادة تحميل...");
                        
                        toast.info("🔄 إعادة تحميل للتفعيل الكامل...", {
                            position: toast.POSITION.TOP_CENTER,
                            autoClose: 1500,
                        });
                        
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                        return;
                    } else {
                        // إذا فشل حتى بعد إعادة التحميل
                        console.error('❌ فشل الحصول على controller بعد إعادة التحميل');
                        setSwStatus("⚠️ افتح التطبيق في تبويب جديد");
                        toast.error("⚠️ افتح التطبيق في تبويب جديد (Ctrl+Click)", {
                            position: toast.POSITION.TOP_CENTER,
                            autoClose: 5000,
                        });
                    }
                }

                // طلب إذن الإشعارات
                if (Notification.permission === "default") {
                    console.log('📢 طلب إذن الإشعارات...');
                    const permission = await Notification.requestPermission();
                    setNotificationPermission(permission === "granted");
                    console.log('🔔 إذن الإشعارات:', permission);
                    
                    if (permission === "granted") {
                        toast.success("✅ تم تفعيل الإشعارات!", {
                            position: toast.POSITION.TOP_CENTER,
                            autoClose: 2000,
                        });
                    }
                } else if (Notification.permission === "granted") {
                    setNotificationPermission(true);
                    console.log('✅ الإشعارات مفعّلة مسبقاً');
                }

            } catch (error) {
                console.error("❌ خطأ في SW:", error);
                setSwStatus("❌ فشل التحميل");
                toast.error("❌ خطأ: " + error.message, {
                    position: toast.POSITION.TOP_CENTER,
                    autoClose: 5000,
                });
            }
        };

        initSW();
    }, []);

    // إرسال أوقات الصلاة للـ SW
    useEffect(() => {
        if (swReady && notificationPermission && timings.Fajr !== "00:00") {
            const controller = navigator.serviceWorker.controller;
            if (controller) {
                controller.postMessage({
                    type: "SET_PRAYER_TIMINGS",
                    timings: timings,
                });
                console.log("📤 تم إرسال أوقات الصلاة:", timings);
                
                toast.success("📅 تم تحديث أوقات الصلاة", {
                    position: toast.POSITION.TOP_CENTER,
                    autoClose: 2000,
                });
            }
        }
    }, [swReady, notificationPermission, timings]);

    // اختبار فوري
    const testNotificationNow = async () => {
        console.log('🧪 اختبار فوري...');
        
        if (!swReady) {
            toast.error("❌ Service Worker غير جاهز", {
                position: toast.POSITION.TOP_CENTER,
            });
            return;
        }

        if (Notification.permission !== "granted") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                toast.error("❌ يرجى السماح بالإشعارات!", {
                    position: toast.POSITION.TOP_CENTER,
                });
                return;
            }
            setNotificationPermission(true);
        }

        const controller = navigator.serviceWorker.controller;
        if (!controller) {
            toast.error("❌ Controller غير متصل", {
                position: toast.POSITION.TOP_CENTER,
            });
            return;
        }

        controller.postMessage({
            type: "TEST_NOW"
        });
        
        toast.success("✅ تم إرسال إشعار اختبار!", {
            position: toast.POSITION.TOP_CENTER,
            autoClose: 3000,
        });
        
        console.log("✅ تم إرسال طلب اختبار");
    };

    // اختبار بعد دقيقة
    const testNotificationDelayed = async () => {
        console.log('⏰ اختبار متأخر...');
        
        if (!swReady) {
            toast.error("❌ Service Worker غير جاهز", {
                position: toast.POSITION.TOP_CENTER,
            });
            return;
        }

        if (Notification.permission !== "granted") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                toast.error("❌ يرجى السماح بالإشعارات!", {
                    position: toast.POSITION.TOP_CENTER,
                });
                return;
            }
            setNotificationPermission(true);
        }

        const controller = navigator.serviceWorker.controller;
        if (!controller) {
            toast.error("❌ Controller غير متصل", {
                position: toast.POSITION.TOP_CENTER,
            });
            return;
        }

        const now = new Date();
        now.setMinutes(now.getMinutes() + 1);
        const testTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        controller.postMessage({
            type: "SET_PRAYER_TIMINGS",
            timings: {
                Fajr: testTime,
                Dhuhr: "12:00",
                Asr: "15:00",
                Sunset: "18:00",
                Isha: "19:30"
            }
        });

        toast.success(`⏰ إشعار مجدول على: ${testTime}`, {
            position: toast.POSITION.TOP_CENTER,
            autoClose: 5000,
        });
        
        console.log(`⏰ جدولة على: ${testTime}`);
    };

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
                            className="bg-lime-500 hover:bg-lime-600 text-white py-2 px-6 rounded-lg mt-4 transition-colors"
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
                {loadingScreen ||
                (timings.Fajr === "00:00" &&
                    timings.Asr === "00:00" &&
                    timings.Isha === "00:00") ? (
                    <Loader />
                ) : (
                    <>
                        {/* شريط الإشعارات */}
                        <div className="container px-5 m-auto mb-5">
                            <div className={`p-4 rounded-xl shadow-lg transition-all ${
                                notificationPermission && swReady
                                    ? "bg-gradient-to-r from-green-500 to-lime-500"
                                    : "bg-gradient-to-r from-gray-500 to-gray-600"
                            } text-white`}>
                                <div className="text-center mb-4">
                                    <div className="text-2xl font-bold mb-2">
                                        🔔 {notificationPermission && swReady ? "الإشعارات مفعلة ✅" : "الإشعارات غير مفعلة ⚠️"}
                                    </div>
                                    <div className="text-sm opacity-90 mb-2">
                                        {notificationPermission && swReady 
                                            ? "ستتلقى إشعاراً عند كل صلاة"
                                            : "فعّل الإشعارات للحصول على تنبيهات الصلاة"}
                                    </div>
                                    <div className="text-xs opacity-75 bg-white/20 rounded px-3 py-1 inline-block">
                                        {swStatus}
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 justify-center flex-wrap">
                                    <button
                                        onClick={testNotificationNow}
                                        disabled={!swReady}
                                        className={`px-6 py-3 rounded-lg font-bold transition-all ${
                                            swReady 
                                                ? "bg-white/30 hover:bg-white/50 hover:scale-105 cursor-pointer" 
                                                : "bg-white/10 cursor-not-allowed opacity-50"
                                        }`}
                                    >
                                        🔔 اختبار فوري
                                    </button>
                                    
                                    <button
                                        onClick={testNotificationDelayed}
                                        disabled={!swReady}
                                        className={`px-6 py-3 rounded-lg font-bold transition-all ${
                                            swReady 
                                                ? "bg-white/30 hover:bg-white/50 hover:scale-105 cursor-pointer" 
                                                : "bg-white/10 cursor-not-allowed opacity-50"
                                        }`}
                                    >
                                        ⏰ اختبار متأخر
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            sessionStorage.clear();
                                            window.location.reload();
                                        }}
                                        className="bg-white/30 hover:bg-white/50 px-6 py-3 rounded-lg font-bold transition-all hover:scale-105"
                                    >
                                        🔄 إعادة تحميل
                                    </button>
                                </div>
                                
                                <div className="text-xs text-center mt-3 opacity-75">
                                    💡 اضغط "اختبار فوري" للتأكد من عمل الإشعارات
                                </div>
                            </div>
                        </div>

                        <div className="prayer-times-section">
                            <div className="container px-5 m-auto mb-10 text-white md:grid lg:grid-cols-5 md:grid-cols-3 gap-5 justify-center items-center">
                                {prayersArray.map((prayer, index) => (
                                    <div
                                        key={prayer.key}
                                        className={`p-5 w-full ${prayer.css} time rounded-md mb-5 md:mb-0 bg-gradient-to-r from-orange-600 to-lime-500 flex flex-col justify-center text-xl transition-all duration-300 ${
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