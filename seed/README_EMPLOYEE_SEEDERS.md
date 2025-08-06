# Panduan Penggunaan Employee Seeders

Dokumen ini menjelaskan cara menggunakan file seeder untuk membuat data karyawan contoh pada aplikasi Samudra ERP.

## Prasyarat

Sebelum menjalankan seeder karyawan, pastikan:

1. Database MongoDB sudah berjalan
2. File `.env` sudah dikonfigurasi dengan benar
3. Data awal (branches, divisions, positions, users) sudah di-seed menggunakan `initializeData.js`

## File Seeder yang Tersedia

Terdapat empat file seeder untuk karyawan:

1. `seedEmployees.js` - Seeder dasar yang membuat karyawan berdasarkan user yang sudah ada
2. `seedSampleEmployees.js` - Membuat 5 karyawan dengan data yang sudah ditentukan
3. `seedRandomEmployees.js` - Membuat sejumlah karyawan dengan data acak
4. `runAllEmployeeSeeders.js` - Menjalankan semua seeder karyawan secara berurutan

## Cara Menjalankan Seeder

### 1. Menjalankan Semua Seeder Sekaligus

Untuk menjalankan semua seeder karyawan secara berurutan, jalankan:

```bash
node seed/runAllEmployeeSeeders.js
```

Ini akan menjalankan:
1. `seedEmployees.js` - Membuat karyawan dari user yang ada
2. `seedSampleEmployees.js` - Membuat 5 karyawan dengan data tertentu
3. `seedRandomEmployees.js` - Membuat 20 karyawan dengan data acak

### 2. Seeder Karyawan Dasar

Untuk membuat karyawan berdasarkan user yang sudah ada, jalankan:

```bash
node seed/seedEmployees.js
```

Seeder ini akan membuat karyawan untuk setiap user yang belum memiliki data karyawan.

### 3. Seeder Karyawan Contoh

Untuk membuat 5 karyawan dengan data yang sudah ditentukan, jalankan:

```bash
node seed/seedSampleEmployees.js
```

Seeder ini akan membuat karyawan dengan data lengkap termasuk:
- Data pribadi (nama, tanggal lahir, jenis kelamin, status pernikahan)
- Alamat dan kontak
- Dokumen (KTP, SIM, NPWP, BPJS)
- Riwayat pelatihan dengan berbagai status
- Riwayat pekerjaan
- Log aktivitas

### 4. Seeder Karyawan Acak

Untuk membuat sejumlah karyawan dengan data acak, jalankan:

```bash
node seed/seedRandomEmployees.js
```

Secara default, seeder ini akan membuat 20 karyawan dengan data acak. Jika ingin mengubah jumlah karyawan yang dibuat, buka file `seedRandomEmployees.js` dan ubah parameter pada baris terakhir:

```javascript
// Ubah angka 20 sesuai kebutuhan
seedRandomEmployees(20);
```

## Informasi Login

Setiap karyawan yang dibuat akan memiliki akun user dengan:
- Username: `firstname.lastname` (huruf kecil)
- Password: `P@ssw0rd!`

## Struktur Data Karyawan

Data karyawan yang dibuat mengikuti struktur dari schema `employeeSchema.js` dengan field-field berikut:

### Data Pribadi
- `firstname` - Nama depan
- `lastname` - Nama belakang
- `gender` - Jenis kelamin (Male/Female)
- `birthdate` - Tanggal lahir
- `maritalStatus` - Status pernikahan

### Dokumen Identitas
- `noKTP` - Nomor KTP
- `noSIM` - Nomor SIM (opsional)

### Alamat dan Kontak
- `address` - Alamat lengkap (jalan, kota, kecamatan, provinsi, kode pos)
- `contact` - Informasi kontak (telepon, telepon darurat, email)

### Informasi Pekerjaan
- `employeeCode` - Kode karyawan (otomatis dibuat)
- `branch` - Cabang
- `division` - Divisi
- `position` - Jabatan
- `joinDate` - Tanggal bergabung
- `status` - Status karyawan (Active, Resigned, Mutated)

### Dokumen
Array dokumen dengan informasi:
- `type` - Jenis dokumen (KTP, SIM, NPWP, BPJS, dll)
- `number` - Nomor dokumen
- `issuedDate` - Tanggal penerbitan
- `expiryDate` - Tanggal kedaluwarsa (opsional)

### Riwayat Pelatihan
Array pelatihan dengan informasi:
- `title` - Judul pelatihan
- `provider` - Penyelenggara pelatihan
- `date` - Tanggal pelatihan
- `duration` - Durasi pelatihan
- `isRequired` - Apakah wajib (true/false)
- `status` - Status pelatihan (planned, ongoing, completed, expired)

### Riwayat Pekerjaan
Array riwayat pekerjaan dengan informasi:
- `position` - Jabatan
- `branch` - Cabang
- `division` - Divisi
- `startDate` - Tanggal mulai
- `endDate` - Tanggal berakhir (opsional)
- `reason` - Alasan perubahan

### Log Aktivitas
Array log dengan informasi:
- `action` - Jenis aktivitas
- `date` - Tanggal aktivitas
- `description` - Deskripsi aktivitas
- `changedBy` - User yang melakukan perubahan

## Catatan Penting

1. Seeder akan memeriksa apakah karyawan sudah ada sebelum membuat yang baru (berdasarkan user ID)
2. Seeder akan membuat user baru jika belum ada user dengan email yang sama
3. Seeder akan membuat direktori untuk foto karyawan dan sertifikat jika belum ada