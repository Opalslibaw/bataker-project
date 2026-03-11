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
  { to: '/leaderboard', label: 'Leaderboard', end: false },
]

/* ── SVG: Sun icon ── */
const IcoSun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

/* ── SVG: Moon icon ── */
const IcoMoon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
)

/* ── SVG: Bell icon ── */
const IcoBell = ({ muted }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
    {muted && <line x1="4" y1="4" x2="20" y2="20" stroke="#e74c3c" strokeWidth="2.5"/>}
  </svg>
)

/* ── StaticBg: CSS only, zero JS ── */
function StaticBg({ isDark }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" style={{
      background: isDark
        ? `
          radial-gradient(ellipse 60% 45% at 8% 15%, rgba(192,57,43,0.18) 0%, transparent 65%),
          radial-gradient(ellipse 55% 50% at 92% 65%, rgba(142,68,173,0.15) 0%, transparent 65%),
          radial-gradient(ellipse 40% 35% at 50% 105%, rgba(241,196,15,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 35% 25% at 75% 5%, rgba(192,57,43,0.1) 0%, transparent 60%)
        `
        : `
          radial-gradient(ellipse 70% 50% at 10% 10%, rgba(241,196,15,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 60% 55% at 90% 70%, rgba(184,134,11,0.12) 0%, transparent 65%),
          radial-gradient(ellipse 50% 40% at 50% 100%, rgba(192,57,43,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 80% 80% at 50% 50%, rgba(255,240,190,0.3) 0%, transparent 70%)
        `,
      transition: 'background 0.6s ease',
    }}/>
  )
}

function NavItem({ item, isDark }) {
  const [hovered, setHovered] = useState(false)
  return (
    <NavLink to={item.to} end={item.end ?? false}>
      {({ isActive }) => (
        <motion.span
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative block select-none rounded-full px-4 py-2 text-sm font-semibold"
          style={{
            color: isActive ? '#fff' : hovered
              ? (isDark ? '#F1C40F' : '#b8860b')
              : (isDark ? 'rgba(241,196,15,0.65)' : 'rgba(120,80,0,0.75)'),
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
          whileTap={{ scale: 0.93 }}
        >
          {isActive && (
            <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full"
              style={{ background: isDark ? 'linear-gradient(135deg,#5b1fa0,#8e44ad)' : 'linear-gradient(135deg,#b8860b,#d4a017)', boxShadow: isDark ? '0 0 20px rgba(142,68,173,0.9)' : '0 0 20px rgba(184,134,11,0.5)' }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
          )}
          {!isActive && hovered && (
            <motion.span className="absolute inset-0 rounded-full"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: isDark ? 'rgba(241,196,15,0.1)' : 'rgba(184,134,11,0.12)', border: `1px solid ${isDark ? 'rgba(241,196,15,0.2)' : 'rgba(184,134,11,0.3)'}` }} />
          )}
          <span className="relative z-10">{item.label}</span>
        </motion.span>
      )}
    </NavLink>
  )
}

/* ── Turn Notification Toast ── */
export function TurnNotification({ show, onClose }) {
  useEffect(() => {
    if (!show) return
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [show, onClose])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          onClick={onClose}
          style={{
            position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, cursor: 'pointer',
            borderRadius: 16, padding: '12px 22px',
            background: 'rgba(5,2,0,0.97)',
            border: '1px solid rgba(241,196,15,0.55)',
            boxShadow: '0 0 40px rgba(241,196,15,0.2), 0 8px 32px rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', gap: 12,
            backdropFilter: 'blur(12px)',
            whiteSpace: 'nowrap',
          }}>
          {/* Pulse dot */}
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: '#F1C40F',
            boxShadow: '0 0 0 0 rgba(241,196,15,0.4)',
            animation: 'turn-ping 1.2s ease-in-out infinite',
          }}/>
          <span style={{ fontFamily: 'Cinzel,serif', fontSize: 13, fontWeight: 700,
            color: '#F1C40F', letterSpacing: '0.05em' }}>Giliranmu!</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Ambil kartu sekarang</span>
          <style>{`
            @keyframes turn-ping {
              0%   { box-shadow: 0 0 0 0 rgba(241,196,15,0.5); }
              70%  { box-shadow: 0 0 0 8px rgba(241,196,15,0); }
              100% { box-shadow: 0 0 0 0 rgba(241,196,15,0); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
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

  // ── Background & card colors reactive to isDark ──
  const bgBase    = isDark ? '#080503' : '#f5efe0'
  const headerBg  = isDark ? 'rgba(0,0,0,0.82)' : 'rgba(245,235,200,0.96)'
  const headerBdr = isDark ? 'rgba(241,196,15,0.18)' : 'rgba(184,134,11,0.3)'
  const gold      = isDark ? '#F1C40F' : '#b8860b'
  const goldDim   = isDark ? 'rgba(241,196,15,0.45)' : 'rgba(184,134,11,0.5)'
  const cardBg    = isDark ? 'rgba(0,0,0,0.52)' : 'rgba(255,248,225,0.9)'
  const cardBdr   = isDark ? 'rgba(241,196,15,0.1)' : 'rgba(184,134,11,0.22)'
  const cardShadow= isDark ? '0 0 70px rgba(0,0,0,0.75)' : '0 4px 40px rgba(100,60,0,0.12)'
  const textColor = isDark ? '#ffffff' : '#1a0f00'
  const footerBg  = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(230,215,175,0.9)'
  const footerBdr = isDark ? 'rgba(241,196,15,0.08)' : 'rgba(184,134,11,0.2)'
  const footerTxt = isDark ? 'rgba(241,196,15,0.28)' : 'rgba(120,80,0,0.45)'

  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{
        backgroundColor: bgBase,
        color: textColor,
        transition: 'background-color 0.5s ease, color 0.3s ease',
      }}>
      <StaticBg isDark={isDark} />

      {/* ── HEADER ── */}
      <header
        className="relative z-20 w-full shrink-0"
        style={{
          background: headerBg,
          backdropFilter: 'blur(22px)',
          borderBottom: `1px solid ${headerBdr}`,
          transition: 'background 0.5s ease, border-color 0.5s ease',
        }}>
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg,transparent,${gold} 50%,transparent)` }} />

        <div className="flex w-full items-center gap-4 px-4 py-3 md:px-6">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5" style={{ cursor: 'pointer' }}>
            <motion.div whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.95 }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: 'radial-gradient(circle at 35% 35%,#e74c3c,#7b1010)', boxShadow: '0 0 20px rgba(192,57,43,0.85)', cursor: 'pointer' }}>
              J
            </motion.div>
            <div className="hidden leading-tight sm:block">
              <p className="font-perpetua text-xl font-semibold"
                style={{ color: gold, textShadow: `0 0 14px ${gold}80`, transition: 'color 0.3s' }}>
                Kartu Batak
              </p>
              <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: goldDim }}>Bataker Project</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {navItems.map(item => <NavItem key={item.to} item={item} isDark={isDark} />)}
          </nav>

          {/* Actions */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  {username && (
                    <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                      style={{
                        border: `1px solid ${isDark ? 'rgba(241,196,15,0.22)' : 'rgba(184,134,11,0.3)'}`,
                        background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,245,210,0.8)',
                        color: gold, transition: 'all 0.3s',
                      }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
                      {username}
                    </div>
                  )}
                  <motion.button type="button" onClick={handleLogout}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{
                      border: '1px solid rgba(192,57,43,0.5)', color: '#e74c3c',
                      background: 'transparent', cursor: 'pointer', borderRadius: '9999px',
                      padding: '6px 16px', fontSize: '14px', fontWeight: 600,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.12)'; e.currentTarget.style.boxShadow = '0 0 14px rgba(192,57,43,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}>
                    Logout
                  </motion.button>
                </>
              ) : (
                <Link to="/login"
                  style={{ cursor: 'pointer', borderRadius: '9999px', padding: '6px 16px', fontSize: '14px', fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#a93226,#e74c3c)', boxShadow: '0 0 16px rgba(192,57,43,0.6)', textDecoration: 'none' }}>
                  Login
                </Link>
              )}

              {/* Dark/Light Toggle — drastis dengan label */}
              <motion.button type="button" onClick={toggleDarkMode}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
                title={isDark ? 'Mode Terang' : 'Mode Gelap'}
                style={{
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  height: 32, borderRadius: 9999, padding: '0 12px',
                  border: `1px solid ${isDark ? 'rgba(241,196,15,0.35)' : 'rgba(184,134,11,0.45)'}`,
                  background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,245,210,0.7)',
                  color: gold,
                  transition: 'all 0.3s ease',
                  boxShadow: isDark ? 'none' : '0 2px 12px rgba(184,134,11,0.15)',
                  fontSize: 11, fontWeight: 600, fontFamily: 'Cinzel,serif',
                  letterSpacing: '0.05em',
                }}>
                {isDark ? <IcoSun /> : <IcoMoon />}
                <span style={{ fontSize: 10 }}>{isDark ? 'Terang' : 'Gelap'}</span>
              </motion.button>
            </div>

            {/* Hamburger */}
            <button type="button" onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-full md:hidden"
              style={{
                border: `1px solid ${isDark ? 'rgba(241,196,15,0.3)' : 'rgba(184,134,11,0.35)'}`,
                background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,245,210,0.7)',
                cursor: 'pointer',
              }}>
              <span className="h-px w-5" style={{ background: gold }} />
              <span className="h-px w-5" style={{ background: gold }} />
              <span className="h-px w-3 self-end" style={{ background: gold }} />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div className="fixed inset-0 z-40"
              style={{ background: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(80,40,0,0.35)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)} />
            <motion.div className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col"
              style={{
                background: isDark ? 'rgba(8,5,3,0.99)' : 'rgba(252,244,220,0.99)',
                borderLeft: `1px solid ${isDark ? 'rgba(241,196,15,0.15)' : 'rgba(184,134,11,0.25)'}`,
                transition: 'background 0.3s',
              }}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}>
              <div className="h-px w-full"
                style={{ background: `linear-gradient(90deg,transparent,${gold},transparent)` }} />
              <div className="flex items-center justify-between px-6 py-4">
                <span className="font-perpetua text-lg" style={{ color: gold }}>Menu</span>
                <button type="button" onClick={() => setMenuOpen(false)}
                  style={{ color: goldDim, cursor: 'pointer', background: 'none', border: 'none', fontSize: 18 }}>✕</button>
              </div>
              <nav className="flex flex-col gap-1 px-4">
                {navItems.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.end ?? false} onClick={() => setMenuOpen(false)}>
                    {({ isActive }) => (
                      <span className="block rounded-xl px-4 py-3 text-sm font-semibold"
                        style={{
                          cursor: 'pointer', color: isActive ? '#fff' : isDark ? 'rgba(241,196,15,0.7)' : 'rgba(120,80,0,0.8)',
                          background: isActive
                            ? (isDark ? 'linear-gradient(135deg,#5b1fa0,#8e44ad)' : 'linear-gradient(135deg,#b8860b,#d4a017)')
                            : 'transparent',
                        }}>
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 px-4 pb-8 pt-4"
                style={{ borderTop: `1px solid ${isDark ? 'rgba(241,196,15,0.1)' : 'rgba(184,134,11,0.15)'}` }}>
                {user ? (
                  <>
                    {username && (
                      <div className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm"
                        style={{ border: `1px solid ${isDark ? 'rgba(241,196,15,0.2)' : 'rgba(184,134,11,0.25)'}`, color: gold }}>
                        <span className="h-2 w-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
                        {username}
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
                {/* Dark/light toggle mobile */}
                <button type="button" onClick={toggleDarkMode}
                  style={{
                    cursor: 'pointer', borderRadius: 12, padding: '8px 16px', fontSize: 14, fontWeight: 600,
                    color: gold,
                    border: `1px solid ${isDark ? 'rgba(241,196,15,0.2)' : 'rgba(184,134,11,0.25)'}`,
                    background: isDark ? 'transparent' : 'rgba(255,245,210,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  {isDark ? <IcoSun /> : <IcoMoon />}
                  {isDark ? 'Mode Terang' : 'Mode Gelap'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 flex w-full flex-1 px-3 py-4 md:px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="relative w-full rounded-2xl p-4 md:p-6"
            style={{
              background: cardBg,
              border: `1px solid ${cardBdr}`,
              boxShadow: cardShadow,
              backdropFilter: 'blur(18px)',
              color: textColor,
              transition: 'background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease',
            }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 w-full py-3 text-center text-[10px] tracking-[0.25em]"
        style={{
          background: footerBg, borderTop: `1px solid ${footerBdr}`,
          color: footerTxt, transition: 'all 0.5s ease',
        }}>
        Kartu Batak &middot; Bataker Project &middot; 2026
      </footer>

      <MusicPlayer />
    </div>
  )
}
