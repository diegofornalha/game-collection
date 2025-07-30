import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Challenge, 
  ChallengeProgress, 
  ChallengeRule,
  GameContext
} from '@/types/gamification.types'
import { storageService } from '@/services/storage.service'
import { useUserProfileStore } from './userProfile.store'

export const useChallengesStore = defineStore('challenges', () => {
  // Stores relacionadas
  const userProfileStore = useUserProfileStore()
  // const gameStore = useGameStore() // Removido - não usado

  // Estado
  const challenges = ref<Challenge[]>([])
  const activeRules = ref<ChallengeRule[]>([])
  const challengeProgress = ref<Map<string, ChallengeProgress>>(new Map())

  // Regras modulares padrão
  const DEFAULT_RULES: ChallengeRule[] = [
    {
      id: 'no-undo',
      name: 'Sem Desfazer',
      type: 'noUndo',
      description: 'Complete sem usar o botão desfazer',
      multiplier: 1.5,
      validate: (context: GameContext) => (context.undoCount || context.undoUsed || 0) === 0
    },
    {
      id: 'no-hints',
      name: 'Sem Dicas',
      type: 'noHints',
      description: 'Complete sem usar dicas',
      multiplier: 1.3,
      validate: (context: GameContext) => context.hintsUsed === 0
    },
    {
      id: 'time-limit',
      name: 'Contra o Tempo',
      type: 'timeLimit',
      description: 'Complete em menos de X minutos',
      multiplier: 2.0,
      value: 300000, // 5 minutos padrão
      validate: (context: GameContext) => {
        const timeTaken = context.timeTaken || context.timeElapsed || 0
        return timeTaken < 300000
      }
    },
    {
      id: 'perfect-match',
      name: 'Combinações Perfeitas',
      type: 'perfectGame',
      description: 'Faça apenas combinações válidas',
      multiplier: 1.8,
      validate: (context: GameContext) => (context.wrongMatches || 0) === 0 || context.perfectGame === true
    },
    {
      id: 'speed-demon',
      name: 'Velocidade Máxima',
      type: 'speedRun',
      description: 'Média de menos de 3 segundos por combinação',
      multiplier: 1.6,
      validate: (context: GameContext) => {
        const matchCount = context.matchCount || 0
        const timeTaken = context.timeTaken || context.timeElapsed || 0
        if (matchCount === 0) return false
        return (timeTaken / matchCount) < 3000
      }
    },
    {
      id: 'combo-master',
      name: 'Mestre dos Combos',
      type: 'custom',
      description: 'Mantenha combo de pelo menos 5',
      multiplier: 1.7,
      value: 5,
      validate: (context: GameContext) => (context.maxCombo || 0) >= 5
    }
  ]

  // Desafios padrão
  const DEFAULT_CHALLENGES: Challenge[] = [
    {
      id: 'daily-simple',
      title: 'Desafio Diário Simples',
      description: 'Complete um jogo hoje',
      type: 'daily',
      rules: [],
      reward: { experience: 100, tokens: 10 },
      progress: 0,
      target: 1,
      expiresAt: getEndOfDay()
    },
    {
      id: 'daily-perfect',
      title: 'Perfeição Diária',
      description: 'Complete um jogo sem erros e sem desfazer',
      type: 'daily',
      rules: [
        DEFAULT_RULES.find(r => r.id === 'no-undo')!,
        DEFAULT_RULES.find(r => r.id === 'perfect-match')!
      ],
      reward: { experience: 300, tokens: 30 },
      progress: 0,
      target: 1,
      expiresAt: getEndOfDay()
    },
    {
      id: 'weekly-speedrun',
      title: 'Speedrun Semanal',
      description: 'Complete 5 jogos em menos de 3 minutos cada',
      type: 'weekly',
      rules: [DEFAULT_RULES.find(r => r.id === 'time-limit')!],
      reward: { experience: 1000, tokens: 100 },
      progress: 0,
      target: 5,
      expiresAt: getEndOfWeek()
    },
    {
      id: 'master-no-help',
      title: 'Mestre Independente',
      description: 'Complete 10 jogos sem usar dicas ou desfazer',
      type: 'achievement',
      rules: [
        DEFAULT_RULES.find(r => r.id === 'no-undo')!,
        DEFAULT_RULES.find(r => r.id === 'no-hints')!
      ],
      reward: { experience: 2000, tokens: 200, achievement: 'master-independent' },
      progress: 0,
      target: 10
    },
    {
      id: 'combo-legend',
      title: 'Lenda dos Combos',
      description: 'Alcance um combo de 10 em um único jogo',
      type: 'achievement',
      rules: [DEFAULT_RULES.find(r => r.id === 'combo-master')!],
      reward: { experience: 1500, tokens: 150, achievement: 'combo-legend' },
      progress: 0,
      target: 1
    }
  ]

  // Computed
  const activeChallenges = computed(() => {
    const now = new Date()
    return challenges.value.filter(c => {
      if (c.expiresAt && new Date(c.expiresAt) < now) return false
      
      const progress = challengeProgress.value.get(c.id)
      if (progress?.isCompleted) return false
      
      return true
    })
  })

  const dailyChallenges = computed(() => 
    activeChallenges.value.filter(c => c.type === 'daily')
  )

  const weeklyChallenges = computed(() => 
    activeChallenges.value.filter(c => c.type === 'weekly')
  )

  const specialChallenges = computed(() => 
    activeChallenges.value.filter(c => c.type === 'special')
  )

  const achievementChallenges = computed(() => 
    activeChallenges.value.filter(c => c.type === 'achievement')
  )

  // Métodos
  function initializeChallenges(userId: string) {
    // Carregar regras
    activeRules.value = [...DEFAULT_RULES]
    
    // Carregar desafios salvos
    const savedChallenges = storageService.getItem(`challenges_${userId}`) as Challenge[] | null
    const savedProgress = storageService.getItem(`challenge_progress_${userId}`) as [string, ChallengeProgress][] | null
    
    if (savedChallenges) {
      challenges.value = savedChallenges.map((c: any) => ({
        ...c,
        expiresAt: c.expiresAt ? new Date(c.expiresAt) : undefined
      }))
    } else {
      // Inicializar com desafios padrão
      challenges.value = [...DEFAULT_CHALLENGES]
    }
    
    if (savedProgress) {
      challengeProgress.value = new Map(savedProgress)
    }
    
    // Limpar desafios expirados e gerar novos diários/semanais se necessário
    refreshChallenges()
  }

  function addChallenge(challenge: Challenge) {
    const exists = challenges.value.some(c => c.id === challenge.id)
    
    if (!exists) {
      challenges.value.push(challenge)
      saveChallenges()
    }
  }

  function removeChallenge(challengeId: string) {
    const index = challenges.value.findIndex(c => c.id === challengeId)
    
    if (index !== -1) {
      challenges.value.splice(index, 1)
      challengeProgress.value.delete(challengeId)
      saveChallenges()
    }
  }

  function validateChallenge(challengeId: string, validation: GameContext): boolean {
    const challenge = challenges.value.find(c => c.id === challengeId)
    if (!challenge) return false
    
    // Verificar todas as regras do desafio
    for (const rule of challenge.rules) {
      if (!rule.validate(validation)) {
        return false
      }
    }
    
    return true
  }

  function completeChallenge(challengeId: string, validation: GameContext) {
    const challenge = challenges.value.find(c => c.id === challengeId)
    if (!challenge) return null
    
    // Validar desafio
    if (!validateChallenge(challengeId, validation)) {
      return null
    }
    
    // Atualizar progresso
    let progress = challengeProgress.value.get(challengeId)
    if (!progress) {
      progress = {
        challengeId,
        currentValue: 0,
        targetValue: challenge.target,
        isCompleted: false,
        lastUpdated: new Date()
      }
    }
    
    progress.currentValue = challenge.target
    progress.isCompleted = true
    progress.lastUpdated = new Date()
    
    challengeProgress.value.set(challengeId, progress)
    
    // Aplicar recompensas
    let totalXP = challenge.reward.experience || 0
    let totalTokens = challenge.reward.tokens || 0
    
    // Aplicar multiplicadores das regras
    for (const rule of challenge.rules) {
      if (rule.multiplier) {
        totalXP = Math.floor(totalXP * rule.multiplier)
        totalTokens = Math.floor(totalTokens * rule.multiplier)
      }
    }
    
    userProfileStore.addXP(totalXP)
    userProfileStore.addTokens(totalTokens)
    
    // Adicionar achievement se houver
    if (challenge.reward.achievement) {
      // Implementar sistema de achievements no userProfile
      console.log(`Achievement desbloqueado: ${challenge.reward.achievement}`)
    }
    
    saveChallenges()
    
    return {
      challenge,
      rewards: {
        xp: totalXP,
        tokens: totalTokens,
        achievement: challenge.reward.achievement
      }
    }
  }

  function updateChallengeProgress(challengeId: string, partialValidation: Partial<GameContext>) {
    const challenge = challenges.value.find(c => c.id === challengeId)
    if (!challenge) return
    
    // Para desafios que requerem múltiplas completions
    if (challenge.target > 1) {
      let progress = challengeProgress.value.get(challengeId)
      if (!progress) {
        progress = {
          challengeId,
          currentValue: 0,
          targetValue: challenge.target,
          isCompleted: false,
          lastUpdated: new Date()
        }
      }
      
      // Incrementar progresso parcial
      if (partialValidation.gameCompleted) {
        progress.currentValue = Math.min((progress.currentValue || 0) + 1, challenge.target)
        
        // Verificar se atingiu o requisito
        if (progress.currentValue >= challenge.target) {
          // Completar o desafio
          const fullValidation: GameContext = {
            gameWon: true,
            gameCompleted: true,
            movesCount: partialValidation.movesCount || 0,
            timeElapsed: partialValidation.timeElapsed || 0,
            timeTaken: partialValidation.timeTaken || 0,
            hintsUsed: partialValidation.hintsUsed || 0,
            undoUsed: partialValidation.undoUsed || 0,
            undoCount: partialValidation.undoCount || 0,
            score: partialValidation.score || 0,
            perfectGame: partialValidation.perfectGame || false,
            wrongMatches: partialValidation.wrongMatches || 0,
            matchCount: partialValidation.matchCount || 0,
            maxCombo: partialValidation.maxCombo || 0,
            metadata: partialValidation.metadata || {}
          }
          
          completeChallenge(challengeId, fullValidation)
        } else {
          challengeProgress.value.set(challengeId, progress)
          saveChallenges()
        }
      }
    }
  }

  function refreshChallenges() {
    const now = new Date()
    
    // Remover desafios expirados
    challenges.value = challenges.value.filter(c => {
      if (!c.expiresAt) return true
      return new Date(c.expiresAt) > now
    })
    
    // Verificar se precisa gerar novos desafios diários
    const hasDailyChallenge = challenges.value.some(c => 
      c.type === 'daily' && c.expiresAt && new Date(c.expiresAt) > now
    )
    
    if (!hasDailyChallenge) {
      generateDailyChallenges()
    }
    
    // Verificar desafios semanais
    const hasWeeklyChallenge = challenges.value.some(c => 
      c.type === 'weekly' && c.expiresAt && new Date(c.expiresAt) > now
    )
    
    if (!hasWeeklyChallenge) {
      generateWeeklyChallenges()
    }
    
    saveChallenges()
  }

  function generateDailyChallenges() {
    // Gerar 2-3 desafios diários aleatórios
    const dailyTemplates = [
      {
        title: 'Velocista do Dia',
        description: 'Complete 3 jogos em menos de 2 minutos cada',
        rules: [DEFAULT_RULES.find(r => r.id === 'time-limit')!],
        reward: { experience: 200, tokens: 20 },
        target: 3
      },
      {
        title: 'Sem Erros',
        description: 'Complete 2 jogos sem combinações erradas',
        rules: [DEFAULT_RULES.find(r => r.id === 'perfect-match')!],
        reward: { experience: 250, tokens: 25 },
        target: 2
      },
      {
        title: 'Combo Diário',
        description: 'Alcance um combo de 7 em qualquer jogo',
        rules: [DEFAULT_RULES.find(r => r.id === 'combo-master')!],
        reward: { experience: 180, tokens: 18 },
        target: 1
      }
    ]
    
    // Selecionar aleatoriamente
    const selected = dailyTemplates[Math.floor(Math.random() * dailyTemplates.length)]
    
    const dailyChallenge: Challenge = {
      id: `daily-${Date.now()}`,
      ...selected,
      type: 'daily',
      progress: 0,
      expiresAt: getEndOfDay()
    }
    
    addChallenge(dailyChallenge)
  }

  function generateWeeklyChallenges() {
    // Gerar 1-2 desafios semanais
    const weeklyChallenge: Challenge = {
      id: `weekly-${Date.now()}`,
      title: 'Maratona Semanal',
      description: 'Complete 20 jogos esta semana',
      type: 'weekly',
      rules: [],
      reward: { experience: 1500, tokens: 150 },
      progress: 0,
      target: 20,
      expiresAt: getEndOfWeek()
    }
    
    addChallenge(weeklyChallenge)
  }

  function addCustomRule(rule: ChallengeRule) {
    const exists = activeRules.value.some(r => r.id === rule.id)
    
    if (!exists) {
      activeRules.value.push(rule)
    }
  }

  // Helpers
  function getEndOfDay(): Date {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return end
  }

  function getEndOfWeek(): Date {
    const end = new Date()
    const dayOfWeek = end.getDay()
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek
    
    end.setDate(end.getDate() + daysUntilSunday)
    end.setHours(23, 59, 59, 999)
    
    return end
  }

  // Persistência
  function saveChallenges() {
    const userId = userProfileStore.profile.id
    storageService.setItem(`challenges_${userId}`, challenges.value)
    storageService.setItem(`challenge_progress_${userId}`, 
      Array.from(challengeProgress.value.entries())
    )
  }

  // Gerar desafios diários - removido (já existe acima)

  return {
    // Estado
    challenges,
    activeRules,
    challengeProgress,
    
    // Computed
    activeChallenges,
    dailyChallenges,
    weeklyChallenges,
    specialChallenges,
    achievementChallenges,
    
    // Métodos
    initializeChallenges,
    addChallenge,
    removeChallenge,
    validateChallenge,
    completeChallenge,
    updateChallengeProgress,
    updateProgress: updateChallengeProgress, // Alias para compatibilidade
    refreshChallenges,
    addCustomRule,
    generateDailyChallenges: refreshChallenges
  }
})