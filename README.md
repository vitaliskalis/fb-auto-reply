# 🤖 DAO UMKM Secretary Bot

Facebook Messenger bot yang bertindak sebagai sekretaris untuk DAO UMKM. Bot ini dapat mengambil informasi dari Snapshot.org dan Gnosis Safe untuk menjawab pertanyaan tentang proposal, voting, dan kas DAO.

## ✨ Fitur

### Phase 1: Core Bot (✅ Completed)
- ✅ Webhook integration dengan Facebook Messenger
- ✅ Error handling dan logging system
- ✅ Rate limiting per user
- ✅ Health check endpoint
- ✅ Environment validation

### Phase 2: Snapshot Integration (✅ In Progress)
- ✅ `/proposal` - Lihat proposal aktif dari Snapshot.org
- ⏳ `/cek` - Cek status proposal tertentu
- ⏳ `/gabung` - Info cara bergabung dengan DAO

### Phase 3: Gnosis Safe Integration (🔜 Coming Soon)
- 🔜 `/kas` - Lihat saldo kas DAO
- 🔜 `/treasury` - Dashboard treasury

### Phase 4: AI Integration (🔜 Coming Soon)
- 🔜 OpenAI GPT integration untuk jawaban smart
- 🔜 Natural language understanding

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x atau lebih
- Facebook Developer Account & App
- Snapshot.org space (DAO yang sudah terdaftar)

### Installation

```bash
# Clone repository
git clone https://github.com/vitaliskalis/fb-auto-reply.git
cd fb-auto-reply

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dan isi dengan token Anda

# Run bot
npm start

# Development mode (with auto-reload)
npm run dev
```

## ⚙️ Configuration

### Environment Variables

```bash
# Facebook Configuration
PAGE_ACCESS_TOKEN=your_facebook_page_token
VERIFY_TOKEN=your_webhook_verify_token

# Server Configuration
PORT=3000
NODE_ENV=development

# DAO Configuration
DAO_SPACE_NAME=daoukmmk.eth  # Ganti dengan ENS space Anda
SNAPSHOT_API_URL=https://hub.snapshot.org/graphql

# Rate Limiting (per user)
RATE_LIMIT_WINDOW_MS=600000     # 10 menit
RATE_LIMIT_MAX_REQUESTS=1       # Max 1 request per window

# Logging
LOG_LEVEL=info
```

### Cara Mendapatkan Facebook Tokens

1. Buka [Facebook Developers](https://developers.facebook.com/)
2. Buat atau buka aplikasi Anda
3. Setup Messenger Product
4. Generate Page Access Token
5. Setup Webhook dengan URL: `https://your-domain.com/webhook`
6. Tentukan Verify Token sendiri dan masukkan di `.env`

## 📱 Available Commands

### `/proposal`
Melihat proposal aktif dari Snapshot.org

```
Input: /proposal
Output:
🗳️ Proposal Aktif DAO UMKM (3):

1. Approve New Member
   Pilihan: Setuju, Tidak Setuju, Abstain
   Berakhir: 5 Jun 14:30
   Vote: https://snapshot.org/#/daoukmmk.eth/proposal/0x...
```

### `/help`
Melihat daftar perintah yang tersedia

### `/health`
Cek status bot

## 📊 Architecture

```
┌─────────────────────────────────┐
│  Facebook Messenger User        │
└────────────┬────────────────────┘
             │ /proposal
             ▼
┌─────────────────────────────────┐
│  Facebook Webhook (POST)        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Command Handler                │
│  - Parse command                │
│  - Rate limiting check          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Snapshot Service               │
│  - Query GraphQL API            │
│  - Format proposals             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Facebook Service               │
│  - Send message                 │
│  - Handle errors                │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Facebook Messenger Response    │
└─────────────────────────────────┘
```

## 🔒 Security

- ✅ Webhook token verification
- ✅ Rate limiting per user
- ✅ Input sanitization
- ✅ Error logging tanpa expose sensitive data
- ✅ Environment variables untuk secrets

## 📝 Logging

Bot menggunakan Winston logger dengan output:
- Console (real-time)
- `logs/error.log` (error only)
- `logs/combined.log` (all logs)

Format log:
```
2024-06-01 14:30:45 [INFO]: Message from user 123456: /proposal
```

## 🧪 Testing

```bash
# Test webhook
curl -X GET "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=test_challenge"

# Test health check
curl http://localhost:3000/health
```

## 📦 Dependencies

- **express**: Web framework
- **body-parser**: Parse JSON requests
- **axios**: HTTP client
- **dotenv**: Environment variables
- **winston**: Logging
- **express-rate-limit**: Rate limiting
- **@snapshot-labs/snapshot.js**: Snapshot.org integration

## 🐛 Troubleshooting

### Bot tidak menerima pesan
1. Cek `VERIFY_TOKEN` di `.env` match dengan yang di Facebook App
2. Cek webhook URL sudah ter-register di Facebook App
3. Lihat logs untuk error messages

### Snapshot API Error
1. Pastikan `DAO_SPACE_NAME` benar (format: `name.eth`)
2. Cek space sudah terbuat di Snapshot.org
3. Cek internet connection

### Rate Limit Issue
- User dapat query `/proposal` 1x per 10 menit
- Disesuaikan di environment variables

## 🚀 Deployment

### Render.io
```yaml
services:
  - type: web
    name: dao-umkm-secretary
    env: node
    plan: free
    buildCommand: npm install
    startCommand: node index.js
```

### Environment Variables di Render
Tambahkan di Render Dashboard:
- `PAGE_ACCESS_TOKEN`
- `VERIFY_TOKEN`
- `DAO_SPACE_NAME`
- Lainnya sesuai `.env.example`

## 📚 Resources

- [Facebook Messenger API Docs](https://developers.facebook.com/docs/messenger-platform)
- [Snapshot.org Docs](https://docs.snapshot.org/)
- [Snapshot GraphQL API](https://hub.snapshot.org/graphql)
- [Gnosis Safe API](https://safe-transaction-mainnet.safe.global/)

## 👥 Contributing

Contribusi sangat diterima! Silakan:
1. Fork repository
2. Buat branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

## 📄 License

MIT License - lihat file [LICENSE](LICENSE) untuk detail

## 📧 Support

Ada pertanyaan? Buka issue di GitHub atau hubungi:
- GitHub Issues: [Issues](https://github.com/vitaliskalis/fb-auto-reply/issues)
- Email: vitalis@dao-umkm.id

---

**Made with ❤️ for DAO UMKM Community**
