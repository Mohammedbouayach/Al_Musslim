const withPWA = require('next-pwa')({
dest: 'public',
disable: process.env.NODE_ENV === 'development',
register: true,
skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
reactStrictMode: false,

images: {
domains: [
'd1.islamhouse.com',
'via.placeholder.com',
],
},
};

module.exports = withPWA(nextConfig);
