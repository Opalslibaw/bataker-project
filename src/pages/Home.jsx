import { useEffect, useRef, useState, useCallback } from 'react'
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

/* Kartu tersebar secara natural di area kanan — tidak tumpuk */
const CARDS = [
  { id: 1, label: 'A♠', rot: -28, ox: -170, oy: -55, isJoker: false },
  { id: 2, label: 'K♥', rot: -12, ox: -82,  oy: -70, isJoker: false },
  { id: 3, label: '🃏', rot:   3, ox:  10,  oy: -60, isJoker: true  },
  { id: 4, label: 'Q♦', rot:  17, ox:  98,  oy: -52, isJoker: false },
  { id: 5, label: '10♣',rot:  30, ox:  175, oy: -42, isJoker: false },
]

const homeStyles = `
  @keyframes hm-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes hm-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes hm-loader {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(300%); }
  }
  @keyframes hm-pulse-dot {
    0%, 100% { box-shadow: 0 0 4px #4ade80; }
    50%       { box-shadow: 0 0 14px #4ade80; }
  }
  @keyframes hm-glow-text {
    0%, 100% { text-shadow: 0 0 20px rgba(241,196,15,0.5), 0 0 60px rgba(192,57,43,0.2); }
    50%       { text-shadow: 0 0 40px rgba(241,196,15,1), 0 0 80px rgba(192,57,43,0.5); }
  }
  @keyframes hm-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .hm-btn-shimmer {
    animation: hm-shimmer 2.5s ease-in-out 1s infinite;
    background-size: 200% 100%;
  }
`

function Spotlight() {
  const x  = useMotionValue(-600)
  const y  = useMotionValue(-600)
  const sx = useSpring(x, { stiffness: 60, damping: 18 })
  const sy = useSpring(y, { stiffness: 60, damping: 18 })

  useEffect(() => {
    let rafId = null
    const move = (e) => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        x.set(e.clientX); y.set(e.clientY); rafId = null
      })
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => { window.removeEventListener('mousemove', move); if (rafId) cancelAnimationFrame(rafId) }
  }, [x, y])

  return (
    <motion.div className="pointer-events-none fixed z-10" style={{
      left: sx, top: sy, width: 600, height: 600, x: '-50%', y: '-50%',
      background: 'radial-gradient(circle,rgba(241,196,15,0.05) 0%,transparent 65%)',
      borderRadius: '50%',
    }} />
  )
}

function StaticBg() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" style={{
      background: `
        radial-gradient(ellipse 60% 50% at 5%  15%, rgba(192,57,43,0.16)  0%, transparent 55%),
        radial-gradient(ellipse 55% 45% at 95% 55%, rgba(142,68,173,0.14) 0%, transparent 55%),
        radial-gradient(ellipse 40% 35% at 50% 95%, rgba(241,196,15,0.05) 0%, transparent 65%),
        radial-gradient(ellipse 35% 30% at 80% 5%,  rgba(192,57,43,0.09)  0%, transparent 60%)
      `,
    }} />
  )
}

function LoadingScreen() {
  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
      style={{ background: 'radial-gradient(ellipse at center,#0e0007 0%,#000 70%)' }}
      initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(192,57,43,0.18) 0%,transparent 70%)',
        }} />
        <div style={{
          width: 108, height: 108, borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#e74c3c',
          borderRightColor: 'rgba(192,57,43,0.3)',
          animation: 'hm-spin 1.6s linear infinite',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 72, height: 100, borderRadius: 12,
            background: 'linear-gradient(145deg,#1a0030,#4a0080)',
            border: '1.5px solid rgba(192,57,43,0.8)',
            boxShadow: '0 0 28px rgba(192,57,43,0.7)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 10, color: '#e74c3c' }}>🃏</span>
            <span style={{ fontSize: 28 }}>🃏</span>
            <span style={{ fontSize: 10, color: '#e74c3c', transform: 'rotate(180deg)' }}>🃏</span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p className="font-perpetua text-3xl tracking-[0.4em]"
          style={{ color: '#F1C40F', animation: 'hm-glow-text 1.8s ease-in-out infinite' }}>
          KARTU BATAK
        </p>
        <p className="text-[9px] uppercase tracking-[0.6em] mt-1" style={{ color: 'rgba(241,196,15,0.35)' }}>
          Bataker Project
        </p>
      </div>
      <div style={{ width: 160, height: 2, background: 'rgba(241,196,15,0.1)', borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: '45%', borderRadius: 9999,
          background: 'linear-gradient(90deg,#e74c3c,#F1C40F,#8e44ad)',
          animation: 'hm-loader 1.4s ease-in-out infinite',
        }} />
      </div>
    </motion.div>
  )
}

/* ── DraggableCard ──
   Di mobile: pointer-events-none, jadi pure dekorasi background.
   Di desktop: bisa diseret & dilempar.
   z-index selalu di bawah konten utama (max z-5 saat idle, z-20 saat drag).
*/
function DraggableCard({ card, isMobile }) {
  const isJoker = card.isJoker
  const dragX   = useMotionValue(0)
  const dragY   = useMotionValue(0)
  const springX = useSpring(dragX, { stiffness: 200, damping: 22, mass: 0.8 })
  const springY = useSpring(dragY, { stiffness: 200, damping: 22, mass: 0.8 })

  const [isDragging, setIsDragging] = useState(false)
  const velRef    = useRef({ x: 0, y: 0 })
  const prevPos   = useRef({ x: 0, y: 0 })
  const prevTime  = useRef(Date.now())
  const retTimer  = useRef(null)

  const handlePointerDown = useCallback((e) => {
    if (isMobile) return
    e.preventDefault(); e.stopPropagation()
    if (retTimer.current) clearTimeout(retTimer.current)
    setIsDragging(true)
    const cx0 = e.touches ? e.touches[0].clientX : e.clientX
    const cy0 = e.touches ? e.touches[0].clientY : e.clientY
    prevPos.current = { x: cx0, y: cy0 }; prevTime.current = Date.now(); velRef.current = { x: 0, y: 0 }

    const onMove = (ev) => {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY
      const now = Date.now(); const dt = Math.max(now - prevTime.current, 1)
      velRef.current = { x: (cx - prevPos.current.x) / dt * 16, y: (cy - prevPos.current.y) / dt * 16 }
      dragX.set(dragX.get() + (cx - prevPos.current.x))
      dragY.set(dragY.get() + (cy - prevPos.current.y))
      prevPos.current = { x: cx, y: cy }; prevTime.current = now
    }
    const onUp = () => {
      setIsDragging(false)
      const speed = Math.sqrt(velRef.current.x ** 2 + velRef.current.y ** 2)
      if (speed > 5) {
        dragX.set(dragX.get() + velRef.current.x * 18)
        dragY.set(dragY.get() + velRef.current.y * 18)
        retTimer.current = setTimeout(() => { dragX.set(0); dragY.set(0) }, 650)
      } else { dragX.set(0); dragY.set(0) }
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp)
    }
    window.addEventListener('mousemove', onMove, { passive: false }); window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onUp)
  }, [dragX, dragY, isMobile])

  /* z-index: saat drag naik ke 20, saat idle SELALU di bawah konten (z 1-5) */
  const zIdx = isDragging ? 20 : card.id

  return (
    <motion.div
      onPointerDown={handlePointerDown}
      className="absolute flex flex-col items-center justify-between rounded-2xl p-3 select-none"
      style={{
        width: 78, height: 110,
        /* posisi tersebar dari tengah container */
        left: '50%',
        top: '50%',
        translateX: `calc(-50% + ${card.ox}px)`,
        translateY: `calc(-50% + ${card.oy}px)`,
        x: springX,
        y: springY,
        rotate: card.rot,
        cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab'),
        pointerEvents: isMobile ? 'none' : 'auto',
        animation: !isDragging ? `hm-float ${3 + card.id * 0.4}s ease-in-out ${card.id * 0.18}s infinite` : 'none',
        background: isJoker
          ? 'linear-gradient(135deg,#1a0030,#4a0080)'
          : 'linear-gradient(135deg,#0a0705,#1f140a)',
        border: isJoker
          ? '1px solid rgba(192,57,43,0.85)'
          : '1px solid rgba(241,196,15,0.45)',
        boxShadow: isDragging
          ? (isJoker ? '0 0 90px rgba(192,57,43,1),0 24px 48px rgba(0,0,0,0.9)' : '0 0 70px rgba(241,196,15,0.9),0 24px 48px rgba(0,0,0,0.9)')
          : (isJoker ? '0 0 28px rgba(192,57,43,0.5),0 6px 18px rgba(0,0,0,0.6)' : '0 0 14px rgba(241,196,15,0.2),0 6px 16px rgba(0,0,0,0.55)'),
        zIndex: zIdx,
        touchAction: 'none',
        willChange: 'transform',
        /* opacity sedikit lebih rendah di mobile agar terlihat sebagai latar */
        opacity: isMobile ? 0.45 : 1,
      }}
      whileHover={(!isMobile && !isDragging) ? { scale: 1.1 } : {}}
    >
      <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl pointer-events-none"
        style={{ background: isJoker
          ? 'linear-gradient(90deg,transparent,rgba(192,57,43,0.5),transparent)'
          : 'linear-gradient(90deg,transparent,rgba(241,196,15,0.35),transparent)' }} />
      <span className="self-start text-xs font-bold" style={{ color: isJoker ? '#e74c3c' : '#F1C40F' }}>{card.label}</span>
      <span className="font-perpetua text-2xl"
        style={{ color: isJoker ? '#e74c3c' : '#F1C40F', filter: isJoker ? 'drop-shadow(0 0 6px #e74c3c)' : 'drop-shadow(0 0 5px #F1C40F)' }}>
        {card.label}
      </span>
      <span className="self-end rotate-180 text-xs font-bold" style={{ color: isJoker ? '#e74c3c' : '#F1C40F' }}>{card.label}</span>
    </motion.div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { isDark, toggleDarkMode } = useDarkMode()
  const { user, profile, signOut } = useAuth()
  const [isLoading, setIsLoading]   = useState(true)
  const [showShare, setShowShare]   = useState(false)
  const [copied, setCopied]         = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [showHint, setShowHint]     = useState(false)
  const [isMobile, setIsMobile]     = useState(false)

  const username = profile?.username || (user?.email ? user.email.split('@')[0] : null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(false)
      if (!isMobile) {
        setTimeout(() => setShowHint(true),  400)
        setTimeout(() => setShowHint(false), 3600)
      }
    }, 1800)
    return () => clearTimeout(t)
  }, [isMobile])

  const handleLogout = async () => { await signOut(); navigate('/login', { replace: true }) }
  const handleCopy   = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500) }
    catch { /* ignore */ }
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-white"
      style={{ backgroundColor: isDark ? '#080503' : '#0d0602' }}>
      <style>{homeStyles}</style>
      <StaticBg />
      <Spotlight />

      {/* LOADING */}
      <AnimatePresence>{isLoading && <LoadingScreen />}</AnimatePresence>

      {/* NAVBAR */}
      <header className="fixed inset-x-0 top-0 z-30 w-full"
        style={{ background: 'rgba(0,0,0,0.9)', borderBottom: '1px solid rgba(241,196,15,0.12)' }}>
        <div className="absolute inset-x-0 top-0 h-px" style={{
          background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.9),transparent)',
          backgroundSize: '200% 100%', animation: 'hm-shimmer 4s linear infinite',
        }} />
        <div className="flex w-full items-center gap-4 px-4 py-3 md:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <motion.div whileHover={{ scale: 1.12, rotate: -5 }} whileTap={{ scale: 0.95 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
              style={{ background: 'radial-gradient(circle at 35% 35%,#e74c3c,#7b1010)', boxShadow: '0 0 18px rgba(192,57,43,0.75)' }}>
              🃏
            </motion.div>
            <div className="hidden leading-tight sm:block">
              <p className="font-perpetua text-xl font-semibold"
                style={{ color: '#F1C40F', textShadow: '0 0 14px rgba(241,196,15,0.55)' }}>Kartu Batak</p>
              <p className="text-[9px] uppercase tracking-[0.35em]" style={{ color: 'rgba(241,196,15,0.38)' }}>Bataker Project</p>
            </div>
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {NAV.map(item => (
              <Link key={item.to} to={item.to}>
                <motion.span className="relative block rounded-full px-4 py-2 text-sm font-semibold"
                  style={{ color: item.to === '/' ? '#fff' : 'rgba(241,196,15,0.6)' }}
                  whileHover={{ color: '#F1C40F' }} whileTap={{ scale: 0.93 }}>
                  {item.to === '/' && (
                    <span className="absolute inset-0 rounded-full"
                      style={{ background: 'linear-gradient(135deg,#5b1fa0,#8e44ad)', boxShadow: '0 0 18px rgba(142,68,173,0.7)' }} />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </motion.span>
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <motion.button type="button" onClick={() => setShowShare(true)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="rounded-full px-3 py-1.5 text-xs font-medium"
                style={{ border: '1px solid rgba(241,196,15,0.28)', color: 'rgba(241,196,15,0.75)', background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}>
                Share
              </motion.button>
              {user ? (
                <>
                  {username && (
                    <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                      style={{ border: '1px solid rgba(241,196,15,0.2)', background: 'rgba(0,0,0,0.4)', color: 'rgba(241,196,15,0.85)' }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400"
                        style={{ animation: 'hm-pulse-dot 2s ease-in-out infinite' }} />
                      {username}
                    </div>
                  )}
                  <motion.button type="button" onClick={handleLogout}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="rounded-full px-4 py-1.5 text-sm font-semibold"
                    style={{ border: '1px solid rgba(192,57,43,0.5)', color: '#e74c3c', background: 'transparent', cursor: 'pointer' }}>
                    Logout
                  </motion.button>
                </>
              ) : (
                <Link to="/login" className="rounded-full px-4 py-1.5 text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#a93226,#e74c3c)', boxShadow: '0 0 16px rgba(192,57,43,0.55)' }}>
                  Login
                </Link>
              )}
              <motion.button type="button" onClick={toggleDarkMode}
                whileHover={{ scale: 1.12, rotate: 20 }} whileTap={{ scale: 0.9 }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                style={{ border: '1px solid rgba(241,196,15,0.3)', background: 'rgba(0,0,0,0.4)', color: '#F1C40F', cursor: 'pointer' }}>
                {isDark ? '☀' : '🌙'}
              </motion.button>
            </div>
            <button type="button" onClick={() => setMobileMenu(true)}
              className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-full md:hidden"
              style={{ border: '1px solid rgba(241,196,15,0.3)', background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}>
              <span className="h-px w-5 bg-yellow-400" /><span className="h-px w-5 bg-yellow-400" />
              <span className="h-px w-3 self-end bg-yellow-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenu && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/70"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenu(false)} />
            <motion.div className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col"
              style={{ background: 'rgba(6,3,1,0.98)', borderLeft: '1px solid rgba(241,196,15,0.15)' }}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="font-perpetua text-lg text-yellow-400">Menu</span>
                <button type="button" onClick={() => setMobileMenu(false)}
                  style={{ color: 'rgba(241,196,15,0.7)', cursor: 'pointer', background: 'none', border: 'none', fontSize: 18 }}>✕</button>
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
                    style={{ cursor: 'pointer', borderRadius: 12, padding: '8px 16px', fontSize: 14, fontWeight: 600, color: '#e74c3c', border: '1px solid rgba(192,57,43,0.4)', background: 'transparent' }}>
                    Logout
                  </button>
                ) : (
                  <Link to="/login" onClick={() => setMobileMenu(false)}
                    style={{ cursor: 'pointer', borderRadius: 12, padding: '8px 16px', textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#a93226,#e74c3c)', textDecoration: 'none' }}>
                    Login
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN */}
      <main className="relative z-20 flex min-h-screen w-full flex-col pt-[64px]">
        <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 md:flex-row md:gap-0 md:px-14 lg:px-24">

          {/* Left – konten teks */}
          <motion.div className="relative z-10 flex-1 space-y-8 text-center md:text-left"
            initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="space-y-3">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{ background: 'rgba(241,196,15,0.08)', border: '1px solid rgba(241,196,15,0.2)' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-green-400"
                  style={{ animation: 'hm-pulse-dot 2s ease-in-out infinite' }} />
                <span className="text-[10px] uppercase tracking-[0.35em]" style={{ color: 'rgba(241,196,15,0.7)' }}>
                  {user ? `Halo, ${username}!` : 'Selamat Datang'}
                </span>
              </motion.div>
              <motion.h1 className="font-perpetua text-5xl font-bold leading-none sm:text-6xl lg:text-7xl xl:text-8xl"
                style={{ color: '#F1C40F', textShadow: '0 0 50px rgba(241,196,15,0.55),0 0 100px rgba(192,57,43,0.3)' }}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}>
                KARTU<br />BATAK
              </motion.h1>
              <motion.p className="text-xs uppercase tracking-[0.5em]" style={{ color: 'rgba(241,196,15,0.5)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                Bataker Project
              </motion.p>
            </div>
            <motion.p className="max-w-md text-sm leading-loose md:mx-0 mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
              Permainan kartu bergaya kasino dengan nuansa misterius. Masuk ke meja, baca pola lawan, dan hindari menjadi pemegang Joker terakhir.
            </motion.p>
            <motion.div className="flex flex-wrap justify-center gap-3 md:justify-start"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
              <motion.button type="button" onClick={() => navigate(user ? '/lobby' : '/login')}
                whileHover={{ scale: 1.06, boxShadow: '0 0 40px rgba(192,57,43,0.8)' }} whileTap={{ scale: 0.96 }}
                className="relative overflow-hidden rounded-full px-8 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-white"
                style={{ background: 'linear-gradient(135deg,#a93226,#e74c3c)', boxShadow: '0 0 26px rgba(192,57,43,0.6)', position: 'relative', zIndex: 10 }}>
                <span className="pointer-events-none absolute inset-0 hm-btn-shimmer"
                  style={{ background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.18) 50%,transparent 70%)' }} />
                <span className="relative z-10 flex items-center gap-2.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Main Sekarang
                </span>
              </motion.button>
              <motion.button type="button" onClick={() => navigate('/history')}
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}
                className="relative overflow-hidden rounded-full px-8 py-3.5 text-sm font-bold uppercase tracking-[0.2em]"
                style={{ border: '1px solid rgba(241,196,15,0.4)', color: '#F1C40F', background: 'rgba(0,0,0,0.35)', cursor: 'pointer', position: 'relative', zIndex: 10 }}>
                <span className="flex items-center gap-2.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
                  </svg>
                  Lihat History
                </span>
              </motion.button>
            </motion.div>
            <motion.div className="flex flex-wrap justify-center gap-8 md:justify-start"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              {[['4–8','Pemain'],['53','Kartu'],['1','Joker']].map(([val, lbl]) => (
                <motion.div key={lbl} className="text-center" whileHover={{ scale: 1.1 }}>
                  <p className="font-perpetua text-3xl"
                    style={{ color: '#F1C40F', textShadow: '0 0 16px rgba(241,196,15,0.65)' }}>{val}</p>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(241,196,15,0.4)' }}>{lbl}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right – area kartu:
              - Desktop: relative, interaktif, pointer-events aktif
              - Mobile: absolute di belakang konten (z-0), dekoratif saja
          */}
          <motion.div
            className="md:relative md:flex-1 md:h-[420px] md:mt-0"
            style={{
              /* Mobile: absolute, penuh, z-0 di belakang teks */
              position: isMobile ? 'absolute' : undefined,
              inset: isMobile ? 0 : undefined,
              zIndex: isMobile ? 0 : undefined,
              height: isMobile ? '100%' : undefined,
              width: isMobile ? '100%' : undefined,
              pointerEvents: isMobile ? 'none' : undefined,
              /* Desktop: beri tinggi fixed agar kartu terlihat */
              marginTop: isMobile ? 0 : undefined,
            }}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            {CARDS.map((card) => <DraggableCard key={card.id} card={card} isMobile={isMobile} />)}
            <AnimatePresence>
              {showHint && !isMobile && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap rounded-full px-4 py-2 text-[10px]"
                  style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(241,196,15,0.3)', color: 'rgba(241,196,15,0.8)', zIndex: 15 }}>
                  ✦ Seret kartu — lempar kencang untuk efek!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* FEATURES – z-10 agar selalu di atas kartu */}
        <section className="relative z-10 w-full px-6 pb-20 md:px-14 lg:px-24">
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="mb-8 flex items-center gap-4">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.35))' }} />
            <p className="text-[10px] uppercase tracking-[0.4em]" style={{ color: 'rgba(241,196,15,0.5)' }}>Fitur Utama</p>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg,rgba(241,196,15,0.35),transparent)' }} />
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="13" height="18" rx="2"/><path d="M5 7h7M5 10.5h7M5 14h4"/><path d="M17 7l3 3-3 3M20 10H13" strokeWidth="1.6"/></svg>, title: 'Hindari Joker', desc: 'Buang semua kartumu sebelum yang lain. Jangan sampai menjadi pemegang Joker terakhir.', color: 'rgba(192,57,43,0.28)', glow: 'rgba(192,57,43,0.6)' },
              { icon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>, title: 'Strategi & Insting', desc: 'Baca pola lawan, pilih kartu dengan tepat. Timing yang benar bisa membalikkan permainan.', color: 'rgba(241,196,15,0.14)', glow: 'rgba(241,196,15,0.5)' },
              { icon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, title: 'Real-time Cepat', desc: 'Multiplayer online dengan Supabase Realtime. Setiap ronde menegangkan sampai kartu terakhir.', color: 'rgba(142,68,173,0.28)', glow: 'rgba(142,68,173,0.6)' },
            ].map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.03 }}
                className="relative overflow-hidden rounded-2xl p-6"
                style={{ border: '1px solid rgba(241,196,15,0.12)', background: 'rgba(8,5,2,0.92)' }}>
                <div className="absolute inset-x-0 top-0 h-px"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.35),transparent)' }} />
                <div className="absolute inset-0 rounded-2xl" style={{ background: `radial-gradient(circle at 20% 20%,${f.color},transparent 60%)`, pointerEvents: 'none' }} />
                <div className="relative">
                  <div style={{ color: f.glow, filter: `drop-shadow(0 0 5px ${f.glow})` }}>{f.icon}</div>
                  <p className="mt-3 font-perpetua text-xl" style={{ color: '#f5d87a' }}>{f.title}</p>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-20 w-full py-4 text-center text-[10px] tracking-[0.3em]"
        style={{ background: 'rgba(0,0,0,0.85)', borderTop: '1px solid rgba(241,196,15,0.09)', color: 'rgba(241,196,15,0.3)' }}>
        Kartu Batak &middot; Bataker Project &middot; 2026
      </footer>

      {/* Share modal */}
      <AnimatePresence>
        {showShare && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.85)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-sm rounded-2xl p-6"
              style={{ border: '1px solid rgba(241,196,15,0.3)', background: 'rgba(5,3,1,0.97)', boxShadow: '0 0 60px rgba(241,196,15,0.08)' }}
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-perpetua text-xl" style={{ color: '#F1C40F' }}>Bagikan Kartu Batak</p>
                <button type="button" onClick={() => setShowShare(false)} style={{ color: 'rgba(241,196,15,0.6)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>
              <p className="mb-4 text-xs" style={{ color: 'rgba(241,196,15,0.45)' }}>Salin link untuk berbagi ke teman.</p>
              <div className="flex gap-2">
                <input readOnly value={window.location.href} className="flex-1 rounded-xl px-3 py-2.5 text-xs outline-none"
                  style={{ border: '1px solid rgba(241,196,15,0.25)', background: 'rgba(0,0,0,0.6)', color: '#F1C40F' }} />
                <motion.button type="button" onClick={handleCopy}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="rounded-full px-4 py-2 text-xs font-bold text-white"
                  style={{ background: copied ? '#27ae60' : 'linear-gradient(135deg,#5b1fa0,#8e44ad)', cursor: 'pointer', border: 'none' }}>
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
