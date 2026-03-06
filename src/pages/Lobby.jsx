import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.jsx'
import { useMultiplayer } from '../hooks/useMultiplayer.js'

export function LobbyPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { createRoom, joinRoom, loading } = useMultiplayer()

  const [mode, setMode] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [formError, setFormError] = useState('')

  const username = profile?.username || user?.email?.split('@')[0] || 'Pemain'

  const handleCreate = async () => {
    setFormError('')
    const result = await createRoom({ userId: user.id, username, maxPlayers })
    if (result.ok) navigate('/multiplayer', { state: { room: result.room, isHost: true } })
    else setFormError(result.message)
  }

  const handleJoin = async () => {
    setFormError('')
    if (joinCode.length < 6) { setFormError('Masukkan kode room 6 karakter.'); return }
    const result = await joinRoom({ code: joinCode, userId: user.id, username })
    if (result.ok) navigate('/multiplayer', { state: { room: result.room, isHost: false } })
    else setFormError(result.message)
  }

  return (
    <section className="space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div style={{ background: 'radial-gradient(ellipse at top left,rgba(142,68,173,0.18) 0%,transparent 55%),radial-gradient(ellipse at bottom right,rgba(192,57,43,0.18) 0%,transparent 55%)', position: 'absolute', inset: 0 }} />
      </div>

      <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <p className="text-xs uppercase tracking-[0.35em]" style={{ color: 'rgba(241,196,15,0.55)' }}>Multiplayer</p>
        <h1 className="font-perpetua text-3xl md:text-4xl" style={{ color: '#f5d87a', textShadow: '0 0 18px rgba(241,196,15,0.35)' }}>Lobby</h1>
        <p className="text-xs" style={{ color: 'rgba(241,196,15,0.5)' }}>Buat room baru atau masuk dengan kode dari teman.</p>
      </motion.header>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2">
        {[
          { key: 'create', icon: '🎰', title: 'Buat Room', desc: 'Buat room baru, dapat kode unik, dan undang teman.', color: 'rgba(142,68,173,0.5)', activeBg: 'linear-gradient(135deg,#1e0a3d,#5b1fa0)', activeBorder: 'rgba(142,68,173,0.7)' },
          { key: 'join', icon: '🔑', title: 'Join Room', desc: 'Masukkan kode 6 karakter dari teman untuk bergabung.', color: 'rgba(192,57,43,0.5)', activeBg: 'linear-gradient(135deg,#3d0a0a,#a93226)', activeBorder: 'rgba(192,57,43,0.7)' },
        ].map((item) => (
          <motion.button key={item.key} type="button"
            onClick={() => { setMode(mode === item.key ? null : item.key); setFormError('') }}
            whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="relative overflow-hidden rounded-2xl p-6 text-left"
            style={{
              background: mode === item.key ? item.activeBg : 'rgba(0,0,0,0.5)',
              border: `1px solid ${mode === item.key ? item.activeBorder : 'rgba(241,196,15,0.15)'}`,
              boxShadow: mode === item.key ? `0 0 28px ${item.color}` : 'none',
              cursor: 'pointer',
            }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.3),transparent)' }} />
            <div className="mb-3 text-3xl">{item.icon}</div>
            <p className="font-perpetua text-xl" style={{ color: '#f5d87a' }}>{item.title}</p>
            <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.desc}</p>
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence>
        {mode && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-2xl p-6"
            style={{ border: '1px solid rgba(241,196,15,0.15)', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)' }}>

            {mode === 'create' && (
              <div className="space-y-5">
                <p className="font-perpetua text-lg" style={{ color: '#f5d87a' }}>Pengaturan Room</p>
                <div>
                  <label className="mb-2 block text-xs font-medium" style={{ color: 'rgba(241,196,15,0.7)' }}>Maks Pemain</label>
                  <div className="flex gap-2">
                    {[2,3,4,5,6].map((n) => (
                      <motion.button key={n} type="button" onClick={() => setMaxPlayers(n)}
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                        style={{
                          width: 44, height: 44, borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none',
                          background: maxPlayers === n ? 'linear-gradient(135deg,#5b1fa0,#8e44ad)' : 'rgba(255,255,255,0.06)',
                          color: maxPlayers === n ? '#fff' : 'rgba(241,196,15,0.6)',
                          boxShadow: maxPlayers === n ? '0 0 14px rgba(142,68,173,0.6)' : 'none',
                          cursor: 'pointer',
                        }}>{n}</motion.button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: 'rgba(241,196,15,0.06)', border: '1px solid rgba(241,196,15,0.12)' }}>
                  <span className="text-xl">👤</span>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(241,196,15,0.6)' }}>Bermain sebagai</p>
                    <p className="text-sm font-semibold" style={{ color: '#F1C40F' }}>{username}</p>
                  </div>
                </div>
                {formError && <p className="rounded-xl p-3 text-xs" style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', color: '#e74c3c' }}>{formError}</p>}
                <motion.button type="button" onClick={handleCreate} disabled={loading}
                  whileHover={!loading ? { scale: 1.03 } : {}} whileTap={!loading ? { scale: 0.97 } : {}}
                  style={{ width: '100%', borderRadius: 9999, padding: '12px 0', fontSize: 14, fontWeight: 700, border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.08em', color: '#fff',
                    background: loading ? 'rgba(142,68,173,0.3)' : 'linear-gradient(135deg,#5b1fa0,#8e44ad)',
                    boxShadow: loading ? 'none' : '0 0 20px rgba(142,68,173,0.6)' }}>
                  {loading ? 'Membuat Room...' : '🎰 Buat Room Sekarang'}
                </motion.button>
              </div>
            )}

            {mode === 'join' && (
              <div className="space-y-5">
                <p className="font-perpetua text-lg" style={{ color: '#f5d87a' }}>Masukkan Kode Room</p>
                <div>
                  <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="ABC123" maxLength={6}
                    style={{ width: '100%', borderRadius: 12, padding: '14px 16px', fontSize: 28, fontWeight: 700,
                      textAlign: 'center', letterSpacing: '0.4em', background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(241,196,15,0.3)', color: '#F1C40F', outline: 'none' }}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(241,196,15,0.7)'; e.target.style.boxShadow = '0 0 14px rgba(241,196,15,0.2)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(241,196,15,0.3)'; e.target.style.boxShadow = 'none' }} />
                  <p className="mt-1 text-center text-xs" style={{ color: 'rgba(241,196,15,0.4)' }}>{joinCode.length}/6 karakter</p>
                </div>
                {formError && <p className="rounded-xl p-3 text-xs" style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', color: '#e74c3c' }}>{formError}</p>}
                <motion.button type="button" onClick={handleJoin} disabled={loading || joinCode.length < 6}
                  whileHover={!loading && joinCode.length === 6 ? { scale: 1.03 } : {}}
                  whileTap={!loading && joinCode.length === 6 ? { scale: 0.97 } : {}}
                  style={{ width: '100%', borderRadius: 9999, padding: '12px 0', fontSize: 14, fontWeight: 700, border: 'none',
                    letterSpacing: '0.08em', color: '#fff',
                    cursor: loading || joinCode.length < 6 ? 'not-allowed' : 'pointer',
                    background: loading || joinCode.length < 6 ? 'rgba(192,57,43,0.3)' : 'linear-gradient(135deg,#a93226,#e74c3c)',
                    boxShadow: loading || joinCode.length < 6 ? 'none' : '0 0 20px rgba(192,57,43,0.6)' }}>
                  {loading ? 'Mencari Room...' : '🔑 Masuk ke Room'}
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="flex items-center gap-4 rounded-2xl p-4"
        style={{ border: '1px solid rgba(241,196,15,0.1)', background: 'rgba(0,0,0,0.35)' }}>
        <span className="text-2xl">🤖</span>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: 'rgba(241,196,15,0.8)' }}>Main Lawan Bot</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Latihan sendiri melawan AI.</p>
        </div>
        <motion.button type="button" onClick={() => navigate('/game')}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          style={{ borderRadius: 9999, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: 'rgba(241,196,15,0.1)', color: 'rgba(241,196,15,0.85)', border: '1px solid rgba(241,196,15,0.25)' }}>
          Main Sekarang
        </motion.button>
      </motion.div>
    </section>
  )
}
