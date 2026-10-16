// Bot WhatsApp Gayo Overland - Private Trip Takengon
// Jalankan: npm install express  ->  node index.js  (Node 18+)
const express = require("express");
const app = express();
app.use(express.json());

// ====== DATA USAHA (sesuai flyer) ======
const TOKEN = process.env.WA_TOKEN;            // Access token WhatsApp Cloud API
const PHONE_ID = process.env.WA_PHONE_ID;      // Phone Number ID dari Meta
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "gayo123";
const ADMIN = "6281264516454";                 // WA admin/pemilik: 0812-6451-6454
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
// ===========================

const sesi = {}; // status booking per nomor

async function kirim(to, body) {
  await fetch(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, ...body }),
  });
}
// Flyer: upload gambar ke hosting (atau folder /public server Kakak), lalu isi URL HTTPS-nya
const FLYER_URL = process.env.FLYER_URL || "";
const gambar = (to, link, caption) =>
  kirim(to, { type: "image", image: { link, caption } });
const teks = (to, t) => kirim(to, { type: "text", text: { body: t } });

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

const PERTANYAAN = [
  ["nama", "Booking dimulai ✅\n\n1/4 Nama lengkap Kakak?"],
  ["tanggal", "2/4 Tanggal mulai & berapa hari? (contoh: 25 Okt, 2 hari)"],
  ["tujuan", "3/4 Tujuan wisata / paket yang diinginkan?"],
  ["orang", "4/4 Jumlah penumpang?"],
];

async function proses(from, nama, pesan) {
  const s = sesi[from];
  // sedang mengisi booking
  if (s && pesan.type === "text") {
    s.data[PERTANYAAN[s.langkah][0]] = pesan.text.body;
    s.langkah++;
    if (s.langkah < PERTANYAAN.length) return teks(from, PERTANYAAN[s.langkah][1]);
    const d = s.data;
    delete sesi[from];
    await teks(from, "Terima kasih Kak! Booking diterima, admin akan segera konfirmasi harga & ketersediaan driver. 🙏");
    return teks(ADMIN, `*BOOKING BARU*\nNama: ${d.nama}\nTanggal: ${d.tanggal}\nTujuan: ${d.tujuan}\nPenumpang: ${d.orang}\nWA: wa.me/${from}`);
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
    case "BOOKING":
      sesi[from] = { langkah: 0, data: {} };
      return teks(from, PERTANYAAN[0][1]);
    default: return sapaan(from, nama);
  }
}

// Verifikasi webhook dari Meta
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) return res.send(req.query["hub.challenge"]);
  res.sendStatus(403);
});

// Pesan masuk
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const v = req.body.entry?.[0]?.changes?.[0]?.value;
    const pesan = v?.messages?.[0];
    if (!pesan) return;
    const nama = v.contacts?.[0]?.profile?.name || "";
    await proses(pesan.from, nama, pesan);
  } catch (e) { console.error(e); }
});

app.listen(3000, () => console.log("Bot jalan di port 3000"));