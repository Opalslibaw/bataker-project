import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'

const EMOJIS = ['😀', '😂', '😍', '😎', '😈', '😢', '😡', '🎉', '🃏', '♥️']

function formatTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChatBox({ roomId = 'lobby', title = 'Chat' }) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [profiles, setProfiles] = useState({})
  const [input, setInput] = useState('')
  const [minimized, setMinimized] = useState(false)
  const [unread, setUnread] = useState(0)
  const listRef = useRef(null)
  const channelRef = useRef(null)

  const currentUserId = user?.id || null

  useEffect(() => {
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, room_id, user_id, content, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (!error && data) {
        setMessages(data)
        const userIds = Array.from(
          new Set(data.map((m) => m.user_id).filter(Boolean)),
        )
        if (userIds.length) {
          const { data: profileRows } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds)
          if (profileRows) {
            const map = {}
            profileRows.forEach((p) => {
              map[p.id] = p
            })
            setProfiles(map)
          }
        }
      }
    }

    fetchInitial()
  }, [roomId])

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const msg = payload.new
          setMessages((prev) => [...prev, msg])
          if (msg.user_id && !profiles[msg.user_id]) {
            supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', msg.user_id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setProfiles((prevProfiles) => ({
                    ...prevProfiles,
                    [data.id]: data,
                  }))
                }
              })
          }
          if (minimized && msg.user_id !== currentUserId) {
            setUnread((n) => n + 1)
          }
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [roomId, minimized, currentUserId, profiles])

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages.length])

  const handleSend = async (e) => {
    e?.preventDefault?.()
    const text = input.trim()
    if (!text || !user) return

    const payload = {
      room_id: roomId,
      user_id: user.id,
      content: text,
    }
    setInput('')
    await supabase.from('messages').insert(payload)
  }

  const toggleMinimize = () => {
    setMinimized((m) => {
      if (m) setUnread(0)
      return !m
    })
  }

  const usernameFor = (userId) => {
    if (userId === currentUserId) {
      return profile?.username || (user?.email ? user.email.split('@')[0] : 'Kamu')
    }
    const p = profiles[userId]
    if (p?.username) return p.username
    return 'Pemain'
  }

  const avatarFor = (userId) => {
    const p = profiles[userId]
    const name = usernameFor(userId)
    const letter = name?.charAt(0)?.toUpperCase() || '?'
    return { letter, url: p?.avatar_url || null }
  }

  const items = useMemo(
    () =>
      messages.map((m) => ({
        ...m,
        isSelf: m.user_id === currentUserId,
      })),
    [messages, currentUserId],
  )

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-40 w-72 text-xs text-brandGold">
      <div className="overflow-hidden rounded-2xl border border-brandGold/40 bg-black/80 backdrop-blur">
        <button
          type="button"
          onClick={toggleMinimize}
          className="flex w-full items-center justify-between px-3 py-2 text-[11px] font-semibold text-brandGold"
        >
          <span>{title}</span>
          <span className="flex items-center gap-2">
            {unread > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brandRed px-1 text-[10px] text-white">
                {unread}
              </span>
            )}
            <span>{minimized ? '▲' : '▼'}</span>
          </span>
        </button>

        <AnimatePresence initial={false}>
          {!minimized && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div
                ref={listRef}
                className="max-h-64 space-y-1 overflow-y-auto border-t border-brandGold/40 bg-black/80 px-2 py-2"
              >
                {items.map((msg) => {
                  const { letter } = avatarFor(msg.user_id)
                  const self = msg.isSelf
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-1 ${
                        self ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {!self && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brandNavy text-[10px] text-brandGold">
                          {letter}
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl px-3 py-1 ${
                          self
                            ? 'bg-brandRed text-white rounded-br-none'
                            : 'bg-brandNavy text-brandGold rounded-bl-none'
                        }`}
                      >
                        <p className="text-[10px] font-semibold opacity-80">
                          {usernameFor(msg.user_id)}
                        </p>
                        <p className="break-words text-[11px]">{msg.content}</p>
                        <p className="mt-0.5 text-[9px] opacity-70">
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                      {self && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brandRed text-[10px] text-white">
                          {(profile?.username || 'K')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  )
                })}
                {items.length === 0 && (
                  <p className="py-4 text-center text-[11px] text-brandGold/60">
                    Belum ada pesan. Mulai ngobrol!
                  </p>
                )}
              </div>

              <form
                onSubmit={handleSend}
                className="flex items-center gap-1 border-t border-brandGold/40 bg-black/90 px-2 py-1.5"
              >
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-brandGold/40 text-[12px] text-brandGold hover:bg-brandGold/10"
                >
                  <div className="relative group">
                    🙂
                    <div className="invisible absolute bottom-7 left-0 z-10 flex gap-1 rounded-xl border border-brandGold/40 bg-black/90 p-1 text-base opacity-0 group-hover:visible group-hover:opacity-100">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setInput((v) => `${v}${emoji}`)}
                          className="px-1"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="h-7 flex-1 rounded-full border border-brandGold/30 bg-black/70 px-2 text-[11px] text-brandGold outline-none"
                  placeholder={
                    user ? 'Ketik pesan...' : 'Login untuk mengirim pesan'
                  }
                  disabled={!user}
                />
                <button
                  type="submit"
                  disabled={!user || !input.trim()}
                  className="h-7 rounded-full bg-brandGold px-3 text-[11px] font-semibold text-black hover:bg-brandGold/90 disabled:cursor-not-allowed disabled:bg-brandGold/40"
                >
                  Kirim
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

