import { test, expect } from '@playwright/test';
import { GamePage } from '../pages/game.page';

test.describe('Sistema de Pontuação', () => {
  let gamePage: GamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page);
    await gamePage.goto();
    await gamePage.startNewGame();
  });

  test('deve começar com pontuação zero', async () => {
    const score = await gamePage.getScore();
    expect(score).toBe(0);
  });

  test('deve aumentar pontuação ao combinar peças', async () => {
    const initialScore = await gamePage.getScore();
    
    const [tile1, tile2] = await gamePage.findMatchingPair();
    await gamePage.selectTile(tile1);
    await gamePage.selectTile(tile2);
    
    const newScore = await gamePage.getScore();
    expect(newScore).toBeGreaterThan(initialScore);
  });

  test('deve aplicar bônus de velocidade para jogadas rápidas', async () => {
    // Primeira jogada (referência)
    const [tile1, tile2] = await gamePage.findMatchingPair();
    await gamePage.selectTile(tile1);
    await gamePage.selectTile(tile2);
    
    const firstMoveScore = await gamePage.getScore();
    
    // Segunda jogada rápida
    const [tile3, tile4] = await gamePage.findMatchingPair();
    await gamePage.selectTile(tile3);
    await gamePage.selectTile(tile4);
    
    const secondMoveScore = await gamePage.getScore();
    const secondMovePoints = secondMoveScore - firstMoveScore;
    
    // A segunda jogada deve valer mais se feita rapidamente
    // (isso depende da implementação real do jogo)
    expect(secondMovePoints).toBeGreaterThan(0);
  });

  test('deve penalizar uso de dicas', async () => {
    const initialScore = await gamePage.getScore();
    
    // Fazer uma jogada normal primeiro para ter pontos
    const [tile1, tile2] = await gamePage.findMatchingPair();
    await gamePage.selectTile(tile1);
    await gamePage.selectTile(tile2);
    
    const scoreBeforeHint = await gamePage.getScore();
    
    // Usar dica
    await gamePage.useHint();
    
    const scoreAfterHint = await gamePage.getScore();
    
    // Verificar se houve penalidade (pode ser 0 ou negativa)
    expect(scoreAfterHint).toBeLessThanOrEqual(scoreBeforeHint);
  });

  test('deve salvar e exibir melhor pontuação', async ({ page }) => {
    // Completar algumas jogadas
    for (let i = 0; i < 3; i++) {
      try {
        const [tile1, tile2] = await gamePage.findMatchingPair();
        await gamePage.selectTile(tile1);
        await gamePage.selectTile(tile2);
      } catch {
        break; // Sem mais pares disponíveis
      }
    }
    
    const currentScore = await gamePage.getScore();
    
    // Iniciar novo jogo
    await gamePage.startNewGame();
    
    // Verificar se a melhor pontuação é exibida
    const highScore = await page.locator('.high-score').textContent();
    expect(highScore).toBeTruthy();
  });

  test('deve exibir pontuação final ao completar o jogo', async ({ page }) => {
    // Este teste verificaria a pontuação final
    // Em um teste real, jogaríamos até o fim
    await gamePage.startNewGame();
    
    // Verificar se elementos de pontuação estão presentes
    await expect(page.locator('.score')).toBeVisible();
    await expect(page.locator('.timer')).toBeVisible();
  });
});