"use client";

import { useState, useEffect } from "react";
import Landing from "@/components/Layout/Landing";
import SplashScreen from "@/components/Layout/SplashScreen";
import moment from 'moment-hijri';
import { useRamadan } from "@/context/ramadanContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faChevronDown, faChevronUp, faMoon, faStar } from "@fortawesome/free-solid-svg-icons";

// ── تاريخ بداية رمضان 1447هـ ثابت: 19 فبراير 2026 ──
const RAMADAN_START = new Date(2026, 1, 19);
const RAMADAN_TOTAL = 30;

const SECTIONS = [
    {
        key: "prayers",
        label: "🕌 الصلوات المفروضة",
        color: "blue",
        items: ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"],
    },
    {
        key: "nawafil",
        label: "🌙 النوافل",
        color: "indigo",
        items: (day) => [
            "2 قبل الفجر", "4 قبل الظهر", "2 بعد الظهر",
            "2 بعد المغرب", "2 بعد العشاء", "الوتر", "تراويح (20 ركعة)",
            ...(day >= 21 ? ["قيام ليلة القدر"] : []),
        ],
    },
    {
        key: "dhikr",
        label: "📿 الأذكار",
        color: "teal",
        items: [
            "أذكار الصباح", "أذكار المساء", "أذكار بعد الصلاة", "دعاء الإفطار",
            "استغفار (100x)", "تسبيح (100x)", "صلاة على النبي (100x)",
        ],
    },
    {
        key: "quran",
        label: "📖 القرآن الكريم",
        color: "emerald",
        items: (day) => [
            `جزء يومي (جزء ${day})`,
            "تدبر الآيات",
            ...(day === 30 ? ["🎉 ختم القرآن"] : []),
        ],
    },
    {
        key: "deeds",
        label: "💛 الأعمال الصالحة",
        color: "amber",
        items: (day) => [
            "إفطار صائم", "صدقة يومية", "بر الوالدين", "صلة الرحم", "دعوة إلى الخير",
            ...(day >= 21 ? ["اعتكاف", "زكاة الفطر"] : []),
        ],
    },
];

const colorMap = {
    blue:    { bg: "bg-blue-50 dark:bg-blue-950/30",     border: "border-blue-200 dark:border-blue-800",     header: "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"     },
    indigo:  { bg: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-800", header: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200" },
    teal:    { bg: "bg-teal-50 dark:bg-teal-950/30",     border: "border-teal-200 dark:border-teal-800",     header: "bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200"     },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", header: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200" },
    amber:   { bg: "bg-amber-50 dark:bg-amber-950/30",   border: "border-amber-200 dark:border-amber-800",   header: "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200"   },
};

// ─── مكوّن قسم التحقق ───
const CheckSection = ({ section, dayNumber, checks, onToggle }) => {
    const items  = typeof section.items === "function" ? section.items(dayNumber) : section.items;
    const colors = colorMap[section.color];
    const done   = items.filter(item => checks[`day${dayNumber}-${item}`]).length;

    return (
        <div className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden flex flex-col`}>
            <div className={`px-3 py-2 flex items-center justify-between ${colors.header}`}>
                <span className="font-semibold text-xs">{section.label}</span>
                <span className="text-xs font-medium opacity-70">{done}/{items.length}</span>
            </div>
            <div className="p-3 flex flex-col gap-2 flex-1">
                {items.map((item) => {
                    const key     = `day${dayNumber}-${item}`;
                    const checked = checks[key] || false;
                    return (
                        <label key={item} className="flex items-start gap-2 cursor-pointer group select-none">
                            <input
                                type="checkbox"
                                className="mt-0.5 w-4 h-4 rounded flex-shrink-0 cursor-pointer accent-orange-500"
                                checked={checked}
                                onChange={(e) => onToggle(key, e.target.checked)}
                            />
                            <span className={`text-xs leading-snug transition-colors
                                ${checked
                                    ? "line-through text-gray-400 dark:text-gray-500"
                                    : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white"
                                }`}>
                                {item}
                            </span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};

// ─── بطاقة يوم واحد (accordion) ───
const DayCard = ({ dayNumber, currentDay, checks, onToggle }) => {
    const isLocked = dayNumber > currentDay;
    const isToday  = dayNumber === currentDay;
    const isLast10 = dayNumber >= 21;
    const [open, setOpen] = useState(isToday);

    const allItems  = SECTIONS.flatMap(s => typeof s.items === "function" ? s.items(dayNumber) : s.items);
    const doneCount = allItems.filter(item => checks[`day${dayNumber}-${item}`]).length;
    const progress  = allItems.length ? Math.round((doneCount / allItems.length) * 100) : 0;

    return (
        <div className={[
            "rounded-2xl border overflow-hidden transition-all duration-200",
            isToday  ? "border-orange-400 shadow-md shadow-orange-100 dark:shadow-orange-900/30" : "border-gray-200 dark:border-gray-700",
            isLast10 ? "bg-gradient-to-br from-yellow-50/80 to-amber-50/80 dark:from-yellow-950/20 dark:to-amber-950/20" : "bg-white dark:bg-gray-900",
        ].join(" ")}>

            {/* ── رأس البطاقة ── */}
            <button
                onClick={() => !isLocked && setOpen(o => !o)}
                disabled={isLocked}
                className={[
                    "w-full text-right flex items-center gap-4 px-5 py-4 transition-colors",
                    isLocked ? "cursor-not-allowed" : "cursor-pointer hover:bg-orange-50/60 dark:hover:bg-white/5",
                ].join(" ")}
            >
                {/* دائرة رقم اليوم */}
                <div className={[
                    "flex-shrink-0 w-13 h-13 w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-bold shadow-sm",
                    isLast10 ? "bg-gradient-to-br from-yellow-500 to-orange-500" : "bg-gradient-to-br from-orange-700 to-orange-500",
                ].join(" ")} style={{ minWidth: "3.25rem", minHeight: "3.25rem" }}>
                    <span className="text-xl leading-none">{dayNumber}</span>
                    <span className="text-[9px] opacity-80 leading-none mt-0.5">رمضان</span>
                </div>

                {/* المعلومات والشريط */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-bold text-gray-800 dark:text-white text-sm">
                            اليوم {dayNumber} من رمضان
                        </span>
                        {isToday && (
                            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">اليوم</span>
                        )}
                        {isLast10 && (
                            <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs rounded-full">✨ العشر الأواخر</span>
                        )}
                        {isLocked && (
                            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full flex items-center gap-1">
                                <FontAwesomeIcon icon={faLock} className="text-[9px]" />
                                مقفل
                            </span>
                        )}
                    </div>
                    {!isLocked && (
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${progress === 100 ? "bg-green-500" : "bg-orange-500"}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className={`text-xs font-bold flex-shrink-0 ${progress === 100 ? "text-green-600" : "text-orange-500"}`}>
                                {progress}%
                            </span>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                                {doneCount}/{allItems.length}
                            </span>
                        </div>
                    )}
                </div>

                {!isLocked && (
                    <FontAwesomeIcon
                        icon={open ? faChevronUp : faChevronDown}
                        className="flex-shrink-0 text-gray-400 text-sm"
                    />
                )}
            </button>

            {/* ── محتوى قابل للطي ── */}
            {open && !isLocked && (
                <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                        {SECTIONS.map(section => (
                            <CheckSection
                                key={section.key}
                                section={section}
                                dayNumber={dayNumber}
                                checks={checks}
                                onToggle={onToggle}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── الصفحة الرئيسية ───
export default function Page() {
    const { ramadan }                   = useRamadan();
    const [checks, setChecks]           = useState({});
    const [selectedDay, setSelectedDay] = useState("all");
    const [isLoading, setIsLoading]     = useState(true);
    const [currentDay, setCurrentDay]   = useState(1);

    const calcCurrentDay = () => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const start = new Date(RAMADAN_START); start.setHours(0, 0, 0, 0);
        const diff  = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
        return Math.max(1, Math.min(diff, RAMADAN_TOTAL));
    };

    useEffect(() => {
        const saved = localStorage.getItem("ramadanChecks");
        if (saved) setChecks(JSON.parse(saved));
        setCurrentDay(calcCurrentDay());
        setIsLoading(false);
    }, []);

    useEffect(() => {
        localStorage.setItem("ramadanChecks", JSON.stringify(checks));
    }, [checks]);

    const toggleCheck = (key, value) => setChecks(prev => ({ ...prev, [key]: value }));

    if (isLoading) return <SplashScreen />;
    if (!ramadan)  return null;

    const visibleDays = selectedDay === "all"
        ? [...Array(RAMADAN_TOTAL)].map((_, i) => i + 1)
        : [Number(selectedDay)];

    return (
        <>
            <Landing title={`يومي في رمضان (${moment().iYear()} هـ - ${moment().year()} م)`} />

            <div className="container mx-auto mb-10 px-3 max-w-5xl">

                {/* ── Header ── */}
                <div className="mt-5 bg-gradient-to-br from-orange-900 to-orange-600 text-white p-6 rounded-2xl shadow-xl mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-5">
                        <div>
                            <h2 className="text-3xl font-bold mb-1 flex items-center gap-2">
                                <FontAwesomeIcon icon={faMoon} className="text-yellow-300" />
                                رمضان المبارك 1447هـ
                            </h2>
                            <p className="text-orange-100 text-sm">
                                البداية: الأربعاء 19 فبراير 2026 &nbsp;|&nbsp; النهاية: 19 مارس 2026
                            </p>
                            <p className="text-orange-200 text-sm mt-1">عدد الأيام: {RAMADAN_TOTAL} يوماً</p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm px-8 py-4 rounded-2xl text-center border border-white/20 flex-shrink-0">
                            <div className="text-5xl font-bold leading-none">{currentDay}</div>
                            <div className="text-orange-200 mt-1 text-sm">اليوم الحالي</div>
                            <div className="text-orange-300 text-xs mt-0.5">
                                {moment().locale('ar').format('dddd، D MMMM')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── فلتر ── */}
                <div className="flex flex-wrap gap-3 mb-5">
                    <select
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                        <option value="all">📅 كل الأيام</option>
                        {[...Array(RAMADAN_TOTAL)].map((_, i) => (
                            <option key={i} value={i + 1}>يوم {i + 1}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setSelectedDay(currentDay.toString())}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                    >
                        📍 اليوم الحالي
                    </button>
                    <button
                        onClick={() => setSelectedDay("all")}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition-colors shadow-sm"
                    >
                        عرض الكل
                    </button>
                </div>

                {/* ── قائمة الأيام ── */}
                <div className="flex flex-col gap-3">
                    {visibleDays.map(dayNum => (
                        <DayCard
                            key={dayNum}
                            dayNumber={dayNum}
                            currentDay={currentDay}
                            checks={checks}
                            onToggle={toggleCheck}
                        />
                    ))}
                </div>

                {/* ── ملاحظات ── */}
                <div className="mt-8 p-5 bg-orange-50 dark:bg-gray-800 border border-orange-100 dark:border-gray-700 rounded-2xl">
                    <h3 className="text-lg font-bold text-orange-800 dark:text-white mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
                        ملاحظات هامة
                    </h3>
                    <ul className="space-y-2 text-sm text-orange-700 dark:text-orange-200 list-disc pr-5 leading-relaxed">
                        <li>في العشر الأواخر (من اليوم 21): إحياء الليل - كثرة الدعاء - الاعتكاف</li>
                        <li>الاجتهاد في الدعاء في أوقات الإجابة (السحر - عند الإفطار)</li>
                        <li>الإكثار من: لا إله إلا الله - الاستغفار - الصلاة على النبي ﷺ</li>
                        <li>التوبة النصوح وترك المعاصي في كل أيام الشهر الكريم</li>
                    </ul>
                </div>
            </div>
        </>
    );
}