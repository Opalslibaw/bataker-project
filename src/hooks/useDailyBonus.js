/**
 * useDailyBonus.js — daily login bonus & daily missions
 * Menyimpan data di Supabase table: daily_bonuses, daily_missions
 *
 * SQL Migration (jalankan di Supabase SQL Editor):
 * ─────────────────────────────────────────────────
 * -- Daily bonus tracker
 * CREATE TABLE IF NOT EXISTS daily_bonuses (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *   last_claimed_at TIMESTAMPTZ,
 *   streak INTEGER DEFAULT 0,
 *   created_at TIMESTAMPTZ DEFAULT now(),
 *   UNIQUE(user_id)
 * );
 * ALTER TABLE daily_bonuses ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users manage own daily_bonus" ON daily_bonuses FOR ALL USING (auth.uid() = user_id);
 *
 * -- Daily missions tracker
 * CREATE TABLE IF NOT EXISTS daily_missions (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *   mission_date DATE DEFAULT CURRENT_DATE,
 *   missions JSONB DEFAULT '[]',
 *   created_at TIMESTAMPTZ DEFAULT now(),
 *   UNIQUE(user_id, mission_date)
 * );
 * ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users manage own missions" ON daily_missions FOR ALL USING (auth.uid() = user_id);
 */

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const DAILY_BONUS_COINS = 25
const STREAK_BONUS = [0, 0, 10, 10, 25, 25, 50] // extra coins per streak day (index = day)

// Mission definitions — bisa ditambah sesuka hati
export const MISSION_DEFS = [
  { id: 'play_1',  label: 'Main 1 Partai',     desc: 'Selesaikan 1 game apapun',          target: 1,  reward: 30,  icon: 'cards'  },
  { id: 'play_3',  label: 'Main 3 Partai',      desc: 'Selesaikan 3 game apapun',          target: 3,  reward: 75,  icon: 'cards'  },
  { id: 'win_1',   label: 'Menang Sekali',       desc: 'Menangkan 1 game',                  target: 1,  reward: 50,  icon: 'trophy' },
  { id: 'win_2',   label: 'Dua Kemenangan',      desc: 'Menangkan 2 game hari ini',         target: 2,  reward: 120, icon: 'trophy' },
  { id: 'multi_1', label: 'Coba Multiplayer',    desc: 'Main 1 game multiplayer',           target: 1,  reward: 60,  icon: 'globe'  },
]

// Setiap user dapat 3 misi acak per hari
function pickDailyMissions(userId, dateStr) {
  // Deterministic random berdasarkan userId + tanggal
  let seed = 0
  const str = userId + dateStr
  for (let i = 0; i < str.length; i++) seed = (seed * 31 + str.charCodeAt(i)) >>> 0
  const shuffled = [...MISSION_DEFS].sort(() => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return (seed % 3) - 1
  })
  return shuffled.slice(0, 3).map(m => ({ ...m, progress: 0, claimed: false }))
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

export function useDailyBonus(userId) {
  const [bonusState, setBonusState] = useState(null)   // { canClaim, streak, nextIn }
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [claimResult, setClaimResult] = useState(null) // { coins, streak, isStreak }

  const loadBonus = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('daily_bonuses')
      .select('*')
      .eq('user_id', userId)
      .single()

    const now = new Date()
    const today = getTodayStr()

    if (!data) {
      setBonusState({ canClaim: true, streak: 0, nextIn: null })
      return
    }

    const last = data.last_claimed_at ? new Date(data.last_claimed_at) : null
    const lastDate = last ? last.toISOString().split('T')[0] : null

    if (lastDate === today) {
      // Sudah klaim hari ini — hitung countdown ke besok
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      const msLeft = tomorrow - now
      setBonusState({ canClaim: false, streak: data.streak, nextIn: msLeft })
    } else {
      // Belum klaim — cek streak (kemarin klaim = streak lanjut, >kemarin = reset)
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      const streakContinues = lastDate === yesterdayStr
      setBonusState({
        canClaim: true,
        streak: streakContinues ? data.streak : 0,
        nextIn: null,
      })
    }
  }, [userId])

  const loadMissions = useCallback(async () => {
    if (!userId) return
    const today = getTodayStr()
    const { data } = await supabase
      .from('daily_missions')
      .select('*')
      .eq('user_id', userId)
      .eq('mission_date', today)
      .single()

    if (data?.missions?.length > 0) {
      // Merge defs with saved progress
      const saved = data.missions
      setMissions(saved)
    } else {
      // Generate fresh missions untuk hari ini
      const fresh = pickDailyMissions(userId, today)
      setMissions(fresh)
      // Simpan ke DB
      await supabase.from('daily_missions').upsert({
        user_id: userId,
        mission_date: today,
        missions: fresh,
      }, { onConflict: 'user_id,mission_date' })
    }
  }, [userId])

  const claimDailyBonus = useCallback(async () => {
    if (!userId || !bonusState?.canClaim) return null
    setLoading(true)
    try {
      const newStreak = bonusState.streak + 1
      const bonus = DAILY_BONUS_COINS + (STREAK_BONUS[Math.min(newStreak - 1, STREAK_BONUS.length - 1)] || 0)

      // Update streak record
      await supabase.from('daily_bonuses').upsert({
        user_id: userId,
        last_claimed_at: new Date().toISOString(),
        streak: newStreak,
      }, { onConflict: 'user_id' })

      // Add coins to profile
      const { data: profile } = await supabase.from('profiles').select('coins').eq('id', userId).single()
      if (profile) {
        await supabase.from('profiles').update({ coins: (profile.coins || 0) + bonus }).eq('id', userId)
      }

      const result = { coins: bonus, streak: newStreak, isStreak: newStreak > 1 }
      setClaimResult(result)
      setBonusState(prev => ({ ...prev, canClaim: false, streak: newStreak }))
      setTimeout(() => setClaimResult(null), 4000)
      return result
    } finally {
      setLoading(false)
    }
  }, [userId, bonusState])

  // Update mission progress
  const updateMissionProgress = useCallback(async (missionId, increment = 1) => {
    if (!userId) return
    const today = getTodayStr()
    setMissions(prev => {
      const updated = prev.map(m => {
        if (m.id !== missionId || m.claimed) return m
        const newProgress = Math.min(m.progress + increment, m.target)
        return { ...m, progress: newProgress }
      })
      // Save to DB
      supabase.from('daily_missions').upsert({
        user_id: userId,
        mission_date: today,
        missions: updated,
      }, { onConflict: 'user_id,mission_date' })
      return updated
    })
  }, [userId])

  // Claim mission reward
  const claimMissionReward = useCallback(async (missionId) => {
    if (!userId) return null
    const mission = missions.find(m => m.id === missionId)
    if (!mission || mission.claimed || mission.progress < mission.target) return null

    const today = getTodayStr()
    const updated = missions.map(m => m.id === missionId ? { ...m, claimed: true } : m)
    setMissions(updated)

    await supabase.from('daily_missions').upsert({
      user_id: userId,
      mission_date: today,
      missions: updated,
    }, { onConflict: 'user_id,mission_date' })

    // Add coins
    const { data: profile } = await supabase.from('profiles').select('coins').eq('id', userId).single()
    if (profile) {
      await supabase.from('profiles').update({ coins: (profile.coins || 0) + mission.reward }).eq('id', userId)
    }

    return mission.reward
  }, [userId, missions])

  // Shortcut: record a game played (call after each game ends)
  const recordGamePlayed = useCallback(async (isWin = false, isMultiplayer = false) => {
    await updateMissionProgress('play_1', 1)
    await updateMissionProgress('play_3', 1)
    if (isWin) {
      await updateMissionProgress('win_1', 1)
      await updateMissionProgress('win_2', 1)
    }
    if (isMultiplayer) {
      await updateMissionProgress('multi_1', 1)
    }
  }, [updateMissionProgress])

  useEffect(() => {
    if (!userId) return
    loadBonus()
    loadMissions()
  }, [userId, loadBonus, loadMissions])

  return {
    bonusState,
    missions,
    loading,
    claimResult,
    claimDailyBonus,
    claimMissionReward,
    recordGamePlayed,
    reload: () => { loadBonus(); loadMissions() },
  }
}
