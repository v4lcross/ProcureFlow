# ProcureFlow — Sistem Aliran Kelulusan Purchase Requisition (PR) v2.0

**ProcureFlow** ialah aplikasi web pengurusan dan penghalaan kelulusan **Purchase Requisition (PR)** mengikut aliran kerja Malaysia (**Waktu Malaysia — `MYT UTC+8`**). Sistem ini dibina untuk mempercepatkan proses semakan dan tandatangan borang PR yang telah diluluskan awal di Coda supaya tidak lagi tertangguh secara manual.

Setiap PR baharu bermula di **Level 0 (Giliran Buyer)** dan bergerak secara berurutan melalui **3 tahap kelulusan (`Level 1 → Level 2 → Level 3`)**, lengkap dengan panel semakan sisi (**Side Viewing Drawer**), fungsi peringatan terus kepada pelulus (**Remind Approver**), penjejak masa **SLA 24 Jam**, halaman **Admin Roles** untuk menetapkan tahap kelulusan berdasarkan e-mel Google/Gmail pengguna, serta penyegerakan masa nyata menggunakan **Firebase Authentication & Cloud Firestore (`asia-southeast1`)**.

---

## 🎯 Matlamat Utama Sistem

1. **Kelulusan Pantas (< 24 Jam):** Memendekkan tempoh kelulusan PR dalaman daripada beberapa hari kepada bawah 24 jam melalui penjejakan SLA masa nyata (`SLA On Track`, `SLA At Risk`, dan `SLA Overdue`).
2. **Kawalan Penuh di Level 0 (Buyer Queue):** Semua PR baharu (sama ada dimasukkan secara manual melalui `+ New PR` atau disegerakkan dari Coda) bermula sebagai `Level 0: Fresh PR` di bawah kawalan Buyer sebelum dihantar ke Level 1.
3. **Pengesanan Peranan Automatik Ikut E-mel Log Masuk:** Pengguna wajib log masuk menggunakan akaun Google/Gmail terlebih dahulu. Sistem akan menetapkan **Active Perspective** secara automatik mengikut tahap (`Level 0`, `Level 1`, `Level 2`, atau `Level 3`) yang telah ditetapkan oleh Admin.
4. **Peringatan Tepat Mengikut Tahap Semasa:** Buyer boleh menghantar peringatan (*Remind*) terus kepada pelulus yang sedang memegang PR tersebut pada waktu itu (`L1`, `L2`, atau `L3`).
5. **Jejak Audit Waktu Malaysia (`MYT UTC+8`) yang Kekal:** Setiap tindakan (cipta PR, hantar, lulus, pulangkan semula kepada Buyer, tolak, muat naik sebut harga baharu, atau hantar peringatan) direkodkan secara kronologi dengan cap masa Malaysia (`DD/MM/YYYY, HH:mm:ss MYT`).

---

## 🔐 Aliran Log Masuk Google & Pengurusan Peranan (`Admin Roles`)

1. **Skrin Log Masuk Wajib (*Sign In to ProcureFlow*):**
   * Apabila pengguna membuka aplikasi, halaman log masuk akan dipaparkan terlebih dahulu.
   * Pengguna perlu log masuk menggunakan butang **Sign In with Google (Gmail)**.
   * Di halaman utama, pengguna boleh melihat e-mel yang sedang aktif dan menekan butang **Sign Out** pada bila-bila masa untuk log keluar kembali ke skrin log masuk.
2. **Halaman Admin (`Admin Roles`):**
   * Melalui butang **`Admin Roles`** di bar atas, Admin boleh mendaftarkan alamat e-mel Google/Gmail pengguna berserta nama paparan mereka ke tahap tertentu:
     * **Level 0:** Buyer (Owner / Dispatcher)
     * **Level 1:** Initial Reviewer / Doc Checker
     * **Level 2:** Head Unit Reviewer
     * **Level 3:** GGM, GCAS (Final Signoff)
   * Jika tiada e-mel ditetapkan untuk sesuatu tahap, ruangan nama pada tahap tersebut akan dibiarkan kosong (*Unassigned*).
3. **Paparan *Active Perspective* Secara Automatik:**
   * Sebaik sahaja pengguna yang telah didaftarkan log masuk menggunakan Google, nama dan tahap mereka akan dipaparkan secara automatik pada **Active Perspective**, sepanduk peranan, carta aliran kelulusan (*Sequential Approval Pipeline*), sijil kelulusan, dan jejak audit.
   * Jika e-mel pengguna yang log masuk belum ditetapkan ke Level 1, 2, atau 3, sistem akan menetapkan mereka secara lalai sebagai **Buyer (Level 0 - Owner)**.

---

## 🏛️ Hierarki & Aliran Kerja Kelulusan Berurutan

| Tahap | Gelaran Peranan | Pelulus Ganti (*Backup / Deputy*) | Tindakan Utama yang Dibenarkan | Status PR yang Dihasilkan |
| :--- | :--- | :--- | :--- | :--- |
| **Level 0** | **Buyer (Owner / Dispatcher)** | Hafizah (Backup Buyer) | Masukkan `+ New PR`, *Quick Coda Sync*, semak dokumen di *Side Viewing*, muat naik sebut harga baharu (`v2`), hantar ke L1, & hantar peringatan ke L1/L2/L3 | `Level 0: Fresh PR` / `Returned to Buyer` |
| **Level 1** | **Initial Reviewer / Doc Checker** | Deputy Doc Checker (Level 1) | Semak sebut harga vendor & log Coda, **Approve** (hantar ke L2), **Return to Buyer** (wajib isi sebab), atau **Reject** | `Pending L1 (Doc Checker)` |
| **Level 2** | **Head Unit Reviewer** | Deputy Head Unit (Level 2) | Sahkan bajet jabatan & justifikasi perniagaan, **Approve** (hantar ke L3 atau terus *Fast-Track*), **Return to Buyer**, atau **Reject** | `Pending L2 (Head Unit)` |
| **Level 3** | **GGM, GCAS (Final Signoff)** | Acting GGM, GCAS (Level 3) | Tandatangan kelulusan akhir eksekutif (**Approve Final Signoff**), **Return to Buyer**, atau **Reject** | `Fully Approved` / `Rejected` |

---

## ✨ Ciri-Ciri Utama Aplikasi

### 1. Kemasukan PR Baharu (`+ New PR`) & Giliran Level 0
* **Borang Kemasukan PR Manual (`+ New PR`):** Buyer boleh memasukkan butiran PR baharu secara lengkap (`PR No.`, `Total Cost (MYR)`, `Budget Ref. No.`, `Requisition Title`, `Department / Unit`, `Requestor`, `Vendor Name`, `GL Account Code`, `Coda PR Ref.`, `Quotation Ref. & Validity Date`, lampiran PDF sebut harga, serta `Business Justification`).
* **2 Pilihan Simpanan:** Simpan ke dalam giliran `Level 0: Fresh PR` untuk semakan lanjut, atau **Save & Submit to Level 1** untuk terus memulakan aliran kelulusan.
* **Quick Coda Sync (`L0`):** Butang simulasi satu klik untuk mengimport PR pra-lulus daripada Coda terus ke giliran Level 0.

### 2. Panel Semakan Sisi (*Side Viewing Drawer*) & Paparan *Split View*
* Klik pada mana-mana baris PR di jadual utama untuk membuka panel **Side Viewing** di sebelah kanan tanpa meninggalkan halaman utama.
* **Perbandingan *Split View* Sebaris:** Buka kandungan penuh sebut harga vendor (senarai item & harga) atau log kelulusan Coda secara terus di dalam panel untuk menyemak silang `GL Account Code`, `Budget Ref. No.`, tarikh sah sebut harga, dan jumlah kos (`MYR`).
* **Perbandingan Pembetulan (*Resubmitted • Amended*):** Apabila PR yang dipulangkan telah diperbetulkan oleh Buyer dan dihantar semula, pelulus dapat melihat perbandingan sebelah-menyebelah antara *Sebab Dipulangkan Sebelum Ini* dengan *Nota Pembetulan & Fail Sebut Harga Baharu Buyer*.

### 3. Kelulusan 3-Tahap, Pulangan Semula (*Return to Buyer*) & Muat Naik Sebut Harga v2
* Menguatkuasakan aliran berurutan sepenuhnya (`L0 → L1 → L2 → L3 → Fully Approved`).
* Jika pelulus memilih **Return to Buyer** atau **Reject**, sistem mewajibkan pengisian ulasan/sebab (*mandatory remarks*) sebelum tindakan boleh diteruskan.
* Bagi PR berstatus `Returned to Buyer`, Buyer boleh memuat naik fail PDF sebut harga baharu (**Revised Quotation v2**) dan menulis nota pembetulan sebelum menghantar semula ke Level 1.

### 4. Peringatan Pelulus (*Remind Approver*) & Tindakan Pukal (*Batch Operations*)
* **Peringatan Mengikut Tahap Aktif:** Sistem mengenal pasti secara automatik siapa pelulus yang sedang memegang PR (`L1`, `L2`, atau `L3`), menghantar notifikasi peringatan, dan merekodkannya ke dalam **Audit Trail (MYT UTC+8)**.
* **Tindakan Pukal (*Batch Action Bar*):** Tandakan (*checkbox*) beberapa PR serentak di jadual untuk melakukan **Batch Submit to L1**, **Batch Remind Approvers**, atau **Batch Approve Selected**.

### 5. Peraturan Aliran Kerja: Pelulus Ganti (*Delegation*) & *Fast-Track* Kos
* **Out-of-Office / Backup Approver Delegation:** Aktifkan wakil/timbalan pelulus untuk Level 1, Level 2, atau Level 3 sekiranya pelulus utama bercuti supaya proses kelulusan tidak tergendala.
* **Laluan Pantas Kos Bawah Had (`< RM 25,000`):** Pilihan peraturan tadbir urus di mana PR bernilai di bawah RM 25,000 terus mendapat status `Fully Approved` sebaik sahaja diluluskan oleh Level 2 (Head Unit) tanpa perlu menunggu Level 3.

### 6. Sijil Kelulusan Rasmi & Eksport Laporan CSV
* **Sijil Kelulusan (*Official Certificate*):** Jana, cetak, atau muat turun sijil pengesahan kelulusan PR yang memaparkan cop pengesahan digital setiap tahap (`L0`, `L1`, `L2`, `L3`) beserta cap masa Malaysia.
* **Eksport CSV:** Muat turun keseluruhan rekod PR dan jumlah jejak audit ke dalam fail laporan `.csv`.

---

## 🗄️ Struktur Pangkalan Data Cloud Firestore (`firebase-blueprint.json`)

Semua data disegerakkan secara masa nyata ke **Cloud Firestore (`asia-southeast1`)** dan turut disimpan di `localStorage` pelayar sebagai sandaran:

| Laluan Koleksi (*Collection Path*) | Skema Entiti | Penerangan |
| :--- | :--- | :--- |
| `/requisitions/{prId}` | `Requisition` | Menyimpan maklumat utama PR, status semasa (`LEVEL_0_FRESH` hingga `FULLY_APPROVED`), `costCenter` (No. Rujukan Bajet), maklumat fail sebut harga, ulasan pulangan/penolakan, dan rekod pembetulan Buyer. |
| `/requisitions/{prId}/auditLogs/{logId}` | `AuditLog` | Subkoleksi yang menyimpan sejarah jejak audit waktu Malaysia (`MYT UTC+8`) yang kekal dan tidak boleh diubah (`IMPORT`, `SUBMIT_L1`, `APPROVE_L1`, `APPROVE_L2`, `APPROVE_L3`, `RETURN_TO_BUYER`, `REJECT`, `REMINDER`, `DOC_UPLOAD`). |
| `/roleAssignments/{assignmentId}` | `RoleAssignment` | Menyimpan penetapan e-mel pengguna Google/Gmail kepada tahap peranan (`L0`, `L1`, `L2`, `L3`) yang dibuat melalui halaman **Admin Roles**. |

---

## ⌨️ Kekunci Pintas Papan Kekunci (*Keyboard Shortcuts*)

Semasa menyemak senarai PR di papan pemuka utama (di luar ruangan input teks):

| Kekunci | Fungsi |
| :--- | :--- |
| `↑` / `↓` (atau `K` / `J`) | Bergerak ke atas/bawah dalam senarai PR & kemas kini paparan *Side Viewing Drawer* |
| `S` | **Submit for Approval (Level 1)** *(apabila Buyer sedang membuka PR Level 0 / Returned)* |
| `A` | **Approve & Route to Next Level** *(apabila Pelulus sedang membuka PR pada tahapnya)* |
| `R` | Buka tetingkap **Return to Buyer (Level 0)** *(apabila Pelulus sedang menyemak PR aktif)* |
| `M` | Hantar **Peringatan kepada Pelulus Semasa** *(untuk PR yang sedang dalam aliran L1/L2/L3)* |
| `Esc` | Tutup tetingkap modal aktif atau tutup *Side Viewing Drawer* |

---

## 🛠️ Teknologi & Susunan Fail Projek

* **Antaramuka (*Frontend*):** React 19 + TypeScript + Vite
* **Pengesahan & Pangkalan Data Awan:** Firebase Authentication (Google Sign-In) + Cloud Firestore (`asia-southeast1`)
* **Gaya Visual (*Styling*):** Tailwind CSS v4 (`Plus Jakarta Sans` & `JetBrains Mono`)
* **Ikon:** Lucide React
* **Keselamatan Peraturan Firestore:** `@firebase/eslint-plugin-security-rules`

```text
├── index.html
├── metadata.json
├── package.json
├── README.md                           # Dokumentasi projek dalam Bahasa Melayu
├── firebase-applet-config.json         # Konfigurasi projek Firebase & pangkalan data Firestore
├── firebase-blueprint.json             # Pelan skema entiti & koleksi Firestore
├── firestore.rules                     # Peraturan keselamatan Zero-Trust Cloud Firestore
├── firestore.rules.test.ts             # Ujian keselamatan peraturan Firestore
├── security_spec.md                    # Spesifikasi keselamatan data & kawalan akses
├── eslint.config.mjs                   # Konfigurasi ESLint untuk peraturan keselamatan Firestore
└── src/
    ├── main.tsx
    ├── index.css
    ├── firebase.ts                     # Fungsi sambungan Firebase Auth, Firestore & pengendali ralat
    ├── App.tsx                         # Halaman log masuk, papan pemuka utama & penyegerakan masa nyata
    ├── types/
    │   └── pr.ts                       # Definisi jenis data TypeScript (PR, AuditLog, RoleAssignment)
    ├── data/
    │   └── initialPRs.ts               # Data sampel PR, definisi tahap L0-L3 & pemformat masa MYT
    └── components/
        ├── AdminRolePage.tsx           # Halaman Admin untuk menetapkan e-mel pengguna ke L0/L1/L2/L3
        ├── StatusBadge.tsx             # Lencana status PR, penunjuk kemajuan 4-tahap & lencana SLA 24j
        ├── SideViewingDrawer.tsx       # Panel semakan sisi, pratonton dokumen Split View & garis masa audit
        └── Modals.tsx                  # Tetingkap modal (+ New PR, Return, Reject, Remind, Sijil & Peraturan)
```

---

## 🚀 Cara Menjalankan Projek Secara Lokal

1. **Pasang pakej kebergantungan (*dependencies*):**
   ```bash
   npm install
   ```

2. **Jalankan pelayan pembangunan (*development server* pada port 3000):**
   ```bash
   npm run dev
   ```

3. **Semak peraturan keselamatan Firestore & kod TypeScript:**
   ```bash
   npx eslint firestore.rules
   npm run lint
   ```

4. **Bina aplikasi untuk produksi (*production build*):**
   ```bash
   npm run build
   ```
