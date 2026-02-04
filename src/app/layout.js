
import "./globals.css";

import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import Buttons from "@/components/Layout/Buttons";
import localFont from "next/font/local";
import Script from "next/script";
import { SWRProvider } from "@/components/Layout/SWRProvider";
import { RamadanProvider } from "@/context/ramadanContext";

const cairo = localFont({
    src: [
        {
            path: "../font/Cairo-Light.woff2",
            weight: "300",
        },
        {
            path: "../font/Cairo-Regular.woff2",
            weight: "400",
        },
        {
            path: "../font/Cairo-Bold.woff2",
            weight: "700",
        },
        {
            path: "../font/Cairo-Black.woff2",
            weight: "900",
        },
    ],
    variable: "--cairo",
    weight: "300 400 700 900",
    display: "swap",
});


export const metadata = {
    metadataBase: new URL("https://almuslim.com"),

    title: {
        default: "المسلم | موقع إسلامي شامل",
        template: "%s | المسلم"
    },

    description:
        "موقع المسلم الإسلامي يقدم محتوى شامل من القرآن الكريم وتفسيره، الأحاديث النبوية، الأدعية والأذكار، الخطب، الفتاوى، الكتب والمقالات، والمحاضرات الصوتية والمرئية — لتجربة معرفية وروحية متكاملة.",
    manifest: "/manifest.webmanifest",

    keywords: [
        "المسلم",
        "القرآن الكريم",
        "تفسير القرآن",
        "أحاديث نبوية",
        "أذكار",
        "أدعية",
        "كتب إسلامية",
        "فتاوى",
        "خطب",
        "محاضرات إسلامية",
        "اقتباسات إسلامية",
        "مكتبة إسلامية",
        "almuslim"
    ],

    authors: [{ name: " محمد بوعيش", url: "https://almuslim.com" }],

    icons: {
        icon: "/logo.png",
        shortcut: "/logo.png",
        apple: "/apple-touch-icon.png"
    },

    openGraph: {
        type: "website",
        locale: "ar_Mar",
        url: "https://almuslim.com",
        siteName: "المسلم | almuslim",
        title: "المسلم | موقع إسلامي شامل للقرآن والأحاديث والأدعية",
        description:
            "اكتشف كنوز العلم والإيمان في موقع المسلم — القرآن الكريم، التفسير، الأحاديث، الأدعية، الخطب، الكتب والمزيد.",
        images: [
            {
                url: "/og-image.jpg",
                width: 1200,
                height: 630,
                alt: "المسلم | موقع إسلامي شامل"
            }
        ]
    },

    twitter: {
        card: "summary_large_image",
        site: "@almuslim",
        creator: "@mostafaahmed",
        title: "المسلم | موقع إسلامي شامل",
        description:
            "منصة المسلم — مرجعك الكامل للقرآن الكريم، الأحاديث، الأدعية، الفتاوى، الكتب والمحاضرات الإسلامية.",
        images: ["/og-image.jpg"]
    },

    verification: {
        google: "google-site-verification-code",
        yahoo: "yahoo-verification-code",
        me: ["mailto:zn327855@gmail.com"]
    },

    alternates: {
        canonical: "https://almuslim.com"
    },

    category: "Islamic"
};


export default function RootLayout({ children }) {
    return (
        <html lang="ar" className="scroll-smooth" dir="rtl">
            <head>
                <meta
                    name="google-adsense-account"
                    content="ca-pub-2830940611983404"
                />
                <Script id="google-analytics" strategy="lazyOnload">
                    {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-WBZJG335');`}
                </Script>
            </head>
            <SWRProvider>
                <RamadanProvider>
                    <body cz-shortcut-listen="true" className="bg-[rgb(250,250,250)] text-sm header dark:bg-gray-950 dark:text-white transition-colors selection:bg-lime-600 selection:text-white">
                        <iframe
                            src="https://www.googletagmanager.com/ns.html?id=GTM-WBZJG335"
                            height="0"
                            width="0"
                            title="google tag manager"
                        >
                        </iframe>
                        <main className={`${cairo.variable} relative font-cairo antialiased`}>
                            <Navbar />
                            {children}
                            <Footer />
                            <Buttons />
                        </main>
                    </body>
                </RamadanProvider>
            </SWRProvider>
        </html>
    );
}
