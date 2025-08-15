import { TileCharacters } from '@/types/game.types';

// Diagnostic logging utility
export class TileDiagnostics {
  private static enabled = process.env.NODE_ENV === 'development';

  static log(message: string, data?: any): void {
    if (this.enabled) {
      console.log(`[TILE] ${message}`, data || '');
    }
  }

  static warn(message: string, data?: any): void {
    if (this.enabled) {
      console.warn(`[TILE WARNING] ${message}`, data || '');
    }
  }

  static error(message: string, data?: any): void {
    console.error(`[TILE ERROR] ${message}`, data || '');
  }

  static logTileState(tile: MjTile, context: string): void {
    if (this.enabled) {
      this.log(`${context} - Tile State`, {
        id: tile.id,
        position: { x: tile.x, y: tile.y, z: tile.z },
        type: tile.type ? `${tile.type.group}[${tile.type.index}]` : 'null',
        active: tile.active,
        selected: tile.selected,
        chaos: {
          offsetX: tile.chaosOffsetX,
          offsetY: tile.chaosOffsetY,
          rotation: tile.chaosRotation
        }
      });
    }
  }

  static logCollectionState(tiles: MjTile[], context: string): void {
    if (this.enabled) {
      this.log(`${context} - Collection State`, {
        totalTiles: tiles.length,
        activeTiles: tiles.filter(t => t.active).length,
        selectedTiles: tiles.filter(t => t.selected).length,
        tilesWithType: tiles.filter(t => t.type !== null).length,
        tilesWithoutType: tiles.filter(t => t.type === null).length
      });
    }
  }
}

export class MjTileType {
  public group: string;
  public index: number;
  public matchAny: boolean;

  private tileCharacters: TileCharacters = {
    "ball": [["&#x1F019","1","blue"], ["&#x1F01A","2","blue"], ["&#x1F01B","3","blue"], ["&#x1F01C","4","blue"],
      ["&#x1F01D","5","blue"], ["&#x1F01E","6","blue"], ["&#x1F01F","7","blue"], ["&#x1F020","8","blue"], ["&#x1F021","9","blue"] ],
    "bam": [["&#x1F010","1","green"], ["&#x1F011","2","green"], ["&#x1F012","3","green"], ["&#x1F013","4","green"],
      ["&#x1F014","5","green"], ["&#x1F015","6","green"], ["&#x1F016","7","green"], ["&#x1F017","8","green"], ["&#x1F018","9","green"] ],
    "num": [["&#x1F007","1","red"], ["&#x1F008","2","red"], ["&#x1F009","3","red"], ["&#x1F00A","4","red"],
      ["&#x1F00B","5","red"], ["&#x1F00C","6","red"], ["&#x1F00D","7","red"], ["&#x1F00E","8","red"], ["&#x1F00F","9","red"] ],
    "season": [["&#x1F026", "spring", "green"], ["&#x1F027", "summer", "#D4A017"], ["&#x1F028", "autumn", "orange"], ["&#x1F029", "winter", "blue"]],
    "wind": [["&#x1F000", "east", "black"], ["&#x1F001", "south", "black"], ["&#x1F002", "west", "black"], ["&#x1F003", "north", "black"]],
    "flower": [["&#x1F022", "plum", "#C71585"], ["&#x1F023", "orchid", "green"], ["&#x1F024", "bamboo", "green"], ["&#x1F025", "mum", "red"]],
    "dragon": [["&#x1F004", "dragon", "red"], ["&#x1F005", "dragon", "green"], ["龙", "dragon", "#4169E1"]]
  }

  constructor (group: string, index: number, matchAny: boolean) {
    this.group = group;
    this.index = index;
    this.matchAny = matchAny;
  }

  public getPrimaryCharacter(): string {
    return this.tileCharacters[this.group][this.index][0];
  }

  public getSecondaryCharacter(): string {
    return this.tileCharacters[this.group][this.index][1];
  }

  public getColor(): string {
    return this.tileCharacters[this.group][this.index][2];
  }

  public matches(otherType: MjTileType) {
    if (this.group === otherType.group && (this.matchAny || this.index === otherType.index)) {
      return true;
    } else {
      return false;
    }
  }

  public toString(): string {
    return this.group + this.index.toString();
  }
}

export class MjTile {
  public id: number = 0;
  public top: number;
  public left: number;
  public type: MjTileType | null = null;
  public x: number;
  public y: number;
  public z: number;
  public sortingOrder: number;
  public selected: boolean = false;
  public isSelected: boolean = false; // Alias for compatibility
  public active: boolean = true;
  public showHint: boolean = false;
  public isHinted: boolean = false; // Alias for compatibility
  public hasFreePair: boolean = false;
  public isBlocked: boolean = false; // For compatibility
  public tileSizeX = 2;
  public tileSizeY = 2;
  public blockedBy: MjTile[] = [];
  public adjacentL: MjTile[] = [];
  public adjacentR: MjTile[] = [];
  public chaosOffsetX: number = 0;
  public chaosOffsetY: number = 0;
  public chaosRotation: number = 0;

  constructor(x: number, y: number, collection: MjTile[], id?: number) {
    this.x = x;
    this.y = y;
    this.z = this.getTileZCoordinate(collection);
    this.top = 0;
    this.left = 0;
    this.sortingOrder = this.z * 10000 - this.x * 100 + this.y;
    this.id = id || this.sortingOrder;
    // Sync alias properties
    this.isSelected = this.selected;
    this.isHinted = this.showHint;
    this.updateBlockedState();
  }

  private getTileZCoordinate(collection: MjTile[]): number {
    let z = 0;
    for (const otherTile of collection) {
      if ((z <= otherTile.z) && this.overlaps2d(otherTile)) {
        z = otherTile.z + 1;
      }
    }
    return z;
  }

  setType(type: MjTileType): void {
    this.type = type;
  }

  overlaps2d(otherTile: MjTile): boolean {
    return (
      (this.x + this.tileSizeX > otherTile.x && this.x < otherTile.x + otherTile.tileSizeX)
      &&
      (this.y + this.tileSizeY > otherTile.y && this.y < otherTile.y + otherTile.tileSizeY)
    );
  }

  isXAdjacentTo(otherTile: MjTile): [boolean, boolean] {
    if (
      (this.z === otherTile.z)
      &&
      (this.y + this.tileSizeY > otherTile.y && this.y < otherTile.y + otherTile.tileSizeY)
    ) {
      return [
        this.x + this.tileSizeX === otherTile.x,
        this.x === otherTile.x + otherTile.tileSizeX
      ];
    } else {
      return [false, false];
    }
  }

  checkRelativePositions(otherTile: MjTile): void {
    if (this.z === otherTile.z - 1 && this.overlaps2d(otherTile)) {
      this.blockedBy.push(otherTile);
    }
    const adjacency = this.isXAdjacentTo(otherTile);
    if (adjacency[0]) {
      this.adjacentL.push(otherTile);
    } else if (adjacency[1]) {
      this.adjacentR.push(otherTile);
    }
  }

  matches(otherTile: MjTile): boolean {
    if (!otherTile || !this.type || !otherTile.type) {
      return false;
    } else {
      return this.type.matches(otherTile.type);
    }
  }

  isFree(): boolean {
    for (const tile of this.blockedBy) {
      if (tile.active) {
        return false;
      }
    }

    let freeOnLeft = true;
    for (const tile of this.adjacentL) {
      if (tile.active) {
        freeOnLeft = false;
        break;
      }
    }

    if (freeOnLeft) {
      return true;
    }

    let freeOnRight = true;
    for (const tile of this.adjacentR) {
      if (tile.active) {
        freeOnRight = false;
        break;
      }
    }

    return freeOnRight;
  }

  public remove(): void {
    this.active = false;
    this.unselect();
  }

  public returnToField(): void {
    this.active = true;
  }

  public select(): void {
    this.selected = true;
    this.isSelected = true;
  }

  public unselect(): void {
    this.selected = false;
    this.isSelected = false;
  }

  public reset(): void {
    this.unselect();
    this.active = true;
    this.updateBlockedState();
  }
  
  public getId(): number {
    return this.id;
  }

  public startHint(): void {
    this.showHint = true;
    this.isHinted = true;
  }

  public stopHint(): void {
    this.showHint = false;
    this.isHinted = false;
  }

  public updateBlockedState(): void {
    this.isBlocked = !this.isFree();
  }

  // Static method for reconstructing tiles from serialized data
  static fromSerializedData(data: SerializedTileData, collection: MjTile[]): MjTile {
    // Validate input data
    if (!TileValidator.isValidTileData(data)) {
      throw new Error(`Invalid tile data: ${JSON.stringify(data)}`);
    }

    // Create new tile instance
    const tile = new MjTile(data.x, data.y, collection, data.id);
    
    // Restore type if present
    if (data.typeGroup && data.typeIndex !== null && data.typeIndex !== undefined) {
      try {
        tile.setType(new MjTileType(data.typeGroup, data.typeIndex, data.typeMatchAny || false));
      } catch (error) {
        console.warn(`Failed to restore tile type: ${data.typeGroup}[${data.typeIndex}]`, error);
        // Continue without type - tile will be handled as untyped
      }
    }
    
    // Restore state
    tile.active = data.active ?? true;
    tile.selected = data.selected ?? false;
    tile.chaosOffsetX = data.chaosOffsetX ?? 0;
    tile.chaosOffsetY = data.chaosOffsetY ?? 0;
    tile.chaosRotation = data.chaosRotation ?? 0;
    tile.showHint = data.showHint ?? false;
    tile.hasFreePair = data.hasFreePair ?? false;
    
    // Sync alias properties
    tile.isSelected = tile.selected;
    tile.isHinted = tile.showHint;
    tile.updateBlockedState();
    
    return tile;
  }

  // Method to serialize tile data for storage
  public toSerializedData(): SerializedTileData {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
      id: this.id,
      active: this.active,
      selected: this.selected,
      typeGroup: this.type?.group || null,
      typeIndex: this.type?.index ?? null,
      typeMatchAny: this.type?.matchAny ?? false,
      chaosOffsetX: this.chaosOffsetX,
      chaosOffsetY: this.chaosOffsetY,
      chaosRotation: this.chaosRotation,
      showHint: this.showHint,
      hasFreePair: this.hasFreePair
    };
  }
}

// Interface for serialized tile data
export interface SerializedTileData {
  x: number;
  y: number;
  z: number;
  id?: number;
  active: boolean;
  selected: boolean;
  typeGroup: string | null;
  typeIndex: number | null;
  typeMatchAny: boolean;
  chaosOffsetX: number;
  chaosOffsetY: number;
  chaosRotation: number;
  showHint: boolean;
  hasFreePair: boolean;
}

// Validator class for tile data integrity
export class TileValidator {
  private static readonly VALID_GROUPS = ['ball', 'bam', 'num', 'season', 'wind', 'flower', 'dragon'];
  private static readonly MAX_INDICES = {
    ball: 8, bam: 8, num: 8, season: 3, wind: 3, flower: 3, dragon: 2
  };

  static isValidTileData(data: any): data is SerializedTileData {
    if (!data || typeof data !== 'object') {
      console.error('[TileValidator] Invalid data: not an object', data);
      return false;
    }

    // Check required numeric fields
    if (typeof data.x !== 'number' || typeof data.y !== 'number') {
      console.error('[TileValidator] Invalid coordinates', { x: data.x, y: data.y });
      return false;
    }

    // Check boolean fields
    if (typeof data.active !== 'boolean' || typeof data.selected !== 'boolean') {
      console.error('[TileValidator] Invalid boolean fields', { 
        active: data.active, 
        selected: data.selected 
      });
      return false;
    }

    // Validate type information
    if (data.typeGroup !== null) {
      if (!this.VALID_GROUPS.includes(data.typeGroup)) {
        console.error('[TileValidator] Invalid type group:', data.typeGroup);
        return false;
      }

      if (data.typeIndex !== null) {
        const maxIndex = this.MAX_INDICES[data.typeGroup as keyof typeof this.MAX_INDICES];
        if (typeof data.typeIndex !== 'number' || data.typeIndex < 0 || data.typeIndex > maxIndex) {
          console.error('[TileValidator] Invalid type index:', {
            group: data.typeGroup,
            index: data.typeIndex,
            maxAllowed: maxIndex
          });
          return false;
        }
      }
    }

    // Validate chaos values (should be reasonable)
    if (typeof data.chaosOffsetX === 'number' && Math.abs(data.chaosOffsetX) > 50) {
      console.warn('[TileValidator] Unusual chaosOffsetX value:', data.chaosOffsetX);
    }
    if (typeof data.chaosOffsetY === 'number' && Math.abs(data.chaosOffsetY) > 50) {
      console.warn('[TileValidator] Unusual chaosOffsetY value:', data.chaosOffsetY);
    }
    if (typeof data.chaosRotation === 'number' && Math.abs(data.chaosRotation) > 360) {
      console.warn('[TileValidator] Unusual chaosRotation value:', data.chaosRotation);
    }

    return true;
  }

  static sanitizeTileData(data: any): SerializedTileData {
    const sanitized: SerializedTileData = {
      x: Number(data.x) || 0,
      y: Number(data.y) || 0,
      z: Number(data.z) || 0,
      id: data.id ? Number(data.id) : undefined,
      active: Boolean(data.active),
      selected: Boolean(data.selected),
      typeGroup: (typeof data.typeGroup === 'string' && this.VALID_GROUPS.includes(data.typeGroup)) 
        ? data.typeGroup : null,
      typeIndex: (data.typeGroup && typeof data.typeIndex === 'number') 
        ? Math.max(0, Math.min(data.typeIndex, this.MAX_INDICES[data.typeGroup as keyof typeof this.MAX_INDICES] || 0))
        : null,
      typeMatchAny: Boolean(data.typeMatchAny),
      chaosOffsetX: Number(data.chaosOffsetX) || 0,
      chaosOffsetY: Number(data.chaosOffsetY) || 0,
      chaosRotation: Number(data.chaosRotation) || 0,
      showHint: Boolean(data.showHint),
      hasFreePair: Boolean(data.hasFreePair)
    };

    // Clamp chaos values to reasonable ranges
    sanitized.chaosOffsetX = Math.max(-50, Math.min(50, sanitized.chaosOffsetX));
    sanitized.chaosOffsetY = Math.max(-50, Math.min(50, sanitized.chaosOffsetY));
    sanitized.chaosRotation = Math.max(-360, Math.min(360, sanitized.chaosRotation));

    return sanitized;
  }

  static validateGameState(gameState: any): boolean {
    if (!gameState || typeof gameState !== 'object') {
      console.error('[TileValidator] Invalid game state: not an object');
      return false;
    }

    if (typeof gameState.layout !== 'string') {
      console.error('[TileValidator] Invalid layout:', gameState.layout);
      return false;
    }

    if (!Array.isArray(gameState.tiles)) {
      console.error('[TileValidator] Invalid tiles array:', gameState.tiles);
      return false;
    }

    if (typeof gameState.score !== 'number' || gameState.score < 0) {
      console.error('[TileValidator] Invalid score:', gameState.score);
      return false;
    }

    if (typeof gameState.timer !== 'number' || gameState.timer < 0) {
      console.error('[TileValidator] Invalid timer:', gameState.timer);
      return false;
    }

    // Validate each tile
    for (let i = 0; i < gameState.tiles.length; i++) {
      if (!this.isValidTileData(gameState.tiles[i])) {
        console.error(`[TileValidator] Invalid tile at index ${i}:`, gameState.tiles[i]);
        return false;
      }
    }

    return true;
  }
}