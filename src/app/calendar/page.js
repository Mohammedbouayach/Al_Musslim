"use client";
import Landing from "@/components/Layout/Landing";
import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment-hijri';
import 'moment/locale/ar';
import { useRamadan } from "@/context/ramadanContext";

const MOROCCAN_CITIES = [
    { name: "الدار البيضاء",   lat: "33.5731",  lng: "-7.5898"  },
    { name: "الرباط",          lat: "34.0209",  lng: "-6.8416"  },
    { name: "فاس",             lat: "34.0181",  lng: "-5.0078"  },
    { name: "مراكش",           lat: "31.6295",  lng: "-7.9811"  },
    { name: "أكادير",          lat: "30.4278",  lng: "-9.5981"  },
    { name: "طنجة",            lat: "35.7595",  lng: "-5.8340"  },
    { name: "مكناس",           lat: "33.8935",  lng: "-5.5473"  },
    { name: "وجدة",            lat: "34.6814",  lng: "-1.9086"  },
    { name: "القنيطرة",        lat: "34.2610",  lng: "-6.5802"  },
    { name: "تطوان",           lat: "35.5785",  lng: "-5.3684"  },
    { name: "سلا",             lat: "34.0378",  lng: "-6.7960"  },
    { name: "الجديدة",         lat: "33.2316",  lng: "-8.5007"  },
    { name: "بني ملال",        lat: "32.3373",  lng: "-6.3498"  },
    { name: "نادور",           lat: "35.1740",  lng: "-2.9287"  },
    { name: "الحسيمة",         lat: "35.2517",  lng: "-3.9372"  },
    { name: "خريبكة",          lat: "32.8811",  lng: "-6.9063"  },
    { name: "القصر الكبير",    lat: "35.0000",  lng: "-5.9000"  },
    { name: "آسفي",            lat: "32.2994",  lng: "-9.2372"  },
    { name: "تازة",            lat: "34.2100",  lng: "-4.0100"  },
    { name: "سطات",            lat: "33.0000",  lng: "-7.6167"  },
    { name: "الفقيه بن صالح",  lat: "32.5000",  lng: "-6.6833"  },
    { name: "تيزنيت",          lat: "29.6974",  lng: "-9.7316"  },
    { name: "الرشيدية",        lat: "31.9310",  lng: "-4.4280"  },
    { name: "وارزازات",        lat: "30.9189",  lng: "-6.8934"  },
    { name: "العيون",          lat: "27.1536",  lng: "-13.2033" },
    { name: "الداخلة",         lat: "23.6848",  lng: "-15.9572" },
    { name: "كلميم",           lat: "28.9864",  lng: "-10.0572" },
    { name: "إفران",           lat: "33.5228",  lng: "-5.1072"  },
    { name: "خنيفرة",          lat: "32.9392",  lng: "-5.6686"  },
    { name: "أزرو",            lat: "33.4340",  lng: "-5.2220"  },
    { name: "الصويرة",         lat: "31.5085",  lng: "-9.7595"  },
    { name: "برشيد",           lat: "33.2667",  lng: "-7.5833"  },
    { name: "المحمدية",        lat: "33.6861",  lng: "-7.3830"  },
    { name: "الناظور",         lat: "35.1740",  lng: "-2.9287"  },
    { name: "العرائش",         lat: "35.1932",  lng: "-6.1561"  },
    { name: "طاطا",            lat: "29.7450",  lng: "-7.9740"  },
    { name: "ميدلت",           lat: "32.6813",  lng: "-4.7342"  },
    { name: "تنغير",           lat: "31.5167",  lng: "-5.5333"  },
    { name: "زاكورة",          lat: "30.3672",  lng: "-5.7311"  },
    { name: "سيدي إفني",       lat: "29.3797",  lng: "-10.1728" },
];

// ── تاريخ بداية رمضان 1447هـ ثابت: 19 فبراير 2026 ──
const RAMADAN_1447_START = moment('2026-02-19').startOf('day');

// ── اختيار أيام رمضان من بيانات الـ API بناءً على التاريخ الثابت ──
const pickRamadanDays = (allDays) => {
    // نصفّي الأيام التي تنتمي للشهر 9 هجري (رمضان)
    const ramadanDays = allDays.filter(day => day.date.hijri.month.number === 9);
    if (!ramadanDays.length) return [];

    // نجد المجموعة التي تبدأ في أو بعد 19 فبراير 2026
    const groups = [];
    let group = [ramadanDays[0]];
    for (let i = 1; i < ramadanDays.length; i++) {
        const prev = moment(ramadanDays[i - 1].date.gregorian.date, 'DD-MM-YYYY');
        const curr = moment(ramadanDays[i].date.gregorian.date, 'DD-MM-YYYY');
        if (curr.diff(prev, 'days') <= 2) {
            group.push(ramadanDays[i]);
        } else {
            groups.push(group);
            group = [ramadanDays[i]];
        }
    }
    groups.push(group);

    // نختار المجموعة التي تحتوي على أو تبدأ في 19 فبراير 2026
    for (const g of groups) {
        const gStart = moment(g[0].date.gregorian.date, 'DD-MM-YYYY').startOf('day');
        const gEnd   = moment(g[g.length - 1].date.gregorian.date, 'DD-MM-YYYY').startOf('day');
        // إذا كان التاريخ الثابت ضمن نطاق هذه المجموعة
        if (!RAMADAN_1447_START.isBefore(gStart) && !RAMADAN_1447_START.isAfter(gEnd)) return g;
        // أو إذا كانت هذه المجموعة هي الأقرب بعد التاريخ الثابت
        if (gStart.isSameOrAfter(RAMADAN_1447_START)) return g;
    }

    return groups[groups.length - 1];
};

// ─────────────────── CitySelector ───────────────────
const CitySelector = ({ selectedCity, onCityChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);
    const filtered = MOROCCAN_CITIES.filter(c => c.name.includes(search));

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-all text-white px-4 py-2 rounded-xl border border-white/30 backdrop-blur-sm text-sm font-medium"
            >
                <span>📍</span>
                <span>{selectedCity?.name || 'اختر المدينة'}</span>
                <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 z-50 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <input
                            type="text"
                            placeholder="ابحث عن مدينة..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 outline-none focus:border-orange-400"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="text-center text-gray-400 py-4 text-sm">لا توجد نتائج</p>
                        ) : (
                            filtered.map((city) => (
                                <button
                                    key={city.name}
                                    onClick={() => { onCityChange(city); setIsOpen(false); setSearch(''); }}
                                    className={`w-full text-right px-4 py-2.5 text-sm transition-colors hover:bg-orange-50 dark:hover:bg-gray-700
                                        ${selectedCity?.name === city.name
                                            ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-semibold'
                                            : 'text-gray-700 dark:text-gray-300'}`}
                                >
                                    {city.name}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────── RamadanStatusCard ───────────────────
const RamadanStatusCard = ({ status, currentDay, daysRemaining, totalDays }) => {
    if (status === 'before') {
        return (
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm text-center min-w-[160px]">
                <div className="text-4xl font-bold text-white mb-1">{daysRemaining}</div>
                <div className="text-orange-200 text-sm">يوم متبقي على رمضان</div>
                <div className="mt-2 text-xs text-orange-100">
                    {moment().locale('ar').format('dddd، D MMMM YYYY')}
                </div>
            </div>
        );
    }
    if (status === 'during') {
        return (
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm text-center min-w-[160px]">
                <div className="text-5xl font-bold text-white mb-1">{currentDay}</div>
                <div className="text-xl text-orange-200">اليوم من رمضان</div>
                <div className="mt-1 text-xs text-orange-100">من أصل {totalDays} يوم</div>
                <div className="mt-2 text-xs text-orange-100">
                    {moment().locale('ar').format('dddd، D MMMM YYYY')}
                </div>
            </div>
        );
    }
    return (
        <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm text-center min-w-[160px]">
            <div className="text-3xl mb-1">🌙</div>
            <div className="text-orange-200 text-sm">انتهى شهر رمضان</div>
            <div className="text-xs text-orange-100 mt-1">كل عام وأنتم بخير</div>
        </div>
    );
};

// ─────────────────── RamadanSchedule ───────────────────
const RamadanSchedule = () => {
    const [prayerTimes, setPrayerTimes] = useState([]);
    const [ramadanDate, setRamadanDate] = useState({
        start: null, end: null, hijriYear: '', totalDays: 30,
        status: 'before', daysRemaining: 0
    });
    const [loading, setLoading] = useState(true);
    const [currentDay, setCurrentDay] = useState(null);
    const [selectedCity, setSelectedCity] = useState(MOROCCAN_CITIES[0]);

    // استعادة المدينة المحفوظة
    useEffect(() => {
        const saved = localStorage.getItem("selectedCity");
        if (saved) {
            try { setSelectedCity(JSON.parse(saved)); } catch (_) {}
        }
    }, []);

    useEffect(() => {
        const fetchRamadanData = async () => {
            try {
                setLoading(true);

                // رمضان 1447هـ يبدأ في 19 فبراير 2026 ← نجلب بيانات 2026
                const apiYear = 2026;
                const apiUrl = `https://api.aladhan.com/v1/calendar/${apiYear}?latitude=${selectedCity.lat}&longitude=${selectedCity.lng}&method=2`;

                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error('فشل جلب البيانات');
                const json = await response.json();

                const allDays = Object.values(json.data).flat();

                // ── اختيار أيام رمضان بناءً على التاريخ الثابت ──
                const ramadanDays = pickRamadanDays(allDays);
                if (!ramadanDays.length) throw new Error('لا توجد بيانات لرمضان');

                // نعيد ترتيب الأيام بحسب asc ونضمن البداية من 19 فبراير
                const startDate = RAMADAN_1447_START.clone();
                const endDate   = moment(ramadanDays[ramadanDays.length - 1].date.gregorian.date, 'DD-MM-YYYY').startOf('day');
                const today     = moment().startOf('day');

                // ── تحديد الحالة ──
                let status, dayNumber, daysRemaining;

                if (today.isBefore(startDate)) {
                    status = 'before';
                    dayNumber = null;
                    daysRemaining = startDate.diff(today, 'days');
                } else if (today.isAfter(endDate)) {
                    status = 'after';
                    dayNumber = null;
                    daysRemaining = 0;
                } else {
                    status = 'during';
                    // اليوم الأول = 19 فبراير = يوم 1
                    dayNumber = today.diff(startDate, 'days') + 1;
                    daysRemaining = 0;
                }

                setRamadanDate({
                    start: startDate,
                    end: endDate,
                    hijriYear: ramadanDays[0].date.hijri.year,
                    totalDays: ramadanDays.length,
                    status,
                    daysRemaining,
                });
                setCurrentDay(dayNumber);

                // ── بناء جدول مواقيت الصلاة ──
                // نرتب الأيام بحيث اليوم الأول يقابل 19 فبراير
                const sortedDays = [...ramadanDays].sort((a, b) => {
                    const da = moment(a.date.gregorian.date, 'DD-MM-YYYY');
                    const db = moment(b.date.gregorian.date, 'DD-MM-YYYY');
                    return da.diff(db);
                });

                setPrayerTimes(sortedDays.map((day, idx) => {
                    const gregDate = moment(day.date.gregorian.date, 'DD-MM-YYYY');
                    const ramadanDayNum = gregDate.diff(startDate, 'days') + 1;
                    return {
                        dayNumber: ramadanDayNum,
                        gregorianDate: gregDate,
                        hijriDate: day.date.hijri.date,
                        fajr: day.timings.Fajr,
                        maghrib: day.timings.Maghrib,
                        isLast10: ramadanDayNum >= 21,
                        isToday: status === 'during' && ramadanDayNum === dayNumber,
                    };
                }));

            } catch (error) {
                console.error('حدث خطأ:', error);

                // ── بيانات احتياطية ──
                const defaultStart = RAMADAN_1447_START.clone();
                const defaultEnd   = defaultStart.clone().add(29, 'days');
                const today = moment().startOf('day');

                let status = 'before';
                let dayNumber = null;
                if (today.isBefore(defaultStart)) {
                    status = 'before';
                } else if (today.isAfter(defaultEnd)) {
                    status = 'after';
                } else {
                    status = 'during';
                    dayNumber = today.diff(defaultStart, 'days') + 1;
                }

                setPrayerTimes(Array.from({ length: 30 }, (_, i) => ({
                    dayNumber: i + 1,
                    gregorianDate: defaultStart.clone().add(i, 'days'),
                    hijriDate: `${i + 1} رمضان 1447`,
                    fajr: '04:30 (WET)',
                    maghrib: '18:30 (WET)',
                    isLast10: i + 1 >= 21,
                    isToday: status === 'during' && (i + 1) === dayNumber,
                })));

                setRamadanDate({
                    start: defaultStart,
                    end: defaultEnd,
                    hijriYear: '1447',
                    totalDays: 30,
                    status,
                    daysRemaining: status === 'before' ? defaultStart.diff(today, 'days') : 0,
                });
                setCurrentDay(dayNumber);
            } finally {
                setLoading(false);
            }
        };

        fetchRamadanData();
    }, [selectedCity]);

    const formatTime = (time) => moment(time.split(' ')[0], 'HH:mm').format('HH:mm');

    const handleCityChange = (city) => {
        setSelectedCity(city);
        localStorage.setItem("selectedCity", JSON.stringify(city));
    };

    if (loading) {
        return (
            <div className="text-center py-16">
                <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-200">جارٍ تحميل مواقيت {selectedCity.name}...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto mb-5 px-2">
            {/* ── Header Card ── */}
            <div className="mt-5">
                <div className="mx-auto p-10 bg-gradient-to-br from-orange-900 to-orange-600 rounded-2xl shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="flex-1">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                تقويم رمضان {ramadanDate.hijriYear}هـ
                            </h1>
                            <div className="mb-4">
                                <CitySelector selectedCity={selectedCity} onCityChange={handleCityChange} />
                            </div>
                            <div className="text-orange-100 text-lg space-y-1">
                                <p>📅 بداية رمضان: {ramadanDate.start?.locale('ar').format('dddd، D MMMM YYYY')}</p>
                                <p>📅 نهاية رمضان: {ramadanDate.end?.locale('ar').format('dddd، D MMMM YYYY')}</p>
                                <p>🌙 عدد الأيام: {ramadanDate.totalDays} يوماً</p>
                            </div>
                        </div>
                        <RamadanStatusCard
                            status={ramadanDate.status}
                            currentDay={currentDay}
                            daysRemaining={ramadanDate.daysRemaining}
                            totalDays={ramadanDate.totalDays}
                        />
                    </div>
                </div>
            </div>

            {/* ── Prayer Times Table ── */}
            <div className="mt-8 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full whitespace-nowrap">
                    <thead className="bg-orange-600 text-white">
                        <tr>
                            {["اليوم", "التاريخ الميلادي", "التاريخ الهجري", "السحور (الفجر)", "الإفطار (المغرب)"].map((h, i) => (
                                <th key={i} className="p-3 text-center">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {prayerTimes.map((day, i) => (
                            <tr
                                key={i}
                                className={`
                                    transition-colors
                                    ${day.isLast10
                                        ? 'bg-yellow-400 hover:bg-yellow-300 text-gray-800'
                                        : 'hover:bg-orange-50 dark:hover:bg-gray-800 dark:text-gray-200'}
                                    ${day.isToday ? 'ring-2 ring-inset ring-orange-600 font-bold' : ''}
                                `}
                            >
                                <td className="p-3 text-center font-medium">
                                    {day.dayNumber} رمضان
                                    {day.isToday && (
                                        <span className="mr-2 text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                                            اليوم
                                        </span>
                                    )}
                                </td>
                                <td className="p-3 text-center">{day.gregorianDate.locale('ar').format('dddd، D MMMM YYYY')}</td>
                                <td className="p-3 text-center">{day.hijriDate}</td>
                                <td className="p-3 text-center font-semibold">{formatTime(day.fajr)}</td>
                                <td className="p-3 text-center font-semibold">{formatTime(day.maghrib)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Dua Cards ── */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {[
                    { title: "السحور",        dua: "اللهم إني نويت صيام هذا اليوم فتقبله مني واغفر لي ما قدمت وما أخرت" },
                    { title: "الإفطار",       dua: "اللهم لك صمت وعلى رزقك أفطرت، فتقبل مني إنك أنت السميع العليم" },
                    { title: "ليلة القدر",    dua: "اللهم إنك عفو كريم تحب العفو فاعف عني وارحمني" },
                    { title: "العشر الأواخر", dua: "اللهم أعتق رقابنا من النار وأدخلنا الجنة بغير حساب" },
                    { title: "رمضان كريم",    dua: "اللهم اجعل هذا الشهر شهر بركة وهداية لنا وللمسلمين جميعا" },
                ].map(({ title, dua }, index) => (
                    <div
                        key={index}
                        className="p-6 shadow-md border border-gray-200 rounded-md bg-white dark:bg-gray-900 dark:border dark:border-gray-600"
                    >
                        <h4 className="text-xl text-orange-600 text-center mb-4">دعاء {title}</h4>
                        <p className="text-gray-600 dark:text-gray-200 text-center text-sm leading-relaxed">{dua}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─────────────────── Page Export ───────────────────
export default function Page() {
    const { ramadan } = useRamadan();
    if (!ramadan) return null;
    return (
        <>
            <Landing title="التقويم الرمضاني" />
            <RamadanSchedule />
        </>
    );
}