// data.js — Konfigurasi statis KYB Partner Scoring Tool
// Berisi: definisi variabel & bobot penilaian, tabel skema tiering, dan config Firebase.
// TIDAK ADA LOGIKA di file ini — hanya data.

// ====== GANTI DENGAN CONFIG FIREBASE ANDA SENDIRI ======
// Ambil dari Firebase Console -> Project Settings -> General -> Your apps -> SDK setup and configuration
const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
// ==========================================================

const PILLARS = [
  { key: 'industri', title: 'Industri', vars: [
    { id: 'industri', label: 'Kategori industri partner', weight: 30, bobot: 100, options: [
      { poin: 5, label: 'Bank' },
      { poin: 4, label: 'Fintech berizin OJK / BI (payment, lending)' },
      { poin: 3, label: 'E-Commerce' },
      { poin: 2, label: 'Multifinance' },
      { poin: 2, label: 'Sekuritas' },
      { poin: 1, label: 'Keagenan / merchant individual' },
    ]},
  ]},
  { key: 'financial', title: 'Financial', vars: [
    { id: 'current_ratio', label: 'Current Ratio', weight: 4.2, bobot: 15, options: [
      { poin: 5, label: '> 2' },
      { poin: 4, label: '1.5 – 1.99' },
      { poin: 3, label: '1 – 1.49' },
      { poin: 2, label: '0.75 – 0.99' },
      { poin: 1, label: '< 0.75' },
    ]},
    { id: 'total_aset', label: 'Total Aset', weight: 2.8, bobot: 10, options: [
      { poin: 5, label: '> 70 Triliun' },
      { poin: 4, label: '40 Triliun – 70 Triliun' },
      { poin: 3, label: '14 Triliun – 40 Triliun' },
      { poin: 2, label: '6 Triliun – 14 Triliun' },
      { poin: 1, label: '< 1 Triliun' },
    ]},
  ]},
  { key: 'nonfinancial', title: 'Non-Financial', vars: [
    { id: 'lama_usaha', label: 'Lama usaha', weight: 2.8, bobot: 10, options: [
      { poin: 5, label: '> 10 tahun' },
      { poin: 4, label: '7 – 9 tahun' },
      { poin: 3, label: '4 – 6 tahun' },
      { poin: 2, label: '1 – 3 tahun' },
      { poin: 1, label: '< 1 tahun' },
    ]},
    { id: 'collab_history', label: 'Collaboration history dengan Pegadaian', weight: 2.8, bobot: 10, options: [
      { poin: 5, label: '> 2 tahun aktif bekerja sama' },
      { poin: 4, label: '1 – 2 tahun aktif' },
      { poin: 3, label: '< 1 tahun aktif' },
      { poin: 2, label: 'Sudah initiate contact' },
      { poin: 1, label: 'Belum pernah berinteraksi' },
    ]},
    { id: 'distribusi', label: 'Jangkauan distribusi (followers digital atau jumlah outlet)', weight: 2.8, bobot: 10, options: [
      { poin: 5, label: '> 400rb followers, atau > 500 outlet/cabang' },
      { poin: 4, label: '200rb – 399rb followers, atau 200 – 499 outlet' },
      { poin: 3, label: '100rb – 199rb followers, atau 50 – 199 outlet' },
      { poin: 2, label: '50rb – 99rb followers, atau 10 – 49 outlet' },
      { poin: 1, label: '< 50rb followers, atau < 10 outlet' },
    ]},
  ]},
  { key: 'market', title: 'Market Validation', vars: [
    { id: 'basis_pengguna', label: 'Skala basis pengguna (MAU / nasabah / pelanggan aktif)', weight: 8.4, bobot: 20, options: [
      { poin: 5, label: '> 5 juta' },
      { poin: 4, label: '1 – 5 juta' },
      { poin: 3, label: '100rb – 999rb' },
      { poin: 2, label: '10rb – 99rb' },
      { poin: 1, label: '< 10rb' },
    ]},
    { id: 'volume_transaksi', label: 'Volume transaksi (per bulan)', weight: 4.2, bobot: 10, options: [
      { poin: 5, label: '> Rp 1 triliun' },
      { poin: 4, label: 'Rp 100 miliar – 1 triliun' },
      { poin: 3, label: 'Rp 10 – 99 miliar' },
      { poin: 2, label: 'Rp 1 – 9 miliar' },
      { poin: 1, label: '< Rp 1 miliar' },
    ]},
    { id: 'reputasi', label: 'Reputasi publik (rating aplikasi / Google review)', weight: 4.2, bobot: 10, options: [
      { poin: 5, label: '> 4.8' },
      { poin: 4, label: '4.5 – 4.79' },
      { poin: 3, label: '4.0 – 4.49, atau data tidak tersedia' },
      { poin: 2, label: '3.5 – 3.99' },
      { poin: 1, label: '< 3.5' },
    ]},
    { id: 'partnership_sejenis', label: 'Partnership sejenis (eksklusivitas)', weight: 2.1, bobot: 5, options: [
      { poin: 5, label: 'Tidak ada partner sejenis' },
      { poin: 4, label: 'Sedang proses onboarding partner sejenis' },
      { poin: 3, label: 'Terdapat 1 partner sejenis' },
      { poin: 2, label: 'Terdapat 2 partner sejenis' },
      { poin: 1, label: '> 3 partner sejenis' },
    ]},
  ]},
];

// Skema tiering: fee progresif berdasarkan realisasi volume transaksi per bulan
// setelah channel live. Skala tiap kategori mengikuti langit-langit fee flat-nya.
const TIER_SCHEDULES = {
  strong: [
    { tier: 1, range: '< Rp 200 miliar', fee: '0.2%' },
    { tier: 2, range: 'Rp 200 – 300 miliar', fee: '0.3%' },
    { tier: 3, range: 'Rp 300 – 500 miliar', fee: '0.4%' },
    { tier: 4, range: 'Rp 500 miliar – 1 triliun', fee: '0.45%' },
    { tier: 5, range: '> Rp 1 triliun', fee: '0.5%' },
  ],
  good: [
    { tier: 1, range: '< Rp 75 miliar', fee: '0.1%' },
    { tier: 2, range: 'Rp 75 – 100 miliar', fee: '0.15%' },
    { tier: 3, range: 'Rp 100 – 150 miliar', fee: '0.25%' },
    { tier: 4, range: 'Rp 150 – 250 miliar', fee: '0.3%' },
    { tier: 5, range: '> Rp 250 miliar', fee: '0.4%' },
  ],
  potential: [
    { tier: 1, range: '< Rp 25 miliar', fee: '0.1%' },
    { tier: 2, range: 'Rp 25 – 50 miliar', fee: '0.15%' },
    { tier: 3, range: 'Rp 50 – 75 miliar', fee: '0.2%' },
    { tier: 4, range: 'Rp 100 – 150 miliar', fee: '0.25%' },
    { tier: 5, range: '> Rp 100 miliar', fee: '0.3%' },
  ],
  bad: null,
};
