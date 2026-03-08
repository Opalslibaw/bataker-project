import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const timeline = [
  {
    year: '1800-an',
    place: 'Jerman',
    title: 'Black Peter (Schwarzer Peter)',
    description:
      'Permainan kartu hukuman di mana pemain terakhir yang memegang kartu hitam khusus disebut Black Peter.',
    card: 'K♠',
  },
  {
    year: 'Era Victoria',
    place: 'Inggris & Amerika',
    title: 'Old Maid',
    description:
      'Permainan populer di kalangan keluarga, sering dipakai sebagai ejekan halus kepada perempuan yang tidak menikah.',
    card: 'Q♣',
  },
  {
    year: 'Abad 19–20',
    place: 'Eropa',
    title: 'Drinking Game Dewasa',
    description:
      'Versi awal sering dimainkan di bar sebagai drinking game; pemain yang kalah harus menerima “hukuman” minum.',
    card: 'J♥',
  },
  {
    year: 'Masa Kolonial',
    place: 'Belanda → Hindia Belanda',
    title: 'Masuk ke Nusantara',
    description:
      'Melalui interaksi dengan budaya Belanda, permainan ini menyebar ke Indonesia dan dikenal sebagai “kartu setan”.',
    card: 'Q♠',
  },
  {
    year: 'Versi Modern Indonesia',
    place: 'Indonesia',
    title: 'Jokeran / Kartu Setan',
    description:
      'Kartu Queen diganti Joker; pemain terakhir yang memegang Joker dianggap sial dan menjadi bahan bercandaan.',
    card: '🃏',
  },
]

function useReveal() {
  const [visible, setVisible] = useState({})
  const refs = useRef({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = entry.target.getAttribute('data-key')
            if (key) {
              setVisible((prev) => ({ ...prev, [key]: true }))
            }
          }
        })
      },
      { threshold: 0.2 },
    )

    Object.values(refs.current).forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const getRef = (key) => (el) => {
    if (el) {
      refs.current[key] = el
    }
  }

  return { visible, getRef }
}

export function HistoryPage() {
  const { visible, getRef } = useReveal()

  return (
    <section className="relative space-y-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(241,196,15,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(192,57,43,0.18),transparent_55%)] opacity-70" />
        <div className="absolute inset-4 rounded-3xl border border-amber-900/40 bg-[rgba(23,15,9,0.96)] shadow-[0_0_40px_rgba(0,0,0,0.7)]" />
      </div>

      <div className="pointer-events-none absolute -left-6 top-8 hidden h-24 w-16 rotate-[-15deg] rounded-xl border border-amber-500/60 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 opacity-80 shadow-xl md:block" />
      <div className="pointer-events-none absolute -right-4 bottom-10 hidden h-24 w-16 rotate-[18deg] rounded-xl border border-amber-500/60 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 opacity-70 shadow-xl md:block" />

      <header className="relative space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
          Sejarah &amp; Peraturan
        </p>
        <h1 className="font-perpetua text-3xl text-amber-200 sm:text-4xl">
          Jejak &amp; Aturan Kartu Batak
        </h1>
        <p className="max-w-xl text-xs text-amber-200/80">
          Dari Black Peter di Eropa hingga Jokeran di Indonesia, Joker Card
          membawa tradisi permainan lama ke meja digital Bataker Project.
        </p>
      </header>

      <section
        ref={getRef('timeline')}
        data-key="timeline"
        className="relative grid gap-10 rounded-3xl border border-amber-900/60 bg-[rgba(24,16,9,0.96)] p-6 text-amber-100 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={visible.timeline ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <h2 className="font-perpetua text-2xl text-amber-200">Jejak Sejarah</h2>
          <p className="mt-1 text-[11px] text-amber-200/80">
            Garis waktu singkat bagaimana permainan tipe Old Maid berkembang
            hingga menjadi Joker Card di Bataker Project.
          </p>

          <div className="mt-5 relative">
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/80 via-amber-700/60 to-amber-900/0" />
            <div className="space-y-5 pl-8">
              {timeline.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={visible.timeline ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="relative flex gap-4"
                >
                  <div className="absolute -left-[22px] mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-amber-400 bg-amber-900/60 text-[10px] text-amber-200 shadow">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1 text-xs">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300/80">
                      {item.year} &middot; {item.place}
                    </p>
                    <p className="font-perpetua text-sm text-amber-100">
                      {item.title}
                    </p>
                    <p className="text-amber-100/80">{item.description}</p>
                  </div>
                  <div className="flex items-center">
                    <div className="flex h-16 w-12 flex-col items-center justify-center rounded-lg border border-amber-400/80 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 text-xs text-amber-100 shadow-lg shadow-amber-900/80">
                      <span className="text-[11px]">
                        {item.card === '🃏' ? 'J' : item.card[0]}
                      </span>
                      <span className="mt-1 text-lg">
                        {item.card === '🃏' ? '🃏' : item.card}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={visible.timeline ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-2 space-y-4 rounded-2xl border border-amber-900/80 bg-[rgba(18,11,6,0.95)] p-4 text-xs text-amber-100"
        >
          <p className="font-perpetua text-sm text-amber-200">
            Dari Kartu Hukuman ke Hiburan Digital
          </p>
          <p className="text-amber-100/80">
            Dahulu, memegang kartu terakhir berarti menerima hukuman atau
            ejekan. Di Joker Card, tradisi itu dipertahankan dalam bentuk Joker
            sebagai kartu sial yang harus kamu hindari sampai akhir permainan.
          </p>
          <p className="text-amber-100/80">
            Bataker Project meramu nuansa klasik itu dengan visual modern dan
            sistem game yang rapi, agar kamu tetap merasakan tegangnya “kabur
            dari Joker” tanpa kehilangan kenyamanan game digital.
          </p>
        </motion.div>
      </section>

      <section
        ref={getRef('rules')}
        data-key="rules"
        className="relative grid gap-8 rounded-3xl border border-amber-900/60 bg-[rgba(24,16,9,0.96)] p-6 text-amber-100 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={visible.rules ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-perpetua text-2xl text-amber-200">Peraturan Utama</h2>
          <p className="mt-1 text-[11px] text-amber-200/80">
            Versi Joker Card di Bataker Project mengikuti pola Old Maid dengan
            sentuhan Joker spesial.
          </p>

          <ol className="mt-4 space-y-3 text-xs">
            <li className="flex gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-800 text-[11px] font-semibold text-amber-200">
                1
              </div>
              <div>
                <p className="font-perpetua text-sm text-amber-200">
                  Kocok &amp; Bagikan Kartu
                </p>
                <p className="text-amber-100/80">
                  52 kartu remi standar + 1 Joker dikocok, lalu dibagikan
                  merata ke 4–8 pemain.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-800 text-[11px] font-semibold text-amber-200">
                2
              </div>
              <div>
                <p className="font-perpetua text-sm text-amber-200">
                  Buang Pasangan
                </p>
                <p className="text-amber-100/80">
                  Semua pemain membuang kartu berpasangan (angka sama) ke
                  tengah. Joker tidak punya pasangan.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-800 text-[11px] font-semibold text-amber-200">
                3
              </div>
              <div>
                <p className="font-perpetua text-sm text-amber-200">
                  Ambil Kartu dari Sebelah Kiri
                </p>
                <p className="text-amber-100/80">
                  Giliran berjalan searah jarum jam. Pemain mengambil 1 kartu
                  tertutup secara acak dari tangan pemain di sebelah kiri.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-800 text-[11px] font-semibold text-amber-200">
                4
              </div>
              <div>
                <p className="font-perpetua text-sm text-amber-200">
                  Keluar Jika Habis Kartu
                </p>
                <p className="text-amber-100/80">
                  Jika kartu di tanganmu habis, kamu dinyatakan selamat dan
                  keluar dari putaran. Permainan berlanjut sampai tinggal satu
                  pemain.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-800 text-[11px] font-semibold text-amber-200">
                5
              </div>
              <div>
                <p className="font-perpetua text-sm text-amber-200">
                  Pemegang Joker Terakhir Kalah
                </p>
                <p className="text-amber-100/80">
                  Pemain terakhir yang masih memegang Joker menjadi &quot;korban&quot;
                  dan dinyatakan kalah.
                </p>
              </div>
            </li>
          </ol>

          <div className="mt-5 grid gap-3 text-xs sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-900/80 bg-[rgba(18,11,6,0.95)] p-3">
              <p className="font-perpetua text-sm text-amber-200">
                Contoh Pasangan
              </p>
              <div className="mt-2 flex gap-2">
                <div className="flex h-14 w-10 flex-col items-center justify-center rounded-lg border border-amber-400/80 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 text-[11px] text-amber-100">
                  <span>7♠</span>
                </div>
                <div className="flex h-14 w-10 flex-col items-center justify-center rounded-lg border border-amber-400/80 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 text-[11px] text-amber-100">
                  <span>7♥</span>
                </div>
                <div className="flex flex-1 items-center justify-center text-[11px] text-amber-200/80">
                  Kartu dengan angka sama (7) boleh dibuang sebagai pasangan.
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-900/80 bg-[rgba(18,11,6,0.95)] p-3">
              <p className="font-perpetua text-sm text-amber-200">
                Joker Tanpa Pasangan
              </p>
              <div className="mt-2 flex gap-2">
                <div className="flex h-14 w-10 flex-col items-center justify-center rounded-lg border border-amber-400/80 bg-gradient-to-br from-red-900 via-red-800 to-red-700 text-[11px] text-amber-100 shadow-[0_0_18px_rgba(192,57,43,0.8)]">
                  <span>🃏</span>
                </div>
                <div className="flex flex-1 items-center justify-center text-[11px] text-amber-200/80">
                  Joker selalu sendirian. Siapa yang memegangnya di akhir, dia
                  yang kalah.
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={visible.rules ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-4 text-xs text-amber-100"
        >
          <div className="rounded-2xl border border-red-800/80 bg-gradient-to-br from-red-950 via-red-900 to-amber-900 p-4 shadow-[0_0_24px_rgba(192,57,43,0.9)]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/80">
              Aturan Joker Spesial
            </p>
            <p className="mt-1 font-perpetua text-sm text-amber-50">
              Balik Arah Putaran
            </p>
            <p className="mt-2 text-amber-100/90">
              Di Joker Card (Bataker Project), pemain yang baru saja menerima
              Joker mendapatkan hak istimewa: <span className="font-semibold">membalik arah putaran</span>.
            </p>
            <ul className="mt-2 list-disc pl-4 text-amber-100/90">
              <li className="mt-1">
                Jika diaktifkan, giliran berikutnya berjalan berlawanan arah.
              </li>
              <li className="mt-1">
                Fitur ini bisa digunakan untuk menghindari pemain tertentu atau
                memerangkap lawan yang hampir bebas.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-900/80 bg-[rgba(18,11,6,0.95)] p-4">
            <p className="font-perpetua text-sm text-amber-200">
              Ringkasan Singkat
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-amber-900/80">
              <table className="min-w-full text-[11px] text-amber-100/90">
                <tbody>
                  <tr className="bg-amber-900/40">
                    <td className="px-3 py-2 text-amber-200/80">Pemain</td>
                    <td className="px-3 py-2">4 &ndash; 8 pemain</td>
                  </tr>
                  <tr className="bg-amber-900/20">
                    <td className="px-3 py-2 text-amber-200/80">Jumlah Kartu</td>
                    <td className="px-3 py-2">52 kartu remi standar + 1 Joker</td>
                  </tr>
                  <tr className="bg-amber-900/40">
                    <td className="px-3 py-2 text-amber-200/80">
                      Kondisi Menang
                    </td>
                    <td className="px-3 py-2">
                      Keluarkan semua kartu dari tanganmu (bukan pemegang Joker
                      terakhir).
                    </td>
                  </tr>
                  <tr className="bg-amber-900/20">
                    <td className="px-3 py-2 text-amber-200/80">
                      Kondisi Kalah
                    </td>
                    <td className="px-3 py-2">
                      Menjadi pemain terakhir yang masih memegang kartu Joker.
                    </td>
                  </tr>
                  <tr className="bg-amber-900/40">
                    <td className="px-3 py-2 text-amber-200/80">
                      Arah Default
                    </td>
                    <td className="px-3 py-2">
                      Searah jarum jam, bisa dibalik saat Joker berpindah.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </section>

      <AnimatePresence>
        {visible.timeline && visible.rules && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center text-[10px] text-amber-300/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Gulir ke atas untuk kembali ke meja Kartu Batak.
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

