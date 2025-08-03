import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DailyStreakData, StreakReward } from '@/types/gamification.types'
import { storageService } from '@/services/storage.service'
import { useUserProfileStore } from './userProfile.store'

export const useDailyStreakStore = defineStore('dailyStreak', () => {
  // Stores relacionadas
  const userProfileStore = useUserProfileStore()

  // Estado
  const streakData = ref<DailyStreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastLoginDate: new Date().toISOString(),
    isVacationMode: false,
    rewardsEarned: []
  })

  // Configurações de recompensas
  const STREAK_REWARDS: StreakReward[] = [
    { day: 3, experience: 50, tokens: 5, achievement: 'Iniciante Dedicado' },
    { day: 7, experience: 150, tokens: 15, achievement: 'Semana Completa' },
    { day: 14, experience: 300, tokens: 30, achievement: 'Duas Semanas' },
    { day: 30, experience: 750, tokens: 75, achievement: 'Mês Inteiro' },
    { day: 60, experience: 1500, tokens: 150, achievement: 'Dois Meses' },
    { day: 90, experience: 2500, tokens: 250, achievement: 'Trimestre' },
    { day: 180, experience: 5000, tokens: 500, achievement: 'Semestre' },
    { day: 365, experience: 10000, tokens: 1000, achievement: 'Ano Completo' }
  ]

  // Computed
  const isStreakActive = computed(() => {
    if (!streakData.value.lastLoginDate) return false
    
    const lastVisit = new Date(streakData.value.lastLoginDate)
    const today = new Date()
    const daysDiff = getDaysDifference(lastVisit, today)
    
    // Em modo férias
    if (streakData.value.isVacationMode && streakData.value.vacationEndDate) {
      const endDate = new Date(streakData.value.vacationEndDate)
      return today <= endDate
    }
    
    return daysDiff <= 1
  })

  const daysUntilNextReward = computed(() => {
    const nextReward = STREAK_REWARDS.find(r => r.day > streakData.value.currentStreak)
    if (!nextReward) return null
    
    return nextReward.day - streakData.value.currentStreak
  })

  const nextReward = computed(() => {
    return STREAK_REWARDS.find(r => r.day > streakData.value.currentStreak) || null
  })

  const currentMilestone = computed(() => {
    const achieved = STREAK_REWARDS.filter(r => r.day <= streakData.value.currentStreak)
    return achieved[achieved.length - 1] || null
  })

  const vacationDaysLeft = computed(() => {
    if (!streakData.value.isVacationMode || !streakData.value.vacationEndDate) return 0
    
    const today = new Date()
    const endDate = new Date(streakData.value.vacationEndDate)
    
    if (today > endDate) return 0
    
    return getDaysDifference(today, endDate) + 1
  })

  // Métodos
  function initializeStreak(userId: string) {
    const savedData = storageService.getItem(`streak_${userId}`) as DailyStreakData | null
    
    if (savedData) {
      streakData.value = savedData
    }
    
    checkAndUpdateStreak()
  }

  function checkAndUpdateStreak() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (!streakData.value.lastLoginDate) {
      // Primeira visita
      startNewStreak()
      return
    }
    
    const lastVisit = new Date(streakData.value.lastLoginDate)
    lastVisit.setHours(0, 0, 0, 0)
    
    const daysDiff = getDaysDifference(lastVisit, today)
    
    // Mesma data, não faz nada
    if (daysDiff === 0) return
    
    // Modo férias ativo
    if (streakData.value.isVacationMode && streakData.value.vacationEndDate) {
      const endDate = new Date(streakData.value.vacationEndDate)
      
      if (today <= endDate) {
        // Ainda em férias, mantém a ofensiva
        updateVisit()
        return
      } else {
        // Férias terminaram
        deactivateVacationMode()
        
        // Verifica se voltou no dia seguinte ao fim das férias
        const daysSinceVacation = getDaysDifference(endDate, today)
        if (daysSinceVacation <= 1) {
          updateVisit()
          return
        }
      }
    }
    
    // Verifica continuidade da ofensiva
    if (daysDiff === 1) {
      // Dia consecutivo
      incrementStreak()
    } else if (daysDiff > 1) {
      // Quebrou a ofensiva
      handleStreakBreak(daysDiff)
    }
  }

  function startNewStreak() {
    const today = new Date()
    
    streakData.value = {
      currentStreak: 1,
      longestStreak: Math.max(1, streakData.value.longestStreak),
      lastLoginDate: today.toISOString(),
      isVacationMode: false,
      rewardsEarned: streakData.value.rewardsEarned || []
    }
    
    saveStreak()
  }

  function incrementStreak() {
    const today = new Date()
    
    streakData.value.currentStreak++
    streakData.value.lastLoginDate = today.toISOString()
    
    if (streakData.value.currentStreak > streakData.value.longestStreak) {
      streakData.value.longestStreak = streakData.value.currentStreak
    }
    
    // Verificar recompensas
    const reward = STREAK_REWARDS.find(r => r.day === streakData.value.currentStreak)
    if (reward) {
      applyStreakReward(reward)
    }
    
    saveStreak()
  }

  function handleStreakBreak(_daysMissed: number) {
    const previousStreak = streakData.value.currentStreak
    
    // Resetar ofensiva
    startNewStreak()
    
    // Bonus de retorno para ofensivas longas
    if (previousStreak >= 7) {
      // Pequena recompensa por voltar
      userProfileStore.addXP(25)
      userProfileStore.addTokens(5)
    }
  }

  function activateVacationMode(days: number): boolean {
    // Verificações
    if (days < 1 || days > 14) return false
    if (streakData.value.isVacationMode) return false
    if (streakData.value.currentStreak < 7) return false // Precisa ter pelo menos 7 dias
    
    const today = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days - 1)
    
    streakData.value.isVacationMode = true
    streakData.value.vacationStartDate = today.toISOString()
    streakData.value.vacationEndDate = endDate.toISOString()
    
    saveStreak()
    return true
  }

  function deactivateVacationMode() {
    if (streakData.value.isVacationMode) {
      streakData.value.isVacationMode = false
      saveStreak()
    }
  }

  function applyStreakReward(reward: StreakReward) {
    userProfileStore.addXP(reward.experience)
    userProfileStore.addTokens(reward.tokens)
    
    // Adicionar à lista de recompensas ganhas
    streakData.value.rewardsEarned.push(reward)
    
    // Pode adicionar conquistas especiais aqui
    if (reward.achievement) {
      // Notificar sobre o bônus especial
      console.log(`Conquista desbloqueada: ${reward.achievement}`)
    }
  }

  function updateVisit() {
    streakData.value.lastLoginDate = new Date().toISOString()
    saveStreak()
  }

  function getDaysDifference(date1: Date, date2: Date): number {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    
    d1.setHours(0, 0, 0, 0)
    d2.setHours(0, 0, 0, 0)
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  function markGameCompleted() {
    // Atualiza a data da última visita quando um jogo é completado
    updateVisit()
    
    // Se a ofensiva ainda não foi iniciada hoje, inicia ou continua
    checkAndUpdateStreak()
    
    // Salva o estado
    saveStreak()
  }

  function resetStreak() {
    streakData.value = {
      currentStreak: 0,
      longestStreak: streakData.value.longestStreak, // Mantém o recorde
      lastLoginDate: new Date().toISOString(),
      isVacationMode: false,
      rewardsEarned: streakData.value.rewardsEarned || []
    }
    saveStreak()
  }

  // Persistência
  function saveStreak() {
    const userId = userProfileStore.profile.id
    storageService.setItem(`streak_${userId}`, streakData.value)
  }

  return {
    // Estado
    streakData,
    STREAK_REWARDS,
    
    // Computed
    isStreakActive,
    daysUntilNextReward,
    nextReward,
    currentMilestone,
    vacationDaysLeft,
    
    // Métodos
    initializeStreak,
    checkAndUpdateStreak,
    activateVacationMode,
    deactivateVacationMode,
    markGameCompleted,
    resetStreak
  }
})