import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDarkMode } from '../hooks/useDarkMode.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { MusicPlayer } from './MusicPlayer.jsx'

const publicNav = [
  { to: '/', label: 'Home', end: true },
  { to: '/history', label: 'History', end: false },
  { to: '/lobby', label: 'Lobby', end: false },
]

function AnimatedBg() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf, t = 0
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const step = 110, off = (t * 0.22) % step
      for (let i = -step * 2; i < W + step * 2; i += step) {
        const a = 0.025 + 0.015 * Math.sin(t * 0.018 + i * 0.009)
        ctx.lineWidth = 1
        ctx.strokeStyle = `rgba(192,57,43,${a})`
        ctx.beginPath(); ctx.moveTo(i + off, 0); ctx.lineTo(i - H + off, H); ctx.stroke()
        ctx.strokeStyle = `rgba(241,196,15,${a * 0.35})`
        ctx.beginPath(); ctx.moveTo(i - off * 0.6, H); ctx.lineTo(i + H - off * 0.6, 0); ctx.stroke()
      }
      ;[
        { x: W * 0.07, y: H * 0.18, r: 290, c: '192,57,43' },
        { x: W * 0.92, y: H * 0.62, r: 330, c: '142,68,173' },
        { x: W * 0.5,  y: H * 1.02, r: 240, c: '241,196,15' },
        { x: W * 0.75, y: H * 0.05, r: 210, c: '192,57,43' },
      ].forEach((o, i) => {
        const p = Math.sin(t * 0.011 + i * 1.9) * 0.05
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r)
        g.addColorStop(0, `rgba(${o.c},${0.13 + p})`); g.addColorStop(1, `rgba(${o.c},0)`)
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill()
      })
      t++; raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0" style={{ opacity: 0.65 }} />
}

function NavItem({ item }) {
  const [hovered, setHovered] = useState(false)
  return (
    <NavLink to={item.to} end={item.end ?? false}>
      {({ isActive }) => (
        <motion.span
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative block select-none rounded-full px-4 py-2 text-sm font-semibold"
          style={{ color: isActive ? '#fff' : hovered ? '#F1C40F' : 'rgba(241,196,15,0.65)', cursor: 'pointer' }}
          whileTap={{ scale: 0.93 }}
        >
          {isActive && (
            <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(135deg,#5b1fa0,#8e44ad)', boxShadow: '0 0 20px rgba(142,68,173,0.9)' }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
          )}
          {!isActive && hovered && (
            <motion.span className="absolute inset-0 rounded-full"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: 'rgba(241,196,15,0.1)', border: '1px solid rgba(241,196,15,0.2)' }} />
          )}
          <span className="relative z-10">{item.label}</span>
        </motion.span>
      )}
    </NavLink>
  )
}

export function Layout() {
  const { isDark, toggleDarkMode } = useDarkMode()
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const username = profile?.username || (user?.email ? user.email.split('@')[0] : null)
  const navItems = [...publicNav, ...(user ? [{ to: '/profile', label: 'Profile', end: false }] : [])]

  const handleLogout = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen flex-col text-white"
      style={{ backgroundColor: isDark ? '#080503' : '#130a04' }}>
      <AnimatedBg />

      <header className="relative z-20 w-full shrink-0"
        style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(22px)', borderBottom: '1px solid rgba(241,196,15,0.18)' }}>
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.75) 50%,transparent)' }} />

        <div className="flex w-full items-center gap-4 px-4 py-3 md:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" style={{ cursor: 'pointer' }}>
            <motion.div whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.95 }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: 'radial-gradient(circle at 35% 35%,#e74c3c,#7b1010)', boxShadow: '0 0 20px rgba(192,57,43,0.85)', cursor: 'pointer' }}>J
            </motion.div>
            <div className="hidden leading-tight sm:block">
              <p className="font-perpetua text-xl font-semibold"
                style={{ color: '#F1C40F', textShadow: '0 0 14px rgba(241,196,15,0.6)' }}>Joker Card</p>
              <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: 'rgba(241,196,15,0.45)' }}>Bataker Project</p>
            </div>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {navItems.map(item => <NavItem key={item.to} item={item} />)}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
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
                    style={{ border: '1px solid rgba(192,57,43,0.5)', color: '#e74c3c', background: 'transparent', cursor: 'pointer', borderRadius: '9999px', padding: '6px 16px', fontSize: '14px', fontWeight: 600 }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.12)'; e.currentTarget.style.boxShadow = '0 0 14px rgba(192,57,43,0.5)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}>
                    Logout
                  </motion.button>
                </>
              ) : (
                <Link to="/login" style={{ cursor: 'pointer', borderRadius: '9999px', padding: '6px 16px', fontSize: '14px', fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#a93226,#e74c3c)', boxShadow: '0 0 16px rgba(192,57,43,0.6)', textDecoration: 'none' }}>
                  Login
                </Link>
              )}
              <motion.button type="button" onClick={toggleDarkMode}
                whileHover={{ scale: 1.12, rotate: 20 }} whileTap={{ scale: 0.9 }}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32, width: 32, borderRadius: '9999px', border: '1px solid rgba(241,196,15,0.35)', background: 'rgba(0,0,0,0.4)', color: '#F1C40F', fontSize: 14 }}>
                {isDark ? '☀' : '🌙'}
              </motion.button>
            </div>

            <button type="button" onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-full md:hidden"
              style={{ border: '1px solid rgba(241,196,15,0.3)', background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}>
              <span className="h-px w-5 bg-yellow-400" />
              <span className="h-px w-5 bg-yellow-400" />
              <span className="h-px w-3 self-end bg-yellow-400" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)} />
            <motion.div className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col"
              style={{ background: 'rgba(8,5,3,0.98)', borderLeft: '1px solid rgba(241,196,15,0.15)' }}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}>
              <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.6),transparent)' }} />
              <div className="flex items-center justify-between px-6 py-4">
                <span className="font-perpetua text-lg text-yellow-400">Menu</span>
                <button type="button" onClick={() => setMenuOpen(false)} style={{ color: 'rgba(241,196,15,0.7)', cursor: 'pointer', background: 'none', border: 'none', fontSize: 18 }}>✕</button>
              </div>
              <nav className="flex flex-col gap-1 px-4">
                {navItems.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.end ?? false} onClick={() => setMenuOpen(false)}>
                    {({ isActive }) => (
                      <span className="block rounded-xl px-4 py-3 text-sm font-semibold" style={{ cursor: 'pointer', color: isActive ? '#fff' : 'rgba(241,196,15,0.7)', background: isActive ? 'linear-gradient(135deg,#5b1fa0,#8e44ad)' : 'transparent' }}>
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 px-4 pb-8 pt-4" style={{ borderTop: '1px solid rgba(241,196,15,0.1)' }}>
                {user ? (
                  <>
                    {username && (
                      <div className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm" style={{ border: '1px solid rgba(241,196,15,0.2)', color: 'rgba(241,196,15,0.85)' }}>
                        <span className="h-2 w-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />{username}
                      </div>
                    )}
                    <button type="button" onClick={() => { handleLogout(); setMenuOpen(false) }}
                      style={{ cursor: 'pointer', borderRadius: 12, padding: '8px 16px', fontSize: 14, fontWeight: 600, color: '#e74c3c', border: '1px solid rgba(192,57,43,0.4)', background: 'transparent' }}>
                      Logout
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setMenuOpen(false)}
                    style={{ cursor: 'pointer', borderRadius: 12, padding: '8px 16px', textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#a93226,#e74c3c)', textDecoration: 'none' }}>
                    Login
                  </Link>
                )}
                <button type="button" onClick={toggleDarkMode}
                  style={{ cursor: 'pointer', borderRadius: 12, padding: '8px 16px', fontSize: 14, fontWeight: 600, color: 'rgba(241,196,15,0.7)', border: '1px solid rgba(241,196,15,0.2)', background: 'transparent' }}>
                  {isDark ? '☀ Mode Terang' : '🌙 Mode Gelap'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex w-full flex-1 px-3 py-4 md:px-4">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} className="relative w-full rounded-2xl p-4 md:p-6"
            style={{ background: 'rgba(0,0,0,0.52)', border: '1px solid rgba(241,196,15,0.1)', boxShadow: '0 0 70px rgba(0,0,0,0.75)', backdropFilter: 'blur(18px)' }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative z-10 w-full py-3 text-center text-[10px] tracking-[0.25em]"
        style={{ background: 'rgba(0,0,0,0.75)', borderTop: '1px solid rgba(241,196,15,0.08)', color: 'rgba(241,196,15,0.28)' }}>
        Joker Card &middot; Bataker Project &middot; 2026
      </footer>
      <MusicPlayer />
    </div>
  )
}
