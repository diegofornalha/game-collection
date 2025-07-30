import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile, UserAchievement, UserStats } from '@/types/gamification.types'
import { storageService } from '@/services/storage.service'

export const useUserProfileStore = defineStore('userProfile', () => {
  // Estado
  const profile = ref<UserProfile>({
    id: '',
    username: 'Jogador',
    avatar: 'default',
    level: 1,
    experiencePoints: 0,
    totalExperience: 0,
    tokens: 0,
    achievements: [],
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
      totalTimePlayed: 0,
      averageGameTime: 0,
      bestTime: undefined,
      currentStreak: 0,
      longestStreak: 0
    },
    preferences: {
      theme: 'light',
      soundEnabled: true,
      animationSpeed: 'normal',
      notifications: true,
      language: 'pt-BR'
    },
    createdAt: new Date(),
    lastLoginAt: new Date()
  })

  // Computed
  const xpForNextLevel = computed(() => {
    // Fórmula de progressão: 100 * level * 1.5
    return Math.floor(100 * profile.value.level * 1.5)
  })

  const xpProgress = computed(() => {
    const needed = xpForNextLevel.value
    return (profile.value.experiencePoints / needed) * 100
  })

  const winRate = computed(() => {
    const { gamesPlayed, gamesWon } = profile.value.stats
    if (gamesPlayed === 0) return 0
    return Math.round((gamesWon / gamesPlayed) * 100)
  })

  const unlockedAchievements = computed(() => {
    return profile.value.achievements.filter(a => a.unlockedAt !== undefined)
  })

  // Métodos
  function initializeProfile(userId: string) {
    const savedProfile = storageService.getItem(`profile_${userId}`) as UserProfile | null
    
    if (savedProfile) {
      profile.value = {
        ...savedProfile,
        createdAt: new Date(savedProfile.createdAt),
        lastLoginAt: new Date(savedProfile.lastLoginAt)
      }
    } else {
      profile.value.id = userId
      profile.value.createdAt = new Date()
      saveProfile()
    }
  }

  function updateProfile(updates: Partial<UserProfile>) {
    profile.value = {
      ...profile.value,
      ...updates,
      lastLoginAt: new Date()
    }
    saveProfile()
  }

  function addXP(amount: number) {
    profile.value.experiencePoints += amount
    profile.value.totalExperience += amount

    // Verificar level up
    while (profile.value.experiencePoints >= xpForNextLevel.value) {
      profile.value.experiencePoints -= xpForNextLevel.value
      profile.value.level++
      
      // Recompensa por level up
      addTokens(10 * profile.value.level)
    }

    saveProfile()
  }

  function addTokens(amount: number) {
    profile.value.tokens += amount
    saveProfile()
  }

  function spendTokens(amount: number): boolean {
    if (profile.value.tokens >= amount) {
      profile.value.tokens -= amount
      saveProfile()
      return true
    }
    return false
  }

  function updateStats(statUpdates: Partial<UserStats>) {
    profile.value.stats = {
      ...profile.value.stats,
      ...statUpdates
    }

    // Recalcular tempo médio
    if (statUpdates.totalTimePlayed !== undefined && profile.value.stats.gamesPlayed > 0) {
      profile.value.stats.averageGameTime = Math.floor(
        profile.value.stats.totalTimePlayed / profile.value.stats.gamesPlayed
      )
    }

    saveProfile()
  }

  function unlockAchievement(achievementId: string) {
    const achievement = profile.value.achievements.find(a => a.id === achievementId)
    
    if (achievement && !achievement.unlockedAt) {
      achievement.unlockedAt = new Date()
      achievement.progress = achievement.target || achievement.maxProgress || 1
      
      // Recompensas por conquista
      if (achievement.rewards) {
        if (achievement.rewards.experience) addXP(achievement.rewards.experience)
        if (achievement.rewards.tokens) addTokens(achievement.rewards.tokens)
      }
      
      saveProfile()
      return achievement
    }
    
    return null
  }

  function updateAchievementProgress(achievementId: string, progress: number) {
    const achievement = profile.value.achievements.find(a => a.id === achievementId)
    
    if (achievement && !achievement.unlockedAt) {
      achievement.progress = Math.min(progress, achievement.target || achievement.maxProgress || 1)
      
      // Verificar se foi completada
      if (achievement.progress >= (achievement.maxProgress || 1)) {
        return unlockAchievement(achievementId)
      }
      
      saveProfile()
    }
    
    return null
  }

  function addAchievement(achievement: UserAchievement) {
    const exists = profile.value.achievements.some(a => a.id === achievement.id)
    
    if (!exists) {
      profile.value.achievements.push({
        ...achievement,
        progress: 0,
        unlockedAt: undefined
      })
      saveProfile()
    }
  }

  function resetProfile() {
    const id = profile.value.id
    profile.value = {
      id,
      username: 'Jogador',
      avatar: 'default',
      level: 1,
      experiencePoints: 0,
      totalExperience: 0,
      tokens: 0,
      achievements: [],
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        winRate: 0,
        totalTimePlayed: 0,
        averageGameTime: 0,
        bestTime: undefined,
        currentStreak: 0,
        longestStreak: 0
      },
      preferences: {
        theme: 'light',
        soundEnabled: true,
        animationSpeed: 'normal',
        notifications: true,
        language: 'pt-BR'
      },
      createdAt: new Date(),
      lastLoginAt: new Date()
    }
    saveProfile()
  }

  // Persistência
  function saveProfile() {
    storageService.setItem(`profile_${profile.value.id}`, profile.value)
  }

  // Getters de conveniência
  const username = computed(() => profile.value.username)
  const level = computed(() => profile.value.level)

  return {
    // Estado
    profile,
    
    // Computed
    xpForNextLevel,
    xpProgress,
    winRate,
    unlockedAchievements,
    username,
    level,
    
    // Getters para compatibilidade de componentes
    nextLevelExperience: xpForNextLevel,
    experiencePoints: computed(() => profile.value.experiencePoints),
    tokens: computed(() => profile.value.tokens),
    
    // Métodos
    initializeProfile,
    updateProfile,
    addXP,
    addTokens,
    spendTokens,
    updateStats,
    unlockAchievement,
    updateAchievementProgress,
    addAchievement,
    resetProfile
  }
})