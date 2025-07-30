// Initialize gamification stores with default data
import { useUserProfileStore } from './gamification/userProfile.store';
import { useDailyStreakStore } from './gamification/dailyStreak.store';
import { useChallengesStore } from './gamification/challenges.store';
import { useGameStore } from './game.store';
import type { GameContext, ChallengeValidation } from '../types/gamification.types';

export function initializeGamificationStores() {
  const userProfile = useUserProfileStore();
  const dailyStreak = useDailyStreakStore();
  const challenges = useChallengesStore();
  const gameStore = useGameStore();

  // Initialize user profile with default data
  if (!userProfile.username || userProfile.username === 'Guest') {
    // Adicionar alguns dados de demonstração para primeira vez
    userProfile.addXP(250); // Começar com alguma experiência
    userProfile.addTokens(100); // Tokens iniciais
  }

  // Check daily streak on initialization
  dailyStreak.checkAndUpdateStreak();

  // Generate daily challenges if needed
  challenges.generateDailyChallenges();

  // Subscribe to game events for challenge progress
  let gameStarted = false;
  
  gameStore.$subscribe((_mutation, state) => {
    // Detectar início de jogo (primeiro movimento)
    if (!gameStarted && state.history && state.history.length === 1) {
      gameStarted = true;
      
      // Verificar streak quando inicia o jogo
      dailyStreak.checkAndUpdateStreak();
      
      // Notificar sobre streak ativo
      if (dailyStreak.isStreakActive) {
        console.log(`🔥 Ofensiva de ${dailyStreak.streakData.currentStreak} dias mantida!`);
        
        // Verificar se há milestone de streak
        const currentStreak = dailyStreak.streakData.currentStreak;
        const milestone = dailyStreak.STREAK_REWARDS.find(r => r.day === currentStreak);
        if (milestone && milestone.tokens && milestone.xp) {
          userProfile.addTokens(milestone.tokens);
          userProfile.addXP(milestone.xp);
          console.log(`🎁 Recompensa de ${milestone.day} dias coletada!`);
        }
      }
    }
    
    // Resetar flag quando jogo termina
    if (state.isGameComplete && gameStarted) {
      gameStarted = false;
      
      // Validar todos os desafios ativos
      const gameContext: GameContext = {
        gameWon: state.tiles.filter(t => t.active).length === 0,
        movesCount: state.history?.length || 0,
        timeElapsed: state.timer,
        hintsUsed: state.hintsUsed || 0,
        undoUsed: state.undoCount || 0,
        score: state.score,
        perfectGame: (state.hintsUsed || 0) === 0 && (state.undoCount || 0) === 0
      };
      
      challenges.activeChallenges.forEach(challenge => {
        const validation: ChallengeValidation = gameContext;
        const isValid = challenges.validateChallenge(challenge.id, validation);
        if (isValid) {
          challenges.completeChallenge(challenge.id, validation);
          
          // Adicionar recompensas
          userProfile.addTokens(challenge.reward.tokens || 0);
          userProfile.addXP(challenge.reward.experience || 0);
          console.log(`✅ Desafio "${challenge.title}" completado!`);
        }
      });
    }
  });

  console.log('🎮 Sistema de gamificação inicializado!');
  console.log('👤 Usuário:', userProfile.username, 'Nível:', userProfile.level);
  console.log('🔥 Ofensiva:', dailyStreak.streakData.currentStreak, 'dias');
  console.log('🎯 Desafios ativos:', challenges.activeChallenges.length);
  console.log('💰 Tokens:', userProfile.tokens);
  console.log('⭐ XP:', userProfile.experiencePoints, '/', userProfile.nextLevelExperience);
}