"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import sur from "@/data/sur.json";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ── عدد الآيات في كل صفحة ──
const AYAHS_PER_PAGE = 15;

export default function TafsirAyahs({ id }) {
    const [dataTafsir]   = useState(sur.data.surahs.references);
    const [selectedAyah, setSelectedAyah] = useState(null);
    const [currentPage,  setCurrentPage]  = useState(1);

    const { data: surahData,    error: surahError    } = useSWR(`https://api.alquran.cloud/v1/surah/${id}`);
    const { data: tafsirData,   error: tafsirError   } = useSWR(`https://quranenc.com/api/v1/translation/sura/arabic_moyassar/${id}`);
    const { data: albitaqatData, error: albitaqatError } = useSWR(
        `https://raw.githubusercontent.com/Alsarmad/albitaqat_quran/main/albitaqat.json`
    );

    // إعادة تعيين الصفحة عند تغيير السورة
    useEffect(() => { setCurrentPage(1); }, [id]);

    // إغلاق المودال بـ ESC
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") setSelectedAyah(null); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // ── بيانات الصفحة الحالية ──
    const allAyahs   = tafsirData?.result ?? [];
    const totalPages = Math.ceil(allAyahs.length / AYAHS_PER_PAGE);
    const pageAyahs  = useMemo(() => {
        const start = (currentPage - 1) * AYAHS_PER_PAGE;
        return allAyahs.slice(start, start + AYAHS_PER_PAGE);
    }, [allAyahs, currentPage]);

    // ── أخطاء ──
    if (surahError || tafsirError || albitaqatError)
        return (
            <div className="text-center py-16">
                <p className="text-red-600 dark:text-red-400 font-medium text-lg">
                    حدث خطأ أثناء تحميل البيانات.
                </p>
            </div>
        );

    // ── تحميل ──
    if (!surahData || !tafsirData || !albitaqatData)
        return (
            <div className="text-center pt-40 pb-40 bg-gradient-to-br from-white to-orange-50 dark:from-gray-900 dark:to-gray-800">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600 mx-auto" />
                <p className="mt-4 text-gray-600 dark:text-gray-300">جارٍ تحميل بيانات السورة...</p>
            </div>
        );

    const albitaqat = albitaqatData[id - 1] || {};

    const goToPage = (page) => {
        setCurrentPage(page);
        // تمرير للأعلى عند تغيير الصفحة
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <section className="relative pt-28 py-16 px-4 bg-gradient-to-br from-white to-orange-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
            {/* زخارف الخلفية */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full filter blur-3xl opacity-20 dark:bg-orange-900 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200 rounded-full filter blur-3xl opacity-20 dark:bg-teal-900 pointer-events-none" />

            <div className="container mx-auto max-w-7xl relative">
                <div className="flex gap-6 w-full">

                    {/* ── فهرس السور ── */}
                    <aside className="w-64 flex-shrink-0 h-fit sticky top-28 self-start hidden lg:block">
                        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-4">
                            <h3 className="text-lg font-bold text-orange-700 dark:text-orange-500 mb-4">فهرس السور</h3>
                            <div className="max-h-96 overflow-y-scroll">
                                <ul className="space-y-1">
                                    {dataTafsir.map((surah, key) => (
                                        <li key={key}>
                                            <Link
                                                href={`/qaran/reading/${surah.number}`}
                                                className={`block p-2 rounded-lg text-sm transition-all
                                                    ${id == surah.number
                                                        ? "bg-orange-600 text-white font-semibold"
                                                        : "text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-800 hover:text-orange-600 dark:hover:text-orange-400"
                                                    }`}
                                            >
                                                {surah.number}. {surah.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </aside>

                    {/* ── المحتوى الرئيسي ── */}
                    <div className="flex-1 min-w-0">

                        {/* معلومات السورة */}
                        <div className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-bold text-orange-700 dark:text-orange-500 mb-2">
                                معلومات عن السورة
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
                            {[
                                { label: "آيَاتُها",           value: albitaqat.ayaatiha           },
                                { label: "مَعنَى اسْمِها",     value: albitaqat.maeni_asamuha      },
                                { label: "سَبَبُ تَسْمِيَتِها", value: albitaqat.sabab_tasmiatiha  },
                                { label: "أَسْمَاؤُهـا",       value: albitaqat.asmawuha           },
                                { label: "مَقْصِدُها العَامُّ", value: albitaqat.maqsiduha_aleamu  },
                                { label: "سَبَبُ نُزُولِهَا",  value: albitaqat.sabab_nuzuliha     },
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                    className="p-6 rounded-2xl shadow-md bg-white dark:bg-gray-900 border border-orange-100 dark:border-gray-700 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-orange-500 rounded-r-2xl" />
                                    <h3 className="text-orange-600 dark:text-orange-500 font-semibold mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-orange-500 rounded-full inline-block" />
                                        {item.label}
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                                        {item.value || "غير متوفر"}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {/* ── عنوان التفسير ── */}
                        <div className="text-center mb-6">
                            <h2 className="text-3xl md:text-4xl font-bold text-orange-700 dark:text-orange-500">
                                تفسير {surahData.data.name}
                            </h2>
                            <p className="text-amber-700 dark:text-amber-300 mt-3 text-base">
                                اضغط على أي آية لعرض تفسيرها
                            </p>
                        </div>

                        {/* ── شريط الصفحات العلوي ── */}
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                الصفحة {currentPage} من {totalPages} &nbsp;|&nbsp; {allAyahs.length} آية
                            </span>
                            <PaginationBar
                                current={currentPage}
                                total={totalPages}
                                onChange={goToPage}
                                compact
                            />
                        </div>

                        {/* ── صفحة المصحف ── */}
                        <motion.div
                            key={currentPage}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            dir="rtl"
                            className="relative bg-gradient-to-br from-[#fdf8f0] to-[#fff8ec] dark:from-gray-800 dark:to-gray-900
                                       rounded-3xl shadow-2xl border border-orange-100 dark:border-gray-700
                                       p-8 md:p-12 overflow-hidden"
                        >
                            {/* زخرفة ورقة المصحف */}
                            <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[url('/patterns/islamic.svg')] bg-repeat" />
                            <div className="absolute top-4 right-4 bottom-4 left-4 border border-orange-200/40 dark:border-orange-700/20 rounded-2xl pointer-events-none" />

                            {/* رقم الصفحة كـ watermark */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-orange-200 dark:text-orange-900 text-7xl font-bold select-none pointer-events-none opacity-30">
                                {currentPage}
                            </div>

                            {/* الآيات */}
                            <p className="relative z-10 font-quran text-gray-900 dark:text-gray-100
                                          text-2xl md:text-3xl leading-[4.5rem] md:leading-[5.5rem]
                                          text-justify whitespace-normal break-words tracking-wide">
                                {pageAyahs.map((aya, index) => (
                                    <motion.span
                                        key={aya.aya}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.02 }}
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() => setSelectedAyah(aya)}
                                        className="cursor-pointer select-none transition-colors
                                                   hover:text-orange-600 dark:hover:text-orange-400
                                                   rounded px-0.5"
                                    >
                                        {aya.arabic_text}
                                        <span className="inline-flex items-center justify-center font-cairo
                                                         mx-2 text-sm font-bold
                                                         text-orange-700 dark:text-orange-400
                                                         border-2 border-orange-500 dark:border-orange-600
                                                         rounded-full min-w-[2.2rem] min-h-[2.2rem] px-1.5 py-0.5
                                                         bg-orange-50 dark:bg-orange-900/30
                                                         shadow-sm">
                                            {aya.aya}
                                        </span>
                                        {" "}
                                    </motion.span>
                                ))}
                            </p>
                        </motion.div>

                        {/* ── شريط الصفحات السفلي ── */}
                        <div className="mt-8 flex justify-center">
                            <PaginationBar
                                current={currentPage}
                                total={totalPages}
                                onChange={goToPage}
                            />
                        </div>

                    </div>
                </div>
            </div>

            {/* ── مودال التفسير ── */}
            <AnimatePresence>
                {selectedAyah && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/75 backdrop-blur-md z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAyah(null)}
                        />
                        <motion.div
                            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 md:p-8 overflow-auto"
                            initial={{ opacity: 0, y: 80 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 80 }}
                            transition={{ duration: 0.28 }}
                        >
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto
                                           bg-gradient-to-br from-white to-orange-50
                                           dark:from-gray-900 dark:to-gray-800
                                           rounded-3xl shadow-2xl border border-orange-200 dark:border-gray-700 p-8"
                            >
                                {/* زخارف المودال */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full blur-3xl opacity-25 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-200 rounded-full blur-3xl opacity-25 pointer-events-none" />

                                {/* زر الإغلاق */}
                                <button
                                    onClick={() => setSelectedAyah(null)}
                                    className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center
                                               rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
                                               text-gray-500 hover:text-orange-600 dark:hover:text-orange-400
                                               border border-gray-200 dark:border-gray-600 transition-all z-10"
                                    aria-label="إغلاق"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                <div className="relative z-10" dir="rtl">
                                    {/* الآية */}
                                    <div className="font-quran text-2xl md:text-3xl text-gray-900 dark:text-white
                                                    leading-[4rem] text-right mb-6
                                                    p-5 bg-orange-100/60 dark:bg-orange-900/25
                                                    rounded-2xl border border-orange-200 dark:border-orange-800/50">
                                        {selectedAyah.arabic_text}
                                        <span className="inline-flex items-center justify-center font-cairo mx-2
                                                         text-sm font-bold text-orange-700 dark:text-orange-400
                                                         border-2 border-orange-500 rounded-full
                                                         min-w-[2.2rem] min-h-[2.2rem] px-1.5 py-0.5
                                                         bg-white dark:bg-gray-900 shadow-sm">
                                            {selectedAyah.aya}
                                        </span>
                                    </div>

                                    {/* التفسير */}
                                    <div className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed
                                                    bg-white/60 dark:bg-gray-800/50 p-6 rounded-2xl
                                                    border border-gray-200 dark:border-gray-700">
                                        <p className="text-orange-600 dark:text-orange-400 font-semibold text-sm mb-3">
                                            📖 التفسير الميسّر
                                        </p>
                                        {selectedAyah.translation}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </section>
    );
}

// ─── مكوّن أزرار الصفحات ───
function PaginationBar({ current, total, onChange, compact = false }) {
    if (total <= 1) return null;

    // بناء قائمة الأرقام الظاهرة
    const pages = useMemo(() => {
        const range = [];
        const delta = compact ? 1 : 2;
        const left  = Math.max(2, current - delta);
        const right = Math.min(total - 1, current + delta);

        range.push(1);
        if (left > 2) range.push("…");
        for (let i = left; i <= right; i++) range.push(i);
        if (right < total - 1) range.push("…");
        if (total > 1) range.push(total);

        return range;
    }, [current, total, compact]);

    const btnBase = "flex items-center justify-center rounded-xl font-medium transition-all text-sm select-none";
    const size    = compact ? "w-8 h-8 text-xs" : "w-10 h-10";

    return (
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* السابق */}
            <button
                onClick={() => onChange(current - 1)}
                disabled={current === 1}
                className={`${btnBase} ${size} px-2
                    ${current === 1
                        ? "opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 hover:border-orange-300"
                    }`}
            >
                ‹
            </button>

            {pages.map((page, i) =>
                page === "…" ? (
                    <span key={`dot-${i}`} className="text-gray-400 px-1 text-sm">…</span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onChange(page)}
                        className={`${btnBase} ${size}
                            ${page === current
                                ? "bg-orange-600 text-white shadow-md shadow-orange-200 dark:shadow-orange-900"
                                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 hover:border-orange-300"
                            }`}
                    >
                        {page}
                    </button>
                )
            )}

            {/* التالي */}
            <button
                onClick={() => onChange(current + 1)}
                disabled={current === total}
                className={`${btnBase} ${size} px-2
                    ${current === total
                        ? "opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 hover:border-orange-300"
                    }`}
            >
                ›
            </button>
        </div>
    );
}