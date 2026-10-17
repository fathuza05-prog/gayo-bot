// Bot WhatsApp Gayo Overland - versi Vercel (tanpa server, tanpa kartu)
const TOKEN = process.env.WA_TOKEN;
const PHONE_ID = process.env.WA_PHONE_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "gayo123";
const FLYER_URL = process.env.FLYER_URL || "";
const ADMIN = "6281264516454"; // 0812-6451-6454
const NAMA_USAHA = "Gayo Overland";

const PAKET = `*DAFTAR HARGA PERJALANAN*
_Private Trip • Takengon Tourism_

📍 *City Tour Takengon* - *Rp 1.400.000* (full day)
Wisata kota Takengon, Dataran Tinggi Gayo, Kampung Kopi, Museum Geopark

🌅 *Sunset Pantan Terong* - *Rp 650.000* (half day)
Spot sunset terbaik, view Danau Laut Tawar, fotografi alam

✈️ *Airport Rembele Transfer* - *Rp 850.000* (one way)
Penjemputan tepat waktu, bagasi aman, armada nyaman

✅ *Sudah termasuk:* Mobil + Driver + BBM
Private trip • Armada bersih & nyaman • Driver berpengalaman lokal Gayo`;

const KENDARAAN = `*ARMADA KAMI*

🚙 *Mitsubishi Pajero Exceed 2010*
Warna hitam • Kapasitas 6-7 penumpang
Aman & terpercaya, cocok untuk medan dataran tinggi Gayo.

Melayani seluruh area Gayo, siap antar jemput.`;

const INFO = `*INFO LAYANAN*

Reservasi: 24/7 via WhatsApp
Lokasi: Takengon, Aceh Tengah
Area layanan: Seluruh area Gayo
WA Admin: 0812-6451-6454`;

const FORMAT_BOOKING = `*BOOKING DRIVER* ✅

Silakan kirim 1 pesan dengan format:

*BOOKING Nama, Tanggal & lama, Tujuan/paket, Jumlah penumpang*

Contoh:
BOOKING Budi, 25 Okt 2 hari, City Tour, 5 orang`;

async function kirim(to, body) {
  const r = await fetch(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, ...body }),
  });
  if (!r.ok) console.error("Gagal kirim:", await r.text());
}
const teks = (to, t) => kirim(to, { type: "text", text: { body: t } });
const gambar = (to, link, caption) => kirim(to, { type: "image", image: { link, caption } });

const sapaan = (to, nama) =>
  kirim(to, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: `Hai Kak ${nama} 👋\n\nTerima kasih telah menghubungi *${NAMA_USAHA}*.\nInformasi apa yang Kakak butuhkan? Silakan tekan Menu di bawah ini.` },
      action: { buttons: [{ type: "reply", reply: { id: "MENU", title: "☰ Menu" } }] },
    },
  });

const menu = (to) =>
  kirim(to, {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: "Silakan pilih layanan:" },
      action: {
        button: "Pilih Menu",
        sections: [{
          title: "Layanan",
          rows: [
            { id: "PAKET", title: "Daftar Harga Perjalanan" },
            { id: "KENDARAAN", title: "Armada Pajero Exceed" },
            { id: "BOOKING", title: "Booking Sekarang" },
            { id: "INFO", title: "Info Layanan" },
            { id: "ADMIN", title: "Chat Admin" },
          ],
        }],
      },
    },
  });

async function proses(from, nama, pesan) {
  // Pesan booking berformat
  const isi = pesan.type === "text" ? pesan.text.body.trim() : "";
  if (/^booking\b/i.test(isi) && isi.replace(/^booking/i, "").trim().length > 5) {
    await teks(from, "Terima kasih Kak! Booking diterima ✅\nAdmin akan segera konfirmasi harga & ketersediaan driver. 🙏");
    return teks(ADMIN, `*BOOKING BARU*\nDari: ${nama} (wa.me/${from})\nData: ${isi.replace(/^booking/i, "").trim()}`);
  }

  const id = pesan.interactive?.button_reply?.id || pesan.interactive?.list_reply?.id;
  switch (id) {
    case "MENU": return menu(from);
    case "PAKET":
      if (FLYER_URL) await gambar(from, FLYER_URL, "Gayo Overland - Daftar Harga Perjalanan");
      await teks(from, PAKET); return menu(from);
    case "KENDARAAN": await teks(from, KENDARAAN); return menu(from);
    case "INFO": await teks(from, INFO); return menu(from);
    case "ADMIN": return teks(from, `Silakan chat admin langsung: https://wa.me/${ADMIN}`);
    case "BOOKING": return teks(from, FORMAT_BOOKING);
    default: return sapaan(from, nama);
  }
}

module.exports = async (req, res) => {
  // Verifikasi webhook dari Meta
  if (req.method === "GET") {
    if (req.query["hub.verify_token"] === VERIFY_TOKEN) return res.status(200).send(req.query["hub.challenge"]);
    return res.status(403).send("Forbidden");
  }
  // Pesan masuk
  try {
    const v = req.body?.entry?.[0]?.changes?.[0]?.value;
    const pesan = v?.messages?.[0];
    if (pesan) await proses(pesan.from, v.contacts?.[0]?.profile?.name || "", pesan);
  } catch (e) {
    console.error(e);
  }
  res.status(200).send("OK");
};
