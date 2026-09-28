# Onebaki

সাদা গ্লাস UI-তে দোকানের বাকি খাতা। Vercel-এ ফোল্ডারটি ড্র্যাগ-অ্যান্ড-ড্রপ করুন।

## ১) Supabase SQL

Supabase Dashboard → SQL Editor-এ `supabase/schema.sql` পুরো ফাইল রান করুন।

## ২) Google লগইন (শুধু Google)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) এ OAuth client খুলুন।
2. Authorized JavaScript origins:
   - `http://localhost:3000`
   - আপনার Vercel URL, যেমন `https://onebaki.vercel.app`
3. Authorized redirect URIs:
   - `https://kucaqezwenakrofppxgl.supabase.co/auth/v1/callback`
   - `https://YOUR-VERCEL-DOMAIN/home`
4. Supabase → Authentication → Providers → Google চালু করুন।
   - Client ID: `YOUR_GOOGLE_CLIENT_ID`
   - Client Secret: `YOUR_GOOGLE_CLIENT_SECRET`
5. Authentication → URL Configuration-এ Site URL ও Redirect URLs-এ Vercel ডোমেইন দিন।

## ৩) Vercel

পুরো প্রজেক্ট ফোল্ডার zip করে Vercel-এ আপলোড করুন, অথবা ফোল্ডার ড্র্যাগ-অ্যান্ড-ড্রপ করুন। Environment variables `.env.local` থেকে অটো কপি করা যায়; কোডেও fallback আছে।

লোকাল রান:

```
npm install
npm run dev
```
