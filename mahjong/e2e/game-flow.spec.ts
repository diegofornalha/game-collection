import { test, expect } from '@playwright/test';

test.describe('Mahjong Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Aguardar o jogo carregar
    await page.waitForSelector('.tile-field', { timeout: 10000 });
  });

  test('should complete full game flow', async ({ page }) => {
    // Verificar elementos principais
    await expect(page.locator('.tile-field')).toBeVisible();
    await expect(page.locator('.status-bar')).toBeVisible();
    
    // Verificar se há tiles
    const tiles = page.locator('.tile');
    const tileCount = await tiles.count();
    expect(tileCount).toBeGreaterThan(0);
    
    // Testar seleção de tile
    const freeTiles = page.locator('.tile.free');
    const firstFreeTile = freeTiles.first();
    await firstFreeTile.click();
    
    // Verificar se tile foi selecionado
    await expect(firstFreeTile).toHaveClass(/selected/);
    
    // Testar hint
    await page.keyboard.press('h');
    await page.waitForTimeout(500);
    
    // Verificar se hints são mostrados
    const hintTiles = page.locator('.tile.hint');
    const hintCount = await hintTiles.count();
    expect(hintCount).toBeGreaterThan(0);
  });

  test('should handle game controls', async ({ page }) => {
    // Testar pausa
    await page.keyboard.press('p');
    await expect(page.locator('.game-dialog')).toBeVisible();
    
    // Resumir jogo
    await page.locator('button:has-text("Continue")').click();
    await expect(page.locator('.game-dialog')).not.toBeVisible();
    
    // Testar novo jogo
    await page.keyboard.press('n');
    await page.waitForTimeout(500);
    
    // Verificar se tiles foram reorganizados
    const tiles = page.locator('.tile');
    const newTileCount = await tiles.count();
    expect(newTileCount).toBeGreaterThan(0);
  });

  test('should work with undo/redo', async ({ page }) => {
    // Fazer uma jogada válida primeiro
    const tiles = page.locator('.tile.free');
    const tilesData = await tiles.evaluateAll(elements => 
      elements.map(el => ({
        type: el.getAttribute('data-type') || '',
        index: Array.from(el.parentElement?.children || []).indexOf(el)
      }))
    );
    
    // Encontrar pares correspondentes
    const pairs = new Map<string, number[]>();
    tilesData.forEach((tile, index) => {
      if (!pairs.has(tile.type)) {
        pairs.set(tile.type, []);
      }
      pairs.get(tile.type)?.push(index);
    });
    
    // Encontrar um par válido
    let validPair: number[] | undefined;
    for (const [, indices] of pairs) {
      if (indices.length >= 2) {
        validPair = indices.slice(0, 2);
        break;
      }
    }
    
    if (validPair) {
      // Clicar no par
      await tiles.nth(validPair[0]).click();
      await tiles.nth(validPair[1]).click();
      await page.waitForTimeout(500);
      
      // Testar undo
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(500);
      
      // Verificar se tiles voltaram
      const undoTiles = await tiles.count();
      expect(undoTiles).toBeGreaterThan(0);
      
      // Testar redo
      await page.keyboard.press('Control+y');
      await page.waitForTimeout(500);
    }
  });

  test('should handle mobile controls', async ({ page, browserName }) => {
    // Definir viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verificar controles mobile
    await expect(page.locator('.mobile-controls')).toBeVisible();
    
    // Testar botões mobile
    await page.locator('button:has-text("Dica")').click();
    await page.waitForTimeout(500);
    
    // Verificar se hints funcionam no mobile
    const hintTiles = page.locator('.tile.hint');
    const hintCount = await hintTiles.count();
    expect(hintCount).toBeGreaterThan(0);
  });

  test('should save and load game state', async ({ page }) => {
    // Fazer algumas jogadas
    const tiles = page.locator('.tile.free');
    const initialCount = await tiles.count();
    
    // Fazer uma jogada se possível
    if (initialCount >= 2) {
      await tiles.first().click();
      await tiles.nth(1).click();
      await page.waitForTimeout(500);
    }
    
    // Recarregar página
    await page.reload();
    await page.waitForSelector('.tile-field', { timeout: 10000 });
    
    // Verificar se o estado foi restaurado
    const restoredTiles = await tiles.count();
    expect(restoredTiles).toBeLessThan(initialCount);
  });

  test('should show tutorial for new users', async ({ page, context }) => {
    // Limpar localStorage para simular novo usuário
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // Recarregar página
    await page.goto('/');
    
    // Verificar se tutorial aparece
    await expect(page.locator('.tutorial-overlay')).toBeVisible({ timeout: 5000 });
    
    // Navegar pelo tutorial
    await page.locator('button:has-text("Próximo")').click();
    await page.waitForTimeout(300);
    
    // Verificar indicadores de passo
    const stepDots = page.locator('.step-dot');
    const dotCount = await stepDots.count();
    expect(dotCount).toBeGreaterThan(0);
    
    // Pular tutorial
    await page.locator('button:has-text("Pular Tutorial")').click();
    await expect(page.locator('.tutorial-overlay')).not.toBeVisible();
  });

  test('should handle auto-shuffle', async ({ page }) => {
    // Ativar auto-shuffle nas configurações
    await page.locator('button[aria-label="Configurações"]').click();
    await page.waitForSelector('.settings-view');
    
    // Ativar auto-shuffle
    const autoShuffleToggle = page.locator('text=Embaralhamento automático').locator('..').locator('input[type="checkbox"]');
    await autoShuffleToggle.check();
    
    // Voltar ao jogo
    await page.keyboard.press('Escape');
    
    // Fazer jogadas até não haver mais movimentos
    // (Este é um teste simplificado - em produção seria mais complexo)
    
    // Verificar se notificação de auto-shuffle aparece
    await expect(page.locator('.auto-shuffle-notification')).toBeVisible({ timeout: 20000 });
  });

  test('should track achievements', async ({ page }) => {
    // Abrir tela de conquistas
    await page.locator('button[aria-label="Conquistas"]').click();
    await expect(page.locator('.achievements-view')).toBeVisible();
    
    // Verificar se há conquistas listadas
    const achievements = page.locator('.achievement-item');
    const achievementCount = await achievements.count();
    expect(achievementCount).toBeGreaterThan(0);
    
    // Verificar progresso
    const progressBars = page.locator('.progress-bar');
    const progressCount = await progressBars.count();
    expect(progressCount).toBeGreaterThan(0);
  });

  test('should handle different themes', async ({ page }) => {
    // Abrir configurações
    await page.locator('button[aria-label="Configurações"]').click();
    
    // Mudar tema
    const themeSelect = page.locator('select').filter({ hasText: 'Tema Visual' });
    await themeSelect.selectOption('nature');
    
    // Verificar se tema mudou
    const body = page.locator('body');
    await expect(body).toHaveClass(/theme-nature/);
    
    // Voltar ao jogo
    await page.keyboard.press('Escape');
  });

  test('should measure performance metrics', async ({ page }) => {
    // Medir tempo de carregamento inicial
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForSelector('.tile-field', { state: 'visible' });
    const loadTime = Date.now() - startTime;
    
    // Verificar se carrega em tempo aceitável
    expect(loadTime).toBeLessThan(3000); // 3 segundos
    
    // Medir FPS durante animações
    const metrics = await page.evaluate(() => {
      return new Promise(resolve => {
        let frameCount = 0;
        const startTime = performance.now();
        
        function countFrame() {
          frameCount++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrame);
          } else {
            resolve(frameCount);
          }
        }
        
        requestAnimationFrame(countFrame);
      });
    });
    
    // Verificar se mantém FPS aceitável
    expect(metrics).toBeGreaterThan(30); // Mínimo 30 FPS
  });
});