import { MjTile, MjTileType } from '@/models/tile.model';

interface WorkerMessage {
  id: string;
  type: 'shuffle' | 'validate' | 'solve' | 'pathfind';
  data: any;
}

interface WorkerResponse {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
}

class GameWorkerService {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: number;
  }>();

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker() {
    try {
      // Criar worker inline para evitar problemas de path
      const workerCode = `
        // Fisher-Yates shuffle optimizado
        function shuffleTiles(tiles, attempts = 100) {
          let bestConfiguration = null;
          let bestScore = -1;
          
          for (let attempt = 0; attempt < attempts; attempt++) {
            const shuffled = [...tiles];
            
            // Shuffle Fisher-Yates
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            
            // Score configuration (quantidade de pares disponíveis)
            const score = calculateAvailablePairs(shuffled);
            
            if (score > bestScore) {
              bestScore = score;
              bestConfiguration = shuffled;
            }
            
            // Early exit se encontrou configuração ótima
            if (score >= Math.floor(tiles.length / 4)) {
              break;
            }
            
            // Yield para não bloquear thread
            if (attempt % 10 === 0) {
              self.postMessage({ type: 'progress', progress: attempt / attempts });
            }
          }
          
          return bestConfiguration || tiles;
        }
        
        function calculateAvailablePairs(tiles) {
          const freeTiles = tiles.filter(t => t.isFree);
          let pairs = 0;
          
          for (let i = 0; i < freeTiles.length - 1; i++) {
            for (let j = i + 1; j < freeTiles.length; j++) {
              if (tilesMatch(freeTiles[i], freeTiles[j])) {
                pairs++;
              }
            }
          }
          
          return pairs;
        }
        
        function tilesMatch(tile1, tile2) {
          if (!tile1.type || !tile2.type) return false;
          
          if (tile1.type.group === tile2.type.group) {
            return tile1.type.matchAny || tile1.type.index === tile2.type.index;
          }
          
          return false;
        }
        
        // Validação de solvabilidade
        function validateSolvability(tiles) {
          const typeCounts = new Map();
          
          tiles.forEach(tile => {
            if (tile.type) {
              const key = tile.type.matchAny 
                ? \`\${tile.type.group}-any\` 
                : \`\${tile.type.group}-\${tile.type.index}\`;
              typeCounts.set(key, (typeCounts.get(key) || 0) + 1);
            }
          });
          
          // Verificar se todos os tipos têm contagem par
          for (const [key, count] of typeCounts) {
            if (key.endsWith('-any')) {
              // Tipos matchAny podem ter qualquer contagem par no grupo
              continue;
            } else if (count % 2 !== 0) {
              return false;
            }
          }
          
          return true;
        }
        
        // Pathfinding para hints
        function findBestHintPath(tiles) {
          const freeTiles = tiles.filter(t => t.isFree);
          const pairs = [];
          
          for (let i = 0; i < freeTiles.length - 1; i++) {
            for (let j = i + 1; j < freeTiles.length; j++) {
              if (tilesMatch(freeTiles[i], freeTiles[j])) {
                // Calcular score baseado na posição e dificuldade
                const score = calculatePairScore(freeTiles[i], freeTiles[j], tiles);
                pairs.push({
                  tile1: freeTiles[i],
                  tile2: freeTiles[j],
                  score
                });
              }
            }
          }
          
          // Retornar o melhor par (mais fácil de acessar)
          pairs.sort((a, b) => b.score - a.score);
          return pairs[0] || null;
        }
        
        function calculatePairScore(tile1, tile2, allTiles) {
          let score = 10; // Score base
          
          // Bonificar tiles no topo
          score += (tile1.z + tile2.z) * 2;
          
          // Bonificar tiles em bordas
          if (isEdgeTile(tile1, allTiles)) score += 5;
          if (isEdgeTile(tile2, allTiles)) score += 5;
          
          // Penalizar tiles que podem bloquear outros
          if (isBlockingTile(tile1, allTiles)) score -= 3;
          if (isBlockingTile(tile2, allTiles)) score -= 3;
          
          return score;
        }
        
        function isEdgeTile(tile, allTiles) {
          // Implementar lógica para detectar tiles de borda
          return tile.x === 0 || tile.y === 0; // Simplificado
        }
        
        function isBlockingTile(tile, allTiles) {
          // Verificar se tile está bloqueando outros
          return allTiles.some(other => 
            other.z < tile.z && 
            tilesOverlap(tile, other)
          );
        }
        
        function tilesOverlap(tile1, tile2) {
          return (
            tile1.x < tile2.x + tile2.tileSizeX &&
            tile1.x + tile1.tileSizeX > tile2.x &&
            tile1.y < tile2.y + tile2.tileSizeY &&
            tile1.y + tile1.tileSizeY > tile2.y
          );
        }
        
        // Message handler
        self.onmessage = function(e) {
          const { id, type, data } = e.data;
          
          try {
            let result;
            
            switch (type) {
              case 'shuffle':
                result = shuffleTiles(data.tiles, data.attempts);
                break;
                
              case 'validate':
                result = validateSolvability(data.tiles);
                break;
                
              case 'solve':
                result = findBestHintPath(data.tiles);
                break;
                
              default:
                throw new Error(\`Unknown task type: \${type}\`);
            }
            
            self.postMessage({
              id,
              success: true,
              result
            });
            
          } catch (error) {
            self.postMessage({
              id,
              success: false,
              error: error.message
            });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));

      this.worker.onmessage = (e) => {
        const response: WorkerResponse = e.data;
        
        if (response.type === 'progress') {
          // Handle progress updates
          return;
        }
        
        const pending = this.pendingRequests.get(response.id);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(response.id);
          
          if (response.success) {
            pending.resolve(response.result);
          } else {
            pending.reject(new Error(response.error || 'Worker task failed'));
          }
        }
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        this.fallbackToMainThread();
      };

    } catch (error) {
      console.warn('Failed to create worker, falling back to main thread:', error);
      this.fallbackToMainThread();
    }
  }

  private fallbackToMainThread() {
    this.worker = null;
    console.warn('Worker unavailable, using main thread for game operations');
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private executeTask<T>(type: string, data: any, timeoutMs = 5000): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        // Fallback to main thread
        return this.executeMainThread<T>(type, data).then(resolve).catch(reject);
      }

      const id = this.generateId();
      
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Worker task timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      this.worker.postMessage({ id, type, data });
    });
  }

  private async executeMainThread<T>(type: string, data: any): Promise<T> {
    // Fallback implementations for main thread
    switch (type) {
      case 'shuffle':
        return this.mainThreadShuffle(data.tiles, data.attempts) as T;
      
      case 'validate':
        return this.mainThreadValidate(data.tiles) as T;
      
      case 'solve':
        return this.mainThreadSolve(data.tiles) as T;
      
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  }

  private mainThreadShuffle(tiles: any[], attempts = 50): any[] {
    // Simplified main thread shuffle
    const shuffled = [...tiles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private mainThreadValidate(tiles: any[]): boolean {
    // Simplified validation
    const typeCounts = new Map<string, number>();
    
    tiles.forEach(tile => {
      if (tile.type) {
        const key = tile.type.matchAny 
          ? `${tile.type.group}-any` 
          : `${tile.type.group}-${tile.type.index}`;
        typeCounts.set(key, (typeCounts.get(key) || 0) + 1);
      }
    });
    
    for (const [key, count] of typeCounts) {
      if (!key.endsWith('-any') && count % 2 !== 0) {
        return false;
      }
    }
    
    return true;
  }

  private mainThreadSolve(tiles: any[]): any | null {
    // Simplified hint finding
    const freeTiles = tiles.filter((t: any) => t.isFree);
    
    for (let i = 0; i < freeTiles.length - 1; i++) {
      for (let j = i + 1; j < freeTiles.length; j++) {
        if (this.tilesMatch(freeTiles[i], freeTiles[j])) {
          return {
            tile1: freeTiles[i],
            tile2: freeTiles[j],
            score: 10
          };
        }
      }
    }
    
    return null;
  }

  private tilesMatch(tile1: any, tile2: any): boolean {
    if (!tile1.type || !tile2.type) return false;
    
    if (tile1.type.group === tile2.type.group) {
      return tile1.type.matchAny || tile1.type.index === tile2.type.index;
    }
    
    return false;
  }

  // Public API
  async shuffleTiles(tiles: MjTile[], attempts = 100): Promise<MjTile[]> {
    const serializedTiles = tiles.map(tile => ({
      id: tile.id,
      x: tile.x,
      y: tile.y,
      z: tile.z,
      type: tile.type ? {
        group: tile.type.group,
        index: tile.type.index,
        matchAny: tile.type.matchAny
      } : null,
      active: tile.active,
      isFree: tile.isFree()
    }));

    const result = await this.executeTask<any[]>('shuffle', { 
      tiles: serializedTiles, 
      attempts 
    });

    // Reconstruct tiles with new type assignments
    return tiles.map((tile, index) => {
      if (result[index] && result[index].type) {
        const newType = new MjTileType(
          result[index].type.group,
          result[index].type.index,
          result[index].type.matchAny
        );
        tile.setType(newType);
      }
      return tile;
    });
  }

  async validateGameSolvability(tiles: MjTile[]): Promise<boolean> {
    const serializedTiles = tiles.map(tile => ({
      type: tile.type ? {
        group: tile.type.group,
        index: tile.type.index,
        matchAny: tile.type.matchAny
      } : null,
      active: tile.active
    }));

    return this.executeTask<boolean>('validate', { tiles: serializedTiles });
  }

  async findBestHint(tiles: MjTile[]): Promise<{ tile1: MjTile; tile2: MjTile } | null> {
    const serializedTiles = tiles.map(tile => ({
      id: tile.id,
      x: tile.x,
      y: tile.y,
      z: tile.z,
      type: tile.type ? {
        group: tile.type.group,
        index: tile.type.index,
        matchAny: tile.type.matchAny
      } : null,
      active: tile.active,
      isFree: tile.isFree(),
      tileSizeX: tile.tileSizeX,
      tileSizeY: tile.tileSizeY
    }));

    const result = await this.executeTask<any>('solve', { tiles: serializedTiles });
    
    if (!result) return null;

    // Find actual tiles by ID
    const tile1 = tiles.find(t => t.id === result.tile1.id);
    const tile2 = tiles.find(t => t.id === result.tile2.id);

    return tile1 && tile2 ? { tile1, tile2 } : null;
  }

  destroy() {
    // Clear pending requests
    this.pendingRequests.forEach(({ timeout }) => clearTimeout(timeout));
    this.pendingRequests.clear();

    // Terminate worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Singleton instance
export const gameWorkerService = new GameWorkerService();