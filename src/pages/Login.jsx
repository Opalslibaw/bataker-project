import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.jsx'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── SVG Icons
const IconEye = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
)

const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

// ── Floating particle cards (decorative)
function FloatingCard({ label, style }) {
  return (
    <motion.div
      className="pointer-events-none absolute flex flex-col items-center justify-between rounded-xl p-1.5"
      style={{
        width: 40, height: 56,
        background: 'linear-gradient(135deg,#0a0705,#1f140a)',
        border: '1px solid rgba(241,196,15,0.3)',
        boxShadow: '0 0 18px rgba(241,196,15,0.12), 0 4px 16px rgba(0,0,0,0.5)',
        ...style,
      }}
      animate={{
        y: [0, -14, 0],
        rotate: [style.rotate ?? 0, (style.rotate ?? 0) + 4, style.rotate ?? 0],
        opacity: [0.5, 0.9, 0.5],
      }}
      transition={{ duration: 5 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut', delay: style.delay ?? 0 }}
    >
      <span className="self-start text-[7px] font-bold" style={{ color: '#F1C40F' }}>{label}</span>
      <span className="text-xs font-bold" style={{ color: '#F1C40F' }}>{label}</span>
      <span className="self-end rotate-180 text-[7px] font-bold" style={{ color: '#F1C40F' }}>{label}</span>
    </motion.div>
  )
}

// ── Joker floating card (red, special)
function JokerCard({ style }) {
  return (
    <motion.div
      className="pointer-events-none absolute flex flex-col items-center justify-between rounded-xl p-1.5"
      style={{
        width: 44, height: 62,
        background: 'linear-gradient(135deg,#1a0030,#4a0080)',
        border: '1px solid rgba(192,57,43,0.7)',
        boxShadow: '0 0 28px rgba(192,57,43,0.5), 0 4px 20px rgba(0,0,0,0.6)',
        ...style,
      }}
      animate={{
        y: [0, -18, 0],
        rotate: [style.rotate ?? 0, (style.rotate ?? 0) - 5, style.rotate ?? 0],
        boxShadow: [
          '0 0 20px rgba(192,57,43,0.4)',
          '0 0 50px rgba(192,57,43,0.8), 0 0 100px rgba(192,57,43,0.2)',
          '0 0 20px rgba(192,57,43,0.4)',
        ],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: style.delay ?? 0 }}
    >
      <span className="self-start text-[8px] font-bold" style={{ color: '#e74c3c' }}>🃏</span>
      <span className="text-sm">🃏</span>
      <span className="self-end rotate-180 text-[8px] font-bold" style={{ color: '#e74c3c' }}>🃏</span>
    </motion.div>
  )
}

// ── Input with icon, glow on focus
function GlowInput({ icon, error, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
        style={{ color: focused ? 'rgba(241,196,15,0.8)' : 'rgba(241,196,15,0.35)', transition: 'color 0.2s' }}>
        {icon}
      </div>
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        className="w-full rounded-xl py-3.5 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200"
        style={{
          background: focused ? 'rgba(241,196,15,0.05)' : 'rgba(0,0,0,0.55)',
          border: `1px solid ${error ? 'rgba(231,76,60,0.7)' : focused ? 'rgba(241,196,15,0.55)' : 'rgba(241,196,15,0.18)'}`,
          boxShadow: error
            ? '0 0 12px rgba(231,76,60,0.2)'
            : focused ? '0 0 20px rgba(241,196,15,0.1), inset 0 0 16px rgba(241,196,15,0.03)' : 'none',
        }}
      />
      {/* Focus ring pulse */}
      <AnimatePresence>
        {focused && !error && (
          <motion.div className="pointer-events-none absolute inset-0 rounded-xl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ border: '1px solid rgba(241,196,15,0.25)', boxShadow: '0 0 0 3px rgba(241,196,15,0.05)' }} />
        )}
      </AnimatePresence>
    </div>
  )
}

export function LoginPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { user, authLoading, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Spotlight
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const sx = useSpring(mouseX, { stiffness: 60, damping: 18 })
  const sy = useSpring(mouseY, { stiffness: 60, damping: 18 })
  const sectionRef = useRef(null)

  useEffect(() => {
    const move = (e) => { mouseX.set(e.clientX); mouseY.set(e.clientY) }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [mouseX, mouseY])

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/lobby'
      navigate(from, { replace: true })
    }
  }, [user, location, navigate])

  const validate = (field, value, currentForm = form, currentMode = mode) => {
    const data = { ...currentForm, [field]: value }
    const e = {}
    if (!data.email) e.email = 'Email wajib diisi.'
    else if (!emailRegex.test(data.email)) e.email = 'Format email tidak valid.'
    if (!data.password) e.password = 'Password wajib diisi.'
    else if (data.password.length < 6) e.password = 'Password minimal 6 karakter.'
    if (currentMode === 'register') {
      if (!data.username) e.username = 'Username wajib diisi.'
      else if (data.username.length < 3) e.username = 'Username minimal 3 karakter.'
      if (!data.confirmPassword) e.confirmPassword = 'Konfirmasi password wajib diisi.'
      else if (data.confirmPassword !== data.password) e.confirmPassword = 'Password tidak cocok.'
    }
    setErrors(e)
    return e
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const updated = { ...form, [name]: value }
    setForm(updated)
    validate(name, value, updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    const errs = validate('email', form.email, form)
    if (Object.values(errs).some(Boolean)) return
    if (mode === 'login') {
      const result = await signIn({ email: form.email, password: form.password })
      if (!result.ok) setSubmitError(result.message || 'Login gagal. Periksa email dan password.')
    } else {
      const result = await signUp({ username: form.username, email: form.email, password: form.password })
      if (!result.ok) setSubmitError(result.message || 'Registrasi gagal. Silakan coba lagi.')
    }
  }

  return (
    <section ref={sectionRef} className="relative flex min-h-[88vh] items-center justify-center px-4">
      {/* Spotlight */}
      <motion.div className="pointer-events-none fixed z-0"
        style={{
          left: sx, top: sy, width: 700, height: 700, x: '-50%', y: '-50%',
          background: 'radial-gradient(circle,rgba(142,68,173,0.07) 0%,transparent 60%)',
          borderRadius: '50%',
        }} />
      <motion.div className="pointer-events-none fixed z-0"
        style={{
          left: sx, top: sy, width: 200, height: 200, x: '-50%', y: '-50%',
          background: 'radial-gradient(circle,rgba(192,57,43,0.08) 0%,transparent 70%)',
          borderRadius: '50%',
        }} />

      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 55% 45% at 10% 10%,rgba(142,68,173,0.16) 0%,transparent 55%), radial-gradient(ellipse 45% 45% at 88% 88%,rgba(192,57,43,0.13) 0%,transparent 55%), radial-gradient(ellipse 30% 30% at 50% 50%,rgba(241,196,15,0.04) 0%,transparent 70%)',
        }} />
      </div>

      {/* Floating decorative cards */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <FloatingCard label="A♠" style={{ left: '4%', top: '14%', rotate: -24, delay: 0 }} />
        <FloatingCard label="K♥" style={{ right: '6%', top: '18%', rotate: 18, delay: 0.8 }} />
        <FloatingCard label="Q♦" style={{ left: '7%', bottom: '22%', rotate: 14, delay: 1.4 }} />
        <FloatingCard label="10♣" style={{ right: '4%', bottom: '18%', rotate: -20, delay: 0.4 }} />
        <JokerCard style={{ right: '14%', top: '38%', rotate: 10, delay: 1.0 }} />
        <JokerCard style={{ left: '14%', bottom: '42%', rotate: -8, delay: 0.3 }} />
      </div>

      {/* Main card */}
      <motion.div className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 36, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>

        <div className="relative overflow-hidden rounded-3xl"
          style={{
            background: 'rgba(5,3,1,0.95)',
            border: '1px solid rgba(241,196,15,0.22)',
            boxShadow: '0 0 80px rgba(241,196,15,0.06), 0 0 160px rgba(192,57,43,0.05), 0 32px 80px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(28px)',
          }}>

          {/* Top gold shimmer */}
          <motion.div className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.0),rgba(241,196,15,0.9),rgba(241,196,15,0.0),transparent)' }}
            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }} />
          {/* Bottom red shimmer */}
          <div className="absolute inset-x-0 bottom-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(192,57,43,0.5),transparent)' }} />
          {/* Corner accents */}
          <div className="absolute left-0 top-0 h-12 w-12"
            style={{ background: 'radial-gradient(circle at 0% 0%,rgba(241,196,15,0.12),transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 h-12 w-12"
            style={{ background: 'radial-gradient(circle at 100% 100%,rgba(192,57,43,0.15),transparent 70%)' }} />

          <div className="p-7 md:p-9">

            {/* Logo + title */}
            <motion.div className="mb-7 text-center"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <motion.div
                className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-2xl text-3xl"
                style={{
                  background: 'radial-gradient(circle at 35% 35%,#e74c3c,#7b1010)',
                  boxShadow: '0 0 32px rgba(192,57,43,0.8), 0 0 64px rgba(192,57,43,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                  border: '1px solid rgba(192,57,43,0.6)',
                }}
                whileHover={{ rotate: [0, -6, 6, 0], scale: 1.06 }}
                transition={{ duration: 0.45 }}
                animate={{
                  boxShadow: [
                    '0 0 24px rgba(192,57,43,0.6)',
                    '0 0 48px rgba(192,57,43,1), 0 0 96px rgba(192,57,43,0.3)',
                    '0 0 24px rgba(192,57,43,0.6)',
                  ]
                }}>
                🃏
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.h1 key={mode} className="font-perpetua text-[1.75rem]"
                  style={{ color: '#F1C40F', textShadow: '0 0 20px rgba(241,196,15,0.6), 0 0 40px rgba(241,196,15,0.2)' }}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}>
                  {mode === 'login' ? 'Selamat Datang' : 'Buat Akun Baru'}
                </motion.h1>
              </AnimatePresence>
              <p className="mt-1 text-xs" style={{ color: 'rgba(241,196,15,0.4)' }}>
                {mode === 'login' ? 'Masuk ke meja Kartu Batak.' : 'Bergabung di meja Kartu Batak.'}
              </p>
            </motion.div>

            {/* Toggle tabs */}
            <div className="mb-6 flex rounded-2xl p-1 gap-1"
              style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(241,196,15,0.1)' }}>
              {['login', 'register'].map(m => (
                <motion.button key={m} type="button" onClick={() => { setMode(m); setSubmitError('') }}
                  whileTap={{ scale: 0.97 }}
                  className="relative flex-1 overflow-hidden rounded-xl py-2.5 text-[13px] font-bold tracking-wide"
                  style={{ cursor: 'pointer', border: 'none' }}>
                  {mode === m && (
                    <motion.span className="absolute inset-0 rounded-xl"
                      layoutId="tab-active"
                      style={{
                        background: 'linear-gradient(135deg,rgba(241,196,15,0.9),rgba(184,134,11,0.95))',
                        boxShadow: '0 0 20px rgba(241,196,15,0.4)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                  )}
                  <span className="relative z-10" style={{ color: mode === m ? '#000' : 'rgba(241,196,15,0.45)' }}>
                    {m === 'login' ? 'Masuk' : 'Daftar'}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28 }}>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest"
                      style={{ color: 'rgba(241,196,15,0.55)' }}>Username</label>
                    <GlowInput
                      icon={<IconUser />}
                      name="username" value={form.username} onChange={handleChange}
                      placeholder="nama_pemain" autoComplete="username"
                      error={errors.username}
                    />
                    <AnimatePresence>
                      {errors.username && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: '#e74c3c' }}>
                          <IconAlert /> {errors.username}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: 'rgba(241,196,15,0.55)' }}>Email</label>
                <GlowInput
                  icon={<IconMail />}
                  name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="kamu@example.com" autoComplete="email"
                  error={errors.email}
                />
                <AnimatePresence>
                  {errors.email && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: '#e74c3c' }}>
                      <IconAlert /> {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: 'rgba(241,196,15,0.55)' }}>Password</label>
                <div className="relative">
                  <GlowInput
                    icon={<IconLock />}
                    name="password" type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={handleChange}
                    placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    error={errors.password}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'rgba(241,196,15,0.45)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(241,196,15,0.9)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(241,196,15,0.45)' }}>
                    <IconEye open={showPass} />
                  </button>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: '#e74c3c' }}>
                      <IconAlert /> {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28 }}>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest"
                      style={{ color: 'rgba(241,196,15,0.55)' }}>Konfirmasi Password</label>
                    <GlowInput
                      icon={<IconLock />}
                      name="confirmPassword" type="password"
                      value={form.confirmPassword} onChange={handleChange}
                      placeholder="Ulangi password" autoComplete="new-password"
                      error={errors.confirmPassword}
                    />
                    <AnimatePresence>
                      {errors.confirmPassword && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: '#e74c3c' }}>
                          <IconAlert /> {errors.confirmPassword}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit error */}
              <AnimatePresence>
                {submitError && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 rounded-xl p-3.5 text-xs"
                    style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.4)', color: '#e74c3c' }}>
                    <span className="mt-0.5 shrink-0"><IconAlert /></span>
                    {submitError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <motion.button type="submit" disabled={authLoading}
                whileHover={!authLoading ? { scale: 1.02, boxShadow: '0 0 48px rgba(192,57,43,0.7), 0 0 96px rgba(192,57,43,0.25)' } : {}}
                whileTap={!authLoading ? { scale: 0.98 } : {}}
                className="relative mt-2 w-full overflow-hidden rounded-xl py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-white"
                style={{
                  background: authLoading
                    ? 'rgba(169,50,38,0.35)'
                    : 'linear-gradient(135deg,#8b1a12,#c0392b,#e74c3c)',
                  border: authLoading ? '1px solid rgba(192,57,43,0.2)' : '1px solid rgba(192,57,43,0.5)',
                  boxShadow: authLoading ? 'none' : '0 0 28px rgba(192,57,43,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                  cursor: authLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}>
                {/* Shimmer sweep always present */}
                {!authLoading && (
                  <motion.span className="pointer-events-none absolute inset-0"
                    style={{ background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.15) 50%,transparent 70%)' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }} />
                )}
                {authLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    {mode === 'login' ? 'Memproses...' : 'Mendaftar...'}
                  </span>
                ) : (
                  <span className="relative z-10">{mode === 'login' ? '🃏 Masuk ke Meja' : '🎰 Buat Akun'}</span>
                )}
              </motion.button>
            </form>

            {/* Bottom switch */}
            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: 'rgba(241,196,15,0.1)' }} />
              <p className="text-[11px]" style={{ color: 'rgba(241,196,15,0.3)' }}>
                {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
              </p>
              <div className="h-px flex-1" style={{ background: 'rgba(241,196,15,0.1)' }} />
            </div>
            <div className="mt-3 text-center">
              <button type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setSubmitError('') }}
                className="text-xs font-semibold"
                style={{ color: 'rgba(241,196,15,0.65)', cursor: 'pointer', background: 'none', border: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#F1C40F' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(241,196,15,0.65)' }}>
                {mode === 'login' ? 'Daftar sekarang →' : '← Masuk di sini'}
              </button>
            </div>

          </div>
        </div>
      </motion.div>
    </section>
  )
}
