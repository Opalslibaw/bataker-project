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

const CARDS = [
  { id: 1, label: 'A♠', rot: -22, ox: -180, oy: 10, isJoker: false },
  { id: 2, label: 'K♥', rot: -9,  ox: -90,  oy: -10, isJoker: false },
  { id: 3, label: '🃏', rot:  2,  ox:  0,   oy: 0,  isJoker: true },
  { id: 4, label: 'Q♦', rot: 13,  ox:  90,  oy: -8, isJoker: false },
  { id: 5, label: '10♣',rot: 24,  ox:  180, oy: 12, isJoker: false },
]

// ── Spotlight
function Spotlight() {
  const x = useMotionValue(-600)
  const y = useMotionValue(-600)
  const sx = useSpring(x, { stiffness: 70, damping: 16 })
  const sy = useSpring(y, { stiffness: 70, damping: 16 })
  useEffect(() => {
    const move = (e) => { x.set(e.clientX); y.set(e.clientY) }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [x, y])
  return (
    <>
      <motion.div className="pointer-events-none fixed z-10" style={{
        left: sx, top: sy, width: 900, height: 900, x: '-50%', y: '-50%',
        background: 'radial-gradient(circle,rgba(241,196,15,0.055) 0%,transparent 60%)',
        borderRadius: '50%',
      }} />
      <motion.div className="pointer-events-none fixed z-10" style={{
        left: sx, top: sy, width: 300, height: 300, x: '-50%', y: '-50%',
        background: 'radial-gradient(circle,rgba(192,57,43,0.09) 0%,transparent 70%)',
        borderRadius: '50%',
      }} />
    </>
  )
}

// ── AnimatedBg
function AnimatedBg({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf, t = 0
    const sparks = Array.from({ length: 38 }, () => ({
      x: Math.random(), y: Math.random(),
      r: 0.5 + Math.random() * 1.5,
      speed: 0.0003 + Math.random() * 0.0005,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.6 ? '241,196,15' : '192,57,43',
    }))
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const step = 100, off = (t * 0.2) % step
      for (let i = -step * 2; i < W + step * 2; i += step) {
        const a = 0.04 + 0.022 * Math.sin(t * 0.016 + i * 0.008)
        ctx.lineWidth = 1
        ctx.strokeStyle = `rgba(192,57,43,${a})`
        ctx.beginPath(); ctx.moveTo(i + off, 0); ctx.lineTo(i - H + off, H); ctx.stroke()
        ctx.strokeStyle = `rgba(241,196,15,${a * 0.35})`
        ctx.beginPath(); ctx.moveTo(i - off * 0.5, H); ctx.lineTo(i + H - off * 0.5, 0); ctx.stroke()
      }
      ;[
        { x: W*0.05, y: H*0.15, r: 380, c:'192,57,43' },
        { x: W*0.95, y: H*0.55, r: 400, c:'142,68,173' },
        { x: W*0.45, y: H*0.95, r: 300, c:'241,196,15' },
        { x: W*0.8,  y: H*0.05, r: 260, c:'192,57,43' },
        { x: W*0.5,  y: H*0.4,  r: 200, c:'142,68,173' },
      ].forEach((o, i) => {
        const p = Math.sin(t * 0.01 + i * 2) * 0.06
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r)
        g.addColorStop(0, `rgba(${o.c},${0.18 + p})`); g.addColorStop(1, `rgba(${o.c},0)`)
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); ctx.fill()
      })
      sparks.forEach(s => {
        const px = (s.x + t * s.speed) % 1
        const py = (s.y + t * s.speed * 0.4) % 1
        const alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.03 + s.phase))
        ctx.beginPath()
        ctx.arc(px * W, py * H, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${s.color},${alpha})`
        ctx.fill()
      })
      t++; raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [canvasRef])
  return null
}

// ── Loading particles
function LoadingParticles() {
  const count = 12
  return (
    <div className="relative w-36 h-36">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360
        const delay = (i / count) * 1.2
        return (
          <motion.div key={i} className="absolute"
            style={{
              width: 6, height: 6, borderRadius: '50%',
              top: '50%', left: '50%', marginTop: -3, marginLeft: -3,
              background: i % 3 === 0 ? '#e74c3c' : i % 3 === 1 ? '#F1C40F' : '#8e44ad',
              boxShadow: `0 0 8px ${i % 3 === 0 ? '#e74c3c' : i % 3 === 1 ? '#F1C40F' : '#8e44ad'}`,
              transformOrigin: '3px 3px',
              transform: `rotate(${angle}deg) translateX(54px)`,
            }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.6, 1.3, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity, delay, ease: 'easeInOut' }}
          />
        )
      })}
      <motion.div className="absolute inset-0 flex items-center justify-center"
        animate={{ rotateY: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
        <div className="flex h-20 w-14 flex-col items-center justify-between rounded-xl p-2"
          style={{
            background: 'linear-gradient(135deg,#1a0030,#4a0080)',
            border: '1px solid rgba(192,57,43,0.9)',
            boxShadow: '0 0 30px rgba(192,57,43,0.8), 0 0 60px rgba(192,57,43,0.3)',
          }}>
          <span className="self-start text-xs font-bold" style={{ color: '#e74c3c' }}>🃏</span>
          <span className="text-2xl">🃏</span>
          <span className="self-end rotate-180 text-xs font-bold" style={{ color: '#e74c3c' }}>🃏</span>
        </div>
      </motion.div>
    </div>
  )
}

// ── DRAGGABLE CARD — seret, lempar, spring balik otomatis
function DraggableCard({ card, parallax }) {
  const isJoker = card.isJoker
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const springX = useSpring(dragX, { stiffness: 180, damping: 20, mass: 1 })
  const springY = useSpring(dragY, { stiffness: 180, damping: 20, mass: 1 })

  const [isDragging, setIsDragging] = useState(false)
  const [extraRot, setExtraRot] = useState(0)
  const velRef = useRef({ x: 0, y: 0 })
  const prevPos = useRef({ x: 0, y: 0 })
  const prevTime = useRef(Date.now())
  const returnTimer = useRef(null)

  const intensity = 10 + card.id * 4
  const baseX = card.ox + (-parallax.x * intensity)
  const baseY = card.oy + (-parallax.y * intensity)

  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (returnTimer.current) clearTimeout(returnTimer.current)
    setIsDragging(true)
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    prevPos.current = { x: clientX, y: clientY }
    prevTime.current = Date.now()
    velRef.current = { x: 0, y: 0 }

    const onMove = (ev) => {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY
      const now = Date.now()
      const dt = Math.max(now - prevTime.current, 1)
      velRef.current = {
        x: (cx - prevPos.current.x) / dt * 16,
        y: (cy - prevPos.current.y) / dt * 16,
      }
      dragX.set(dragX.get() + (cx - prevPos.current.x))
      dragY.set(dragY.get() + (cy - prevPos.current.y))
      prevPos.current = { x: cx, y: cy }
      prevTime.current = now
    }

    const onUp = () => {
      setIsDragging(false)
      const speed = Math.sqrt(velRef.current.x ** 2 + velRef.current.y ** 2)
      if (speed > 5) {
        // Throw! fling jauh lalu balik
        const throwX = velRef.current.x * 20
        const throwY = velRef.current.y * 20
        const spinAmount = velRef.current.x * 3
        dragX.set(dragX.get() + throwX)
        dragY.set(dragY.get() + throwY)
        setExtraRot(spinAmount)
        returnTimer.current = setTimeout(() => {
          dragX.set(0)
          dragY.set(0)
          setExtraRot(0)
        }, 700)
      } else {
        // Gentle drop
        dragX.set(0)
        dragY.set(0)
        setExtraRot(0)
      }
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }

    window.addEventListener('mousemove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }, [dragX, dragY])

  return (
    <motion.div
      onPointerDown={handlePointerDown}
      className="absolute left-1/2 top-1/2 flex flex-col items-center justify-between rounded-2xl p-3 select-none"
      style={{
        width: 88, height: 124,
        cursor: isDragging ? 'grabbing' : 'grab',
        x: springX,
        y: springY,
        rotate: card.rot + extraRot,
        translateX: `calc(-50% + ${baseX}px)`,
        translateY: `calc(-50% + ${baseY}px)`,
        background: isJoker
          ? 'linear-gradient(135deg,#1a0030,#4a0080)'
          : 'linear-gradient(135deg,#0a0705,#1f140a)',
        border: isJoker
          ? '1px solid rgba(192,57,43,0.85)'
          : '1px solid rgba(241,196,15,0.55)',
        boxShadow: isDragging
          ? (isJoker
            ? '0 0 120px rgba(192,57,43,1), 0 0 240px rgba(192,57,43,0.5), 0 32px 64px rgba(0,0,0,0.9)'
            : '0 0 80px rgba(241,196,15,0.9), 0 32px 64px rgba(0,0,0,0.9)')
          : (isJoker
            ? '0 0 60px rgba(192,57,43,0.8), 0 0 120px rgba(192,57,43,0.25), 0 8px 32px rgba(0,0,0,0.7), inset 0 0 20px rgba(192,57,43,0.1)'
            : '0 0 30px rgba(241,196,15,0.35), 0 8px 24px rgba(0,0,0,0.6), inset 0 0 12px rgba(241,196,15,0.05)'),
        zIndex: isDragging ? 50 : isJoker ? 10 : card.id,
        touchAction: 'none',
        transition: isDragging ? 'box-shadow 0.15s ease' : undefined,
      }}
      animate={!isDragging ? {
        y: [0, -8, 0],
      } : {}}
      transition={!isDragging ? {
        duration: 3 + card.id * 0.5, repeat: Infinity, ease: 'easeInOut', delay: card.id * 0.25
      } : {}}
      whileHover={!isDragging ? {
        scale: 1.12,
        boxShadow: isJoker
          ? '0 0 80px rgba(192,57,43,1), 0 0 160px rgba(192,57,43,0.4)'
          : '0 0 60px rgba(241,196,15,0.7), 0 0 120px rgba(241,196,15,0.2)',
      } : {}}
    >
      {/* Shimmer top line */}
      <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl pointer-events-none"
        style={{ background: isJoker
          ? 'linear-gradient(90deg,transparent,rgba(192,57,43,0.6),transparent)'
          : 'linear-gradient(90deg,transparent,rgba(241,196,15,0.4),transparent)' }} />
      <span className="self-start text-sm font-bold"
        style={{ color: isJoker ? '#e74c3c' : '#F1C40F', textShadow: isJoker ? '0 0 8px #e74c3c' : '0 0 8px #F1C40F' }}>
        {card.label}
      </span>
      <span className="font-perpetua text-3xl"
        style={{ color: isJoker ? '#e74c3c' : '#F1C40F', filter: isJoker ? 'drop-shadow(0 0 8px #e74c3c)' : 'drop-shadow(0 0 6px #F1C40F)' }}>
        {card.label}
      </span>
      <span className="self-end rotate-180 text-sm font-bold"
        style={{ color: isJoker ? '#e74c3c' : '#F1C40F', textShadow: isJoker ? '0 0 8px #e74c3c' : '0 0 8px #F1C40F' }}>
        {card.label}
      </span>
    </motion.div>
  )
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
  const [btnShimmer, setBtnShimmer] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const username = profile?.username || (user?.email ? user.email.split('@')[0] : null)

  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(false)
      setTimeout(() => setShowHint(true), 500)
      setTimeout(() => setShowHint(false), 4000)
    }, 1800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (isLoading) return
    const interval = setInterval(() => {
      setBtnShimmer(true)
      setTimeout(() => setBtnShimmer(false), 700)
    }, 3500)
    return () => clearInterval(interval)
  }, [isLoading])

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
    <div ref={containerRef} className="relative min-h-screen w-full overflow-x-hidden text-white"
      style={{ backgroundColor: isDark ? '#080503' : '#0d0602' }} onMouseMove={handleMouseMove}>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" style={{ opacity: 0.85 }} />
      <AnimatedBg canvasRef={canvasRef} />
      <Spotlight />

      {/* ── LOADING SPLASH */}
      <AnimatePresence>
        {isLoading && (
          <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
            style={{ background: 'radial-gradient(ellipse at center, #0e0007 0%, #000 70%)' }}
            initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
            <motion.div className="absolute"
              style={{ width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,57,43,0.25) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
            <LoadingParticles />
            <div className="flex flex-col items-center gap-1">
              <motion.p className="font-perpetua text-3xl tracking-[0.4em]"
                style={{ color: '#F1C40F', textShadow: '0 0 30px rgba(241,196,15,0.8), 0 0 60px rgba(241,196,15,0.3)' }}
                animate={{ opacity: [0.6, 1, 0.6], textShadow: [
                  '0 0 20px rgba(241,196,15,0.5)',
                  '0 0 40px rgba(241,196,15,1), 0 0 80px rgba(192,57,43,0.5)',
                  '0 0 20px rgba(241,196,15,0.5)',
                ]}}
                transition={{ duration: 1.8, repeat: Infinity }}>
                KARTU BATAK
              </motion.p>
              <motion.p className="text-[9px] uppercase tracking-[0.6em]"
                style={{ color: 'rgba(241,196,15,0.35)' }}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 0.4 }}>
                Bataker Project
              </motion.p>
            </div>
            <div className="w-48 overflow-hidden rounded-full" style={{ height: 2, background: 'rgba(241,196,15,0.1)' }}>
              <motion.div className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#e74c3c,#F1C40F,#8e44ad)' }}
                initial={{ x: '-100%' }} animate={{ x: '100%' }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NAVBAR */}
      <header className="fixed inset-x-0 top-0 z-30 w-full"
        style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(28px)', borderBottom: '1px solid rgba(241,196,15,0.12)' }}>
        <motion.div className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.0) 0%,rgba(241,196,15,0.9) 50%,rgba(241,196,15,0.0) 100%)' }}
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
        <div className="flex w-full items-center gap-4 px-4 py-3 md:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <motion.div whileHover={{ scale: 1.12, rotate: -5 }} whileTap={{ scale: 0.95 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
              style={{ background: 'radial-gradient(circle at 35% 35%,#e74c3c,#7b1010)', boxShadow: '0 0 24px rgba(192,57,43,0.9), 0 0 48px rgba(192,57,43,0.3)' }}>
              🃏
            </motion.div>
            <div className="hidden leading-tight sm:block">
              <p className="font-perpetua text-xl font-semibold"
                style={{ color: '#F1C40F', textShadow: '0 0 20px rgba(241,196,15,0.7), 0 0 40px rgba(241,196,15,0.2)' }}>Kartu Batak</p>
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
                      style={{ background: 'linear-gradient(135deg,#5b1fa0,#8e44ad)', boxShadow: '0 0 24px rgba(142,68,173,0.9), 0 0 48px rgba(142,68,173,0.3)' }} />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </motion.span>
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <motion.button type="button" onClick={() => setShowShare(true)}
                whileHover={{ scale: 1.05, boxShadow: '0 0 16px rgba(241,196,15,0.3)' }} whileTap={{ scale: 0.95 }}
                className="rounded-full px-3 py-1.5 text-xs font-medium"
                style={{ border: '1px solid rgba(241,196,15,0.28)', color: 'rgba(241,196,15,0.75)', background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}>
                Share
              </motion.button>
              {user ? (
                <>
                  {username && (
                    <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                      style={{ border: '1px solid rgba(241,196,15,0.2)', background: 'rgba(0,0,0,0.4)', color: 'rgba(241,196,15,0.85)' }}>
                      <motion.span className="h-1.5 w-1.5 rounded-full bg-green-400"
                        style={{ boxShadow: '0 0 6px #4ade80' }}
                        animate={{ boxShadow: ['0 0 4px #4ade80', '0 0 12px #4ade80', '0 0 4px #4ade80'] }}
                        transition={{ duration: 2, repeat: Infinity }} />
                      {username}
                    </div>
                  )}
                  <motion.button type="button" onClick={handleLogout}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 16px rgba(192,57,43,0.4)' }} whileTap={{ scale: 0.95 }}
                    className="rounded-full px-4 py-1.5 text-sm font-semibold"
                    style={{ border: '1px solid rgba(192,57,43,0.5)', color: '#e74c3c', background: 'transparent', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                    Logout
                  </motion.button>
                </>
              ) : (
                <Link to="/login" className="rounded-full px-4 py-1.5 text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#a93226,#e74c3c)', boxShadow: '0 0 20px rgba(192,57,43,0.65), 0 0 40px rgba(192,57,43,0.2)' }}>
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

      {/* ── MAIN */}
      <main className="relative z-20 flex min-h-screen w-full flex-col pt-[64px]">

        {/* HERO */}
        <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 md:flex-row md:gap-0 md:px-14 lg:px-24">
          {/* Left */}
          <motion.div className="flex-1 space-y-8 text-center md:text-left"
            initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{ background: 'rgba(241,196,15,0.08)', border: '1px solid rgba(241,196,15,0.2)' }}>
                <motion.span className="h-1.5 w-1.5 rounded-full bg-green-400"
                  animate={{ boxShadow: ['0 0 4px #4ade80', '0 0 14px #4ade80', '0 0 4px #4ade80'] }}
                  transition={{ duration: 2, repeat: Infinity }} />
                <span className="text-[10px] uppercase tracking-[0.35em]" style={{ color: 'rgba(241,196,15,0.7)' }}>
                  {user ? `Halo, ${username}!` : 'Selamat Datang'}
                </span>
              </motion.div>
              <motion.h1 className="font-perpetua text-5xl font-bold leading-none sm:text-6xl lg:text-7xl xl:text-8xl"
                style={{ color: '#F1C40F', textShadow: '0 0 60px rgba(241,196,15,0.6), 0 0 120px rgba(192,57,43,0.35), 0 2px 0 rgba(0,0,0,0.8)' }}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}>
                KARTU<br />BATAK
              </motion.h1>
              <motion.p className="text-xs uppercase tracking-[0.5em]"
                style={{ color: 'rgba(241,196,15,0.5)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                Bataker Project
              </motion.p>
            </div>
            <motion.p className="max-w-md text-sm leading-loose md:mx-0 mx-auto"
              style={{ color: 'rgba(255,255,255,0.55)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
              Permainan kartu bergaya kasino dengan nuansa misterius. Masuk ke meja, baca pola lawan, dan hindari menjadi pemegang Joker terakhir.
            </motion.p>
            <motion.div className="flex flex-wrap justify-center gap-3 md:justify-start"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
              <motion.button type="button" onClick={() => navigate(user ? '/lobby' : '/login')}
                whileHover={{ scale: 1.07, boxShadow: '0 0 48px rgba(192,57,43,0.85), 0 0 96px rgba(192,57,43,0.3)' }}
                whileTap={{ scale: 0.96 }}
                className="relative overflow-hidden rounded-full px-8 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-white"
                style={{ background: 'linear-gradient(135deg,#a93226,#e74c3c)', boxShadow: '0 0 32px rgba(192,57,43,0.7), 0 0 64px rgba(192,57,43,0.25)' }}>
                <motion.span className="pointer-events-none absolute inset-0"
                  style={{ background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.22) 50%,transparent 70%)' }}
                  animate={btnShimmer ? { x: ['-100%', '100%'] } : { x: '-100%' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }} />
              <span className="relative z-10 flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Main Sekarang
              </span>
              </motion.button>
              <motion.button type="button" onClick={() => navigate('/history')}
                whileHover={{ scale: 1.07, boxShadow: '0 0 32px rgba(241,196,15,0.35)', borderColor: 'rgba(241,196,15,0.7)' }}
                whileTap={{ scale: 0.96 }}
                className="relative overflow-hidden rounded-full px-8 py-3.5 text-sm font-bold uppercase tracking-[0.2em]"
                style={{ border: '1px solid rgba(241,196,15,0.4)', color: '#F1C40F', background: 'rgba(0,0,0,0.35)', cursor: 'pointer' }}>
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
              {[['4–8', 'Pemain'], ['53', 'Kartu'], ['1', 'Joker']].map(([val, lbl]) => (
                <motion.div key={lbl} className="text-center" whileHover={{ scale: 1.1 }}>
                  <p className="font-perpetua text-3xl"
                    style={{ color: '#F1C40F', textShadow: '0 0 20px rgba(241,196,15,0.8), 0 0 40px rgba(241,196,15,0.3)' }}>{val}</p>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(241,196,15,0.4)' }}>{lbl}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — DRAGGABLE CARDS */}
          <motion.div className="relative mt-14 h-72 w-full flex-1 md:mt-0 md:h-[420px]"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>
            {CARDS.map((card) => (
              <DraggableCard key={card.id} card={card} parallax={parallax} />
            ))}
            {/* Drag hint */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap rounded-full px-4 py-2 text-[10px]"
                  style={{
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(241,196,15,0.3)',
                    color: 'rgba(241,196,15,0.8)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 0 20px rgba(241,196,15,0.1)',
                  }}>
                  ✦ Seret kartu — lempar kencang untuk efek!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* FEATURES */}
        <section className="w-full px-6 pb-20 md:px-14 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="mb-8 flex items-center gap-4">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.35))' }} />
            <p className="text-[10px] uppercase tracking-[0.4em]" style={{ color: 'rgba(241,196,15,0.5)' }}>Fitur Utama</p>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg,rgba(241,196,15,0.35),transparent)' }} />
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="13" height="18" rx="2"/>
                    <path d="M5 7h7M5 10.5h7M5 14h4"/>
                    <path d="M17 7l3 3-3 3M20 10H13" strokeWidth="1.6"/>
                  </svg>
                ),
                title: 'Hindari Joker', desc: 'Buang semua kartumu sebelum yang lain. Jangan sampai menjadi pemegang Joker terakhir.', color: 'rgba(192,57,43,0.35)', glow: 'rgba(192,57,43,0.6)',
              },
              {
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                  </svg>
                ),
                title: 'Strategi & Insting', desc: 'Baca pola lawan, pilih kartu dengan tepat. Timing yang benar bisa membalikkan permainan.', color: 'rgba(241,196,15,0.18)', glow: 'rgba(241,196,15,0.5)',
              },
              {
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                ),
                title: 'Real-time Cepat', desc: 'Multiplayer online dengan Supabase Realtime. Setiap ronde menegangkan sampai kartu terakhir.', color: 'rgba(142,68,173,0.35)', glow: 'rgba(142,68,173,0.6)',
              },
            ].map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                whileHover={{ y: -8, scale: 1.04, boxShadow: `0 0 60px ${f.glow}, 0 20px 60px rgba(0,0,0,0.5)` }}
                className="relative overflow-hidden rounded-2xl p-6"
                style={{ border: '1px solid rgba(241,196,15,0.12)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(14px)' }}>
                <div className="absolute inset-x-0 top-0 h-px"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.4),transparent)' }} />
                <div className="absolute inset-0 rounded-2xl opacity-40"
                  style={{ background: `radial-gradient(circle at 20% 20%,${f.color},transparent 60%)` }} />
                <div className="absolute bottom-0 right-0 h-24 w-24 opacity-20"
                  style={{ background: `radial-gradient(circle at 100% 100%,${f.color},transparent 70%)` }} />
                <div className="relative">
                <motion.div className="block"
                  style={{ color: f.glow, filter: `drop-shadow(0 0 6px ${f.glow})` }}
                  whileHover={{ scale: 1.18, filter: `drop-shadow(0 0 16px ${f.glow})` }}>
                  {f.icon}
                </motion.div>
                  <p className="mt-3 font-perpetua text-xl" style={{ color: '#f5d87a', textShadow: '0 0 12px rgba(241,196,15,0.4)' }}>{f.title}</p>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full py-4 text-center text-[10px] tracking-[0.3em]"
        style={{ background: 'rgba(0,0,0,0.85)', borderTop: '1px solid rgba(241,196,15,0.09)', color: 'rgba(241,196,15,0.3)' }}>
        Kartu Batak &middot; Bataker Project &middot; 2026
      </footer>

      {/* Share modal */}
      <AnimatePresence>
        {showShare && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-sm rounded-2xl p-6"
              style={{ border: '1px solid rgba(241,196,15,0.3)', background: 'rgba(5,3,1,0.97)', boxShadow: '0 0 80px rgba(241,196,15,0.12), 0 0 160px rgba(192,57,43,0.08)' }}
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-perpetua text-xl" style={{ color: '#F1C40F', textShadow: '0 0 12px rgba(241,196,15,0.5)' }}>Bagikan Kartu Batak</p>
                <button type="button" onClick={() => setShowShare(false)} style={{ color: 'rgba(241,196,15,0.6)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>
              <p className="mb-4 text-xs" style={{ color: 'rgba(241,196,15,0.45)' }}>Salin link untuk berbagi ke teman.</p>
              <div className="flex gap-2">
                <input readOnly value={window.location.href} className="flex-1 rounded-xl px-3 py-2.5 text-xs outline-none"
                  style={{ border: '1px solid rgba(241,196,15,0.25)', background: 'rgba(0,0,0,0.6)', color: '#F1C40F' }} />
                <motion.button type="button" onClick={handleCopy}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="rounded-full px-4 py-2 text-xs font-bold text-white"
                  style={{ background: copied ? '#27ae60' : 'linear-gradient(135deg,#5b1fa0,#8e44ad)', cursor: 'pointer', border: 'none', boxShadow: copied ? '0 0 16px rgba(39,174,96,0.6)' : '0 0 16px rgba(142,68,173,0.6)' }}>
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
