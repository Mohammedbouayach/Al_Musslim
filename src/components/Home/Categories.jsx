import Link from "next/link";
import Image from "next/image";
import { categoriesLinks } from "@/data/links";
import { useRamadan } from "@/context/ramadanContext";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faStar,
    faBook,
    faMosque,
    faQuran,
    faClock,
    faHands,
    faQuoteRight,
    faVideo,
    faMicrophone,
    faBookOpen,
    faNewspaper,
    faComments,
    faQuestionCircle,
    faSearch,
    faChild,
    faHandHoldingUsd,
    faCalendarAlt,
    faList,
    faPrayingHands
} from "@fortawesome/free-solid-svg-icons";

export default function Categories() {
    const { ramadan } = useRamadan();
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

    // الحصول على الأيقونة المناسبة لكل قسم
    // 🧩 دالة إرجاع الأيقونة المناسبة لكل قسم
    const getIcon = (name) => {
        const iconMap = {
            "إمساكية شهر رمضان": faCalendarAlt,
            "يومي في رمضان": faList,
            "أسئلة دينية": faQuestionCircle,
            "أداة الباحث في الحديث": faSearch,
            "أسماء الله الحسنى": faStar,
            "قسم القرآن الكريم": faQuran,
            "قسم تفسير القرآن": faBookOpen,
            "قسم الحديث": faBook,
            "أوقات الصلاة والمناسبات الإسلامية": faClock,
            "قسم الأدعية والأذكار": faHands,
            "قسم التسبيح": faPrayingHands,
            "قسم الاقتباسات": faQuoteRight,
            "قسم الكتب": faBook,
            "قسم المقالات": faNewspaper,
            "قسم الخطب": faComments,
            "قسم الفتاوى": faComments,
            "قسم المحاضرات الصوتية": faMicrophone,
            "قسم المحاضرات المرئية": faVideo,
            "ما لا يسع أطفال المسلمين جهله": faChild,
            "زكاة المال": faHandHoldingUsd,
        };

        // ترجع الأيقونة المرتبطة بالاسم أو أيقونة افتراضية إن لم توجد
        return iconMap[name] || faBook;
    };

    // 🎨 دالة إرجاع لون الخلفية المناسب لكل قسم
    const getBgColor = (name) => {
        const colorMap = {
            "إمساكية شهر رمضان": "from-amber-500 to-orange-600",
            "يومي في رمضان": "from-amber-500 to-orange-600",
            "أسئلة دينية": "from-blue-500 to-indigo-600",
            "أداة الباحث في الحديث": "from-purple-500 to-indigo-600",
            "أسماء الله الحسنى": "from-orange-500 to-teal-600",
            "قسم القرآن الكريم": "from-orange-500 to-teal-600",
            "قسم تفسير القرآن": "from-orange-500 to-teal-600",
            "قسم الحديث": "from-orange-500 to-teal-600",
            "أوقات الصلاة والمناسبات الإسلامية": "from-cyan-500 to-blue-600",
            "قسم الأدعية والأذكار": "from-cyan-500 to-blue-600",
            "قسم التسبيح": "from-cyan-500 to-blue-600",
            "قسم الاقتباسات": "from-violet-500 to-purple-600",
            "قسم الكتب": "from-rose-500 to-pink-600",
            "قسم المقالات": "from-rose-500 to-pink-600",
            "قسم الخطب": "from-rose-500 to-pink-600",
            "قسم الفتاوى": "from-rose-500 to-pink-600",
            "قسم المحاضرات الصوتية": "from-orange-500 to-amber-600",
            "قسم المحاضرات المرئية": "from-orange-500 to-amber-600",
            "ما لا يسع أطفال المسلمين جهله": "from-orange-500 to-orange-600",
            "زكاة المال": "from-orange-500 to-orange-600",
        };

        // ترجع لون الخلفية المطابق أو لون افتراضي إن لم يُعرّف القسم
        return colorMap[name] || "from-gray-500 to-gray-700";
    };

    // عرض بيانات الأقسام مع تأثير Staggered
    const showData = categoriesLinks.map((item, key) => {
        // إذا كان القسم خاصاً برمضان وليس شهر رمضان، لا عرضه
        if (item.ramadan && !ramadan) return null;
        if(item.ramadan === false || !item.ramadan){
        return (
            <motion.div
                key={key}
                ref={sectionRef}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
                transition={{ 
                    duration: 0.7, 
                    delay: key * 0.12,
                    ease: "easeOut"
                }}
                whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
                <Link
                    href={item.path}
                    dir="rtl"
                    className="group relative block h-full"
                >
                    <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-200 dark:border-gray-700 flex flex-col">
                        {/* تأثير إضاءة متدرج */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-100/40 via-transparent to-transparent dark:from-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                        {/* الصورة والشارة في زوايا مختلفة */}
                        <div className="relative w-full h-24 mb-5 pt-5 px-5">
                            {/* الصورة في الزاوية اليمين */}
                            <div className="absolute top-5 right-5">
                                <div className="relative w-12 h-12 overflow-hidden transform group-hover:scale-105 transition-transform duration-700">
                                    <Image
                                        src={item.img}
                                        alt={item.name}
                                        width={48}
                                        height={48}
                                        className="object-cover w-full h-full rounded-lg"
                                        quality={85}
                                        loading="lazy"
                                    />
                                </div>
                            </div>

                            {/* شارة جديد في الزاوية اليسار */}
                            {item.new && (
                                <motion.div 
                                    className="absolute top-5 left-5"
                                    initial={{ scale: 0 }}
                                    animate={isInView ? { scale: 1 } : { scale: 0 }}
                                    transition={{ delay: key * 0.12 + 0.3 }}
                                >
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white shadow-md">
                                        <FontAwesomeIcon icon={faStar} className="text-yellow-200" />
                                        جديد
                                    </span>
                                </motion.div>
                            )}
                        </div>

                        {/* شارة رمضان */}
                        {item.ramadan && (
                            <div className="absolute top-4 left-4 z-10">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-md animate-pulse">
                                    رمضان
                                </span>
                            </div>
                        )}

                        <div className="relative z-10 flex flex-col h-full px-5 pb-5 flex-grow">
                            {/* العنوان */}
                            <motion.h3 
                                className="text-lg font-bold text-center text-gray-800 dark:text-white mb-3 line-clamp-2 leading-relaxed"
                                initial={{ opacity: 0 }}
                                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                                transition={{ delay: key * 0.12 + 0.2 }}
                            >
                                {item.name}
                            </motion.h3>

                            {/* الوصف */}
                            {item.description && (
                                <motion.p 
                                    className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 line-clamp-2"
                                    initial={{ opacity: 0 }}
                                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                                    transition={{ delay: key * 0.12 + 0.3 }}
                                >
                                    {item.description}
                                </motion.p>
                            )}
                        </div>
                    </div>
                </Link>
            </motion.div>
        )
    }
    });

    return (
        <section className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800" id="categories" ref={sectionRef}>
            {/* زخارف خلفية إسلامية */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-64 h-64 border-4 border-orange-200 dark:border-orange-900 rounded-full opacity-30 dark:opacity-20"></div>
                <div className="absolute bottom-20 right-10 w-48 h-48 border-4 border-orange-200 dark:border-orange-900 rounded-full opacity-30 dark:opacity-20"></div>
                <div className="absolute top-1/2 left-1/4 w-32 h-32 border-4 border-orange-200 dark:border-orange-900 transform rotate-45 opacity-30 dark:opacity-20"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* عنوان القسم */}
                <motion.div 
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="inline-block px-4 py-1 bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium mb-4">
                        اكتشف محتوانا
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                        أقسام الموقع
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        استكشف مجموعتنا المتنوعة من المحتوى الإسلامي عالي الجودة، المصمم لتعزيز معرفتك وتقربك من الله عز وجل
                    </p>

                    {/* خط زخرفي تحت العنوان */}
                    <div className="flex justify-center items-center mt-6">
                        <div className="h-px bg-gray-300 dark:bg-gray-700 w-16"></div>
                        <div className="mx-3 w-2 h-2 rounded-full bg-orange-500"></div>
                        <div className="h-px bg-gray-300 dark:bg-gray-700 w-16"></div>
                    </div>
                </motion.div>

                {/* شبكة الأقسام */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {showData}
                </div>

                {/* قسم خاص لرمضان إذا كان الشهر الفضيل */}
                {ramadan && (
                    <>
                        <motion.div 
                            className="mt-16 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-8 border border-amber-200 dark:border-amber-800"
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 mb-4">
                                    <FontAwesomeIcon icon={faCalendarAlt} size="lg" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                                    محتوى خاص بشهر رمضان
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
                                    استمتع بمحتوى مخصص لشهر رمضان المبارك، بما في ذلك الإمساكية والجدول اليومي والأنشطة الرمضانية
                                </p>
                            </div>
                        </motion.div>

                        {/* عرض الأقسام الخاصة برمضان */}
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {categoriesLinks.map((item, key) => {
                                if (item.ramadan) {
                                    return (
                                        <motion.div
                                            key={key}
                                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
                                            transition={{ 
                                                duration: 0.7, 
                                                delay: (key + categoriesLinks.filter(c => !c.ramadan).length) * 0.12,
                                                ease: "easeOut"
                                            }}
                                            whileHover={{ y: -5 }}
                                        >
                                            <Link
                                                href={item.path}
                                                dir="rtl"
                                                className="group relative block h-full"
                                            >
                                                <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-200 dark:border-gray-700 flex flex-col">
                                                    {/* تأثير إضاءة متدرج */}
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-100/40 via-transparent to-transparent dark:from-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                                    {/* الصورة والشارة في زوايا مختلفة */}
                                                    <div className="relative w-full h-24 mb-5 pt-5 px-5">
                                                        {/* الصورة في الزاوية اليمين */}
                                                        <div className="absolute top-5 right-5">
                                                            <div className="relative w-12 h-12 overflow-hidden transform group-hover:scale-105 transition-transform duration-700">
                                                                <Image
                                                                    src={item.img}
                                                                    alt={item.name}
                                                                    width={48}
                                                                    height={48}
                                                                    className="object-cover w-full h-full rounded-lg"
                                                                    quality={85}
                                                                    loading="lazy"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* شارة رمضان */}
                                                    {item.ramadan && (
                                                        <div className="absolute top-4 left-4 z-10">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-md animate-pulse">
                                                                رمضان
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="relative z-10 flex flex-col h-full px-5 pb-5 flex-grow">
                                                        {/* العنوان */}
                                                        <h3 className="text-lg font-bold text-center text-gray-800 dark:text-white mb-3 line-clamp-2 leading-relaxed">
                                                            {item.name}
                                                        </h3>

                                                        {/* الوصف */}
                                                        {item.description && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 line-clamp-2">
                                                                {item.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
