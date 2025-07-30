import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DailyStreakData, VacationMode, StreakReward } from '@/types/gamification.types'
import { storageService } from '@/services/storage.service'
import { useUserProfileStore } from './userProfile.store'

export const useDailyStreakStore = defineStore('dailyStreak', () => {
  // Stores relacionadas
  const userProfileStore = useUserProfileStore()

  // Estado
  const streakData = ref<DailyStreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastVisit: null,
    streakStartDate: null,
    totalDaysPlayed: 0,
    vacationMode: null,
    missedDays: 0,
    comebackBonus: false
  })

  // Configurações de recompensas
  const STREAK_REWARDS: StreakReward[] = [
    { day: 3, xp: 50, tokens: 5, bonus: 'Iniciante Dedicado' },
    { day: 7, xp: 150, tokens: 15, bonus: 'Semana Completa' },
    { day: 14, xp: 300, tokens: 30, bonus: 'Duas Semanas' },
    { day: 30, xp: 750, tokens: 75, bonus: 'Mês Inteiro' },
    { day: 60, xp: 1500, tokens: 150, bonus: 'Dois Meses' },
    { day: 90, xp: 2500, tokens: 250, bonus: 'Trimestre' },
    { day: 180, xp: 5000, tokens: 500, bonus: 'Semestre' },
    { day: 365, xp: 10000, tokens: 1000, bonus: 'Ano Completo' }
  ]

  // Computed
  const isStreakActive = computed(() => {
    if (!streakData.value.lastVisit) return false
    
    const lastVisit = new Date(streakData.value.lastVisit)
    const today = new Date()
    const daysDiff = getDaysDifference(lastVisit, today)
    
    // Em modo férias
    if (streakData.value.vacationMode?.active) {
      const endDate = new Date(streakData.value.vacationMode.endDate)
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
    if (!streakData.value.vacationMode?.active) return 0
    
    const today = new Date()
    const endDate = new Date(streakData.value.vacationMode.endDate)
    
    if (today > endDate) return 0
    
    return getDaysDifference(today, endDate) + 1
  })

  // Métodos
  function initializeStreak(userId: string) {
    const savedData = storageService.getItem<DailyStreakData>(`streak_${userId}`)
    
    if (savedData) {
      streakData.value = {
        ...savedData,
        lastVisit: savedData.lastVisit ? new Date(savedData.lastVisit) : null,
        streakStartDate: savedData.streakStartDate ? new Date(savedData.streakStartDate) : null,
        vacationMode: savedData.vacationMode ? {
          ...savedData.vacationMode,
          startDate: new Date(savedData.vacationMode.startDate),
          endDate: new Date(savedData.vacationMode.endDate)
        } : null
      }
    }
    
    checkAndUpdateStreak()
  }

  function checkAndUpdateStreak() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (!streakData.value.lastVisit) {
      // Primeira visita
      startNewStreak()
      return
    }
    
    const lastVisit = new Date(streakData.value.lastVisit)
    lastVisit.setHours(0, 0, 0, 0)
    
    const daysDiff = getDaysDifference(lastVisit, today)
    
    // Mesma data, não faz nada
    if (daysDiff === 0) return
    
    // Modo férias ativo
    if (streakData.value.vacationMode?.active) {
      const endDate = new Date(streakData.value.vacationMode.endDate)
      
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
      lastVisit: today,
      streakStartDate: today,
      totalDaysPlayed: streakData.value.totalDaysPlayed + 1,
      vacationMode: null,
      missedDays: 0,
      comebackBonus: false
    }
    
    saveStreak()
  }

  function incrementStreak() {
    const today = new Date()
    
    streakData.value.currentStreak++
    streakData.value.lastVisit = today
    streakData.value.totalDaysPlayed++
    
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

  function handleStreakBreak(daysMissed: number) {
    const previousStreak = streakData.value.currentStreak
    
    // Salvar dados antes de resetar
    streakData.value.missedDays = daysMissed - 1
    
    // Resetar ofensiva
    startNewStreak()
    
    // Bonus de retorno para ofensivas longas
    if (previousStreak >= 7) {
      streakData.value.comebackBonus = true
      
      // Pequena recompensa por voltar
      userProfileStore.addXP(25)
      userProfileStore.addTokens(5)
    }
  }

  function activateVacationMode(days: number): boolean {
    // Verificações
    if (days < 1 || days > 14) return false
    if (streakData.value.vacationMode?.active) return false
    if (streakData.value.currentStreak < 7) return false // Precisa ter pelo menos 7 dias
    
    const today = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days - 1)
    
    streakData.value.vacationMode = {
      active: true,
      startDate: today,
      endDate: endDate,
      daysUsed: days
    }
    
    saveStreak()
    return true
  }

  function deactivateVacationMode() {
    if (streakData.value.vacationMode) {
      streakData.value.vacationMode.active = false
      saveStreak()
    }
  }

  function applyStreakReward(reward: StreakReward) {
    userProfileStore.addXP(reward.xp)
    userProfileStore.addTokens(reward.tokens)
    
    // Pode adicionar conquistas especiais aqui
    if (reward.bonus) {
      // Notificar sobre o bônus especial
      console.log(`Bônus desbloqueado: ${reward.bonus}`)
    }
  }

  function updateVisit() {
    streakData.value.lastVisit = new Date()
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

  function resetStreak() {
    streakData.value = {
      currentStreak: 0,
      longestStreak: streakData.value.longestStreak, // Mantém o recorde
      lastVisit: null,
      streakStartDate: null,
      totalDaysPlayed: streakData.value.totalDaysPlayed, // Mantém total
      vacationMode: null,
      missedDays: 0,
      comebackBonus: false
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
    resetStreak
  }
})