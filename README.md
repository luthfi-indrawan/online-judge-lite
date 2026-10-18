# Online Judge Lite — Frontend

Frontend React + TypeScript untuk Online Judge Lite, mengikuti `PRD.md` dan `API_CONTRACT.md` yang diberikan.

## Stack

- React 19 + TypeScript + Vite
- React Router
- Monaco Editor untuk editor C/C++
- Supabase JS untuk upload PDF langsung dari browser
- Papa Parse untuk impor CSV
- Axios untuk integrasi REST API
- CSS responsif custom (tanpa Tailwind build dependency)

## Menjalankan lokal

Prasyarat: Node.js 20.19+ atau 22.12+ (disarankan Node.js 22/24) dan backend yang berjalan.

```bash
npm install
cp .env.example .env
npm run dev
```

Buka URL yang dicetak Vite, biasanya `http://localhost:5173`.

## Environment

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_SUPABASE_BUCKET=problems
```

`VITE_SUPABASE_*` hanya diperlukan untuk upload PDF dari halaman Admin. Bucket Storage dan policy upload harus dikonfigurasi di Supabase. Jangan pernah menaruh `service_role` key di frontend.

## Fitur

### Semua user
- Login JWT dan pemeriksaan profil via `/auth/me`
- Dashboard dan daftar problem group
- Status grup berdasarkan field server `UPCOMING`, `ONGOING`, `ENDED`
- Detail grup dan daftar problem
- Workspace problem dengan PDF viewer, Monaco Editor, pilihan C/C++, sample test cases, submit dan polling verdict
- Scoreboard matrix dengan warna First Blood, Accepted, Attempted, dan Not Attempted

### Admin
- Buat akun individual, reset password, impor CSV bulk
- Buat problem group dan jadwal
- Buat problem, unggah PDF ke Supabase Storage, tentukan time/memory limit
- Tambah test case dan pilih apakah sample case boleh terlihat peserta

## Endpoint yang dipakai

Mengacu pada API Contract:

- `POST /auth/login`, `GET /auth/me`
- `GET /problem-groups`, `GET /problem-groups/:id`, `POST /problem-groups`
- `POST /admin/users`, `POST /admin/users/bulk`, `PUT /admin/users/:id/reset-password`
- `POST /problems`, `GET /problems/:id`, `POST /problems/:id/test-cases`
- `POST /submissions`, `GET /submissions/:id`
- `GET /scoreboards/groups/:group_id`

## Catatan integrasi API

1. Contract saat ini belum mendefinisikan endpoint daftar akun (`GET /admin/users`) dan riwayat submission pengguna (`GET /submissions/me`). UI mencoba endpoint tersebut untuk melengkapi tabel Admin dan aktivitas dashboard. Jika backend belum memilikinya, tambahkan endpoint tersebut atau sesuaikan frontend dengan endpoint list yang benar. Dashboard tetap dapat dipakai jika riwayat submission tidak tersedia.
2. `GET /problem-groups/:id` diharapkan mengembalikan `problems` sebagaimana kontrak.
3. `GET /problems/:id` mengembalikan hanya sample test cases, bukan hidden cases.
4. `POST /submissions` mengembalikan `submission_id`, `status`, dan `submitted_at`. Frontend melakukan polling ke `GET /submissions/:id` setiap 1,5 detik sampai verdict final (maksimal sekitar 135 detik).
5. Respons API harus mengikuti envelope `{ success, message, data, error }` sesuai kontrak.
6. Token disimpan pada `localStorage` dengan key `oj_token`; ringkasan profil menggunakan `oj_user`.

## Deployment SPA

Konfigurasikan host agar semua route selain file statis diarahkan ke `index.html` (SPA fallback). Tanpa fallback, membuka `/groups/1` secara langsung dapat menghasilkan 404 dari hosting.

## Build

```bash
npm run build
npm run preview
```

Hasil produksi tersedia di `dist/`.
