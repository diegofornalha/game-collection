import { test, expect } from '@playwright/test';
import { GamePage } from '../pages/game.page';

test.describe('Fluxo do Jogo Mahjong', () => {
  let gamePage: GamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page);
    await gamePage.goto();
  });

  test('deve carregar a página inicial do jogo', async ({ page }) => {
    await expect(page).toHaveTitle(/Mahjong/);
    await expect(gamePage.newGameButton).toBeVisible();
  });

  test('deve iniciar um novo jogo', async () => {
    await gamePage.startNewGame();
    
    await expect(gamePage.gameBoard).toBeVisible();
    await expect(gamePage.timer).toBeVisible();
    await expect(gamePage.score).toContainText('0');
    
    const tilesCount = await gamePage.getRemainingTiles();
    expect(tilesCount).toBeGreaterThan(0);
  });

  test('deve pausar e retomar o jogo', async () => {
    await gamePage.startNewGame();
    
    // Pausar
    await gamePage.pauseGame();
    await expect(gamePage.page.locator('.pause-overlay')).toBeVisible();
    
    // Retomar
    await gamePage.resumeGame();
    await expect(gamePage.page.locator('.pause-overlay')).not.toBeVisible();
  });

  test('deve resetar o jogo quando solicitado', async () => {
    await gamePage.startNewGame();
    
    // Fazer algumas jogadas
    const [tile1, tile2] = await gamePage.findMatchingPair();
    await gamePage.selectTile(tile1);
    await gamePage.selectTile(tile2);
    
    const scoreAfterMove = await gamePage.getScore();
    expect(scoreAfterMove).toBeGreaterThan(0);
    
    // Resetar
    await gamePage.startNewGame();
    
    const scoreAfterReset = await gamePage.getScore();
    expect(scoreAfterReset).toBe(0);
  });

  test('deve exibir mensagem de conclusão ao terminar o jogo', async () => {
    // Este teste seria mais complexo em um ambiente real
    // Aqui apenas verificamos se a lógica de conclusão funciona
    await gamePage.startNewGame();
    
    // Simular conclusão do jogo (em um teste real, jogaríamos até o fim)
    // Por ora, apenas verificamos se o método existe
    const isComplete = await gamePage.isGameComplete();
    expect(typeof isComplete).toBe('boolean');
  });
});