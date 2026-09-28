export const config = {
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://kucaqezwenakrofppxgl.supabase.co",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Y2FxZXp3ZW5ha3JvZnBweGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDQwMTcsImV4cCI6MjEwNjAyMDAxN30.qOI3LcP4-sM7k_TgAlXEAgjkZBEpsRG_89ezq6V1BF4",
  googleClientId:
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "213084449102-lgrbpo3p3763tl5vpbsj8hm2nckuc1q7.apps.googleusercontent.com",
};
