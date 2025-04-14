/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
        domains:[
            "pbs.twimg.com"
        ]         
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
};

export default nextConfig;
