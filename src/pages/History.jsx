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
      'Versi awal sering dimainkan di bar sebagai drinking game; pemain yang kalah harus menerima "hukuman" minum.',
    card: 'J♥',
  },
  {
    year: 'Masa Kolonial',
    place: 'Belanda → Hindia Belanda',
    title: 'Masuk ke Nusantara',
    description:
      'Melalui interaksi dengan budaya Belanda, permainan ini menyebar ke Indonesia dan dikenal sebagai "kartu setan".',
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

// ── SVG Icons
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconMapPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconBookOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
  </svg>
)
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IconZap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

function useReveal() {
  const [visible, setVisible] = useState({})
  const refs = useRef({})
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const key = entry.target.getAttribute('data-key')
          if (key) setVisible((prev) => ({ ...prev, [key]: true }))
        }
      }),
      { threshold: 0.15 },
    )
    Object.values(refs.current).forEach((el) => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])
  const getRef = (key) => (el) => { if (el) refs.current[key] = el }
  return { visible, getRef }
}

// ── Mini card component
function MiniCard({ label, isJoker, size = 'md' }) {
  const w = size === 'sm' ? 40 : 48
  const h = size === 'sm' ? 56 : 68
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.08 }}
      className="flex flex-col items-center justify-between rounded-xl p-1.5 shrink-0"
      style={{
        width: w, height: h,
        background: isJoker
          ? 'linear-gradient(135deg,#1a0030,#4a0080)'
          : 'linear-gradient(135deg,#0a0705,#1f140a)',
        border: isJoker
          ? '1px solid rgba(192,57,43,0.8)'
          : '1px solid rgba(241,196,15,0.5)',
        boxShadow: isJoker
          ? '0 0 20px rgba(192,57,43,0.6), 0 4px 16px rgba(0,0,0,0.6)'
          : '0 0 12px rgba(241,196,15,0.2), 0 4px 12px rgba(0,0,0,0.5)',
      }}>
      <span className="self-start text-[7px] font-bold"
        style={{ color: isJoker ? '#e74c3c' : '#F1C40F' }}>
        {label === '🃏' ? '🃏' : label}
      </span>
      <span className="text-base font-bold"
        style={{ color: isJoker ? '#e74c3c' : '#F1C40F', filter: isJoker ? 'drop-shadow(0 0 6px #e74c3c)' : 'drop-shadow(0 0 4px #F1C40F)' }}>
        {label}
      </span>
      <span className="self-end rotate-180 text-[7px] font-bold"
        style={{ color: isJoker ? '#e74c3c' : '#F1C40F' }}>
        {label === '🃏' ? '🃏' : label}
      </span>
    </motion.div>
  )
}

// ── Rule step
function RuleStep({ num, title, desc, delay, visible }) {
  return (
    <motion.li
      className="flex gap-4"
      initial={{ opacity: 0, x: -20 }}
      animate={visible ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.45, delay }}>
      <div className="relative shrink-0">
        <motion.div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg,rgba(192,57,43,0.4),rgba(241,196,15,0.15))',
            border: '1px solid rgba(241,196,15,0.35)',
            color: '#F1C40F',
            boxShadow: '0 0 12px rgba(241,196,15,0.2)',
          }}
          animate={{ boxShadow: ['0 0 8px rgba(241,196,15,0.15)', '0 0 20px rgba(241,196,15,0.4)', '0 0 8px rgba(241,196,15,0.15)'] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: num * 0.3 }}>
          {num}
        </motion.div>
        {num < 5 && (
          <div className="absolute left-1/2 top-full h-full w-px -translate-x-1/2"
            style={{ background: 'linear-gradient(to bottom,rgba(241,196,15,0.3),transparent)' }} />
        )}
      </div>
      <div className="pb-5 flex-1">
        <p className="font-perpetua text-sm" style={{ color: '#f5d87a' }}>{title}</p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
      </div>
    </motion.li>
  )
}

export function HistoryPage() {
  const { visible, getRef } = useReveal()

  return (
    <section className="relative space-y-10">
      {/* Ambient bg */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 40% at 5% 5%,rgba(192,57,43,0.12) 0%,transparent 55%), radial-gradient(ellipse 50% 40% at 95% 90%,rgba(142,68,173,0.12) 0%,transparent 55%), radial-gradient(ellipse 40% 30% at 50% 50%,rgba(241,196,15,0.04) 0%,transparent 70%)',
        }} />
      </div>
      {/* Decorative floating cards */}
      <div className="pointer-events-none absolute -left-4 top-10 hidden md:block">
        <motion.div className="rounded-xl"
          style={{ width: 52, height: 74, background: 'linear-gradient(135deg,#0a0705,#1f140a)', border: '1px solid rgba(241,196,15,0.3)', boxShadow: '0 0 16px rgba(241,196,15,0.1)', transform: 'rotate(-14deg)', opacity: 0.7 }}
          animate={{ y: [0, -8, 0], rotate: [-14, -10, -14] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      </div>
      <div className="pointer-events-none absolute -right-3 bottom-20 hidden md:block">
        <motion.div className="rounded-xl"
          style={{ width: 52, height: 74, background: 'linear-gradient(135deg,#1a0030,#4a0080)', border: '1px solid rgba(192,57,43,0.5)', boxShadow: '0 0 20px rgba(192,57,43,0.3)', transform: 'rotate(16deg)', opacity: 0.65 }}
          animate={{ y: [0, -10, 0], rotate: [16, 12, 16] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
      </div>

      {/* ── HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-px w-6" style={{ background: 'rgba(241,196,15,0.5)' }} />
          <p className="text-[10px] uppercase tracking-[0.5em]" style={{ color: 'rgba(241,196,15,0.5)' }}>
            Sejarah &amp; Peraturan
          </p>
        </div>
        <h1 className="font-perpetua text-4xl md:text-5xl"
          style={{ color: '#F1C40F', textShadow: '0 0 30px rgba(241,196,15,0.5), 0 0 60px rgba(241,196,15,0.15)' }}>
          Jejak &amp; Aturan<br className="sm:hidden" /> Kartu Batak
        </h1>
        <p className="max-w-lg text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Dari Black Peter di Eropa hingga Jokeran di Indonesia — Kartu Batak membawa tradisi lama ke meja digital Bataker Project.
        </p>
      </motion.header>

      {/* ── TIMELINE SECTION */}
      <div ref={getRef('timeline')} data-key="timeline"
        className="grid gap-6 md:grid-cols-[1.5fr_1fr]">

        {/* Left — timeline */}
        <motion.div
          initial={{ opacity: 0, y: 36 }} animate={visible.timeline ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-3xl p-6"
          style={{
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(241,196,15,0.14)',
            backdropFilter: 'blur(14px)',
          }}>
          <motion.div className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.8),transparent)' }}
            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }} />
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(241,196,15,0.07),transparent 70%)' }} />

          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'rgba(241,196,15,0.1)', border: '1px solid rgba(241,196,15,0.25)', color: '#F1C40F' }}>
              <IconClock />
            </div>
            <div>
              <h2 className="font-perpetua text-xl" style={{ color: '#F1C40F' }}>Jejak Sejarah</h2>
              <p className="text-[10px]" style={{ color: 'rgba(241,196,15,0.4)' }}>Garis waktu Old Maid → Kartu Batak</p>
            </div>
          </div>

          {/* Timeline items */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[18px] top-0 bottom-0 w-px"
              style={{ background: 'linear-gradient(to bottom,rgba(241,196,15,0.6),rgba(241,196,15,0.1),transparent)' }} />

            <div className="space-y-6 pl-10">
              {timeline.map((item, idx) => {
                const isJoker = item.card === '🃏'
                return (
                  <motion.div key={item.title}
                    initial={{ opacity: 0, x: 24 }}
                    animate={visible.timeline ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="relative flex gap-4 items-start">
                    {/* Dot */}
                    <motion.div
                      className="absolute -left-[29px] top-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
                      style={{
                        background: isJoker ? 'linear-gradient(135deg,#7b1010,#e74c3c)' : 'linear-gradient(135deg,#2d1a0a,#6d4c1a)',
                        border: isJoker ? '1px solid rgba(192,57,43,0.8)' : '1px solid rgba(241,196,15,0.6)',
                        color: isJoker ? '#e74c3c' : '#F1C40F',
                        boxShadow: isJoker ? '0 0 10px rgba(192,57,43,0.5)' : '0 0 8px rgba(241,196,15,0.3)',
                      }}
                      animate={isJoker ? {
                        boxShadow: ['0 0 6px rgba(192,57,43,0.4)', '0 0 18px rgba(192,57,43,0.9)', '0 0 6px rgba(192,57,43,0.4)']
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}>
                      {idx + 1}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px]"
                          style={{ color: 'rgba(241,196,15,0.55)' }}>
                          <IconClock /> {item.year}
                        </span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                        <span className="inline-flex items-center gap-1 text-[10px]"
                          style={{ color: 'rgba(241,196,15,0.4)' }}>
                          <IconMapPin /> {item.place}
                        </span>
                      </div>
                      <p className="mt-0.5 font-perpetua text-sm" style={{ color: isJoker ? '#e74c3c' : '#f5d87a' }}>
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>
                        {item.description}
                      </p>
                    </div>

                    {/* Card */}
                    <MiniCard label={item.card} isJoker={isJoker} size="sm" />
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Right — context card */}
        <motion.div
          initial={{ opacity: 0, y: 36 }} animate={visible.timeline ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="flex flex-col gap-4">

          {/* Context card */}
          <div className="relative overflow-hidden rounded-3xl p-5 flex-1"
            style={{
              background: 'rgba(0,0,0,0.55)',
              border: '1px solid rgba(241,196,15,0.12)',
              backdropFilter: 'blur(14px)',
            }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(142,68,173,0.6),transparent)' }} />
            <div className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full"
              style={{ background: 'radial-gradient(circle,rgba(142,68,173,0.15),transparent 70%)' }} />

            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: 'rgba(142,68,173,0.15)', border: '1px solid rgba(142,68,173,0.3)', color: '#a78bfa' }}>
                <IconBookOpen />
              </div>
              <p className="font-perpetua text-base" style={{ color: '#f5d87a' }}>
                Dari Hukuman ke Hiburan
              </p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Dahulu, memegang kartu terakhir berarti menerima hukuman atau ejekan. Di Kartu Batak, tradisi itu dipertahankan dalam bentuk Joker sebagai kartu sial yang harus kamu hindari sampai akhir permainan.
            </p>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Bataker Project meramu nuansa klasik itu dengan visual modern agar kamu tetap merasakan tegangnya "kabur dari Joker" tanpa kehilangan kenyamanan game digital.
            </p>
          </div>

          {/* Decorative card fan */}
          <div className="relative overflow-hidden rounded-3xl p-5"
            style={{
              background: 'rgba(0,0,0,0.55)',
              border: '1px solid rgba(192,57,43,0.2)',
              backdropFilter: 'blur(14px)',
            }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(192,57,43,0.6),transparent)' }} />
            <p className="mb-3 text-[10px] uppercase tracking-[0.4em]" style={{ color: 'rgba(241,196,15,0.4)' }}>Kartu dalam Sejarah</p>
            <div className="flex items-end justify-center gap-1">
              {timeline.map((item, idx) => (
                <motion.div key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={visible.timeline ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + idx * 0.08 }}
                  whileHover={{ y: -10, zIndex: 20 }}
                  style={{ zIndex: idx, position: 'relative' }}>
                  <MiniCard label={item.card} isJoker={item.card === '🃏'} size="md" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── RULES SECTION */}
      <div ref={getRef('rules')} data-key="rules"
        className="grid gap-6 md:grid-cols-[1.5fr_1fr]">

        {/* Left — rules */}
        <motion.div
          initial={{ opacity: 0, y: 36 }} animate={visible.rules ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-3xl p-6"
          style={{
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(241,196,15,0.14)',
            backdropFilter: 'blur(14px)',
          }}>
          <motion.div className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.8),transparent)' }}
            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
          <div className="pointer-events-none absolute -left-10 top-20 h-32 w-32 rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(192,57,43,0.08),transparent 70%)' }} />

          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#e74c3c' }}>
              <IconShield />
            </div>
            <div>
              <h2 className="font-perpetua text-xl" style={{ color: '#F1C40F' }}>Peraturan Utama</h2>
              <p className="text-[10px]" style={{ color: 'rgba(241,196,15,0.4)' }}>Versi Old Maid dengan Joker spesial</p>
            </div>
          </div>

          <ol className="space-y-0 list-none">
            <RuleStep num={1} title="Kocok & Bagikan Kartu" desc="52 kartu remi standar + 1 Joker dikocok, lalu dibagikan merata ke 4–8 pemain." delay={0.05} visible={visible.rules} />
            <RuleStep num={2} title="Buang Pasangan" desc="Semua pemain membuang kartu berpasangan (angka sama) ke tengah. Joker tidak punya pasangan." delay={0.12} visible={visible.rules} />
            <RuleStep num={3} title="Ambil Kartu dari Sebelah Kanan" desc="Giliran berjalan ke kiri. Pemain mengambil 1 kartu tertutup secara acak dari tangan pemain di sebelah kanan." delay={0.19} visible={visible.rules} />
            <RuleStep num={4} title="Keluar Jika Habis Kartu" desc="Jika kartu di tanganmu habis, kamu dinyatakan selamat dan keluar dari putaran." delay={0.26} visible={visible.rules} />
            <RuleStep num={5} title="Pemegang Joker Terakhir Kalah" desc='Pemain terakhir yang masih memegang Joker menjadi "korban" dan dinyatakan kalah.' delay={0.33} visible={visible.rules} />
          </ol>

          {/* Pair examples */}
          <motion.div
            initial={{ opacity: 0 }} animate={visible.rules ? { opacity: 1 } : {}}
            transition={{ delay: 0.45 }}
            className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl p-4"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(241,196,15,0.12)' }}>
              <div className="absolute inset-x-0 top-0 h-px"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.3),transparent)' }} />
              <p className="mb-3 font-perpetua text-sm" style={{ color: '#f5d87a' }}>Contoh Pasangan</p>
              <div className="flex items-center gap-3">
                <MiniCard label="7♠" isJoker={false} size="sm" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px]" style={{ color: 'rgba(241,196,15,0.5)' }}>+</span>
                </div>
                <MiniCard label="7♥" isJoker={false} size="sm" />
                <p className="flex-1 text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Kartu angka sama → buang ke tengah
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl p-4"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(192,57,43,0.18)' }}>
              <div className="absolute inset-x-0 top-0 h-px"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(192,57,43,0.6),transparent)' }} />
              <p className="mb-3 font-perpetua text-sm" style={{ color: '#f5d87a' }}>Joker Tanpa Pasangan</p>
              <div className="flex items-center gap-3">
                <MiniCard label="🃏" isJoker={true} size="sm" />
                <p className="flex-1 text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Joker selalu sendirian. Siapa yang memegangnya di akhir, dia yang kalah.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right — special rule + summary */}
        <motion.div
          initial={{ opacity: 0, y: 36 }} animate={visible.rules ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="flex flex-col gap-4">

          {/* Joker special rule */}
          <div className="relative overflow-hidden rounded-3xl p-5"
            style={{
              background: 'linear-gradient(135deg,rgba(80,0,0,0.6),rgba(20,0,40,0.8))',
              border: '1px solid rgba(192,57,43,0.45)',
              backdropFilter: 'blur(14px)',
              boxShadow: '0 0 40px rgba(192,57,43,0.2), 0 0 80px rgba(192,57,43,0.08)',
            }}>
            {/* Animated top shimmer */}
            <motion.div className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(192,57,43,0.9),transparent)' }}
              animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
            {/* Glow corner */}
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full"
              style={{ background: 'radial-gradient(circle,rgba(192,57,43,0.25),transparent 70%)' }} />

            <div className="mb-3 flex items-center gap-2">
              <motion.div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg"
                style={{ background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.5)' }}
                animate={{ boxShadow: ['0 0 8px rgba(192,57,43,0.4)', '0 0 20px rgba(192,57,43,0.9)', '0 0 8px rgba(192,57,43,0.4)'] }}
                transition={{ duration: 2, repeat: Infinity }}>
                <IconZap />
              </motion.div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'rgba(192,57,43,0.8)' }}>Aturan Joker Spesial</p>
                <p className="font-perpetua text-sm" style={{ color: '#e74c3c', textShadow: '0 0 10px rgba(192,57,43,0.6)' }}>Balik Arah Putaran</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,200,180,0.8)' }}>
              Pemain yang baru saja menerima Joker mendapatkan hak istimewa:{' '}
              <span className="font-semibold" style={{ color: '#e74c3c' }}>membalik arah putaran</span>.
            </p>
            <ul className="mt-2 space-y-1.5">
              {[
                'Giliran berikutnya berjalan berlawanan arah.',
                'Bisa dipakai untuk menghindari pemain tertentu.',
                'Atau memerangkap lawan yang hampir bebas.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px]" style={{ color: 'rgba(255,200,180,0.7)' }}>
                  <span style={{ color: 'rgba(192,57,43,0.8)', marginTop: 1 }}>›</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Summary table */}
          <div className="relative overflow-hidden rounded-3xl p-5 flex-1"
            style={{
              background: 'rgba(0,0,0,0.55)',
              border: '1px solid rgba(241,196,15,0.12)',
              backdropFilter: 'blur(14px)',
            }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.5),transparent)' }} />
            <p className="mb-4 font-perpetua text-sm" style={{ color: '#f5d87a' }}>Ringkasan Singkat</p>
            <div className="space-y-1 overflow-hidden rounded-2xl"
              style={{ border: '1px solid rgba(241,196,15,0.1)' }}>
              {[
                ['Pemain', '4 – 8 pemain'],
                ['Jumlah Kartu', '52 kartu + 1 Joker'],
                ['Kondisi Menang', 'Keluarkan semua kartu dari tangan'],
                ['Kondisi Kalah', 'Pemegang Joker terakhir'],
                ['Arah Default', 'Searah jarum jam, bisa dibalik'],
              ].map(([label, val], i) => (
                <div key={label}
                  className="flex items-start gap-3 px-3.5 py-2.5"
                  style={{ background: i % 2 === 0 ? 'rgba(241,196,15,0.04)' : 'transparent' }}>
                  <span className="shrink-0 text-[11px] font-semibold" style={{ color: 'rgba(241,196,15,0.55)', minWidth: 90 }}>{label}</span>
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer hint */}
      <AnimatePresence>
        {visible.timeline && visible.rules && (
          <motion.div
            className="flex items-center justify-center gap-2 text-[10px]"
            style={{ color: 'rgba(241,196,15,0.3)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="h-px w-12" style={{ background: 'rgba(241,196,15,0.15)' }} />
            Gulir ke atas untuk kembali ke meja Kartu Batak.
            <div className="h-px w-12" style={{ background: 'rgba(241,196,15,0.15)' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
