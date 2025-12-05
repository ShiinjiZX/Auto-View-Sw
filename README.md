```markdown
# WhatsApp Status Forwarder Bot

Bot WhatsApp otomatis untuk melihat, react, dan forward status WA ke WhatsApp (bot sendiri) atau Telegram.

**Author:** IkyyKzy

---

## 📋 Fitur

- ✅ Auto view & react status WhatsApp
- ✅ Forward status ke WhatsApp Bot atau Telegram (bisa dipilih)
- ✅ Support semua tipe media (Text, Image, Video, Audio, Sticker, Document)
- ✅ Anti-spam react (tidak react berulang)
- ✅ Command exec/$ untuk remote terminal
- ✅ Console log detail dengan informasi lengkap
- ✅ Auto reconnect jika terputus
- ✅ Pairing code (tidak perlu scan QR)

---

## 🚀 Instalasi

### 📱 Termux (Android)

1. **Install requirements:**
```bash
pkg update && pkg upgrade -y
pkg install git nodejs -y
```

2. **Clone repository:**
```bash
git clone https://github.com/ShiinjiZX/Auto-View-Sw
cd Auto-View-Sw
```

3. **Install dependencies:**
```bash
npm install
```

4. **Konfigurasi:**
Edit file utama dan sesuaikan:
```javascript
const SEND_TO_TELEGRAM = false; // true = Telegram | false = WhatsApp Bot

// Jika menggunakan Telegram, isi ini:
const TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN";
const TELEGRAM_CHAT_ID = "YOUR_CHAT_ID";
```

5. **Edit setting.js:**
```javascript
// setting.js
global.autoviewsw = true; // Auto view status
global.swreact = ['❤️', '🔥', '😂', '👍', '🙏', '😍']; // Random react
```

6. **Jalankan bot:**
```bash
node index.js
```

7. **Masukkan nomor WA dengan format 62:**
```
Masukkan Nomor Yang Aktif Awali Dengan 62 :
628123456789
```

8. **Pairing code akan muncul, masukkan ke WhatsApp:**
   - Buka WhatsApp > Settings > Linked Devices
   - Link a Device > Enter code manually
   - Masukkan kode yang muncul

---

### 🖥️ VPS (Ubuntu/Debian)

1. **Update system:**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **Install Node.js & Git:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git
```

3. **Clone repository:**
```bash
git clone https://github.com/yourusername/wa-status-forwarder
cd wa-status-forwarder
```

4. **Install dependencies:**
```bash
npm install
```

5. **Konfigurasi seperti di Termux**

6. **Jalankan dengan PM2 (agar tetap jalan di background):**
```bash
# Install PM2
npm install -g pm2

# Jalankan bot
pm2 start index.js --name wa-status-bot

# Auto start saat VPS restart
pm2 startup
pm2 save

# Monitoring
pm2 logs wa-status-bot
pm2 status
```

**PM2 Commands:**
```bash
pm2 restart wa-status-bot  # Restart bot
pm2 stop wa-status-bot     # Stop bot
pm2 delete wa-status-bot   # Hapus dari PM2
pm2 monit                  # Monitor real-time
```

---

### ☁️ Railway

1. **Buat akun di [Railway.app](https://railway.app)**

2. **Deploy dari GitHub:**
   - Klik "New Project"
   - Pilih "Deploy from GitHub repo"
   - Pilih repository Anda

3. **Tambahkan Environment Variables:**
   - `SEND_TO_TELEGRAM` = `false` atau `true`
   - `TELEGRAM_BOT_TOKEN` = `your_token` (jika pakai Telegram)
   - `TELEGRAM_CHAT_ID` = `your_chat_id` (jika pakai Telegram)

4. **Buat file `railway.json`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

5. **Deploy akan otomatis berjalan**

⚠️ **Catatan:** Pairing code hanya bisa dilihat di logs Railway pertama kali deploy.

---

### 🌐 Heroku

1. **Install Heroku CLI:**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

2. **Login Heroku:**
```bash
heroku login
```

3. **Clone & setup:**
```bash
git clone https://github.com/yourusername/wa-status-forwarder
cd wa-status-forwarder
```

4. **Buat Procfile:**
```
worker: node index.js
```

5. **Deploy:**
```bash
heroku create your-app-name
git push heroku main
```

6. **Scale worker:**
```bash
heroku ps:scale worker=1
```

7. **Lihat logs untuk pairing code:**
```bash
heroku logs --tail
```

---

### 📦 Vercel (Tidak Disarankan)

⚠️ **Vercel tidak cocok untuk bot WhatsApp karena:**
- Serverless function punya timeout
- Tidak bisa maintain WebSocket connection
- Session akan hilang setiap deploy

**Alternatif yang lebih baik:** Railway, Heroku, atau VPS

---

### 🐳 Docker

1. **Buat Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "index.js"]
```

2. **Buat docker-compose.yml:**
```yaml
version: '3.8'

services:
  wa-bot:
    build: .
    container_name: wa-status-bot
    restart: unless-stopped
    volumes:
      - ./session:/app/session
    environment:
      - SEND_TO_TELEGRAM=false
      - TELEGRAM_BOT_TOKEN=your_token
      - TELEGRAM_CHAT_ID=your_chat_id
```

3. **Jalankan:**
```bash
docker-compose up -d

# Lihat logs untuk pairing code
docker-compose logs -f
```

---

## ⚙️ Konfigurasi

### Mode Pengiriman

**Kirim ke WhatsApp Bot (Nomor bot sendiri):**
```javascript
const SEND_TO_TELEGRAM = false;
```

**Kirim ke Telegram:**
```javascript
const SEND_TO_TELEGRAM = true;
```

### Setting Global

Edit file `setting.js`:
```javascript
// Auto view status
global.autoviewsw = true;

// React random yang akan digunakan
global.swreact = ['❤️', '🔥', '😂', '👍', '🙏', '😍', '💯', '🗿', '✨'];
```

### Telegram Setup (Opsional)

1. **Buat bot di Telegram:**
   - Chat [@BotFather](https://t.me/botfather)
   - Ketik `/newbot`
   - Ikuti instruksi
   - Simpan token yang diberikan

2. **Dapatkan Chat ID:**
   - Chat [@userinfobot](https://t.me/userinfobot)
   - Bot akan reply dengan chat ID Anda

3. **Masukkan ke config:**
```javascript
const TELEGRAM_BOT_TOKEN = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11";
const TELEGRAM_CHAT_ID = "6706060911";
```

---

## 🎮 Cara Penggunaan

### Command Bot

Bot hanya bisa digunakan oleh nomor bot sendiri:

**Execute terminal command:**
```
$ ls
$ node -v
$ npm list
exec pm2 list
```

### Status Forwarding

Bot akan otomatis:
1. ✅ Melihat status WA yang muncul
2. 😊 React dengan emoji random
3. 📤 Forward ke WA Bot atau Telegram (sesuai config)
4. 📊 Menampilkan log detail di console

**Console Log Example:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👁️  STATUS TERDETEKSI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 Nomor User    : +628123456789
📝 Tipe Status   : IMAGE
😊 React Bot     : 🔥
📤 Dikirim ke    : WHATSAPP BOT
⏰ Waktu         : 5/12/2024 20.30.45
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ React "🔥" berhasil dikirim ke +628123456789
📤 Mendownload IMAGE...
📥 Download selesai (149.52 KB)
✅ Image berhasil dikirim ke WA Bot (149.52 KB)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📂 Struktur File

```
Auto-View-Sw/
├── setting.js            # Configuration file
├── connect
│   └── index.js           # Main bot file
├── session/              # WhatsApp session (auto-generated)
│   ├── creds.json
│   └── ...
├── package.json          # Dependencies
└── README.md             # Documentation
```

---

## 🔧 Dependencies

```json
{
  "dependencies": {
    "@hapi/boom": "^10.0.1",
    "@whiskeysockets/baileys": "npm:wileys",
    "jimp": "latest", 
    "pino": "^7.0.5",
    "readline": "^1.3.0"
  }
}
```

**Install:**
```bash
npm install @whiskeysockets/baileys pino @hapi/boom axios form-data
```

---

## ⚠️ Troubleshooting

### Bot tidak connect
```bash
# Hapus session lalu login ulang
rm -rf session/
node index.js
```

### Error saat download media
```bash
# Update Baileys ke versi terbaru
npm update @whiskeysockets/baileys
```

### Tidak bisa kirim ke Telegram
- Cek token bot Telegram valid
- Pastikan chat ID benar
- Cek bot sudah di-start dengan `/start`

### Status tidak terdeteksi
- Pastikan `global.autoviewsw = true`
- Cek koneksi internet stabil
- Restart bot

### Command exec tidak jalan
- Pastikan nomor yang kirim command adalah nomor bot sendiri
- Cek format: `$ command` atau `exec command`

---

## 🛡️ Keamanan

- ⚠️ **Jangan share session/** folder (berisi kredensial)
- ⚠️ **Command exec sangat powerful**, hanya bot sendiri yang bisa pakai
- ⚠️ **Backup session/** secara berkala
- ⚠️ **Jangan share token Telegram** ke publik

**.gitignore:**
```
node_modules/
session/
.env
*.log
```

---

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Initial release
- ✅ Support Telegram & WhatsApp forwarding
- ✅ Anti-spam react
- ✅ Command exec
- ✅ Auto reconnect

---

## 🤝 Contributing

1. Fork repository
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

---

## 📄 License

MIT License - bebas digunakan untuk keperluan pribadi maupun komersial.

---

## 💬 Support

- **Issues:** [GitHub Issues](https://github.com/ShiinjiZX/Auto-View-Sw/issues)
- **Telegram:** [@IkyyKzy](https://t.me/IkyyxpzX)
- **Email:** kyykntk@gmail.com

---

## ⭐ Credits

- **Author:** IkyyKzy
- **Library:** [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)
- **Inspired by:** WhatsApp Bot Community

---

## 🎯 Roadmap

- [ ] Web dashboard untuk monitoring
- [ ] Database support (MongoDB/PostgreSQL)
- [ ] Multi-account support
- [ ] Schedule status posting
- [ ] Filter status by contact
- [ ] Backup status to cloud storage

---

**⚡ Star repository ini jika bermanfaat!**

```
 _____ _                 _          __
|_   _| |__   __ _ _ __ | | _____  / _| ___  _ __
  | | | '_ \ / _` | '_ \| |/ / __|| |_ / _ \| '__|
  | | | | | | (_| | | | |   <\__ \|  _| (_) | |
  |_| |_| |_|\__,_|_| |_|_|\_\___/|_|  \___/|_|
         _   _     _
  _   _| |_| |_  (_)___
 | | | | __| __| | / __|
 | |_| | |_| |_  | \__ \
  \__,_|\__|\__| |_|___/

```

---

Made with ❤️ by **IkyyKzy**
```

File README.md lengkap dengan:
- ✅ Instalasi untuk Termux, VPS, Railway, Heroku, Docker
- ✅ Konfigurasi detail
- ✅ Troubleshooting
- ✅ Security best practices
- ✅ Contributing guidelines
- ✅ Roadmap fitur mendatang

Copy paste code di atas ke file `README.md` di project Anda! 📝