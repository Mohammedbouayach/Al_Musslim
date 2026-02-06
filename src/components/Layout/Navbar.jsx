"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import Headroom from "react-headroom";
import { links } from "../../data/links";
import { useRamadan } from "@/context/ramadanContext";
import { usePathname } from "next/navigation";



export default function Navbar() {
    const { ramadan } = useRamadan();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();


    // تأثير التمرير
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // إغلاق القائمة عند تغيير حجم الشاشة
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <>
            {/* شريط التنقل الرئيسي */}
            <Headroom className="fixed z-50 top-0 left-0 right-0 transition-all  duration-300">
                <nav className={`relative backdrop-blur-xl mb-10 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-gray-900/95 shadow-xl py-3' : 'bg-transparent py-1'}`}>
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="flex justify-between items-center">
                            {/* الشعار */}
                            <Link href="/" className="flex-shrink-0 flex items-center space-x-3">
                                <div className="relative">
                                    <div className="relative w-25 h-25 overflow-hidden rounded-xl p-0.5">
                                        <div className="w-full h-full rounded-lg flex items-center justify-center">
                                            <Image
                                                loading="lazy"
                                                quality={95}
                                                width="100"
                                                height="200"
                                                src="/logo.png"
                                                alt="Website logo"
                                                className="transition-transform duration-300 hover:rotate-12"
                                            />
                                        </div>
                                    </div>
                                    {/* <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></div> */}
                                </div>
                                {/* <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lime-600 to-orange-700 dark:from-lime-400 dark:to-orange-500 hidden sm:block">موقعك</span> */}
                            </Link>

                            {/* قائمة سطح المكتب */}
                            <div className="hidden lg:flex items-center space-x-4">
                          <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
                                {links.map((item, index) => {
                                    const isActive = pathname === item.path;

                                    return (
                                        <Link
                                            key={index}
                                            href={item.path}
                                            className={`relative px-4 py-2.5 text-sm font-semibold rounded-xl overflow-hidden transition-all duration-300
                                                ${isActive ? "text-orange-600 dark:text-orange-400 shadow-sm" : "text-gray-700 dark:text-white hover:text-orange-600 dark:hover:text-orange-400"}
                                                before:absolute before:inset-0 before:rounded-xl
 0                                               before:bg-gradient-to-r before:from-orange-50/2 before:to-orange-50/2
                                                before:transition-all before:duration-500
                                                ${
                                                    isActive
                                                        ? "before:opacity-100 before:scale-x-100 before:origin-left"
                                                        : "before:opacity-0 before:scale-x-0 before:origin-right hover:before:opacity-100 hover:before:scale-x-100"
                                                }
                                            `}
                                        >
                                            <span className="relative z-10">{item.name}</span>
                                        </Link>
                                    );
                                                    })}
                                </div>



                                {/* <div className="flex items-center space-x-3 mr-2">
                                    <button className="relative px-5 py-2.5 text-sm font-medium rounded-lg text-white overflow-hidden group">
                                        <span className="relative z-10">تسجيل الدخول</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-lime-500 to-orange-600 transition-transform duration-300 group-hover:scale-105"></div>
                                    </button>
                                    <button className="px-4 py-2.5 text-sm font-medium rounded-lg border border-lime-500 text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-gray-800 transition-all duration-300">
                                        إنشاء حساب
                                    </button>
                                </div> */}
                            </div>

                            {/* زر القائمة للهاتف */}
                            <button
                                onClick={toggleMenu}
                                className="lg:hidden relative w-12 h-12 flex items-center justify-center rounded-xl bg-orange-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                aria-label="Toggle navigation menu"
                                aria-expanded={isOpen}
                            >
                                <div className="w-6 h-6 relative">
                                    <span className={`absolute top-1 left-0 w-full h-0.5 bg-current transition-all duration-300 ${isOpen ? 'rotate-45 top-3' : ''}`}></span>
                                    <span className={`absolute top-3 left-0 w-full h-0.5 bg-current transition-all duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                                    <span className={`absolute top-5 left-0 w-full h-0.5 bg-current transition-all duration-300 ${isOpen ? '-rotate-45 top-3' : ''}`}></span>
                                </div>
                            </button>
                        </div>
                    </div>
                </nav>
            </Headroom>

            {/* القائمة الجانبية للهاتف */}
            <div
                className={`fixed inset-0 z-40 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            >
                <div
                    className={`fixed top-0 right-0 h-full w-80 max-w-full bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col h-full">
                        {/* رأس القائمة الجانبية */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                            <div className="flex items-center space-x-3">
                                <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-gradient-to-br from-lime-400 to-orange-600 p-0.5">
                                    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center">
                                        <Image
                                            loading="lazy"
                                            quality={95}
                                            width="30"
                                            height="30"
                                            src="/logo.png"
                                            alt="Website logo"
                                        />
                                    </div>
                                </div>
                            </div>
                         
                        </div>

                        {/* محتوى القائمة الجانبية */}
                        <div className="flex-1 overflow-y-auto p-6 mt-4">
                            <ul className="space-y-4">
                                {links.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            onClick={() => setIsOpen(false)}
                                            href={item.path}
                                            className={`flex items-center px-4 py-3 text-lg font-medium rounded-lg transition-all duration-300 group
                                                ${
                                                    pathname === item.path
                                                        ? "bg-orange-50 text-orange-600 dark:bg-gray-800 dark:text-orange-400"
                                                        : "text-gray-700 dark:text-gray-200 hover:bg-lime-50 dark:hover:bg-gray-800 hover:text-lime-600 dark:hover:text-lime-400"
                                                }
                                            `}
                                        >

                                            <span className="relative z-10">{item.name}</span>
                                            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-lime-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* تذييل القائمة الجانبية */}
                       
                    </div>
                </div>
            </div>

            {/* زينة رمضان */}
            {ramadan && (
                <div className="fixed top-16 right-2 z-40 animate-pulse md:right-4">
                    <div className="relative">
                        <Image
                            src="/zena.png"
                            width={120}
                            height={100}
                            alt="Ramadan decoration"
                            className="transition-all duration-500 hover:scale-110 drop-shadow-lg"
                        />
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                    </div>
                </div>
            )}
        </>
    );
}
