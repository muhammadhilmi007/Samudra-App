# API Documentation (Postman Collection)

Berikut adalah dokumentasi API untuk endpoint autentikasi (`auth`) pada aplikasi ini. Anda dapat mengimpor file ini ke Postman sebagai dokumentasi dan pengujian API.

## Collection: Auth API

### 1. Register (GET)
- **URL:** `/auth/register`
- **Method:** GET
- **Description:** Menampilkan halaman registrasi user.
- **Auth:** Tidak diperlukan

### 2. Register (POST)
- **URL:** `/auth/register`
- **Method:** POST
- **Description:** Mendaftarkan user baru.
- **Body:**
  - `name` (string)
  - `email` (string)
  - `password` (string)
  - `branch_id` (string)
  - `division_id` (string)
  - `position_id` (string)
- **Auth:** Tidak diperlukan

### 3. Login (GET)
- **URL:** `/auth/`
- **Method:** GET
- **Description:** Menampilkan halaman login user.
- **Auth:** Tidak diperlukan

### 4. Authenticate (POST)
- **URL:** `/auth/authenticate`
- **Method:** POST
- **Description:** Autentikasi user dan membuat session login.
- **Body:**
  - `email` (string)
  - `password` (string)
- **Auth:** Tidak diperlukan

### 5. Logout (POST)
- **URL:** `/auth/logout`
- **Method:** POST
- **Description:** Logout user dan menghapus session.
- **Auth:** Diperlukan (user harus login)

### 6. Reset Password (GET)
- **URL:** `/auth/reset-password`
- **Method:** GET
- **Description:** Menampilkan halaman reset password.
- **Auth:** Tidak diperlukan

---

## Cara Import ke Postman
1. Salin dokumentasi ini ke file `.md` atau buat file Postman Collection (JSON) sesuai endpoint di atas.
2. Di Postman, pilih `Import` lalu pilih file yang sudah dibuat.
3. Sesuaikan environment dan base URL sesuai konfigurasi aplikasi Anda.

---

Jika Anda ingin file Postman Collection dalam format JSON, silakan minta lebih lanjut.
