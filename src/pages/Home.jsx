import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { useDarkMode } from '../hooks/useDarkMode.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { MusicPlayer } from '../components/MusicPlayer.jsx'

const NAV = [
  { label: 'Home', to: '/' },
  { label: 'History', to: '/history' },
  { label: 'Lobby', to: '/lobby' },
]

const CARDS = [
  { id: 1, label: 'A♠', rot: -18, ox: -160 },
  { id: 2, label: 'K♥', rot: -7,  ox: -80  },
  { id: 3, label: '🃏', rot:  2,  ox:  0   },
  { id: 4, label: 'Q♦', rot: 12,  ox:  80  },
  { id: 5, label: '10♣',rot: 22,  ox:  160 },
]

/* ── Cursor-following spotlight ── */
function Spotlight() {
  const x = useMotionValue(-400)
  const y = useMotionValue(-400)
  const sx = useSpring(x, { stiffness: 80, damping: 18 })
  const sy = useSpring(y, { stiffness: 80, damping: 18 })

  useEffect(() => {
    const move = (e) => { x.set(e.clientX); y.set(e.clientY) }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [x, y])

  return (
    <motion.div
      className="pointer-events-none fixed z-10"
      style={{
        left: sx, top: sy,
        width: 520, height: 520,
        x: '-50%', y: '-50%',
        background: 'radial-gradient(circle,rgba(241,196,15,0.07) 0%,transparent 65%)',
        borderRadius: '50%',
      }}
    />
  )
}

/* ── Animated canvas ── */
function AnimatedBg({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf, t = 0
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const step = 100, off = (t * 0.2) % step
      for (let i = -step * 2; i < W + step * 2; i += step) {
        const a = 0.03 + 0.018 * Math.sin(t * 0.016 + i * 0.008)
        ctx.lineWidth = 1
        ctx.strokeStyle = `rgba(192,57,43,${a})`
        ctx.beginPath(); ctx.moveTo(i + off, 0); ctx.lineTo(i - H + off, H); ctx.stroke()
        ctx.strokeStyle = `rgba(241,196,15,${a * 0.3})`
        ctx.beginPath(); ctx.moveTo(i - off * 0.5, H); ctx.lineTo(i + H - off * 0.5, 0); ctx.stroke()
      }
      ;[
        { x: W*0.05, y: H*0.15, r: 320, c:'192,57,43' },
        { x: W*0.95, y: H*0.55, r: 350, c:'142,68,173' },
        { x: W*0.45, y: H*0.95, r: 260, c:'241,196,15' },
        { x: W*0.8,  y: H*0.05, r: 220, c:'192,57,43' },
      ].forEach((o, i) => {
        const p = Math.sin(t * 0.01 + i * 2) * 0.05
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r)
        g.addColorStop(0, `rgba(${o.c},${0.14 + p})`); g.addColorStop(1, `rgba(${o.c},0)`)
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); ctx.fill()
      })
      t++; raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [canvasRef])
  return null
}

export function HomePage() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const { isDark, toggleDarkMode } = useDarkMode()
  const { user, profile, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  const username = profile?.username || (user?.email ? user.email.split('@')[0] : null)

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1400)
    return () => clearTimeout(t)
  }, [])

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setParallax({
      x: (e.clientX - rect.left - rect.width / 2) / rect.width,
      y: (e.clientY - rect.top - rect.height / 2) / rect.height,
    })
  }

  const handleLogout = async () => { await signOut(); navigate('/login', { replace: true }) }

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500) }
    catch { /* ignore */ }
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-x-hidden text-white"
      style={{ backgroundColor: isDark ? '#080503' : '#130a04' }}
      onMouseMove={handleMouseMove}
    >
      {/* Canvas bg */}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" style={{ opacity: 0.7 }} />
      <AnimatedBg canvasRef={canvasRef} />
      <Spotlight />

      {/* Loading splash */}
      <AnimatePresence>
        {isLoading && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black"
            initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <motion.div className="relative flex h-44 w-32 items-center justify-center"
              animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
              <div className="absolute inset-0 rounded-2xl"
                style={{ border: '1px solid rgba(241,196,15,0.4)', background: 'rgba(192,57,43,0.2)', boxShadow: '0 0 50px rgba(192,57,43,0.7)', animation: 'pulse 1.5s infinite' }} />
              <div className="absolute inset-3 flex flex-col items-center justify-center rounded-xl"
                style={{ border: '1px solid rgba(241,196,15,0.5)', background: 'rgba(0,0,0,0.85)' }}>
                <span className="font-perpetua text-3xl" style={{ color: '#F1C40F' }}>J</span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.3em]" style={{ color: 'rgba(241,196,15,0.7)' }}>Joker</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NAVBAR ── full width */}
      <header className="fixed inset-x-0 top-0 z-30 w-full"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(22px)', borderBottom: '1px solid rgba(241,196,15,0.18)' }}>
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.7) 50%,transparent)' }} />

        <div className="flex w-full items-center gap-4 px-4 py-3 md:px-6">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <motion.div whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.95 }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: 'radial-gradient(circle at 35% 35%,#e74c3c,#7b1010)', boxShadow: '0 0 20px rgba(192,57,43,0.85)' }}>
              J
            </motion.div>
            <div className="hidden leading-tight sm:block">
              <p className="font-perpetua text-xl font-semibold" style={{ color: '#F1C40F', textShadow: '0 0 14px rgba(241,196,15,0.6)' }}>Kartu Batak</p>
              <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: 'rgba(241,196,15,0.4)' }}>Bataker Project</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {NAV.map(item => (
              <Link key={item.to} to={item.to}>
                <motion.span
                  className="relative block rounded-full px-4 py-2 text-sm font-semibold"
                  style={{ color: item.to === '/' ? '#fff' : 'rgba(241,196,15,0.65)' }}
                  whileHover={{ color: '#F1C40F' }}
                  whileTap={{ scale: 0.93 }}
                >
                  {item.to === '/' && (
                    <motion.span layoutId="home-pill" className="absolute inset-0 rounded-full"
                      style={{ background: 'linear-gradient(135deg,#5b1fa0,#8e44ad)', boxShadow: '0 0 20px rgba(142,68,173,0.9)' }} />
                  )}
                  <motion.span className="absolute inset-0 rounded-full opacity-0" whileHover={{ opacity: 1 }}
                    style={{ background: 'rgba(241,196,15,0.08)', border: '1px solid rgba(241,196,15,0.15)' }} />
                  <span className="relative z-10">{item.label}</span>
                </motion.span>
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <motion.button type="button" onClick={() => setShowShare(true)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="rounded-full px-3 py-1.5 text-xs font-medium"
                style={{ border: '1px solid rgba(241,196,15,0.3)', color: 'rgba(241,196,15,0.8)', background: 'rgba(0,0,0,0.4)' }}>
                Share
              </motion.button>
              {user ? (
                <>
                  {username && (
                    <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                      style={{ border: '1px solid rgba(241,196,15,0.22)', background: 'rgba(0,0,0,0.4)', color: 'rgba(241,196,15,0.85)' }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
                      {username}
                    </div>
                  )}
                  <motion.button type="button" onClick={handleLogout}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="rounded-full px-4 py-1.5 text-sm font-semibold"
                    style={{ border: '1px solid rgba(192,57,43,0.5)', color: '#e74c3c', background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.12)'; e.currentTarget.style.boxShadow = '0 0 14px rgba(192,57,43,0.5)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}>
                    Logout
                  </motion.button>
                </>
              ) : (
                <Link to="/login" className="rounded-full px-4 py-1.5 text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#a93226,#e74c3c)', boxShadow: '0 0 16px rgba(192,57,43,0.6)' }}>
                  Login
                </Link>
              )}
              <motion.button type="button" onClick={toggleDarkMode}
                whileHover={{ scale: 1.12, rotate: 20 }} whileTap={{ scale: 0.9 }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                style={{ border: '1px solid rgba(241,196,15,0.35)', background: 'rgba(0,0,0,0.4)', color: '#F1C40F' }}>
                {isDark ? '☀' : '🌙'}
              </motion.button>
            </div>

            {/* Mobile hamburger */}
            <button type="button" onClick={() => setMobileMenu(true)}
              className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-full md:hidden"
              style={{ border: '1px solid rgba(241,196,15,0.3)', background: 'rgba(0,0,0,0.4)' }}>
              <span className="h-px w-5 bg-yellow-400" />
              <span className="h-px w-5 bg-yellow-400" />
              <span className="h-px w-3 self-end bg-yellow-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenu && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenu(false)} />
            <motion.div className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col"
              style={{ background: 'rgba(8,5,3,0.98)', borderLeft: '1px solid rgba(241,196,15,0.15)' }}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="font-perpetua text-lg text-yellow-400">Menu</span>
                <button type="button" onClick={() => setMobileMenu(false)}
                  className="text-yellow-400/70 hover:text-yellow-400">✕</button>
              </div>
              <nav className="flex flex-col gap-1 px-4">
                {NAV.map(item => (
                  <Link key={item.to} to={item.to} onClick={() => setMobileMenu(false)}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold"
                    style={{ color: 'rgba(241,196,15,0.8)' }}>{item.label}</Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 px-4 pb-8 pt-4"
                style={{ borderTop: '1px solid rgba(241,196,15,0.1)' }}>
                {user ? (
                  <button type="button" onClick={() => { handleLogout(); setMobileMenu(false) }}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-red-400"
                    style={{ border: '1px solid rgba(192,57,43,0.4)' }}>Logout</button>
                ) : (
                  <Link to="/login" onClick={() => setMobileMenu(false)}
                    className="rounded-xl px-4 py-2 text-center text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#a93226,#e74c3c)' }}>Login</Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-20 flex min-h-screen w-full flex-col pt-[64px]">

        {/* HERO */}
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 md:flex-row md:items-center md:gap-0 md:px-12 lg:px-20">
          {/* Left text */}
          <motion.div className="flex-1 space-y-7 text-center md:text-left"
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div>
              <motion.p className="text-xs uppercase tracking-[0.4em]"
                style={{ color: 'rgba(241,196,15,0.55)' }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                Welcome to
              </motion.p>
              <motion.h1
                className="mt-2 font-perpetua text-5xl font-bold leading-none sm:text-6xl lg:text-7xl"
                style={{ color: '#F1C40F', textShadow: '0 0 30px rgba(241,196,15,0.5), 0 0 60px rgba(192,57,43,0.3)' }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}>
                JOKER CARD
              </motion.h1>
              <motion.p className="mt-2 text-sm uppercase tracking-[0.45em]"
                style={{ color: 'rgba(241,196,15,0.6)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                Bataker Project
              </motion.p>
            </div>

            <motion.p className="max-w-md text-sm leading-relaxed md:mx-0 mx-auto"
              style={{ color: 'rgba(255,255,255,0.55)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
              Permainan kartu bergaya kasino dengan nuansa misterius. Masuk ke meja, baca pola lawan, dan hindari menjadi pemegang Joker terakhir.
            </motion.p>

            <motion.div className="flex flex-wrap justify-center gap-3 md:justify-start"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
              <motion.button type="button" onClick={() => navigate('/lobby')}
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}
                className="rounded-full px-7 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white"
                style={{ background: 'linear-gradient(135deg,#a93226,#e74c3c)', boxShadow: '0 0 24px rgba(192,57,43,0.65)' }}>
                Main Sekarang
              </motion.button>
              <motion.button type="button" onClick={() => navigate('/history')}
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}
                className="rounded-full px-7 py-3 text-sm font-bold uppercase tracking-[0.2em]"
                style={{ border: '1px solid rgba(241,196,15,0.45)', color: '#F1C40F', background: 'rgba(0,0,0,0.3)' }}>
                Lihat History
              </motion.button>
            </motion.div>

            {/* Stats row */}
            <motion.div className="flex flex-wrap justify-center gap-6 md:justify-start"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              {[['4–8', 'Pemain'], ['53', 'Kartu'], ['1', 'Joker']].map(([val, lbl]) => (
                <div key={lbl} className="text-center">
                  <p className="font-perpetua text-2xl" style={{ color: '#F1C40F', textShadow: '0 0 10px rgba(241,196,15,0.5)' }}>{val}</p>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(241,196,15,0.45)' }}>{lbl}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — floating cards */}
          <motion.div className="relative mt-12 h-72 w-full flex-1 md:mt-0 md:h-96"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            {CARDS.map((card, idx) => {
              const intensity = 8 + idx * 4
              const tx = -parallax.x * intensity
              const ty = -parallax.y * intensity
              const isJoker = card.label === '🃏'
              return (
                <motion.div
                  key={card.id}
                  className="absolute left-1/2 top-1/2 flex h-44 w-32 flex-col items-center justify-between rounded-2xl p-3"
                  style={{
                    transform: `translate(-50%,-50%) translate(${card.ox + tx}px,${ty}px) rotate(${card.rot}deg)`,
                    transition: 'transform 100ms linear',
                    background: isJoker
                      ? 'linear-gradient(135deg,#1a0030,#3d0060)'
                      : 'linear-gradient(135deg,#0a0705,#1a1008)',
                    border: isJoker
                      ? '1px solid rgba(192,57,43,0.7)'
                      : '1px solid rgba(241,196,15,0.45)',
                    boxShadow: isJoker
                      ? '0 0 40px rgba(192,57,43,0.7), 0 8px 32px rgba(0,0,0,0.7)'
                      : '0 0 25px rgba(241,196,15,0.25), 0 8px 24px rgba(0,0,0,0.6)',
                  }}
                  whileHover={{ scale: 1.08, zIndex: 10 }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3 + idx * 0.4, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.2 }}
                >
                  <span className="self-start text-xs" style={{ color: isJoker ? '#e74c3c' : '#F1C40F' }}>{card.label}</span>
                  <span className="font-perpetua text-2xl" style={{ color: isJoker ? '#e74c3c' : '#F1C40F' }}>{card.label}</span>
                  <span className="self-end rotate-180 text-xs" style={{ color: isJoker ? '#e74c3c' : '#F1C40F' }}>{card.label}</span>
                </motion.div>
              )
            })}
          </motion.div>
        </section>

        {/* FEATURES */}
        <section className="w-full px-4 pb-16 md:px-12 lg:px-20">
          <motion.div className="grid gap-4 sm:grid-cols-3"
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, staggerChildren: 0.1 }}>
            {[
              { icon: '🃏', title: 'Hindari Joker', desc: 'Buang semua kartumu. Jangan sampai menjadi pemegang Joker terakhir.' },
              { icon: '🎰', title: 'Strategi & Insting', desc: 'Baca pola lawan, timing yang tepat bisa membalikkan permainan.' },
              { icon: '⚡', title: 'Real-time Cepat', desc: 'Setiap ronde berlangsung cepat dan menegangkan sampai akhir.' },
            ].map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="rounded-2xl p-5"
                style={{ border: '1px solid rgba(241,196,15,0.12)', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)' }}>
                <div className="mb-3 text-3xl">{f.icon}</div>
                <p className="font-perpetua text-lg" style={{ color: '#f5d87a' }}>{f.title}</p>
                <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full py-4 text-center text-[10px] tracking-[0.25em]"
        style={{ background: 'rgba(0,0,0,0.75)', borderTop: '1px solid rgba(241,196,15,0.08)', color: 'rgba(241,196,15,0.28)' }}>
        Kartu Batak &middot; Bataker Project &middot; 2026
      </footer>

      {/* Share modal */}
      <AnimatePresence>
        {showShare && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-sm rounded-2xl p-5"
              style={{ border: '1px solid rgba(241,196,15,0.35)', background: 'rgba(5,3,1,0.95)', boxShadow: '0 0 40px rgba(241,196,15,0.2)' }}
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-perpetua text-lg" style={{ color: '#F1C40F' }}>Bagikan Kartu Batak</p>
                <button type="button" onClick={() => setShowShare(false)} style={{ color: 'rgba(241,196,15,0.6)' }}>✕</button>
              </div>
              <p className="mb-3 text-xs" style={{ color: 'rgba(241,196,15,0.5)' }}>Salin link untuk berbagi ke teman.</p>
              <div className="flex gap-2">
                <input readOnly value={window.location.href}
                  className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                  style={{ border: '1px solid rgba(241,196,15,0.3)', background: 'rgba(0,0,0,0.5)', color: '#F1C40F' }} />
                <motion.button type="button" onClick={handleCopy}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="rounded-full px-4 py-2 text-xs font-bold text-white"
                  style={{ background: copied ? '#27ae60' : 'linear-gradient(135deg,#5b1fa0,#8e44ad)' }}>
                  {copied ? '✓' : 'Copy'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MusicPlayer />
    </div>
  )
}
