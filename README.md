# UMKM.AI

> Platform Manajemen Bisnis Cerdas untuk UMKM berbasis Web dengan Integrasi Artificial Intelligence

UMKM.AI adalah aplikasi web yang dirancang untuk membantu pemilik usaha dan kasir dalam mengelola operasional bisnis sehari-hari, mulai dari pengelolaan produk, kategori, transaksi penjualan, hingga analisis bisnis berbasis Artificial Intelligence (AI).

Aplikasi ini menggunakan sistem Role-Based Access Control (RBAC) dengan dua role utama, yaitu Owner dan Cashier. Owner memiliki akses terhadap pengelolaan data dan fitur analitik bisnis, sedangkan Cashier berfokus pada proses transaksi melalui Point of Sale (POS).

---

## ✨ Fitur Utama

### 👑 Owner

Owner memiliki akses penuh terhadap fitur manajemen dan analitik bisnis.

#### Dashboard
- Ringkasan pendapatan hari ini
- Jumlah transaksi hari ini
- Pendapatan bulan berjalan
- Perbandingan pendapatan dengan bulan sebelumnya
- Total produk
- Produk dengan stok rendah
- Jumlah pelanggan aktif
- Grafik penjualan 7 hari terakhir
- Produk terlaris
- Transaksi terbaru
- Insight bisnis

#### Manajemen Produk
Owner dapat melakukan CRUD terhadap produk:
- Tambah produk
- Melihat daftar produk
- Edit produk
- Hapus produk
- SKU produk
- Harga jual
- Harga modal / HPP
- Stok
- Minimum stok
- Satuan produk
- Kategori
- Foto produk
- Deskripsi produk

#### Manajemen Kategori
Owner dapat:
- Menambah kategori
- Melihat kategori
- Mengedit kategori
- Menghapus kategori
- Menambahkan deskripsi kategori

#### Riwayat Transaksi
Owner dapat melihat seluruh transaksi yang dilakukan oleh kasir, termasuk:
- Nomor invoice
- Kasir yang melakukan transaksi
- Total transaksi
- Metode pembayaran
- Status transaksi
- Waktu transaksi

#### AI Prediction
Fitur prediksi digunakan untuk membantu Owner memperkirakan kebutuhan produk dan potensi penjualan.

Informasi yang tersedia antara lain:
- Proyeksi revenue
- Rata-rata revenue harian
- Tren pertumbuhan
- Produk dengan kebutuhan stok kritis
- Histori penjualan
- Proyeksi permintaan
- Estimasi produk habis
- Risk level
- Rekomendasi restock

#### AI Recommendation
Fitur ini menganalisis pola pembelian pelanggan untuk menemukan produk yang sering dibeli secara bersamaan.

Output yang tersedia:
- Produk yang sering dibeli bersama
- Association rules
- Support
- Confidence
- Lift
- Rekomendasi bundling
- Harga bundle
- Estimasi margin

Tujuan utama fitur ini adalah membantu Owner menentukan strategi cross-selling dan bundling produk.

#### AI Business Insights
Fitur ini melakukan analisis terhadap kondisi bisnis secara keseluruhan.

Informasi yang tersedia:
- Business Health Score
- Status kesehatan bisnis
- Gross Margin
- Total omzet 30 hari
- Total transaksi
- Total laba kotor
- Slow-moving stock
- Rekomendasi strategis AI

Fitur ini berfungsi sebagai business diagnostic, bukan sebagai rekomendasi produk.

---

### 💳 Cashier

Cashier memiliki akses yang berfokus pada operasional transaksi.

#### POS (Point of Sale)
Cashier dapat:
- Melihat katalog produk
- Mencari produk
- Menambahkan produk ke cart
- Mengatur jumlah produk
- Melihat subtotal
- Menggunakan diskon
- Memilih metode pembayaran
- Memproses pembayaran
- Melihat kembalian
- Membuat transaksi

Metode pembayaran yang tersedia:
- Cash
- QRIS
- Debit

Setiap transaksi otomatis tercatat menggunakan akun kasir yang melakukan transaksi.

#### Riwayat Transaksi
Cashier dapat melihat riwayat transaksi yang dibuat oleh akun kasir tersebut.

Cashier tidak memiliki akses terhadap:
- Manajemen produk
- Manajemen kategori
- Dashboard Owner
- AI Prediction
- AI Recommendation
- AI Business Insights

---

### 🛒 Customer Catalog

Customer-facing catalog dirancang sebagai katalog produk yang sederhana dan mudah digunakan.

Fitur yang direncanakan/disediakan:
- Menampilkan seluruh produk
- Filter berdasarkan kategori
- Pencarian berdasarkan nama produk
- Rekomendasi produk
- Informasi produk
- Deskripsi produk
- Foto produk
- Chatbot AI untuk pertanyaan seputar produk

Chatbot AI difokuskan untuk membantu customer mendapatkan informasi mengenai produk yang tersedia, bukan sebagai business management assistant.

---

## 🤖 Perbedaan Fitur AI

UMKM.AI memiliki tiga fitur AI utama dengan fungsi yang berbeda:

| Fitur | Fungsi |
|---|---|
| AI Prediction | Memprediksi kebutuhan dan permintaan produk |
| AI Recommendation | Menemukan produk yang cocok direkomendasikan atau dibundling berdasarkan pola pembelian |
| AI Business Insights | Menganalisis kesehatan dan kondisi bisnis serta memberikan rekomendasi strategis |

Contoh:

AI Prediction:
"Stok Kopi ABC diperkirakan akan habis dalam beberapa hari."

AI Recommendation:
"Pelanggan yang membeli Kopi ABC sering membeli Roti A."

AI Business Insights:
"Gross margin bisnis berada pada 63.1% dan kondisi bisnis tergolong sangat sehat."

---

## 🔐 Role-Based Access Control

UMKM.AI menggunakan dua role utama:

### Owner

Memiliki akses:
- Dashboard
- POS-related business data
- Semua transaksi
- Produk
- Kategori
- AI Prediction
- AI Recommendation
- AI Business Insights

### Cashier

Memiliki akses:
- POS
- Transaksi milik akun tersebut

Role diterapkan pada backend melalui middleware authentication dan authorization.

Selain proteksi pada frontend, endpoint backend juga memiliki authorization sehingga pengguna tidak dapat memperoleh akses Owner hanya dengan mengubah URL atau request dari client.

Registrasi publik secara otomatis menghasilkan akun dengan role `cashier`.

Role `owner` tidak diberikan melalui input registrasi publik.

---

## 🏗️ Arsitektur Project

Project menggunakan arsitektur terpisah antara frontend dan backend.

```text
UMKM.AI
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── database/
│   ├── seed/
│   └── app.js
│
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   ├── pages/
    │   └── routes/
    ├── public/
    └── package.json
```

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- React Router
- Tailwind CSS
- Lucide React

### Backend
- Node.js
- Express.js
- JWT Authentication
- bcrypt
- REST API

### Database
- PostgreSQL

### AI / Business Analytics
- Demand Prediction
- Association Rule Analysis
- Product Recommendation
- Business Health Analysis
- Strategic Business Recommendations

---

## 🔑 Authentication

UMKM.AI menggunakan JSON Web Token (JWT) sebagai mekanisme authentication.

Flow authentication:

```text
Login
  ↓
Backend melakukan validasi email & password
  ↓
Password diverifikasi menggunakan bcrypt
  ↓
Backend membuat JWT
  ↓
Token disimpan di browser
  ↓
Token dikirim melalui Authorization header
  ↓
Backend melakukan authentication
  ↓
Backend melakukan authorization berdasarkan role
```

Authorization header:

Authorization: Bearer <JWT_TOKEN>

---

## 🔄 Transaction Flow

Proses transaksi pada UMKM.AI berjalan melalui flow berikut:

    Cashier Login
         ↓
    POS
         ↓
    Pilih Produk
         ↓
    Tambah ke Cart
         ↓
    Atur Quantity
         ↓
    Pilih Payment Method
         ↓
    Input Pembayaran
         ↓
    Validasi Stok
         ↓
    Create Transaction
         ↓
    Create Transaction Details
         ↓
    Kurangi Stok Produk
         ↓
    Transaction Berhasil
         ↓
    Invoice / Receipt

Proses transaksi menggunakan database transaction untuk menjaga konsistensi data antara transaksi, detail transaksi, dan stok produk.

---

## 📊 Database

UMKM.AI menggunakan PostgreSQL sebagai database utama.

### Entitas Utama

    users
    products
    categories
    transactions
    transaction_details
    ai_insights

### Relasi Utama

    users
      │
      └── transactions
              │
              └── transaction_details
                        │
                        └── products
                                  │
                                  └── categories

### Users

Menyimpan data akun Owner dan Cashier.

Field utama:
- id
- name
- email
- password
- role
- phone
- created_at

### Products

Menyimpan informasi produk:
- id
- name
- SKU
- category
- selling price
- cost price
- stock
- minimum stock
- unit
- image
- description

### Categories

Menyimpan kategori produk yang digunakan untuk mengelompokkan produk dalam katalog.

### Transactions

Menyimpan informasi transaksi:
- invoice number
- user / cashier
- customer reference
- total amount
- discount
- final amount
- paid amount
- change
- payment method
- status
- created_at

### Transaction Details

Menyimpan detail produk pada setiap transaksi:
- transaction
- product
- product name
- quantity
- unit price
- cost price
- subtotal

---

## 🔌 API Overview

Base URL:

    /api

### Authentication

    POST /api/auth/register
    POST /api/auth/login
    GET  /api/auth/me

### Products

    GET    /api/products
    GET    /api/products/:id
    POST   /api/products
    PUT    /api/products/:id
    DELETE /api/products/:id

Create, update, dan delete produk hanya dapat dilakukan oleh Owner.

### Categories

    GET    /api/categories
    POST   /api/categories
    PUT    /api/categories/:id
    DELETE /api/categories/:id

Create, update, dan delete kategori hanya dapat dilakukan oleh Owner.

### Transactions

    GET  /api/transactions
    GET  /api/transactions/:id
    POST /api/transactions

Pembuatan transaksi dilakukan oleh Cashier.

Owner dapat melihat data transaksi sesuai authorization yang diberikan.

### Dashboard

    GET /api/dashboard

Endpoint untuk mengambil statistik dan data yang ditampilkan pada Dashboard Owner.

### AI

    GET /api/ai/prediction
    GET /api/ai/recommendation
    GET /api/ai/insights

Endpoint AI digunakan untuk mengambil hasil analisis bisnis berdasarkan data yang tersedia pada database.

---

## ⚙️ Installation

### 1. Clone Repository

    git clone https://github.com/FazaViranza/tesfinalepawfazagantenk.git
    cd tesfinalepawfazagantenk

### 2. Backend

Masuk ke folder backend:

    cd backend

Install dependencies:

    npm install

Buat file `.env`:

    DB_USER=postgres
    DB_PASS=your_password
    DB_DATABASE=umkm_ai
    DB_HOST=127.0.0.1
    DB_PORT=5432
    DB_DIALECT=postgres

    JWT_SECRET=your_secret_key
    JWT_EXPIRES=1d

    PORT=3000

Sesuaikan konfigurasi database dengan PostgreSQL lokal.

### 3. Database

Buat database PostgreSQL:

    CREATE DATABASE umkm_ai;

Kemudian jalankan schema database yang tersedia pada folder `database`.

Setelah schema berhasil dibuat, jalankan seed data jika tersedia.

### 4. Start Backend

    npm run dev

atau:

    npm start

Backend berjalan pada:

    http://localhost:3000

### 5. Frontend

Buka terminal baru:

    cd frontend

Install dependencies:

    npm install

Buat file `.env`:

    VITE_API_URL=http://localhost:3000/api

Jalankan development server:

    npm run dev

Buka URL yang diberikan oleh Vite pada browser.

---

## 👤 User Roles

UMKM.AI menggunakan dua role utama:

### Owner

Owner memiliki akses terhadap:

- Dashboard
- Semua transaksi
- Manajemen produk
- Manajemen kategori
- AI Prediction
- AI Recommendation
- AI Business Insights

### Cashier

Cashier memiliki akses terhadap:

- POS
- Pembuatan transaksi
- Riwayat transaksi sesuai akun

Cashier tidak memiliki akses terhadap fitur management dan AI milik Owner.

### Customer

Customer berinteraksi melalui katalog produk dan chatbot AI yang berfokus pada informasi produk.

---

## 🔐 Role-Based Access Control

UMKM.AI menerapkan Role-Based Access Control (RBAC) pada frontend dan backend.

Frontend menggunakan protected routes untuk mengontrol halaman yang dapat diakses oleh setiap role.

Backend menggunakan middleware authentication dan authorization untuk memastikan request memiliki hak akses yang sesuai.

Contoh:

    Owner
      ├── Dashboard          ✅
      ├── Products           ✅
      ├── Categories         ✅
      ├── Transactions       ✅
      ├── AI Prediction      ✅
      ├── AI Recommendation  ✅
      └── AI Insights        ✅

    Cashier
      ├── POS                ✅
      ├── Transactions       ✅
      ├── Products CRUD      ❌
      ├── Categories CRUD    ❌
      └── AI Engine          ❌

Registrasi publik tidak menyediakan pilihan role Owner.

Setiap akun yang melakukan registrasi publik secara otomatis diberikan role `cashier`.

Hal ini mencegah pengguna membuat akun Owner secara langsung melalui form registrasi.

---

## 🧪 Testing Checklist

### Authentication

    [ ] Owner dapat login
    [ ] Cashier dapat login
    [ ] Password salah ditolak
    [ ] Email tidak terdaftar ditolak
    [ ] Logout menghapus token
    [ ] Protected route tidak dapat diakses tanpa login

### Authorization

    [ ] Owner dapat mengakses Dashboard
    [ ] Owner dapat CRUD produk
    [ ] Owner dapat CRUD kategori
    [ ] Owner dapat melihat seluruh transaksi
    [ ] Owner dapat mengakses AI features

    [ ] Cashier dapat mengakses POS
    [ ] Cashier dapat membuat transaksi
    [ ] Cashier dapat melihat riwayat transaksi
    [ ] Cashier tidak dapat CRUD produk
    [ ] Cashier tidak dapat CRUD kategori
    [ ] Cashier tidak dapat mengakses AI Owner
    [ ] Cashier tidak dapat mengakses Dashboard Owner

### Product Management

    [ ] Create product
    [ ] Read product
    [ ] Update product
    [ ] Delete product
    [ ] Product search
    [ ] Category displayed correctly
    [ ] Stock displayed correctly

### Category Management

    [ ] Create category
    [ ] Read category
    [ ] Update category
    [ ] Delete category

### POS

    [ ] Product dapat ditambahkan ke cart
    [ ] Quantity dapat diubah
    [ ] Stock validation berjalan
    [ ] Cash payment berjalan
    [ ] QRIS payment berjalan
    [ ] Debit payment berjalan
    [ ] Payment validation berjalan
    [ ] Change dihitung dengan benar
    [ ] Transaction berhasil dibuat
    [ ] Stock berkurang setelah transaksi

### AI

    [ ] AI Prediction berhasil dimuat
    [ ] AI Recommendation berhasil dimuat
    [ ] AI Business Insights berhasil dimuat
    [ ] Financial metrics sesuai dengan data transaksi
    [ ] Recommendation menggunakan pola transaksi
    [ ] Prediction menggunakan data penjualan
    [ ] Restock recommendation ditampilkan

---

## 🎯 Project Scope

UMKM.AI berfokus pada tiga area utama.

### 1. Business Management

Owner dapat mengelola:

- Produk
- Kategori
- Stok
- Transaksi
- Performa bisnis

### 2. Transaction Management

Cashier dapat melakukan:

- Product selection
- Cart management
- Payment processing
- Transaction recording

### 3. AI-Assisted Business Decision Making

Owner mendapatkan bantuan AI melalui:

- Demand Prediction
- Product Recommendation
- Business Health Insights

---

## 🔒 Security Considerations

UMKM.AI menerapkan beberapa mekanisme keamanan:

- JWT-based authentication
- Password hashing menggunakan bcrypt
- Role-Based Access Control
- Backend authorization middleware
- Protected frontend routes
- Parameterized SQL queries
- Database transaction untuk proses penjualan
- Row locking pada proses pengecekan stok
- Public registration otomatis menggunakan role `cashier`

Frontend hanya digunakan untuk mengontrol tampilan dan navigasi.

Authorization utama tetap dilakukan pada backend sehingga pengguna tidak dapat memperoleh akses Owner hanya dengan mengubah URL atau request dari browser.

---

## 📱 Responsive Design

Frontend dirancang menggunakan responsive layout agar dapat digunakan pada berbagai ukuran layar.

Implementasi responsive meliputi:

- Responsive sidebar
- Mobile navigation
- Responsive dashboard
- Responsive product catalog
- Responsive POS
- Responsive cards
- Responsive tables

---

## 🚀 Application Flow

Flow utama aplikasi:

    UMKM.AI
        │
        ├───────────────────────┐
        │                       │
      OWNER                  CASHIER
        │                       │
    ┌───┴───────┐          ┌────┴─────┐
    │           │          │          │
Management   AI Engine    POS     Transactions
    │           │          │
 ┌──┴───┐    ┌─┴────────┐ │
 │      │    │          │ │
Products Categories Prediction Cart
             Recommendation │
             Business       │
             Insights       │
                            │
                         Payment
                            │
                       Transaction
                            │
                       Stock Update

Customer memiliki flow terpisah melalui katalog produk:

    Customer
       ↓
    Product Catalog
       ↓
    Search / Category Filter
       ↓
    Product Detail
       ↓
    Product Recommendation
       ↓
    AI Product Chatbot

---

## 💡 Design Philosophy

UMKM.AI dirancang berdasarkan beberapa prinsip utama:

### Simple

Antarmuka dibuat sederhana agar mudah digunakan oleh pengguna UMKM.

### Role-Based

Setiap pengguna hanya mendapatkan fitur yang relevan dengan tanggung jawabnya.

### Data-Driven

Informasi bisnis dan AI menggunakan data transaksi serta data produk yang tersimpan pada database.

### AI-Assisted

AI digunakan untuk membantu Owner memahami kondisi bisnis dan mengambil keputusan.

### Secure

Authentication dan authorization diterapkan pada frontend dan backend.

### Responsive

Aplikasi dapat digunakan pada desktop maupun perangkat dengan ukuran layar yang lebih kecil.

---

## 🔮 Future Development

Beberapa pengembangan yang dapat dilakukan di masa mendatang:

- Advanced sales forecasting
- Customer loyalty system
- Automated promotional campaigns
- Advanced inventory optimization
- Payment gateway integration
- Sales report export
- PDF invoice generation
- Advanced conversational AI analytics
- Multi-store management
- Real-time notification
- Cloud deployment

---

## 👥 User Types

### Owner

Business owner yang bertanggung jawab terhadap pengelolaan produk, kategori, transaksi, dan analisis bisnis.

### Cashier

Staff yang bertanggung jawab terhadap proses transaksi penjualan menggunakan POS.

### Customer

Pengguna yang melihat katalog produk dan dapat menggunakan chatbot AI untuk memperoleh informasi mengenai produk.

---

## 📄 License

Project ini dibuat untuk kebutuhan pembelajaran dan project akademik.

---

## 🙌 UMKM.AI

UMKM.AI menggabungkan Business Management, Point of Sale, Inventory Awareness, dan Artificial Intelligence dalam satu platform.

Platform ini membantu UMKM dalam menjalankan operasional sehari-hari sekaligus menyediakan informasi berbasis data untuk membantu Owner mengambil keputusan bisnis dengan lebih efektif.
