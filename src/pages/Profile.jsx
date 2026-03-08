import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase.js'

function StatCard({ label, value, color, glow, delay, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, scale: 1.03 }}
      className="relative overflow-hidden rounded-2xl p-5 text-center"
      style={{ border: `1px solid ${color}30`, background: 'rgba(0,0,0,0.55)' }}
    >
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${color}80,transparent)` }} />
      <div className="absolute inset-0 opacity-5 rounded-2xl"
        style={{ background: `radial-gradient(circle at 50% 0%,${color},transparent 70%)` }} />
      <span className="text-2xl">{icon}</span>
      <p className="mt-2 font-perpetua text-3xl font-bold" style={{ color, textShadow: `0 0 16px ${glow}` }}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.25em]" style={{ color: 'rgba(241,196,15,0.5)' }}>{label}</p>
    </motion.div>
  )
}

export function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploadMsg, setUploadMsg] = useState(null)

  useEffect(() => {
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
  }, [profile])

  useEffect(() => {
    if (user) refreshProfile()
  }, [user])

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
    if (file.size > 2 * 1024 * 1024) {
      setUploadMsg({ ok: false, text: 'File terlalu besar. Maksimal 2MB.' })
      setTimeout(() => setUploadMsg(null), 3000)
      return
    }
    setUploading(true)
    setUploadMsg(null)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
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
    await refreshProfile()
    setTimeout(() => setUploadMsg(null), 3000)
  }

  const username = profile?.username || user?.email?.split('@')[0] || 'Pemain'
  const played = profile?.games_played ?? 0
  const won = profile?.games_won ?? 0
  const lost = profile?.games_lost ?? 0
  const winRate = played > 0 ? Math.round((won / played) * 100) : 0

  return (
    <section className="relative space-y-8">
      {/* Ambient bg */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 40% at 10% 0%,rgba(142,68,173,0.15) 0%,transparent 60%), radial-gradient(ellipse 50% 50% at 90% 100%,rgba(192,57,43,0.12) 0%,transparent 60%)',
        }} />
      </div>

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[10px] uppercase tracking-[0.5em]" style={{ color: 'rgba(241,196,15,0.5)' }}>Akun Pemain</p>
        <h1 className="mt-1 font-perpetua text-4xl md:text-5xl" style={{ color: '#F1C40F', textShadow: '0 0 24px rgba(241,196,15,0.4)' }}>Profil</h1>
      </motion.div>

      {/* ── PROFILE CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl p-6"
        style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(241,196,15,0.2)', boxShadow: '0 0 40px rgba(241,196,15,0.06)' }}
      >
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.6),transparent)' }} />
        {/* Purple glow top left */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full"
          style={{ background: 'radial-gradient(circle,rgba(142,68,173,0.25),transparent 70%)' }} />

        <div className="flex flex-wrap items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0 cursor-pointer group" onClick={handleAvatarClick}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 35%,#5b1fa0,#2d0a52)',
                border: '2px solid rgba(241,196,15,0.4)',
                boxShadow: '0 0 28px rgba(142,68,173,0.6), 0 0 0 4px rgba(142,68,173,0.1)',
              }}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                : <span className="text-4xl">🃏</span>
              }
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: 'rgba(0,0,0,0.65)' }}>
              {uploading
                ? <svg className="animate-spin h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                : <span className="text-xl">📷</span>
              }
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {/* Online dot */}
            <div className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-2 border-black bg-green-400"
              style={{ boxShadow: '0 0 8px #4ade80' }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-perpetua text-2xl md:text-3xl truncate" style={{ color: '#f5d87a' }}>{username}</p>
            <p className="mt-0.5 truncate text-xs" style={{ color: 'rgba(241,196,15,0.4)' }}>{user?.email}</p>
            <p className="mt-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Klik foto untuk ganti avatar</p>
          </div>

          {/* Logout */}
          <motion.button type="button" onClick={handleLogout}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold"
            style={{ border: '1px solid rgba(192,57,43,0.5)', color: '#e74c3c', background: 'transparent', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.12)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(192,57,43,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}>
            Logout
          </motion.button>
        </div>

        <AnimatePresence>
          {uploadMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 rounded-xl px-4 py-2.5 text-sm text-center"
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

      {/* ── STATS ── */}
      <div>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="mb-4 text-[10px] uppercase tracking-[0.4em]" style={{ color: 'rgba(241,196,15,0.45)' }}>
          Statistik Permainan
        </motion.p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Dimainkan" value={played} color="#F1C40F" glow="rgba(241,196,15,0.5)" delay={0.15} icon="🎮" />
          <StatCard label="Menang" value={won} color="#27ae60" glow="rgba(39,174,96,0.5)" delay={0.2} icon="🏆" />
          <StatCard label="Kalah" value={lost} color="#e74c3c" glow="rgba(231,76,60,0.5)" delay={0.25} icon="💀" />
          <StatCard label="Win Rate" value={`${winRate}%`} color="#8e44ad" glow="rgba(142,68,173,0.5)" delay={0.3} icon="⚡" />
        </div>

        {/* Win rate bar */}
        {played > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="mt-4 overflow-hidden rounded-full"
            style={{ height: 6, background: 'rgba(231,76,60,0.3)' }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${winRate}%` }}
              transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg,#27ae60,#2ecc71)', boxShadow: '0 0 10px rgba(39,174,96,0.6)' }}
            />
          </motion.div>
        )}
      </div>

      {/* ── PLAY MODES ── */}
      <div>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="mb-4 text-[10px] uppercase tracking-[0.4em]" style={{ color: 'rgba(241,196,15,0.45)' }}>
          Mode Permainan
        </motion.p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              title: 'Lawan Bot', desc: 'Bermain melawan AI. Cocok untuk latihan dan menguasai strategi Kartu Batak.',
              icon: '🤖', action: () => navigate('/game'), btnLabel: 'Main Sekarang',
              gradient: 'linear-gradient(135deg,#a93226,#e74c3c)', glow: 'rgba(192,57,43,0.5)',
              border: 'rgba(192,57,43,0.3)',
            },
            {
              title: 'Multiplayer Online', desc: 'Tantang pemain lain secara real-time. Buat room atau join room teman.',
              icon: '🌐', action: () => navigate('/lobby'), btnLabel: 'Masuk Lobby',
              gradient: 'linear-gradient(135deg,#1a0a4a,#3d1a8a)', glow: 'rgba(91,31,160,0.5)',
              border: 'rgba(142,68,173,0.3)',
            },
          ].map((m, i) => (
            <motion.div key={m.title}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="relative overflow-hidden rounded-2xl p-5"
              style={{ border: `1px solid ${m.border}`, background: 'rgba(0,0,0,0.5)' }}
            >
              <div className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg,transparent,${m.glow.replace('0.5', '0.8')},transparent)` }} />
              <div className="mb-4 flex items-center gap-3">
                <span className="text-3xl">{m.icon}</span>
                <p className="font-perpetua text-xl" style={{ color: '#f5d87a' }}>{m.title}</p>
              </div>
              <p className="mb-4 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{m.desc}</p>
              <motion.button type="button" onClick={m.action}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="w-full rounded-full py-2.5 text-sm font-bold tracking-wide text-white"
                style={{ background: m.gradient, cursor: 'pointer', boxShadow: `0 0 16px ${m.glow}`, border: 'none' }}>
                {m.btnLabel}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
