"use client";

import Categories from "@/components/Home/Categories";
import SplashScreen from "@/components/Layout/SplashScreen";
import { motion } from "framer-motion";
import {
    faAngleDoubleDown,
    faDownload,
    faBook,
    faPray,
    faMosque,
    faQuran,
    faStar,
    faCalendarAlt,
    faList,
    faQuestionCircle,
    faSearch,
    faBookOpen,
    faClock,
    faHands,
    faPrayingHands,
    faQuoteRight,
    faNewspaper,
    faComments,
    faMicrophone,
    faVideo,
    faChild,
    faHandHoldingUsd,
    faUsers,
    faHeart,
    faChartLine,
    faMicrophoneAlt,
    faHandsPraying,
    faScroll,
    faPodcast,
    faUserPlus,
    faEye,
    faGlobe
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import quotesData from "@/data/quotesAll.json";



export default function Home() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    const [isInstalled, setIsInstalled] = useState(false);

    const [isVisible, setIsVisible] = useState(false);
    const [statsVisible, setStatsVisible] = useState(false);
    const [quotesVisible, setQuotesVisible] = useState(false);
    const quotesRef = useRef(null);

    useEffect(() => {
        setIsVisible(true);

        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
        }

        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });

        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
        });

        // مراقب التمرير لإظهار الإحصائيات والاقتباسات
        const handleScroll = () => {
            if (window.scrollY > 1000 && !statsVisible) {
                setStatsVisible(true);
            }

            // مراقبة ظهور قسم الاقتباسات
            if (quotesRef.current && !quotesVisible) {
                const rect = quotesRef.current.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.75) {
                    setQuotesVisible(true);
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [statsVisible, quotesVisible]);

    const installPWA = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choice) => {
                if (choice.outcome === "accepted") {
                    setIsInstalled(true);
                }
                setDeferredPrompt(null);
            });
        }
    };

    const features = [
        {
            icon: faQuran,
            title: "القرآن الكريم وعلومه",
            description: "يشمل جميع سور القرآن الكريم بتلاوات متعددة في وضعي الاستماع والحفظ، مع تفسير شامل لكل آية ومعلومات السور من معاني وأسباب النزول والفضل والمقاصد."
        },
        {
            icon: faMicrophoneAlt,
            title: "الحديث والأذكار",
            description: "يضم أكثر من 3500 حديث شريف بشرحٍ وتوضيحٍ مفصل، مع أكثر من 140 قسمًا للأدعية والأذكار اليومية والأوقات والأحوال المختلفة."
        },
        {
            icon: faBook,
            title: "المكتبة والمعارف الإسلامية",
            description: "أكثر من 4900 كتاب و1690 مقال و520 فتوى و280 خطبة في مختلف مجالات العقيدة والفقه والسيرة والأخلاق."
        },
        {
            icon: faVideo,
            title: "الوسائط والمحتوى التفاعلي",
            description: "يحتوي على أكثر من 1000 محاضرة فيديو و3900 محاضرة صوتية و100 اقتباس إسلامي قابل للمشاركة، لتجربة تعليمية متكاملة وتفاعلية."
        }
    ];

    // إحصائيات الموقع
    const stats = [
        
        { icon: faBook, value: "4900+", label: "كتاب إسلامي" },
        { icon: faPodcast, value: "3900+", label: "محاضرة صوتية" },
        { icon: faMicrophoneAlt, value: "3500+", label: "حديث شريف" },
        { icon: faNewspaper, value: "1690+", label: "مقال إسلامي" },
        { icon: faVideo, value: "1000+", label: "محاضرة فيديو" },
        { icon: faHandsPraying, value: "140+", label: "قسم أدعية وأذكار" },
        { icon: faQuoteRight, value: "100+", label: "اقتباس إسلامي" },
        { icon: faScroll, value: "280+", label: "خطبة إسلامية" },
        { icon: faQuestionCircle, value: "520+", label: "فتوى شرعية" },
    ];

    // محتوى مميز
    const featuredContent = [
        {
            title: "تفسير سورة الفاتحة",
            description: "شرح مفصل لأعظم سورة في القرآن الكريم",
            category: "تفسير القرآن",
            image: "/quran.jpg"
        },
        {
            title: "أدعية مستجابة",
            description: "مجموعة مختارة من الأدعية النبوية الصحيحة",
            category: "الأدعية والأذكار",
            image: "/dua.jpg"
        },
        {
            title: "فقه الصلاة",
            description: "تعلم أحكام الصلاة وشروطها وأركانها",
            category: "العقيدة والعبادات",
            image: "/prayer.jpg"
        }
    ];

    // اقتباسات إسلامية
    const islamicQuotes = [
        {
            text: "إن مع العسر يسرا",
            source: "القرآن الكريم - سورة الشرح",
            delay: 0
        },
        {
            text: "الدعاء مخ العبادة",
            source: "حديث شريف",
            delay: 150
        },
        {
            text: "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ",
            source: "القرآن الكريم - سورة النحل",
            delay: 300
        },
        {
            text: "خير الناس أنفعهم للناس",
            source: "حديث شريف",
            delay: 450
        }
    ];
    useEffect(() => {
  const askPermissionOnce = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    window.removeEventListener("click", askPermissionOnce);
  };

  window.addEventListener("click", askPermissionOnce);

  return () => window.removeEventListener("click", askPermissionOnce);
}, []);

useEffect(() => {
  if (!("Notification" in window)) return;

  if (Notification.permission !== "granted") return;

  const interval = setInterval(() => {
    const quotes = quotesData.result;
    if (!quotes || quotes.length === 0) return;

    const randomQuote =
      quotes[Math.floor(Math.random() * quotes.length)];

    new Notification("📿 اقتباس إسلامي", {
      body: `${randomQuote.text} — ${randomQuote.author}`,
      icon: "/img.png",
    });
  }, 60000);

  return () => clearInterval(interval);
}, []);






    return (
        <>
        
            <section className="relative overflow-hidden min-h-screen pt-20 flex items-center justify-center bg-gradient-to-br from-orange-50 via-teal-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">

                {/* خلفية زخرفية متحركة */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.15 }}
                    transition={{ duration: 2 }}
                    className="absolute inset-0 pointer-events-none"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                        className="absolute top-1/4 left-1/4 w-56 h-56 border-[6px] border-orange-400/40 rounded-full"
                    ></motion.div>
                    
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
                        className="absolute bottom-1/4 right-1/4 w-80 h-80 border-[6px] border-teal-400/30 rounded-full"
                    ></motion.div>
                </motion.div>

                {/* المحتوى */}
                <div className="relative z-10 mb-10 container mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 items-center gap-12 rtl">
                    {/* النص */}
                    <motion.div
                        initial={{ x: -60, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 1 }}
                        className="space-y-6"
                    >
                        <div className="inline-block px-4 py-1 bg-orange-100 dark:bg-orange-500/50 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium">
                            مرحباً بك في
                        </div>

                            <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold text-gray-800 dark:text-white leading-snug">
                                 موقع <span className="text-orange-500 dark:text-orange-400">المسلم</span> الإسلامي
                             </h1>


                        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
                            اكتشف عالمًا من المعرفة الإسلامية عبر مكتبة شاملة تضم القرآن الكريم، الأحاديث النبوية، المقالات،
                            والكتب التعليمية في مختلف مجالات الدين.
                        </p>

                        {/* المميزات */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                            {features.map((f, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ y: 30, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.2 + 0.5, duration: 2 }}
                                    className="flex items-center space-x-3 rtl:space-x-reverse"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 text-orange-400 dark:text-orange-400 shadow-sm">
                                        <FontAwesomeIcon icon={f.icon} />
                                    </div>

                                    <div>
                                        <h3 className="text-base font-semibold text-gray-800 dark:text-white">{f.title}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{f.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>


                        
                     <div className="flex flex-col sm:flex-row gap-4 mt-10">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium shadow-lg transition-all ${isInstalled
                                    ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-xl"
                                    }`}
                                onClick={installPWA}
                                disabled={isInstalled}
                            >
                                <FontAwesomeIcon icon={faDownload} />
                                {isInstalled ? "مثبت بالفعل" : "تحميل كتطبيق"}
                            </motion.button>

                            <motion.a
                                href="#categories"
                                whileHover={{ y: -3 }}
                                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-gray-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 shadow-sm"
                            >
                                استكشف المحتوى
                                <FontAwesomeIcon icon={faAngleDoubleDown} />
                            </motion.a>
                        </div>
                    </motion.div>


                    {/* الصورة */}
                    <motion.div
                        initial={{ x: 80, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="relative  dark:bg-transparent"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                        >
                            <Image
                                src="/images/muslim.jpg"
                                alt="المسلم - موقع إسلامي"
                                width={520}
                                height={400}
                                priority
                                className="object-cover w-full h-auto mb-20"
                            />
                        </motion.div>
                    </motion.div>
                </div>

                {/* السهم السفلي */}
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-10 text-orange-600 dark:text-orange-600"
                >
                <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1, delay: 1 }}
                    >
                    <a
                        href="#categories"
                        className="flex flex-col items-center text-lg font-medium hover:text-orange-400 dark:hover:text-orange-400 transition-colors"
                    >
                        <span className="mb-1">استكشف المزيد</span>
                        <FontAwesomeIcon icon={faAngleDoubleDown} />
                    </a>
                    </motion.div>
                </motion.div>
            </section>

            {/* قسم الإحصائيات */}
            <div className="py-16 bg-gradient-to-r from-orange-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4"> 
                            إحصائيات موقع المسلم الإسلامي  
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"> 
                            نحن فخورون بتقديم محتوى إسلامي عالي الجودة يصل لملايين المستخدمين حول العالم
                        </p>
                        <div className="flex justify-center items-center mt-6">
                            <div className="h-px bg-gray-300 dark:bg-gray-700 w-16"></div>
                            <div className="mx-3 w-2 h-2 rounded-full bg-orange-500"></div>
                            <div className="h-px bg-gray-300 dark:bg-gray-700 w-16"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className={`relative group overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 text-center transform transition-all duration-700 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] ${statsVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                                    }`}
                            >
                                {/* خلفية متدرجة */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-800 dark:to-orange-900/10 z-0" />

                                {/* تأثير لامع متحرك */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent dark:from-transparent dark:via-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -translate-x-full group-hover:translate-x-full animate-shine" />

                                {/* زخرفة زاوية */}
                                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 dark:bg-orange-500/5 rounded-bl-full z-0" />

                                <div className="relative z-10 p-8 flex flex-col items-right">

                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 flex items-center justify-center text-white shadow-lg mb-5 transform transition-transform duration-500 group-hover:scale-110">
                                        <FontAwesomeIcon icon={stat.icon} size="lg" />
                                    </div>

                                  <div className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-orange-700 dark:from-white dark:to-orange-300 bg-clip-text text-transparent mb-2 tracking-tight text-right">
                                         {stat.value}
                                    </div>


                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider  text-right">
                                        {stat.label}
                                    </div>
                                    
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

            {/* قسم الاقتباسات الإسلامية */}
            <div ref={quotesRef} className="py-16 bg-gradient-to-br from-orange-500 to-teal-600 dark:from-orange-800 dark:to-teal-900">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">حكم واقتباسات إسلامية</h2>
                        <p className="text-orange-100 max-w-2xl mx-auto">كلمات من نور تهدئ القلب وتنير العقل</p>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {islamicQuotes.map((quote, index) => (
                            <div
                                key={index}
                                className={`quote-card bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-white ${quotesVisible ? 'visible' : ''}`}
                                style={{ transitionDelay: `${quote.delay}ms` }}
                            >
                                <div className="flex items-start space-x-4 rtl:space-x-reverse">
                                    <div className="flex-shrink-0 text-3xl text-orange-200">
                                        <FontAwesomeIcon icon={faQuoteRight} />
                                    </div>
                                    <div>
                                        <p className="text-xl font-medium mb-3 leading-relaxed">{quote.text}</p>
                                        <p className="text-orange-100 text-sm">{quote.source}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* زخارف إسلامية في قسم الاقتباسات */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-10 left-10 text-white/10 float-animation">
                            <FontAwesomeIcon icon={faStar} size="3x" />
                        </div>
                        <div className="absolute bottom-20 right-20 text-white/10 float-animation" style={{ animationDelay: '1.5s' }}>
                            <FontAwesomeIcon icon={faStar} size="2x" />
                        </div>
                    </div>
                </div>
            </div>

            {/* قسم المحتوى المميز */}
            {/* <div className="py-16 bg-white dark:bg-gray-800">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">محتوى مميز</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">اخترنا لك أبرز المحتويات التي قد تهمك</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {featuredContent.map((content, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <div className="h-48 relative">
                                    <Image
                                        src={content.image}
                                        alt={content.title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                                        {content.category}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{content.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">{content.description}</p>
                                    <button className="text-orange-600 dark:text-orange-400 font-medium hover:text-orange-700 dark:hover:text-orange-300 transition-colors">
                                        اقرأ المزيد
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div> */}

            {/* <SplashScreen /> */}

            <Categories />
        </>
    );
}
