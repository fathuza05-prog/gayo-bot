// Alat bantu sekali pakai. HAPUS file ini setelah bot berjalan.
// /api/setup?key=KUNCI            -> pasang webhook
// /api/setup?key=KUNCI&tes=628xx  -> kirim pesan "Hello World" ke nomor itu (untuk membuka percakapan)
module.exports = async (req, res) => {
  if (!process.env.SETUP_KEY || req.query.key !== process.env.SETUP_KEY) {
    return res.status(403).send("Forbidden");
  }

  // Mode tes: kirim template hello_world dan tampilkan jawaban Meta apa adanya
  if (req.query.tes) {
    try {
      const r = await fetch(`https://graph.facebook.com/v20.0/${process.env.WA_PHONE_ID}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WA_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: req.query.tes,
          type: "template",
          template: { name: "hello_world", language: { code: "en_US" } },
        }),
      });
      return res.status(200).json({ tes_kirim: await r.json() });
    } catch (e) {
      return res.status(200).json({ error: String(e) });
    }
  }

  const APP_ID = process.env.APP_ID;
  const APP_SECRET = process.env.APP_SECRET;
  const WABA_ID = process.env.WABA_ID;
  const hasil = {};
  try {
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
