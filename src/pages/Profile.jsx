import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase.js'

const StatCard = ({ label, value, color, glow, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="flex flex-col items-center justify-center rounded-2xl p-4 text-center"
    style={{ border: `1px solid ${color}40`, background: 'rgba(0,0,0,0.5)', boxShadow: `0 0 18px ${glow}` }}>
    <p className="font-perpetua text-3xl font-bold" style={{ color, textShadow: `0 0 12px ${glow}` }}>{value}</p>
    <p className="mt-1 text-xs" style={{ color: 'rgba(241,196,15,0.55)' }}>{label}</p>
  </motion.div>
)

export function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null)
  const [uploadMsg, setUploadMsg] = useState(null)

  const handleLogout = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadMsg({ ok: false, text: 'File terlalu besar. Maksimal 2MB.' })
      setTimeout(() => setUploadMsg(null), 3000)
      return
    }

    setUploading(true)
    setUploadMsg(null)

    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setUploadMsg({ ok: false, text: 'Gagal upload. Coba lagi.' })
      setUploading(false)
      setTimeout(() => setUploadMsg(null), 3000)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = urlData.publicUrl + '?t=' + Date.now()

    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    setAvatarUrl(publicUrl)
    setUploading(false)
    setUploadMsg({ ok: true, text: 'Foto profil berhasil diperbarui!' })
    setTimeout(() => setUploadMsg(null), 3000)
  }

  const username = profile?.username || user?.email?.split('@')[0] || 'Pemain'
  const played = profile?.games_played ?? 0
  const won = profile?.games_won ?? 0
  const lost = profile?.games_lost ?? 0
  const winRate = played > 0 ? Math.round((won / played) * 100) : 0

  return (
    <section className="space-y-6">
      {/* bg aura */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div style={{ background: 'radial-gradient(ellipse at top,rgba(241,196,15,0.1) 0%,transparent 55%),radial-gradient(ellipse at bottom,rgba(192,57,43,0.12) 0%,transparent 55%)', position: 'absolute', inset: 0 }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs uppercase tracking-[0.35em]" style={{ color: 'rgba(241,196,15,0.55)' }}>Akun Pemain</p>
        <h1 className="font-perpetua text-3xl md:text-4xl" style={{ color: '#f5d87a', textShadow: '0 0 18px rgba(241,196,15,0.35)' }}>
          Profil
        </h1>
      </motion.div>

      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl p-5 md:p-6"
        style={{ border: '1px solid rgba(241,196,15,0.18)', background: 'rgba(0,0,0,0.55)', boxShadow: '0 0 30px rgba(241,196,15,0.08)' }}>
        <div className="flex flex-wrap items-center gap-4">
          {/* Avatar - clickable */}
          <div className="relative shrink-0 cursor-pointer group" onClick={handleAvatarClick}>
            <div className="flex h-20 w-20 items-center justify-center rounded-full overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 35% 35%,#5b1fa0,#2d0a52)',
                border: '2px solid rgba(241,196,15,0.35)',
                boxShadow: '0 0 20px rgba(142,68,173,0.6)',
              }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl">🃏</span>
              )}
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.6)' }}>
              {uploading ? (
                <svg className="animate-spin h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <span className="text-lg">📷</span>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-perpetua text-2xl" style={{ color: '#f5d87a' }}>{username}</p>
            <p className="truncate text-xs" style={{ color: 'rgba(241,196,15,0.45)' }}>{user?.email}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 5px #4ade80' }} />
              <span className="text-xs text-green-400/80">Online</span>
            </div>
            <p className="mt-1 text-xs" style={{ color: 'rgba(241,196,15,0.4)' }}>
              Klik foto untuk ganti avatar
            </p>
          </div>

          <motion.button type="button" onClick={handleLogout}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="rounded-full px-5 py-2 text-sm font-semibold"
            style={{ border: '1px solid rgba(192,57,43,0.5)', color: '#e74c3c', background: 'transparent', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.12)'; e.currentTarget.style.boxShadow = '0 0 14px rgba(192,57,43,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}>
            Logout
          </motion.button>
        </div>

        {/* Upload message */}
        <AnimatePresence>
          {uploadMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-3 rounded-xl px-4 py-2 text-sm text-center"
              style={{
                background: uploadMsg.ok ? 'rgba(39,174,96,0.15)' : 'rgba(192,57,43,0.15)',
                border: `1px solid ${uploadMsg.ok ? 'rgba(39,174,96,0.4)' : 'rgba(192,57,43,0.4)'}`,
                color: uploadMsg.ok ? '#27ae60' : '#e74c3c',
              }}>
              {uploadMsg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Stats */}
      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.3em]" style={{ color: 'rgba(241,196,15,0.45)' }}>Statistik</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Game Dimainkan" value={played} color="#F1C40F" glow="rgba(241,196,15,0.3)" delay={0.15} />
          <StatCard label="Menang" value={won} color="#27ae60" glow="rgba(39,174,96,0.3)" delay={0.2} />
          <StatCard label="Kalah" value={lost} color="#e74c3c" glow="rgba(231,76,60,0.3)" delay={0.25} />
          <StatCard label="Win Rate" value={`${winRate}%`} color="#8e44ad" glow="rgba(142,68,173,0.35)" delay={0.3} />
        </div>
      </div>

      {/* Modes */}
      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.3em]" style={{ color: 'rgba(241,196,15,0.45)' }}>Mode Permainan</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              title: 'Lawan Bot', desc: 'Bermain melawan AI. Cocok untuk latihan dan menguasai strategi Joker Card.',
              icon: '🤖', available: true, action: () => navigate('/game'),
              btnLabel: 'Main Sekarang',
            },
            {
              title: 'Multiplayer Online', desc: 'Tantang pemain lain secara real-time. Buat room atau join room teman.',
              icon: '🌐', available: true, action: () => navigate('/lobby'),
              btnLabel: 'Masuk Lobby',
            },
          ].map((mode, i) => (
            <motion.div key={mode.title}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.1 }}
              className="flex flex-col gap-3 rounded-2xl p-5"
              style={{ border: '1px solid rgba(241,196,15,0.12)', background: 'rgba(0,0,0,0.45)' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{mode.icon}</span>
                <p className="font-perpetua text-base" style={{ color: '#f5d87a' }}>{mode.title}</p>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{mode.desc}</p>
              <motion.button type="button" onClick={mode.action}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="w-full rounded-full py-2 text-sm font-semibold"
                style={{
                  background: i === 0 ? 'linear-gradient(135deg,#a93226,#e74c3c)' : 'linear-gradient(135deg,#1a0a4a,#3d1a8a)',
                  color: '#fff', cursor: 'pointer',
                  boxShadow: i === 0 ? '0 0 14px rgba(192,57,43,0.5)' : '0 0 14px rgba(91,31,160,0.5)',
                  border: i === 1 ? '1px solid rgba(142,68,173,0.4)' : 'none',
                }}>
                {mode.btnLabel}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
