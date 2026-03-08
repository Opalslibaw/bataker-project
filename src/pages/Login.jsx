import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.jsx'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function ParticleCard({ style }) {
  return (
    <motion.div
      className="pointer-events-none absolute flex flex-col items-center justify-between rounded-xl p-1.5"
      style={{
        width: 36, height: 50,
        background: 'linear-gradient(135deg,#0a0705,#1f140a)',
        border: '1px solid rgba(241,196,15,0.35)',
        boxShadow: '0 0 10px rgba(241,196,15,0.15)',
        ...style,
      }}
      animate={{ y: [0, -12, 0], rotate: [style.rotate ?? 0, (style.rotate ?? 0) + 3, style.rotate ?? 0] }}
      transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 2 }}
    >
      <span className="self-start text-[7px]" style={{ color: '#F1C40F' }}>{style.label}</span>
      <span className="text-[11px]" style={{ color: '#F1C40F' }}>{style.label}</span>
      <span className="self-end rotate-180 text-[7px]" style={{ color: '#F1C40F' }}>{style.label}</span>
    </motion.div>
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

  const inputStyle = {
    width: '100%', borderRadius: 12, padding: '12px 16px', fontSize: 14,
    background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(241,196,15,0.2)',
    color: '#fff', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 15% 15%,rgba(142,68,173,0.18) 0%,transparent 55%), radial-gradient(ellipse 50% 40% at 85% 85%,rgba(192,57,43,0.15) 0%,transparent 55%)',
        }} />
      </div>

      {/* Floating cards decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <ParticleCard style={{ left: '5%', top: '15%', rotate: -20, label: 'A♠' }} />
        <ParticleCard style={{ right: '8%', top: '20%', rotate: 15, label: 'K♥' }} />
        <ParticleCard style={{ left: '8%', bottom: '20%', rotate: 12, label: 'Q♦' }} />
        <ParticleCard style={{ right: '5%', bottom: '15%', rotate: -18, label: '10♣' }} />
      </div>

      <motion.div className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl"
          style={{
            background: 'rgba(5,3,1,0.94)',
            border: '1px solid rgba(241,196,15,0.25)',
            boxShadow: '0 0 60px rgba(241,196,15,0.08), 0 0 120px rgba(192,57,43,0.06)',
            backdropFilter: 'blur(24px)',
          }}>
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.7),transparent)' }} />
          <div className="absolute inset-x-0 bottom-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(192,57,43,0.4),transparent)' }} />

          <div className="p-7 md:p-9">
            {/* Logo */}
            <motion.div className="mb-7 text-center"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <motion.div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl font-perpetua text-3xl font-bold text-white"
                style={{ background: 'radial-gradient(circle at 35% 35%,#e74c3c,#7b1010)', boxShadow: '0 0 30px rgba(192,57,43,0.7)' }}
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                transition={{ duration: 0.4 }}>
                🃏
              </motion.div>
              <h1 className="font-perpetua text-3xl" style={{ color: '#F1C40F', textShadow: '0 0 16px rgba(241,196,15,0.5)' }}>
                {mode === 'login' ? 'Selamat Datang' : 'Buat Akun'}
              </h1>
              <p className="mt-1 text-xs" style={{ color: 'rgba(241,196,15,0.45)' }}>
                {mode === 'login' ? 'Masuk ke meja Kartu Batak.' : 'Bergabung di meja Kartu Batak.'}
              </p>
            </motion.div>

            {/* Toggle */}
            <div className="mb-6 flex rounded-full p-1" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(241,196,15,0.12)' }}>
              {['login', 'register'].map(m => (
                <motion.button key={m} type="button" onClick={() => { setMode(m); setSubmitError('') }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    flex: 1, borderRadius: '9999px', padding: '9px 0', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', border: 'none', letterSpacing: '0.04em',
                    background: mode === m ? 'linear-gradient(135deg,rgba(241,196,15,0.95),rgba(184,134,11,0.95))' : 'transparent',
                    color: mode === m ? '#000' : 'rgba(241,196,15,0.55)',
                    boxShadow: mode === m ? '0 0 16px rgba(241,196,15,0.4)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                  {m === 'login' ? 'Masuk' : 'Daftar'}
                </motion.button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'rgba(241,196,15,0.65)' }}>Username</label>
                    <input name="username" value={form.username} onChange={handleChange}
                      placeholder="nama_pemain" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'rgba(241,196,15,0.55)'; e.target.style.boxShadow = '0 0 12px rgba(241,196,15,0.12)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(241,196,15,0.2)'; e.target.style.boxShadow = 'none' }} />
                    {errors.username && <p className="mt-1 text-xs" style={{ color: '#e74c3c' }}>{errors.username}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'rgba(241,196,15,0.65)' }}>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="kamu@example.com" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(241,196,15,0.55)'; e.target.style.boxShadow = '0 0 12px rgba(241,196,15,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(241,196,15,0.2)'; e.target.style.boxShadow = 'none' }} />
                {errors.email && <p className="mt-1 text-xs" style={{ color: '#e74c3c' }}>{errors.email}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'rgba(241,196,15,0.65)' }}>Password</label>
                <div className="relative">
                  <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange}
                    placeholder="••••••••" style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(241,196,15,0.55)'; e.target.style.boxShadow = '0 0 12px rgba(241,196,15,0.12)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(241,196,15,0.2)'; e.target.style.boxShadow = 'none' }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: 'rgba(241,196,15,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs" style={{ color: '#e74c3c' }}>{errors.password}</p>}
              </div>

              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'rgba(241,196,15,0.65)' }}>Konfirmasi Password</label>
                    <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
                      placeholder="Ulangi password" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'rgba(241,196,15,0.55)'; e.target.style.boxShadow = '0 0 12px rgba(241,196,15,0.12)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(241,196,15,0.2)'; e.target.style.boxShadow = 'none' }} />
                    {errors.confirmPassword && <p className="mt-1 text-xs" style={{ color: '#e74c3c' }}>{errors.confirmPassword}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              {submitError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-3 text-xs" style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)', color: '#e74c3c' }}>
                  {submitError}
                </motion.div>
              )}

              <motion.button type="submit" disabled={authLoading}
                whileHover={!authLoading ? { scale: 1.02 } : {}} whileTap={!authLoading ? { scale: 0.98 } : {}}
                style={{
                  width: '100%', borderRadius: '9999px', padding: '13px 0', fontSize: 14, fontWeight: 700,
                  color: '#fff', border: 'none', marginTop: 4, letterSpacing: '0.06em',
                  background: authLoading ? 'rgba(192,57,43,0.35)' : 'linear-gradient(135deg,#a93226,#e74c3c)',
                  boxShadow: authLoading ? 'none' : '0 0 28px rgba(192,57,43,0.55)',
                  cursor: authLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                }}>
                {authLoading
                  ? (mode === 'login' ? 'Memproses...' : 'Mendaftar...')
                  : (mode === 'login' ? '🃏 Masuk ke Meja' : '🎰 Buat Akun')}
              </motion.button>
            </form>

            <p className="mt-5 text-center text-xs" style={{ color: 'rgba(241,196,15,0.3)' }}>
              {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setSubmitError('') }}
                style={{ color: 'rgba(241,196,15,0.65)', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline', fontSize: 12 }}>
                {mode === 'login' ? 'Daftar sekarang' : 'Masuk di sini'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
