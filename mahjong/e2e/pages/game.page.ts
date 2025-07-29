import { Page, Locator } from '@playwright/test';

export class GamePage {
  readonly page: Page;
  readonly gameBoard: Locator;
  readonly timer: Locator;
  readonly score: Locator;
  readonly newGameButton: Locator;
  readonly pauseButton: Locator;
  readonly hintButton: Locator;
  readonly undoButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.gameBoard = page.locator('.game-board');
    this.timer = page.locator('.timer');
    this.score = page.locator('.score');
    this.newGameButton = page.getByRole('button', { name: 'New Game' });
    this.pauseButton = page.getByRole('button', { name: 'Pause' });
    this.hintButton = page.getByRole('button', { name: 'Hint' });
    this.undoButton = page.getByRole('button', { name: 'Undo' });
  }

  async goto() {
    await this.page.goto('/');
  }

  async startNewGame() {
    await this.newGameButton.click();
    await this.gameBoard.waitFor({ state: 'visible' });
  }

  async getTile(index: number): Promise<Locator> {
    return this.page.locator(`.tile[data-index="${index}"]`);
  }

  async findMatchingPair(): Promise<[Locator, Locator]> {
    // Busca por peças com o mesmo valor que estejam disponíveis para jogar
    const tiles = await this.page.locator('.tile:not(.matched):not(.blocked)').all();
    
    for (let i = 0; i < tiles.length; i++) {
      const tile1Value = await tiles[i].getAttribute('data-value');
      
      for (let j = i + 1; j < tiles.length; j++) {
        const tile2Value = await tiles[j].getAttribute('data-value');
        
        if (tile1Value === tile2Value) {
          return [tiles[i], tiles[j]];
        }
      }
    }
    
    throw new Error('Nenhum par disponível encontrado');
  }

  async selectTile(tile: Locator) {
    await tile.click();
    await tile.waitFor({ state: 'attached' });
  }

  async getScore(): Promise<number> {
    const scoreText = await this.score.textContent();
    return parseInt(scoreText || '0', 10);
  }

  async getTime(): Promise<string> {
    return await this.timer.textContent() || '00:00';
  }

  async pauseGame() {
    await this.pauseButton.click();
  }

  async resumeGame() {
    await this.page.getByRole('button', { name: 'Resume' }).click();
  }

  async useHint() {
    await this.hintButton.click();
  }

  async undoMove() {
    await this.undoButton.click();
  }

  async isGameComplete(): Promise<boolean> {
    const completionMessage = await this.page.locator('.game-complete-message').isVisible();
    return completionMessage;
  }

  async getRemainingTiles(): Promise<number> {
    const tiles = await this.page.locator('.tile:not(.matched)').count();
    return tiles;
  }
}