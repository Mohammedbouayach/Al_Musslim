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
    const [scheduledNotifications, setScheduledNotifications] = useState([]);

    // تسجيل Service Worker وطلب إذن الإشعارات
    useEffect(() => {
        const initNotifications = async () => {
            if ("serviceWorker" in navigator && "Notification" in window) {
                try {
                    // تسجيل Service Worker
                    const registration = await navigator.serviceWorker.register("/sw.js");
                    console.log("✅ Service Worker registered");

                    // طلب إذن الإشعارات
                    const permission = await Notification.requestPermission();
                    if (permission === "granted") {
                        setNotificationPermission(true);
                        toast.success("✅ تم تفعيل الإشعارات بنجاح!", {
                            position: toast.POSITION.TOP_CENTER,
                        });
                    } else {
                        toast.warn("⚠️ يرجى السماح بالإشعارات لتلقي تنبيهات الصلاة", {
                            position: toast.POSITION.TOP_CENTER,
                        });
                    }
                } catch (error) {
                    console.error("❌ خطأ في تسجيل Service Worker:", error);
                }
            }
        };

        initNotifications();
    }, []);

    // دالة لجدولة إشعار واحد
    const scheduleNotification = async (prayerName, prayerTime) => {
        if (!notificationPermission || Notification.permission !== "granted") {
            return;
        }

        try {
            const now = moment();
            const prayerMoment = moment(prayerTime, "HH:mm");

            // إذا مضى وقت الصلاة اليوم، جدولها للغد
            if (prayerMoment.isBefore(now)) {
                prayerMoment.add(1, "day");
            }

            const msUntilPrayer = prayerMoment.diff(now);
            const minutesUntil = Math.floor(msUntilPrayer / 60000);

            console.log(`📅 جدولة إشعار ${prayerName} بعد ${minutesUntil} دقيقة`);

            // جدولة الإشعار
            const timeoutId = setTimeout(async () => {
                const registration = await navigator.serviceWorker.ready;

                await registration.showNotification(`🕌 حان وقت صلاة ${prayerName}`, {
                    body: `الوقت: ${moment(prayerTime, "HH:mm").format("hh:mm A")}\n\nالصلاة خير من النوم 🤲`,
                    icon: "/icon-192x192.png",
                    badge: "/icon-192x192.png",
                    tag: `prayer-${prayerName}-${Date.now()}`,
                    requireInteraction: true,
                    vibrate: [200, 100, 200, 100, 200, 100, 200],
                    timestamp: prayerMoment.valueOf(),
                    data: {
                        prayer: prayerName,
                        time: prayerTime,
                        url: "/salah",
                    },
                    actions: [
                        {
                            action: "view",
                            title: "👁️ عرض الأوقات",
                        },
                    ],
                });

                console.log(`✅ تم إرسال إشعار ${prayerName}`);
            }, msUntilPrayer);

            return timeoutId;
        } catch (error) {
            console.error(`❌ خطأ في جدولة إشعار ${prayerName}:`, error);
        }
    };

    // جدولة جميع إشعارات الصلاة
    useEffect(() => {
        if (
            notificationPermission &&
            timings.Fajr !== "00:00" &&
            timings.Dhuhr !== "00:00"
        ) {
            console.log("📅 بدء جدولة إشعارات الصلاة...");

            const timeouts = [];

            // جدولة الصلوات الخمس
            prayersArray.forEach((prayer) => {
                const timeoutId = scheduleNotification(
                    prayer.displayName,
                    timings[prayer.key]
                );
                if (timeoutId) timeouts.push(timeoutId);
            });

            // جدولة أوقات رمضان
            if (ramadan) {
                ramadanTimingsArray.forEach((ramadanTime) => {
                    const timeoutId = scheduleNotification(
                        ramadanTime.displayName,
                        timings[ramadanTime.key]
                    );
                    if (timeoutId) timeouts.push(timeoutId);
                });
            }

            setScheduledNotifications(timeouts);
            toast.success("✅ تم جدولة إشعارات الصلاة بنجاح!", {
                position: toast.POSITION.TOP_CENTER,
                autoClose: 3000,
            });

            // تنظيف عند إعادة التحميل
            return () => {
                timeouts.forEach((id) => clearTimeout(id));
            };
        }
    }, [timings, notificationPermission, ramadan]);

    // إرسال إشعار تجريبي
    const sendTestNotification = async () => {
        if (!notificationPermission) {
            toast.warn("يرجى السماح بالإشعارات أولاً!", {
                position: toast.POSITION.TOP_CENTER,
            });
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification("🕌 إشعار تجريبي", {
                body: "هذا إشعار تجريبي للتأكد من عمل الإشعارات ✅",
                icon: "/icon-192x192.png",
                badge: "/icon-192x192.png",
                vibrate: [200, 100, 200],
                tag: "test-notification",
            });
            toast.success("✅ تم إرسال الإشعار التجريبي!", {
                position: toast.POSITION.TOP_CENTER,
            });
        } catch (error) {
            console.error("❌ خطأ في إرسال الإشعار التجريبي:", error);
            toast.error("❌ فشل إرسال الإشعار التجريبي", {
                position: toast.POSITION.TOP_CENTER,
            });
        }
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
            <ToastContainer />
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
                        {/* شريط حالة الإشعارات */}
                        <div className="container px-5 m-auto mb-5">
                            <div
                                className={`text-center py-3 px-4 rounded-lg shadow-md transition-all ${
                                    notificationPermission
                                        ? "bg-gradient-to-r from-green-500 to-lime-500 text-white"
                                        : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                                }`}
                            >
                                {notificationPermission ? (
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                        <span className="text-xl">🔔</span>
                                        <div className="flex-1 min-w-[200px]">
                                            <div className="font-bold">الإشعارات مفعلة</div>
                                            <div className="text-sm opacity-90">
                                                تم جدولة {scheduledNotifications.length} إشعار
                                            </div>
                                        </div>
                                        <button
                                            onClick={sendTestNotification}
                                            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
                                        >
                                            📢 إشعار تجريبي
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-xl">⚠️</span>
                                        <div>
                                            <div className="font-bold">الإشعارات غير مفعلة</div>
                                            <div className="text-sm opacity-90">
                                                يرجى السماح بالإشعارات من إعدادات المتصفح
                                            </div>
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