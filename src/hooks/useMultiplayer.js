import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function useMultiplayer() {
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [gameState, setGameState] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const subsRef = useRef([])
  const roomIdRef = useRef(null)
  // Polling fallback for messages in case WebSocket fails
  const pollRef = useRef(null)
  const lastMsgIdRef = useRef(null)

  const clearSubs = () => {
    subsRef.current.forEach((s) => supabase.removeChannel(s))
    subsRef.current = []
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const fetchMessages = useCallback(async (roomId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at')
      .limit(100)
    if (data) {
      setMessages(data)
      if (data.length > 0) lastMsgIdRef.current = data[data.length - 1].id
    }
  }, [])

  const startMsgPolling = useCallback((roomId) => {
    if (pollRef.current) clearInterval(pollRef.current)
    // Poll every 2 seconds as fallback
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at')
        .limit(100)
      if (data) {
        setMessages(data)
      }
    }, 2000)
  }, [])

  const subscribeToRoom = useCallback((roomId) => {
    clearSubs()
    roomIdRef.current = roomId

    // room status
    const roomCh = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
        (payload) => { if (payload.new) setRoom(payload.new) })
      .subscribe()

    // players
    const playersCh = supabase
      .channel(`players:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        async () => {
          const { data } = await supabase.from('room_players').select('*').eq('room_id', roomId).order('joined_at')
          if (data) setPlayers(data)
        })
      .subscribe()

    // game state
    const stateCh = supabase
      .channel(`state:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_states', filter: `room_id=eq.${roomId}` },
        (payload) => { if (payload.new) setGameState(payload.new.state) })
      .subscribe()

    // messages — realtime + polling fallback
    const msgCh = supabase
      .channel(`messages:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new && payload.new.room_id === roomId) {
            setMessages((prev) => {
              // avoid duplicates
              if (prev.find(m => m.id === payload.new.id)) return prev
              return [...prev, payload.new]
            })
          }
        })
      .subscribe((status) => {
        // If WebSocket fails, start polling fallback
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          startMsgPolling(roomId)
        }
      })

    subsRef.current = [roomCh, playersCh, stateCh, msgCh]

    // Always start polling as fallback (stops if realtime works fine)
    startMsgPolling(roomId)
  }, [startMsgPolling])

  const createRoom = useCallback(async ({ userId, username, maxPlayers = 4 }) => {
    setLoading(true); setError(null)
    try {
      const code = genCode()
      const { data: roomData, error: roomErr } = await supabase
        .from('game_rooms')
        .insert({ room_code: code, host_id: userId, max_players: maxPlayers, status: 'waiting' })
        .select().single()
      if (roomErr) throw roomErr

      const { error: playerErr } = await supabase
        .from('room_players')
        .insert({ room_id: roomData.id, user_id: userId, username, is_ready: false })
      if (playerErr) throw playerErr

      setRoom(roomData)
      const { data: playersData } = await supabase.from('room_players').select('*').eq('room_id', roomData.id)
      setPlayers(playersData || [])
      setMessages([])
      setGameState(null)
      subscribeToRoom(roomData.id)
      return { ok: true, room: roomData }
    } catch (e) {
      setError(e.message)
      return { ok: false, message: e.message }
    } finally {
      setLoading(false)
    }
  }, [subscribeToRoom])

  const joinRoom = useCallback(async ({ code, userId, username }) => {
    setLoading(true); setError(null)
    try {
      const { data: roomData, error: roomErr } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', code.toUpperCase())
        .single()
      if (roomErr || !roomData) throw new Error('Room tidak ditemukan.')
      if (roomData.status !== 'waiting') throw new Error('Game sudah dimulai.')

      const { data: existingPlayers } = await supabase
        .from('room_players').select('*').eq('room_id', roomData.id)
      if ((existingPlayers?.length ?? 0) >= roomData.max_players) throw new Error('Room sudah penuh.')

      const alreadyIn = existingPlayers?.find((p) => p.user_id === userId)
      if (!alreadyIn) {
        const { error: joinErr } = await supabase
          .from('room_players')
          .insert({ room_id: roomData.id, user_id: userId, username, is_ready: false })
        if (joinErr) throw joinErr
      }

      setRoom(roomData)
      const { data: playersData } = await supabase.from('room_players').select('*').eq('room_id', roomData.id).order('joined_at')
      setPlayers(playersData || [])

      const { data: stateData } = await supabase.from('game_states').select('*').eq('room_id', roomData.id).single()
      if (stateData) setGameState(stateData.state)

      await fetchMessages(roomData.id)
      subscribeToRoom(roomData.id)
      return { ok: true, room: roomData }
    } catch (e) {
      setError(e.message)
      return { ok: false, message: e.message }
    } finally {
      setLoading(false)
    }
  }, [subscribeToRoom, fetchMessages])

  const leaveRoom = useCallback(async ({ roomId, userId, isHost }) => {
    try {
      await supabase.from('room_players').delete().eq('room_id', roomId).eq('user_id', userId)
      if (isHost) {
        await supabase.from('game_rooms').update({ status: 'closed' }).eq('id', roomId)
      }
      clearSubs()
      setRoom(null); setPlayers([]); setGameState(null); setMessages([])
    } catch (e) {
      setError(e.message)
    }
  }, [])

  const setReady = useCallback(async ({ roomId, userId, isReady }) => {
    await supabase.from('room_players').update({ is_ready: isReady }).eq('room_id', roomId).eq('user_id', userId)
  }, [])

  const startGame = useCallback(async ({ roomId, initialState }) => {
    await supabase.from('game_rooms').update({ status: 'playing' }).eq('id', roomId)
    const { data: existing } = await supabase.from('game_states').select('id').eq('room_id', roomId).single()
    if (existing) {
      await supabase.from('game_states').update({ state: initialState, updated_at: new Date().toISOString() }).eq('room_id', roomId)
    } else {
      await supabase.from('game_states').insert({ room_id: roomId, state: initialState })
    }
  }, [])

  const updateGameState = useCallback(async ({ roomId, state }) => {
    await supabase.from('game_states')
      .update({ state, updated_at: new Date().toISOString() })
      .eq('room_id', roomId)
  }, [])

  const sendMessage = useCallback(async ({ roomId, userId, username, text }) => {
    if (!text.trim()) return
    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      user_id: userId,
      username,
      content: text.trim()
    })
    if (!error && roomIdRef.current) {
      // Immediately fetch latest messages after sending
      await fetchMessages(roomId)
    }
  }, [fetchMessages])

  const finishGame = useCallback(async ({ roomId, winnerIds, loserIds }) => {
    await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', roomId)
    for (const uid of winnerIds) {
      const { data } = await supabase.from('profiles').select('games_played,games_won').eq('id', uid).single()
      if (data) await supabase.from('profiles').update({ games_played: (data.games_played||0)+1, games_won: (data.games_won||0)+1 }).eq('id', uid)
    }
    for (const uid of loserIds) {
      const { data } = await supabase.from('profiles').select('games_played,games_lost').eq('id', uid).single()
      if (data) await supabase.from('profiles').update({ games_played: (data.games_played||0)+1, games_lost: (data.games_lost||0)+1 }).eq('id', uid)
    }
  }, [])

  useEffect(() => () => clearSubs(), [])

  return {
    room, players, gameState, messages, loading, error,
    createRoom, joinRoom, leaveRoom, setReady, startGame, updateGameState, sendMessage, finishGame,
  }
}
