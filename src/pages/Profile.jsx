const profileStyles = `
  @keyframes pf-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes pf-pulse-dot {
    0%, 100% { opacity: 0.5; box-shadow: 0 0 4px #4ade80; }
    50%       { opacity: 1;   box-shadow: 0 0 12px #4ade80; }
  }
  @keyframes pf-icon-glow {
    0%, 100% { filter: drop-shadow(0 0 3px var(--glow)); }
    50%       { filter: drop-shadow(0 0 10px var(--glow)); }
  }
`

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase.js'

// ── Premium SVG Icons
const IconCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
    <circle cx="12" cy="13" r="1" fill="currentColor"/>
  </svg>
)

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
  </svg>
)

// Sword icon — Bot fights with blade
const IconBot = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5"/>
    <path d="M13 19l6-6"/>
    <path d="M16 16l4 4"/>
    <path d="M19 21l2-2"/>
    <path d="M3 21l9-9"/>
  </svg>
)

// Network/globe — elegant meridian lines
const IconGlobe = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    <path d="M12 2v20" strokeOpacity="0.3"/>
  </svg>
)

const IconSpin = () => (
  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2"/>
    <path d="M12 2a10 10 0 019.5 6.8" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

// ── Stat Icons (SVG only, zero emoji)
// Dimainkan — playing card silhouette
const StatIconPlayed = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="12" height="16" rx="2"/>
    <path d="M5 7h6M5 10h6M5 13h3"/>
    <rect x="10" y="7" width="12" height="16" rx="2" fill="none" strokeOpacity="0.4"/>
  </svg>
)

// Menang — laurel / trophy crown
const StatIconWin = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4l-4.8 2.5.9-5.4L4.2 7.7l5.4-.8L12 2z"/>
    <path d="M5 21h14M8 21v-2M16 21v-2M12 21v-3"/>
  </svg>
)

// Kalah — broken shield
const StatIconLost = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <line x1="9" y1="9" x2="15" y2="15" strokeOpacity="0.7"/>
    <line x1="15" y1="9" x2="9" y2="15" strokeOpacity="0.7"/>
  </svg>
)

// Win Rate — diamond / gem
const StatIconRate = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 12L2 9l4-6z"/>
    <path d="M2 9h20M6 3l4 6M18 3l-4 6"/>
  </svg>
)

// ── Animated stat card
function StatCard({ label, value, color, glow, delay, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.04, boxShadow: `0 0 40px ${glow}40, 0 16px 40px rgba(0,0,0,0.5)` }}
      className="relative overflow-hidden rounded-2xl p-5 text-center"
      style={{
        border: `1px solid ${color}25`,
        background: 'rgba(0,0,0,0.55)',
      }}>
      {/* Top glow line */}
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${color}90,transparent)` }} />
      {/* Ambient bg */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: `radial-gradient(circle at 50% 0%,${color}18,transparent 65%)` }} />
      {/* Corner shine */}
      <div className="pointer-events-none absolute right-2 top-2 h-8 w-8"
        style={{ background: `radial-gradient(circle at 100% 0%,${color}20,transparent 70%)` }} />
      <div className="relative">
        <div className="flex justify-center" style={{ filter: `drop-shadow(0 0 6px ${glow})` }}>
          {icon}
        </div>
        <motion.p className="mt-2 font-perpetua text-3xl font-bold"
          style={{ color, textShadow: `0 0 20px ${glow}` }}
          initial={{ scale: 0.5 }} animate={{ scale: 1 }}
          transition={{ delay: delay + 0.15, type: 'spring', stiffness: 280 }}>
          {value}
        </motion.p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.25em]" style={{ color: 'rgba(241,196,15,0.45)' }}>{label}</p>
      </div>
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

  const handleLogout = async () => { await signOut(); navigate('/', { replace: true }) }

  const handleAvatarClick = () => {
    if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click() }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 2 * 1024 * 1024) {
      setUploadMsg({ ok: false, text: 'File terlalu besar. Maksimal 2MB.' })
      setTimeout(() => setUploadMsg(null), 3000); return
    }
    setUploading(true); setUploadMsg(null)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) {
      setUploadMsg({ ok: false, text: 'Gagal upload. Coba lagi.' })
      setUploading(false); setTimeout(() => setUploadMsg(null), 3000); return
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = urlData.publicUrl + '?t=' + Date.now()
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    setAvatarUrl(publicUrl); setUploading(false)
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
      <style>{profileStyles}</style>
      {/* Ambient bg */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 40% at 10% 0%,rgba(142,68,173,0.14) 0%,transparent 60%), radial-gradient(ellipse 50% 50% at 90% 100%,rgba(192,57,43,0.11) 0%,transparent 60%), radial-gradient(ellipse 40% 30% at 50% 50%,rgba(241,196,15,0.03) 0%,transparent 70%)',
        }} />
      </div>

      {/* ── HEADER */}
      <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-[10px] uppercase tracking-[0.5em]" style={{ color: 'rgba(241,196,15,0.45)' }}>Akun Pemain</p>
        <h1 className="mt-1 font-perpetua text-4xl md:text-5xl"
          style={{ color: '#F1C40F', textShadow: '0 0 30px rgba(241,196,15,0.5), 0 0 60px rgba(241,196,15,0.15)' }}>
          Profil
        </h1>
      </motion.div>

      {/* ── PROFILE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-6"
        style={{
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(241,196,15,0.18)',
          boxShadow: '0 0 60px rgba(241,196,15,0.05), 0 0 120px rgba(192,57,43,0.04)',
          }}>
        {/* Top shimmer */}
        <div className="absolute inset-x-0 top-0 h-px" style={{
          background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.8),transparent)',
          backgroundSize: '200% 100%', animation: 'pf-shimmer 4s linear infinite',
        }} />
        {/* Bottom line */}
        <div className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(142,68,173,0.4),transparent)' }} />
        {/* Corner glow */}
        <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full"
          style={{ background: 'radial-gradient(circle,rgba(142,68,173,0.2),transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full"
          style={{ background: 'radial-gradient(circle,rgba(192,57,43,0.15),transparent 70%)' }} />

        <div className="flex flex-wrap items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAvatarClick}
              className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 35%,#5b1fa0,#2d0a52)',
                border: '2px solid rgba(241,196,15,0.35)',
                boxShadow: '0 0 32px rgba(142,68,173,0.6), 0 0 64px rgba(142,68,173,0.15), 0 0 0 4px rgba(142,68,173,0.1)',
              }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                : <span className="text-4xl select-none">🃏</span>
              }
              {/* Hover overlay */}
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full"
                style={{ background: 'rgba(0,0,0,0.7)', color: '#F1C40F' }}
                initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} transition={{ duration: 0.18 }}>
                {uploading ? <IconSpin /> : <IconCamera />}
                <span className="text-[9px] font-semibold uppercase tracking-wider">
                  {uploading ? 'Upload...' : 'Ganti'}
                </span>
              </motion.div>
            </motion.div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {/* Online dot */}
            <div className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-2"
              style={{ background: '#4ade80', borderColor: '#050301', animation: 'pf-pulse-dot 2s ease-in-out infinite' }} />
          </div>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <motion.p className="font-perpetua text-2xl md:text-3xl truncate"
              style={{ color: '#f5d87a', textShadow: '0 0 16px rgba(241,196,15,0.3)' }}
>
              {username}
            </motion.p>
            <p className="truncate text-xs" style={{ color: 'rgba(241,196,15,0.38)' }}>{user?.email}</p>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                style={{ background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.3)', color: '#4ade80' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" style={{ animation: 'pf-pulse-dot 1.5s ease-in-out infinite' }} />
                Online
              </span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Klik foto untuk ganti avatar</span>
            </div>
          </div>

          {/* Logout */}
          <motion.button type="button" onClick={handleLogout}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(192,57,43,0.4)' }}
            whileTap={{ scale: 0.95 }}
            className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
            style={{ border: '1px solid rgba(192,57,43,0.4)', color: '#e74c3c', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            <IconLogout />
            Logout
          </motion.button>
        </div>

        {/* Upload message */}
        <AnimatePresence>
          {uploadMsg && (
            <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              className="mt-4 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm"
              style={{
                background: uploadMsg.ok ? 'rgba(39,174,96,0.12)' : 'rgba(192,57,43,0.12)',
                border: `1px solid ${uploadMsg.ok ? 'rgba(39,174,96,0.4)' : 'rgba(192,57,43,0.4)'}`,
                color: uploadMsg.ok ? '#4ade80' : '#e74c3c',
              }}>
              {uploadMsg.ok ? <IconCheck /> : <IconX />}
              {uploadMsg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── STATS */}
      <div>
        <motion.div
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="mb-4 flex items-center gap-3">
          <div className="h-px w-5" style={{ background: 'rgba(241,196,15,0.4)' }} />
          <p className="text-[10px] uppercase tracking-[0.45em]" style={{ color: 'rgba(241,196,15,0.45)' }}>Statistik Permainan</p>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg,rgba(241,196,15,0.2),transparent)' }} />
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Dimainkan" value={played} color="#F1C40F" glow="rgba(241,196,15,0.7)" delay={0.15} icon={<StatIconPlayed color="#F1C40F"/>} />
          <StatCard label="Menang"    value={won}    color="#4ade80" glow="rgba(74,222,128,0.7)"  delay={0.22} icon={<StatIconWin color="#4ade80"/>} />
          <StatCard label="Kalah"     value={lost}   color="#e74c3c" glow="rgba(231,76,60,0.7)"   delay={0.29} icon={<StatIconLost color="#e74c3c"/>} />
          <StatCard label="Win Rate"  value={`${winRate}%`} color="#a78bfa" glow="rgba(167,139,250,0.7)" delay={0.36} icon={<StatIconRate color="#a78bfa"/>} />
        </div>

        {/* Win rate bar */}
        {played > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(241,196,15,0.4)' }}>Win Rate</span>
              <motion.span className="text-xs font-bold" style={{ color: '#4ade80' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                {winRate}%
              </motion.span>
            </div>
            <div className="overflow-hidden rounded-full" style={{ height: 7, background: 'rgba(231,76,60,0.25)' }}>
              <motion.div className="relative h-full overflow-hidden rounded-full"
                initial={{ width: 0 }} animate={{ width: `${winRate}%` }}
                transition={{ duration: 1.2, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: 'linear-gradient(90deg,#16a34a,#4ade80)', boxShadow: '0 0 12px rgba(74,222,128,0.7)' }}>
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.25) 50%,transparent 100%)',
                  backgroundSize: '200% 100%', animation: 'pf-shimmer 2s linear 1.5s infinite',
                }} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── PLAY MODES */}
      <div>
        <motion.div
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
          className="mb-4 flex items-center gap-3">
          <div className="h-px w-5" style={{ background: 'rgba(241,196,15,0.4)' }} />
          <p className="text-[10px] uppercase tracking-[0.45em]" style={{ color: 'rgba(241,196,15,0.45)' }}>Mode Permainan</p>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg,rgba(241,196,15,0.2),transparent)' }} />
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              title: 'Lawan Bot',
              desc: 'Bermain melawan AI. Cocok untuk latihan dan menguasai strategi Kartu Batak.',
              icon: <IconBot />,
              action: () => navigate('/game'),
              btnLabel: 'Main Sekarang',
              gradient: 'linear-gradient(135deg,#8b1a12,#c0392b,#e74c3c)',
              glow: 'rgba(192,57,43,0.55)',
              glowBright: 'rgba(192,57,43,0.8)',
              border: 'rgba(192,57,43,0.28)',
              bgAccent: 'rgba(192,57,43,0.1)',
              delay: 0.4,
            },
            {
              title: 'Multiplayer Online',
              desc: 'Tantang pemain lain secara real-time. Buat room atau join room teman.',
              icon: <IconGlobe />,
              action: () => navigate('/lobby'),
              btnLabel: 'Masuk Lobby',
              gradient: 'linear-gradient(135deg,#1a0a4a,#3d1a8a,#5b1fa0)',
              glow: 'rgba(91,31,160,0.55)',
              glowBright: 'rgba(142,68,173,0.8)',
              border: 'rgba(142,68,173,0.28)',
              bgAccent: 'rgba(142,68,173,0.08)',
              delay: 0.48,
            },
          ].map((m) => (
            <motion.div key={m.title}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: m.delay, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: `0 0 50px ${m.glow}, 0 20px 50px rgba(0,0,0,0.5)` }}
              className="group relative overflow-hidden rounded-2xl p-5"
              style={{
                border: `1px solid ${m.border}`,
                background: 'rgba(0,0,0,0.55)',
                transition: 'box-shadow 0.3s ease',
              }}>
              {/* Top shimmer line */}
              <div className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg,transparent,${m.glowBright},transparent)` }} />
              {/* Corner accent */}
              <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-40"
                style={{ background: `radial-gradient(circle,${m.bgAccent},transparent 70%)` }} />
              {/* Hover bg sweep */}
              <motion.div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100"
                style={{ background: `radial-gradient(ellipse at 20% 50%,${m.bgAccent},transparent 60%)`, transition: 'opacity 0.3s' }} />

              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <motion.div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: m.bgAccent, border: `1px solid ${m.border}`, color: '#f5d87a' }}
                    whileHover={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 0.4 }}>
                    {m.icon}
                  </motion.div>
                  <p className="font-perpetua text-xl" style={{ color: '#f5d87a', textShadow: '0 0 10px rgba(241,196,15,0.2)' }}>
                    {m.title}
                  </p>
                </div>
                <p className="mb-5 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>{m.desc}</p>
                <motion.button type="button" onClick={m.action}
                  whileHover={{ scale: 1.04, boxShadow: `0 0 24px ${m.glow}` }}
                  whileTap={{ scale: 0.97 }}
                  className="relative w-full overflow-hidden rounded-xl py-2.5 text-sm font-bold tracking-wide text-white"
                  style={{ background: m.gradient, cursor: 'pointer', border: 'none', boxShadow: `0 0 16px ${m.glow}` }}>
                  {/* Shimmer */}
                  <span className="pointer-events-none absolute inset-0" style={{
                    background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.12) 50%,transparent 70%)',
                    backgroundSize: '200% 100%', animation: 'pf-shimmer 2.5s ease-in-out 1s infinite',
                  }} />
                  <span className="relative z-10">{m.btnLabel}</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
