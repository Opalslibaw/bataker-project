import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.jsx'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
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
    width: '100%', borderRadius: 12, padding: '10px 14px', fontSize: 14,
    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(241,196,15,0.25)',
    color: '#fff', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <section className="relative flex min-h-[75vh] items-center justify-center px-4">
      {/* bg glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top left,rgba(142,68,173,0.2) 0%,transparent 55%),radial-gradient(ellipse at bottom right,rgba(192,57,43,0.2) 0%,transparent 55%)' }} />
      </div>

      <motion.div className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        {/* Card */}
        <div className="rounded-3xl p-6 md:p-8"
          style={{
            background: 'rgba(5,3,1,0.92)',
            border: '1px solid rgba(241,196,15,0.3)',
            boxShadow: '0 0 50px rgba(241,196,15,0.12), 0 0 100px rgba(192,57,43,0.08)',
            backdropFilter: 'blur(20px)',
          }}>

          {/* Gold shimmer top */}
          <div className="absolute inset-x-8 top-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.6),transparent)' }} />

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold text-white"
              style={{ background: 'radial-gradient(circle at 35% 35%,#e74c3c,#7b1010)', boxShadow: '0 0 24px rgba(192,57,43,0.7)' }}>
              J
            </div>
            <h1 className="font-perpetua text-3xl" style={{ color: '#F1C40F', textShadow: '0 0 14px rgba(241,196,15,0.4)' }}>
              {mode === 'login' ? 'Masuk' : 'Daftar'} Kartu Batak
            </h1>
            <p className="mt-1 text-xs" style={{ color: 'rgba(241,196,15,0.5)' }}>
              {mode === 'login' ? 'Masuk untuk mulai bermain.' : 'Buat akun untuk bergabung di meja.'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="mb-5 flex rounded-full p-1" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(241,196,15,0.15)' }}>
            {['login', 'register'].map(m => (
              <button key={m} type="button" onClick={() => { setMode(m); setSubmitError('') }}
                style={{
                  flex: 1, borderRadius: '9999px', padding: '8px 0', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                  background: mode === m ? 'linear-gradient(135deg,rgba(241,196,15,0.9),rgba(184,134,11,0.9))' : 'transparent',
                  color: mode === m ? '#000' : 'rgba(241,196,15,0.6)',
                  boxShadow: mode === m ? '0 0 12px rgba(241,196,15,0.4)' : 'none',
                }}>
                {m === 'login' ? 'Login' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'rgba(241,196,15,0.7)' }}>Username</label>
                  <input name="username" value={form.username} onChange={handleChange}
                    placeholder="joker_master" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'rgba(241,196,15,0.6)'; e.target.style.boxShadow = '0 0 10px rgba(241,196,15,0.15)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(241,196,15,0.25)'; e.target.style.boxShadow = 'none' }} />
                  {errors.username && <p className="mt-1 text-xs" style={{ color: '#e74c3c' }}>{errors.username}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'rgba(241,196,15,0.7)' }}>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="kamu@example.com" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'rgba(241,196,15,0.6)'; e.target.style.boxShadow = '0 0 10px rgba(241,196,15,0.15)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(241,196,15,0.25)'; e.target.style.boxShadow = 'none' }} />
              {errors.email && <p className="mt-1 text-xs" style={{ color: '#e74c3c' }}>{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'rgba(241,196,15,0.7)' }}>Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                placeholder="••••••••" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'rgba(241,196,15,0.6)'; e.target.style.boxShadow = '0 0 10px rgba(241,196,15,0.15)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(241,196,15,0.25)'; e.target.style.boxShadow = 'none' }} />
              {errors.password && <p className="mt-1 text-xs" style={{ color: '#e74c3c' }}>{errors.password}</p>}
            </div>

            <AnimatePresence>
              {mode === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'rgba(241,196,15,0.7)' }}>Konfirmasi Password</label>
                  <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
                    placeholder="Ulangi password" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'rgba(241,196,15,0.6)'; e.target.style.boxShadow = '0 0 10px rgba(241,196,15,0.15)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(241,196,15,0.25)'; e.target.style.boxShadow = 'none' }} />
                  {errors.confirmPassword && <p className="mt-1 text-xs" style={{ color: '#e74c3c' }}>{errors.confirmPassword}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {submitError && (
              <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.35)', color: '#e74c3c' }}>
                {submitError}
              </div>
            )}

            <motion.button type="submit" disabled={authLoading}
              whileHover={!authLoading ? { scale: 1.02 } : {}} whileTap={!authLoading ? { scale: 0.98 } : {}}
              style={{
                width: '100%', borderRadius: '9999px', padding: '12px 0', fontSize: 14, fontWeight: 700,
                color: '#fff', border: 'none', marginTop: 8,
                background: authLoading ? 'rgba(192,57,43,0.4)' : 'linear-gradient(135deg,#a93226,#e74c3c)',
                boxShadow: authLoading ? 'none' : '0 0 24px rgba(192,57,43,0.6)',
                cursor: authLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', letterSpacing: '0.05em',
              }}>
              {authLoading
                ? (mode === 'login' ? 'Memproses...' : 'Mendaftar...')
                : (mode === 'login' ? 'Masuk ke Kartu Batak' : 'Daftar Kartu Batak')}
            </motion.button>
          </form>

          {/* Bottom hint */}
          <p className="mt-4 text-center text-xs" style={{ color: 'rgba(241,196,15,0.35)' }}>
            {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setSubmitError('') }}
              style={{ color: 'rgba(241,196,15,0.7)', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline', fontSize: 12 }}>
              {mode === 'login' ? 'Daftar sekarang' : 'Masuk di sini'}
            </button>
          </p>
        </div>
      </motion.div>
    </section>
  )
}
