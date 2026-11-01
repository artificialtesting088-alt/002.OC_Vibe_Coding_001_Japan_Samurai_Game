export type NpcDef = {
  id: string
  model: string
  name: string
  role: string
  position: [number, number]
  lines: string[]
}

export const NPCS: NpcDef[] = [
  {
    id: 'kenshin',
    model: 'samurai',
    name: 'Kapten Kenshin',
    role: 'Penjaga Gerbang',
    position: [-6.5, 7],
    lines: [
      'Berhenti, pengelana. Angin malam ini membawa bau hujan dan besi.',
      'Gerbang torii di utara menuju kuil tua. Jangan menyinggung arwah yang tertidur di sana.',
      'Jika kau mendengar lonceng tanpa arah, jangan menoleh. Terus berjalan.',
    ],
  },
  {
    id: 'aoi',
    model: 'woman',
    name: 'Pendeta Aoi',
    role: 'Penjaga Kuil',
    position: [4.5, -2],
    lines: [
      'Selamat datang di Jalan Angin. Kau datang tepat saat kelopak sakura mulai gugur.',
      'Aku merawat lentera-lentera ini agar jiwa yang tersesat menemukan jalan pulang.',
      'Bila kau menemukan batu berlumut di balik pagoda, bawalah kembali kepadaku.',
    ],
  },
  {
    id: 'jiro',
    model: 'farmer',
    name: 'Jiro',
    role: 'Petani Lembah',
    position: [-9, -16],
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
    lines: [
      'Jejak kaki di tanah basah itu bukan milik hewan. Ada yang mengawasi kita.',
      'Anak panahku tinggal tiga. Sisanya tertinggal di punggung babi hutan minggu lalu.',
      'Pohon-pohon di timur tinggi dan rimbun. Tempat sempurna untuk menyergap.',
    ],
  },
  {
    id: 'gen',
    model: 'elderly-man',
    name: 'Tetua Gen',
    role: 'Penjaga Pagoda',
    position: [-4, -30],
    lines: [
      'Ssst. Jangan berisik. Aku baru melihat cahaya bergerak di antara pepohonan.',
      'Pagoda itu kosong selama bertahun-tahun, tapi tadi malam ada suara genderang.',
      'Aku akan mengawasi dari sini. Kau periksa bagian belakang pagoda.',
    ],
  },
  {
    id: 'raja',
    model: 'king',
    name: 'Pangeran Noboru',
    role: 'Penguasa Lembah',
    position: [5, -33],
    lines: [
      'Kau berjalan jauh hanya untuk menemui seorang pangeran tanpa takhta?',
      'Lembah ini dulu makmur. Kini hanya angin yang tersisa untuk rakyatku.',
      'Temukan pedang yang hilang di balik pagoda, dan aku akan membuka jalan ke kuil.',
    ],
  },
]
