// Pengaturan webhook sekali jalan (tanpa halaman Meta). HAPUS file ini setelah berhasil.
module.exports = async (req, res) => {
  if (!process.env.SETUP_KEY || req.query.key !== process.env.SETUP_KEY) {
    return res.status(403).send("Forbidden");
  }
  const APP_ID = process.env.APP_ID;
  const APP_SECRET = process.env.APP_SECRET;
  const WABA_ID = process.env.WABA_ID;
  const hasil = {};
  try {
    // 1. Daftarkan alamat webhook ke aplikasi Meta
    const r1 = await fetch(`https://graph.facebook.com/v20.0/${APP_ID}/subscriptions`, {
      method: "POST",
      body: new URLSearchParams({
        object: "whatsapp_business_account",
        callback_url: "https://gayo-bot.vercel.app/api/webhook",
        verify_token: process.env.VERIFY_TOKEN || "gayo123",
        fields: "messages",
        access_token: `${APP_ID}|${APP_SECRET}`,
      }),
    });
    hasil.langkah1_webhook = await r1.json();

    // 2. Hubungkan aplikasi ke akun WhatsApp Business
    const r2 = await fetch(`https://graph.facebook.com/v20.0/${WABA_ID}/subscribed_apps`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WA_TOKEN}` },
    });
    hasil.langkah2_langganan = await r2.json();
  } catch (e) {
    hasil.error = String(e);
  }
  res.status(200).json(hasil);
};
