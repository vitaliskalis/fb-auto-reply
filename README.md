# 🤖 DAO UMKM Secretary Bot - Telegram Edition

**Bot pintar untuk manajemen DAO UMKM di Telegram!**

> Powered by **Snapshot.org** (Voting) + **Groq AI** (Penjelasan Smart)

---

## ⚡ Quick Start

```bash
# 1. Install
npm install

# 2. Setup .env
cp .env.example .env
# Edit .env dengan credentials Anda:
# - TELEGRAM_BOT_TOKEN (dari @BotFather)
# - GROQ_API_KEY (dari https://console.groq.com)

# 3. Run
npm start
```

---

## 🎯 Commands

### `/proposal` - Lihat Proposal Aktif

```
User: /proposal

Bot: 📝 Sebentar guruku, lagi tanya ke DAO UMKM...
     [Fetch dari Snapshot.org]
     [Summarize dengan Groq AI]

📋 Proposal Aktif DAO UMKM (3):

1. Approve New Member
📝 Proposal ini untuk menerima anggota baru ke DAO. Jika disetujui, member baru bisa ikut voting.
⏰ Berakhir: 5 Jun 14:30
🔗 Vote di Snapshot

2. Update Treasury Policy
📝 Mengubah kebijakan kas DAO agar lebih transparan. Jika setuju, audit dilakukan setiap bulan.
⏰ Berakhir: 6 Jun 16:45
🔗 Vote di Snapshot
```

### `/help` - Bantuan

### `/status` - Cek Bot Online

### `/start` - Menu Awal

---

## 💰 Cost

| Service | Cost |
|---------|------|
| Groq API | **FREE** (9K req/hari) |
| Snapshot | **FREE** (off-chain) |
| Telegram | **FREE** |
| **Total** | **$0/bulan** 🎉 |

**vs OpenAI:** $30-50/bulan

---

## ⚙️ Environment Variables

```bash
TELEGRAM_BOT_TOKEN=your_bot_token
GROQ_API_KEY=gsk_...
DAO_SPACE_NAME=daomumkm.eth
GROQ_MODEL=llama-3.1-70b-versatile
GROQ_MAX_TOKENS=200
```

---

## 📁 Structure

```
├── config/
│   └── index.js              # Configuration
├── services/
│   ├── snapshotService.js    # Snapshot.org API
│   └── groqService.js        # Groq AI
├── handlers/
│   └── telegramCommandHandler.js  # Commands
├── utils/
│   ├── logger.js
│   └── rateLimiter.js
├── index.js                  # Main bot
├── .env.example
└── package.json
```

---

## 🚀 Deploy

### Render.io
```yaml
services:
  - type: background_worker
    name: dao-umkm-bot
    env: node
    buildCommand: npm install
    startCommand: npm start
```

### Railway
```bash
railway up
```

---

## 🐛 Troubleshooting

**Bot tidak start?**
```bash
node -v  # Must be >= 18.0.0
npm install
cat .env | grep TELEGRAM_BOT_TOKEN
```

**Groq API error?**
```bash
curl -H "Authorization: Bearer $GROQ_API_KEY" \
  https://api.groq.com/openai/v1/models
```

**Lihat logs:**
```bash
tail -50 logs/combined.log
```

---

**Made with ❤️ for DAO UMKM**
