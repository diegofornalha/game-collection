import { test, expect } from '@playwright/test';
import { GamePage } from '../pages/game.page';

test.describe('Mecânica de Combinação de Peças', () => {
  let gamePage: GamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page);
    await gamePage.goto();
    await gamePage.startNewGame();
  });

  test('deve selecionar e destacar peça ao clicar', async ({ page }) => {
    const tile = await page.locator('.tile:not(.blocked)').first();
    await tile.click();
    
    await expect(tile).toHaveClass(/selected/);
  });

  test('deve combinar peças iguais válidas', async () => {
    const initialScore = await gamePage.getScore();
    const initialTileCount = await gamePage.getRemainingTiles();
    
    const [tile1, tile2] = await gamePage.findMatchingPair();
    await gamePage.selectTile(tile1);
    await gamePage.selectTile(tile2);
    
    // Verificar se as peças foram removidas
    await expect(tile1).toHaveClass(/matched/);
    await expect(tile2).toHaveClass(/matched/);
    
    // Verificar atualização da pontuação
    const newScore = await gamePage.getScore();
    expect(newScore).toBeGreaterThan(initialScore);
    
    // Verificar redução no número de peças
    const newTileCount = await gamePage.getRemainingTiles();
    expect(newTileCount).toBe(initialTileCount - 2);
  });

  test('não deve combinar peças diferentes', async ({ page }) => {
    // Encontrar duas peças diferentes
    const tiles = await page.locator('.tile:not(.blocked)').all();
    let tile1, tile2;
    
    for (let i = 0; i < tiles.length - 1; i++) {
      const value1 = await tiles[i].getAttribute('data-value');
      const value2 = await tiles[i + 1].getAttribute('data-value');
      
      if (value1 !== value2) {
        tile1 = tiles[i];
        tile2 = tiles[i + 1];
        break;
      }
    }
    
    if (tile1 && tile2) {
      await tile1.click();
      await tile2.click();
      
      // Peças não devem ser removidas
      await expect(tile1).not.toHaveClass(/matched/);
      await expect(tile2).not.toHaveClass(/matched/);
    }
  });

  test('não deve permitir seleção de peça bloqueada', async ({ page }) => {
    // Procurar uma peça bloqueada (geralmente no meio da pilha)
    const blockedTile = await page.locator('.tile.blocked').first();
    
    if (await blockedTile.count() > 0) {
      await blockedTile.click({ force: true });
      await expect(blockedTile).not.toHaveClass(/selected/);
    }
  });

  test('deve desfazer última jogada', async () => {
    const initialTileCount = await gamePage.getRemainingTiles();
    
    // Fazer uma jogada
    const [tile1, tile2] = await gamePage.findMatchingPair();
    await gamePage.selectTile(tile1);
    await gamePage.selectTile(tile2);
    
    // Verificar que as peças foram removidas
    const afterMoveTileCount = await gamePage.getRemainingTiles();
    expect(afterMoveTileCount).toBe(initialTileCount - 2);
    
    // Desfazer
    await gamePage.undoMove();
    
    // Verificar que as peças voltaram
    const afterUndoTileCount = await gamePage.getRemainingTiles();
    expect(afterUndoTileCount).toBe(initialTileCount);
  });

  test('deve mostrar dica quando solicitado', async ({ page }) => {
    await gamePage.useHint();
    
    // Verificar se duas peças foram destacadas como dica
    const hintedTiles = await page.locator('.tile.hint').count();
    expect(hintedTiles).toBe(2);
    
    // Verificar se são peças válidas para combinar
    const hintTiles = await page.locator('.tile.hint').all();
    if (hintTiles.length === 2) {
      const value1 = await hintTiles[0].getAttribute('data-value');
      const value2 = await hintTiles[1].getAttribute('data-value');
      expect(value1).toBe(value2);
    }
  });
});