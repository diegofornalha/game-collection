// Initialize gamification stores with default data
import { useUserProfileStore } from './gamification/userProfile.store';
import { useDailyStreakStore } from './gamification/dailyStreak.store';
import { useChallengesStore } from './gamification/challenges.store';
import { useGameStore } from './game.store';

export function initializeGamificationStores() {
  const userProfile = useUserProfileStore();
  const dailyStreak = useDailyStreakStore();
  const challenges = useChallengesStore();
  const gameStore = useGameStore();

  // Initialize user profile with default data
  if (!userProfile.username) {
    userProfile.updateProfile({
      username: 'Jogador',
      avatar: '/avatars/default.png'
    });
  }

  // Check daily streak on initialization
  dailyStreak.checkStreak();

  // Generate daily challenges if needed
  challenges.generateDailyChallenges();

  // Subscribe to game events for challenge progress
  gameStore.$subscribe((mutation, state) => {
    // Update challenges when game state changes
    if (state.isGameComplete) {
      // Validar todos os desafios ativos
      const gameContext = {
        gameWon: state.tiles.filter(t => t.active).length === 0,
        movesCount: state.history.length,
        timeElapsed: state.timer,
        hintsUsed: state.hintsUsed || 0,
        undoUsed: state.undoCount || 0,
        score: state.score,
        perfectGame: state.hintsUsed === 0 && state.undoCount === 0
      };
      
      challenges.activeChallenges.forEach(challenge => {
        challenges.validateChallenge(challenge.id, gameContext);
      });
    }
  });

  console.log('🎮 Gamification system initialized!');
  console.log('👤 User:', userProfile.username, 'Level:', userProfile.level);
  console.log('🔥 Streak:', dailyStreak.currentStreak, 'days');
  console.log('🎯 Active challenges:', challenges.activeChallenges.length);
}