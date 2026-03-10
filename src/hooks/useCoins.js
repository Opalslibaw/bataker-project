// src/hooks/useCoins.js
// Hook untuk semua operasi coin — add, deduct, fetch transactions
import { useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.jsx'

export function useCoins() {
  const { user, refreshProfile } = useAuth()

  /* ── Tambah / kurangi koin via RPC (atomic, server-side) ── */
  const addCoins = useCallback(async (amount, reason, referenceId = null) => {
    if (!user?.id) return { ok: false, message: 'Not authenticated' }
    const { data, error } = await supabase.rpc('add_coins', {
      p_user_id: user.id,
      p_amount:  amount,
      p_reason:  reason,
      p_ref:     referenceId,
    })
    if (error) return { ok: false, message: error.message }
    await refreshProfile()
    return { ok: true, newBalance: data }
  }, [user, refreshProfile])

  /* ── Reward menang game vs bot ── */
  const rewardWin = useCallback(async (gameId = null) => {
    return addCoins(50, 'win_game', gameId)
  }, [addCoins])

  /* ── Reward achievement ── */
  const rewardAchievement = useCallback(async (achievementName) => {
    return addCoins(25, 'achievement', achievementName)
  }, [addCoins])

  /* ── Fetch riwayat transaksi user ── */
  const fetchTransactions = useCallback(async (limit = 20) => {
    if (!user?.id) return []
    const { data, error } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
    return error ? [] : data
  }, [user])

  /* ── Pasang taruhan di room (dipanggil sebelum game mulai) ── */
  const placeBet = useCallback(async (roomId, amount) => {
    if (!user?.id) return { ok: false, message: 'Not authenticated' }
    if (amount < 10) return { ok: false, message: 'Taruhan minimal 10 koin.' }

    // Cek saldo cukup
    const { data: profile } = await supabase
      .from('profiles').select('coins').eq('id', user.id).single()
    if (!profile || profile.coins < amount)
      return { ok: false, message: 'Saldo koin tidak cukup.' }

    const { error } = await supabase.from('room_bets').upsert({
      room_id: roomId,
      user_id: user.id,
      amount,
      status: 'pending',
    }, { onConflict: 'room_id,user_id' })

    if (error) return { ok: false, message: error.message }
    return { ok: true }
  }, [user])

  /* ── Ambil semua bet di sebuah room ── */
  const fetchRoomBets = useCallback(async (roomId) => {
    const { data, error } = await supabase
      .from('room_bets')
      .select('*, profiles(username, avatar_url)')
      .eq('room_id', roomId)
    return error ? [] : data
  }, [])

  /* ── Settle bet setelah game selesai (panggil dari host) ── */
  const settleBet = useCallback(async (roomId, winnerId) => {
    const { error } = await supabase.rpc('settle_bet', {
      p_room_id:   roomId,
      p_winner_id: winnerId,
    })
    if (error) return { ok: false, message: error.message }
    await refreshProfile()
    return { ok: true }
  }, [refreshProfile])

  /* ── Fetch leaderboard global ── */
  const fetchLeaderboard = useCallback(async () => {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
    return error ? [] : data
  }, [])

  return {
    addCoins,
    rewardWin,
    rewardAchievement,
    placeBet,
    fetchRoomBets,
    settleBet,
    fetchLeaderboard,
    fetchTransactions,
  }
}
