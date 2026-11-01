export type NpcDef = {
  id: string
  model: 'samurai' | 'ninja'
  name: string
  role: string
  position: [number, number]
  tint?: string
  scale?: number
  lines: string[]
}

export const NPCS: NpcDef[] = [
  {
    id: 'kenshin',
    model: 'samurai',
    name: 'Kapten Kenshin',
    role: 'Penjaga Gerbang',
    position: [-6.5, 7],
    tint: '#c4b49c',
    scale: 1.03,
    lines: [
      'Berhenti, pengelana. Angin malam ini membawa bau hujan dan besi.',
      'Gerbang torii di utara menuju kuil tua. Jangan menyinggung arwah yang tertidur di sana.',
      'Jika kau mendengar lonceng tanpa arah, jangan menoleh. Terus berjalan.',
    ],
  },
  {
    id: 'aoi',
    model: 'samurai',
    name: 'Pendeta Aoi',
    role: 'Penjaga Kuil',
    position: [4.5, -2],
    tint: '#c9a6b6',
    scale: 0.93,
    lines: [
      'Selamat datang di Jalan Angin. Kau datang tepat saat kelopak sakura mulai gugur.',
      'Aku merawat lentera-lentera ini agar jiwa yang tersesat menemukan jalan pulang.',
      'Bila kau menemukan batu berlumut di balik pagoda, bawalah kembali kepadaku.',
    ],
  },
  {
    id: 'jiro',
    model: 'samurai',
    name: 'Jiro',
    role: 'Petani Lembah',
    position: [-9, -16],
    tint: '#b7a681',
    scale: 0.93,
    lines: [
      'Sawah kami kering sejak bulan lalu. Bahkan bambu pun enggan bersuara.',
      'Kudengar ada bandit berkemah di balik bukit timur. Hati-hati, samurai.',
      'Kalau kau lapar, singgah saja. Nasi kami tak banyak, tapi cukup untuk dibagi.',
    ],
  },
  {
    id: 'rin',
    model: 'ninja',
    name: 'Rin',
    role: 'Pemburu',
    position: [8, -22],
    tint: '#a9bcc6',
    scale: 0.94,
    lines: [
      'Jejak kaki di tanah basah itu bukan milik hewan. Ada yang mengawasi kita.',
      'Anak panahku tinggal tiga. Sisanya tertinggal di punggung babi hutan minggu lalu.',
      'Pohon-pohon di timur tinggi dan rimbun. Tempat sempurna untuk menyergap.',
    ],
  },
  {
    id: 'gen',
    model: 'samurai',
    name: 'Tetua Gen',
    role: 'Penjaga Pagoda',
    position: [-4, -30],
    tint: '#c0bdb4',
    scale: 0.88,
    lines: [
      'Ssst. Jangan berisik. Aku baru melihat cahaya bergerak di antara pepohonan.',
      'Pagoda itu kosong selama bertahun-tahun, tapi tadi malam ada suara genderang.',
      'Aku akan mengawasi dari sini. Kau periksa bagian belakang pagoda.',
    ],
  },
  {
    id: 'noboru',
    model: 'samurai',
    name: 'Pangeran Noboru',
    role: 'Penguasa Lembah',
    position: [5, -33],
    tint: '#d0b77c',
    scale: 1.04,
    lines: [
      'Kau berjalan jauh hanya untuk menemui seorang pangeran tanpa takhta?',
      'Lembah ini dulu makmur. Kini hanya angin yang tersisa untuk rakyatku.',
      'Temukan pedang yang hilang di balik pagoda, dan aku akan membuka jalan ke kuil.',
    ],
  },
  {
    id: 'hana',
    model: 'samurai',
    name: 'Hana',
    role: 'Tabib Desa',
    position: [-17, 10],
    tint: '#d0a0ad',
    scale: 0.9,
    lines: [
      'Ramuan ini pahit, tapi jauh lebih baik daripada demam yang menggerogoti.',
      'Bila kau terluka di jalan, kembali ke sini sebelum luka itu membusuk.',
      'Angin dari utara membawa penyakit. Tutup luka dan jangan tidur di tanah basah.',
    ],
  },
  {
    id: 'taro',
    model: 'samurai',
    name: 'Taro',
    role: 'Penebang Kayu',
    position: [17, 12],
    tint: '#b3a078',
    scale: 0.97,
    lines: [
      'Kapakku sudah tiga kali patah di hutan barat. Kayunya keras, seperti hati tuanku.',
      'Jangan lewat jalur sempit itu saat senja. Batu-batu di sana mudah longsor.',
      'Kalau kau butuh pegangan pedang baru, cari aku setelah matahari terbit.',
    ],
  },
  {
    id: 'yuki',
    model: 'ninja',
    name: 'Yuki',
    role: 'Pengintai',
    position: [16, -15],
    tint: '#b6c8d4',
    scale: 0.92,
    lines: [
      'Aku menghitung sembilan orang bersenjata menyeberangi sungai tadi malam.',
      'Mereka tidak menyalakan api. Orang yang takut dilihat tidak butuh kehangatan.',
      'Jangan percaya pada jalan yang terlalu terang. Cahaya bisa jadi umpan.',
    ],
  },
  {
    id: 'sora',
    model: 'ninja',
    name: 'Sora',
    role: 'Kurir Rahasia',
    position: [-16, -14],
    tint: '#c3ad96',
    scale: 0.9,
    lines: [
      'Surat ini harus sampai ke pagoda sebelum fajar. Kakiku sudah tak bisa berlari lebih jauh.',
      'Ambil jalur di balik bambu. Penjaga di jalan utama sedang mencari seseorang.',
      'Jika kau bertemu pria berpayung hitam, jangan sebut namaku.',
    ],
  },
  {
    id: 'kaito',
    model: 'samurai',
    name: 'Kaito',
    role: 'Ronin',
    position: [-11, -20],
    tint: '#a0aab2',
    scale: 1.01,
    lines: [
      'Seorang samurai tanpa tuan hanyalah bayangan yang menolak menghilang.',
      'Pedangku tidak lagi melayani siapa pun. Tapi masih bisa melindungi yang lemah.',
      'Kau masih muda. Jangan habiskan hidupmu mengejar kehormatan orang lain.',
    ],
  },
  {
    id: 'mei',
    model: 'samurai',
    name: 'Mei',
    role: 'Perawat Lentera',
    position: [11, -24],
    tint: '#d1ae8b',
    scale: 0.94,
    lines: [
      'Setiap lentera di jalan ini punya nama. Yang padam berarti ada yang lupa pulang.',
      'Malam ini tiga lentera mati sekaligus. Aku tidak berani menyalakannya sendiri.',
      'Tolong periksa lentera di balik pagoda. Jika apinya biru, segera kembali.',
    ],
  },
]
