"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import moment from "moment";
import "moment/dist/locale/ar-dz";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "@/components/Layout/Loader";
import Landing from "../Layout/Landing";
import { useRamadan } from "@/context/ramadanContext";

moment.locale("ar");

// حالات Service Worker
const SW_STATUS = {
  LOADING: "loading",
  READY: "ready",
  ERROR: "error",
  UNSUPPORTED: "unsupported",
};

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

  const [remainingPrayerTime, setRemainingPrayerTime] = useState({ h: "00", m: "00", s: "00" });
  const [remainingRamadanTime, setRemainingRamadanTime] = useState({ h: "00", m: "00", s: "00" });
  const [nextPrayerIndex, setNextPrayerIndex] = useState(0);
  const [nextRamadanIndex, setNextRamadanIndex] = useState(0);
  const [refreshGps, setRefreshGps] = useState(true);
  const [btnError, setBtnError] = useState(null);
  const [loadingScreen, setLoadingScreen] = useState(true);

  // حالة الإشعارات
  const [swStatus, setSwStatus] = useState(SW_STATUS.LOADING);
  const [notifPermission, setNotifPermission] = useState("default");
  const [testScheduled, setTestScheduled] = useState(false);
  const [testTime, setTestTime] = useState("");

  // ============================================
  // تسجيل Service Worker
  // ============================================
  useEffect(() => {
    const initSW = async () => {
      if (!("serviceWorker" in navigator)) {
        setSwStatus(SW_STATUS.UNSUPPORTED);
        return;
      }

      try {
        // إلغاء Service Workers القديمة التي بها مشاكل
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          // إلغاء فقط إذا كانت هناك مشكلة (redundant)
          if (reg.active && reg.active.state === "redundant") {
            await reg.unregister();
            console.log("🧹 تم إلغاء SW قديم متعطل");
          }
        }

        // تسجيل prayer-sw.js الجديد (اسم مختلف عن sw.js لتجنب التعارض مع next-pwa)
        const registration = await navigator.serviceWorker.register("/prayer-sw.js", {
          updateViaCache: "none",
        });

        console.log("📝 SW مسجل");

        // انتظار حتى يصبح active
        await new Promise((resolve) => {
          if (registration.active) {
            resolve();
          } else {
            const sw = registration.installing || registration.waiting;
            if (sw) {
              sw.addEventListener("statechange", () => {
                if (sw.state === "activated") resolve();
              });
            } else {
              resolve();
            }
          }
        });

        await navigator.serviceWorker.ready;

        setSwStatus(SW_STATUS.READY);
        setNotifPermission(Notification.permission);
        console.log("✅ SW جاهز!");

      } catch (error) {
        console.error("❌ خطأ في SW:", error);
        setSwStatus(SW_STATUS.ERROR);
      }
    };

    initSW();

    // الاستماع لتغييرات الإذن
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "notifications" }).then((permissionStatus) => {
        permissionStatus.onchange = () => {
          setNotifPermission(Notification.permission);
        };
      });
    }
  }, []);

  // ============================================
  // إرسال أوقات الصلاة للـ SW
  // ============================================
  const sendTimingsToSW = useCallback((timingsData) => {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SET_PRAYER_TIMINGS",
        timings: timingsData,
      });
      console.log("📤 تم إرسال الأوقات للـ SW");
    }
  }, []);

  useEffect(() => {
    if (swStatus === SW_STATUS.READY && notifPermission === "granted" && timings.Fajr !== "00:00") {
      sendTimingsToSW(timings);
    }
  }, [swStatus, notifPermission, timings, sendTimingsToSW]);

  // ============================================
  // تفعيل الإشعارات
  // ============================================
  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("❌ متصفحك لا يدعم الإشعارات");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotifPermission(permission);

    if (permission === "granted") {
      toast.success("✅ تم تفعيل الإشعارات!", { position: toast.POSITION.TOP_CENTER });
      if (timings.Fajr !== "00:00") sendTimingsToSW(timings);
    } else if (permission === "denied") {
      toast.error(
        "❌ الإشعارات محظورة!\n\nالحل: اضغط 🔒 في شريط العنوان → Notifications → Allow",
        { position: toast.POSITION.TOP_CENTER, autoClose: 8000 }
      );
    }
  };

  // ============================================
  // اختبار الإشعار
  // ============================================
  const scheduleTest = async () => {
    if (notifPermission !== "granted") {
      await enableNotifications();
      return;
    }

    if (swStatus !== SW_STATUS.READY) {
      toast.warn("⏳ انتظر حتى يتحمل النظام...", { position: toast.POSITION.TOP_CENTER });
      return;
    }

    if (!navigator.serviceWorker.controller) {
      toast.info("🔄 جاري التحضير... أعد تحميل الصفحة", { position: toast.POSITION.TOP_CENTER });
      setTimeout(() => window.location.reload(), 2000);
      return;
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const testTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    sendTimingsToSW({ Fajr: testTimeStr, Dhuhr: "12:00", Asr: "15:00", Sunset: "18:00", Isha: "19:30" });

    setTestScheduled(true);
    setTestTime(testTimeStr);

    toast.success(`⏰ سيظهر إشعار على الساعة: ${testTimeStr}\nانتظر دقيقة واحدة...`, {
      position: toast.POSITION.TOP_CENTER,
      autoClose: 8000,
    });
  };

  // اختبار فوري
  const testNow = async () => {
    if (notifPermission !== "granted") {
      await enableNotifications();
      return;
    }
    if (!navigator.serviceWorker.controller) {
      toast.warn("⏳ Service Worker غير جاهز، حاول بعد ثانية...");
      return;
    }

    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    sendTimingsToSW({ Fajr: currentTimeStr, Dhuhr: "12:00", Asr: "15:00", Sunset: "18:00", Isha: "19:30" });

    toast.info("🔔 تم إرسال إشعار اختبار! يجب أن يظهر الآن...", {
      position: toast.POSITION.TOP_CENTER,
      autoClose: 5000,
    });
  };

  const cancelTest = () => {
    sendTimingsToSW(timings);
    setTestScheduled(false);
    setTestTime("");
    toast.info("✅ تم إلغاء الاختبار", { position: toast.POSITION.TOP_CENTER });
  };

  // ============================================
  // العداد التنازلي
  // ============================================
  const setupPrayerCountdownTimer = useCallback(() => {
    const momentNow = moment();
    let prayerIndex = 0;

    if (momentNow.isAfter(moment(timings["Fajr"], "HH:mm")) && momentNow.isBefore(moment(timings["Dhuhr"], "HH:mm"))) {
      prayerIndex = 1;
    } else if (momentNow.isAfter(moment(timings["Dhuhr"], "HH:mm")) && momentNow.isBefore(moment(timings["Asr"], "HH:mm"))) {
      prayerIndex = 2;
    } else if (momentNow.isAfter(moment(timings["Asr"], "HH:mm")) && momentNow.isBefore(moment(timings["Sunset"], "HH:mm"))) {
      prayerIndex = 3;
    } else if (momentNow.isAfter(moment(timings["Sunset"], "HH:mm")) && momentNow.isBefore(moment(timings["Isha"], "HH:mm"))) {
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

    const d = moment.duration(remainingTime);
    setRemainingPrayerTime({
      h: d.hours().toString().padStart(2, "0"),
      m: d.minutes().toString().padStart(2, "0"),
      s: d.seconds().toString().padStart(2, "0"),
    });
  }, [timings]);

  const setupRamadanCountdownTimer = useCallback(() => {
    const momentNow = moment();
    let ramadanIndex = 0;

    if (momentNow.isAfter(moment(timings["Lastthird"], "HH:mm")) && momentNow.isBefore(moment(timings["Imsak"], "HH:mm"))) {
      ramadanIndex = 1;
    } else if (momentNow.isAfter(moment(timings["Imsak"], "HH:mm")) && momentNow.isBefore(moment(timings["Sunset"], "HH:mm"))) {
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

    const d = moment.duration(remainingTime);
    setRemainingRamadanTime({
      h: d.hours().toString().padStart(2, "0"),
      m: d.minutes().toString().padStart(2, "0"),
      s: d.seconds().toString().padStart(2, "0"),
    });
  }, [timings]);

  useEffect(() => {
    const interval = setInterval(() => {
      setupPrayerCountdownTimer();
      if (ramadan) setupRamadanCountdownTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [setupPrayerCountdownTimer, setupRamadanCountdownTimer, ramadan]);

  // ============================================
  // جلب أوقات الصلاة
  // ============================================
  useEffect(() => {
    setLoadingScreen(true);
    const date = new Date();

    async function getPlayer(latitude, longitude) {
      try {
        const response = await fetch(
          `https://api.aladhan.com/v1/calendar/${date.getFullYear()}?latitude=${latitude}&longitude=${longitude}`
        );
        const pray = await response.json();
        const time = pray.data[date.getMonth() + 1][date.getDate() - 1];
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
      } catch {
        toast.error("تحقق من اتصال الانترنت", { position: toast.POSITION.TOP_RIGHT });
      }
      setLoadingScreen(false);
    }

    function onSuccess({ coords: { latitude, longitude } }) {
      localStorage.setItem("latitude", latitude);
      localStorage.setItem("longitude", longitude);
      getPlayer(latitude, longitude);
    }

    async function onErrors(err) {
      toast.warn("فشل تحديد الموقع", { position: toast.POSITION.TOP_RIGHT });
      if (err.code === 1) {
        try {
          const response = await fetch("https://api.aladhan.com/v1/timingsByCity?city=Casablanca&country=morocco");
          const data = await response.json();
          const t = data.data.timings;
          setTimings({ Fajr: t.Fajr, Dhuhr: t.Dhuhr, Asr: t.Asr, Sunset: t.Maghrib, Isha: t.Isha, Lastthird: t.Lastthird, Imsak: t.Imsak });
        } catch {
          toast.error("تحقق من اتصال الانترنت", { position: toast.POSITION.TOP_RIGHT });
        }
        setBtnError(
          <div className="container px-5 m-auto text-center">
            <button onClick={() => setRefreshGps((p) => !p)} className="bg-lime-500 hover:bg-lime-600 text-white py-2 px-6 rounded-lg mt-4 transition-colors">
              🔄 تحديث الموقع
            </button>
          </div>
        );
        setLoadingScreen(false);
      }
    }

    if (localStorage.getItem("latitude") && localStorage.getItem("longitude")) {
      getPlayer(localStorage.getItem("latitude"), localStorage.getItem("longitude"));
    } else {
      navigator.geolocation
        ? navigator.geolocation.getCurrentPosition(onSuccess, onErrors)
        : console.log("Not Found Location");
    }
  }, [refreshGps]);

  // ============================================
  // واجهة شريط الإشعارات
  // ============================================
  const renderNotificationBar = () => {
    if (testScheduled) {
      return (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-xl shadow-lg animate-pulse text-center">
          <div className="text-2xl font-bold mb-1">⏰ اختبار جاري...</div>
          <div className="text-lg mb-2">
            سيظهر إشعار "صلاة الفجر" على الساعة:{" "}
            <span className="font-mono font-bold">{testTime}</span>
          </div>
          <div className="text-sm opacity-90 mb-3">⏳ انتظر دقيقة واحدة...</div>
          <button onClick={cancelTest} className="bg-white/30 hover:bg-white/50 px-5 py-2 rounded-lg font-bold">
            ❌ إلغاء
          </button>
        </div>
      );
    }

    // SW يتحمل
    if (swStatus === SW_STATUS.LOADING) {
      return (
        <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-4 rounded-xl shadow-lg text-center">
          <div className="animate-pulse">⏳ جاري تحميل نظام الإشعارات...</div>
        </div>
      );
    }

    // SW غير مدعوم
    if (swStatus === SW_STATUS.UNSUPPORTED) {
      return (
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl shadow-lg text-center">
          <div className="font-bold">❌ متصفحك لا يدعم الإشعارات</div>
          <div className="text-sm opacity-90">جرب Chrome أو Firefox</div>
        </div>
      );
    }

    // إشعارات مفعلة
    if (notifPermission === "granted") {
      return (
        <div className="bg-gradient-to-r from-green-500 to-lime-500 text-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-2xl">🔔</span>
            <div className="flex-1 min-w-[180px] text-center">
              <div className="font-bold text-lg">الإشعارات مفعلة ✅</div>
              <div className="text-sm opacity-90">ستتلقى إشعاراً عند كل صلاة</div>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <button onClick={testNow} className="bg-white/30 hover:bg-white/50 px-4 py-2 rounded-lg font-bold transition-all hover:scale-105">
                🔔 اختبار فوري
              </button>
              <button onClick={scheduleTest} className="bg-white/30 hover:bg-white/50 px-4 py-2 rounded-lg font-bold transition-all hover:scale-105">
                🧪 اختبار بعد دقيقة
              </button>
            </div>
          </div>
        </div>
      );
    }

    // إشعارات محظورة
    if (notifPermission === "denied") {
      return (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-xl shadow-lg text-center">
          <div className="font-bold text-lg mb-1">🚫 الإشعارات محظورة</div>
          <div className="text-sm opacity-90 mb-3">
            لإلغاء الحظر: اضغط 🔒 في شريط العنوان ← Notifications ← Allow
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-white/30 hover:bg-white/50 px-5 py-2 rounded-lg font-bold"
          >
            🔄 إعادة تحميل
          </button>
        </div>
      );
    }

    // لم يطلب الإذن بعد
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="text-2xl">🔔</span>
          <div className="flex-1 min-w-[180px] text-center">
            <div className="font-bold text-lg">فعّل إشعارات الصلاة</div>
            <div className="text-sm opacity-90">احصل على إشعار عند كل وقت صلاة</div>
          </div>
          <button
            onClick={enableNotifications}
            className="bg-white/30 hover:bg-white/50 active:bg-white/60 px-6 py-3 rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg"
          >
            🔔 تفعيل الإشعارات
          </button>
        </div>
      </div>
    );
  };

  // ============================================
  // الـ JSX الرئيسي
  // ============================================
  return (
    <>
      <Landing title="أوقات الصلاة" />
      <ToastContainer rtl={true} />
      <section className="pt-15 mt-4 salah pb-5 relative">
        <Image width={100} height={100} src="/img.png" className="absolute w-32 top-16 left-0 -z-40" alt="img" />

        {loadingScreen || (timings.Fajr === "00:00" && timings.Asr === "00:00" && timings.Isha === "00:00") ? (
          <Loader />
        ) : (
          <>
            {/* شريط الإشعارات */}
            <div className="container px-5 m-auto mb-5">
              {renderNotificationBar()}
            </div>

            {/* أوقات الصلاة */}
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
                      {moment(timings[prayer.key], ["HH:mm"]).format("hh:mm A")}
                    </span>
                    {nextPrayerIndex === index && (
                      <>
                        <span className="block mt-3 text-sm opacity-90">⏰ الصلاة التالية</span>
                        <span className="block font-sans text-3xl font-bold animate-pulse">
                          {remainingPrayerTime.h}:{remainingPrayerTime.m}:{remainingPrayerTime.s}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* أوقات رمضان */}
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
                        {moment(timings[ramadanTime.key], ["HH:mm"]).format("hh:mm A")}
                      </span>
                      {nextRamadanIndex === index && (
                        <>
                          <span className="block mt-3 text-sm opacity-90">⏰ الوقت التالي</span>
                          <span className="block font-sans text-3xl font-bold animate-pulse">
                            {remainingRamadanTime.h}:{remainingRamadanTime.m}:{remainingRamadanTime.s}
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