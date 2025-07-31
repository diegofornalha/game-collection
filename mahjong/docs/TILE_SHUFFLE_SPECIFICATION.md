# Mahjong Tile Shuffle Algorithm Specification (SPARC)

## 1. Problem Analysis

### 1.1 Current Issue
The current shuffle implementation in `shuffleRemainingTiles()` (lines 860-1010 in TileField.vue) has a critical flaw: it attempts to ensure valid moves but doesn't adequately handle edge cases where tiles in lower layers might have matching pairs but are blocked, resulting in no playable moves.

### 1.2 Core Constraints
1. **Z-Layer Dependencies**: Tiles exist in layers 0-5, where higher tiles block lower ones
2. **Freedom Rules**: A tile is "free" if:
   - No tile blocks it from above (higher z-layer overlapping)
   - At least one side (left OR right) is free
3. **Matching Rules**: Only free tiles can be matched and removed
4. **Valid Game State**: After shuffle, there MUST be at least one valid matching pair among free tiles

## 2. Algorithmic Requirements

### 2.1 Functional Requirements

```yaml
functional_requirements:
  - id: "FR-001"
    description: "Shuffle shall guarantee at least one valid move exists after completion"
    priority: "critical"
    acceptance_criteria:
      - "At least 2 free tiles must have matching types"
      - "Free tiles must be accessible according to z-layer rules"
      - "Algorithm must handle edge cases (2 tiles, all blocked, etc.)"
  
  - id: "FR-002"
    description: "Shuffle shall preserve tile position integrity"
    priority: "high"
    acceptance_criteria:
      - "Tiles remain in their original x,y,z positions"
      - "Only tile types are redistributed"
      - "Layer relationships are maintained"
  
  - id: "FR-003"
    description: "Shuffle shall maximize playable moves when possible"
    priority: "medium"
    acceptance_criteria:
      - "Multiple valid pairs on free tiles when feasible"
      - "Strategic placement to unlock future moves"
      - "Avoid creating dead-end configurations"
  
  - id: "FR-004"
    description: "Shuffle shall handle degenerate cases gracefully"
    priority: "high"
    acceptance_criteria:
      - "Works with minimum 2 tiles"
      - "Handles all-blocked scenarios"
      - "Manages single-type dominance"
```

### 2.2 Non-Functional Requirements

```yaml
non_functional_requirements:
  - id: "NFR-001"
    category: "performance"
    description: "Shuffle completes within 100ms for 144 tiles"
    measurement: "execution time < 100ms"
    
  - id: "NFR-002"
    category: "reliability"
    description: "Algorithm guarantees valid move 100% of the time"
    validation: "No deadlock states possible"
    
  - id: "NFR-003"
    category: "maintainability"
    description: "Algorithm is deterministic and testable"
    validation: "Unit tests with edge cases"
```

## 3. Algorithm Design

### 3.1 Data Structures

```typescript
interface TilePosition {
  x: number;
  y: number;
  z: number;
  tile: MjTile;
  isFree: boolean;
  blockedBy: TilePosition[];
  blocking: TilePosition[];
  adjacentLeft: TilePosition[];
  adjacentRight: TilePosition[];
}

interface TileTypePool {
  type: MjTileType;
  count: number;
  instances: MjTileType[];
}

interface ShuffleContext {
  positions: TilePosition[];
  freeTiles: TilePosition[];
  blockedTiles: TilePosition[];
  typePool: Map<string, TileTypePool>;
  guaranteedPairs: number;
}
```

### 3.2 Algorithm Phases

#### Phase 1: Analysis and Classification
```yaml
steps:
  1. Build position graph:
     - Map all tile positions with relationships
     - Calculate free/blocked status
     - Identify blocking chains
  
  2. Classify tiles:
     - Free tiles (immediately playable)
     - Semi-free tiles (one move away from freedom)
     - Deep-blocked tiles (multiple moves away)
  
  3. Analyze type distribution:
     - Count matching pairs
     - Identify singleton types
     - Calculate pair requirements
```

#### Phase 2: Strategic Type Assignment
```yaml
strategy:
  1. Reserve guaranteed pairs:
     - Calculate minimum pairs needed for free tiles
     - Set aside matching types for critical positions
  
  2. Layer-aware distribution:
     - Prioritize pairs on free tiles
     - Place strategic pairs on semi-free tiles
     - Distribute remaining types to blocked tiles
  
  3. Future-move optimization:
     - Analyze which tiles become free after each move
     - Place pairs to create cascading opportunities
```

#### Phase 3: Validation and Correction
```yaml
validation:
  1. Primary check:
     - Verify at least one valid move exists
     - Count total possible moves
  
  2. Secondary optimization:
     - If only one move exists, attempt redistribution
     - Maximize move diversity when possible
  
  3. Emergency fallback:
     - Force-place guaranteed pair on free tiles
     - Log warning for analysis
```

## 4. Edge Case Handling

### 4.1 Minimal Tiles (2-10 tiles)
```yaml
scenario: "Very few tiles remaining"
strategy:
  - If tiles < 4: Ensure all are same type
  - If tiles < 10: Maximize free tile pairs
  - Special handling for odd tile counts
```

### 4.2 Heavily Blocked Configuration
```yaml
scenario: "Most tiles are blocked"
strategy:
  - Identify critical blocker tiles
  - Place pairs on tiles that unlock most moves
  - Use semi-free tile analysis
```

### 4.3 Single Layer Dominance
```yaml
scenario: "All tiles on same z-layer"
strategy:
  - Focus on x-axis adjacency
  - Ensure edge tiles have pairs
  - Distribute to maximize accessible pairs
```

## 5. Optimization Strategies

### 5.1 Move Maximization
```typescript
function calculateMoveValue(tile: TilePosition): number {
  let value = 0;
  
  // Base value for being free
  if (tile.isFree) value += 100;
  
  // Value for tiles it would free
  value += tile.blocking.filter(t => 
    wouldBecomeFree(t, tile)
  ).length * 50;
  
  // Penalty for blocking many tiles
  value -= tile.blocking.length * 10;
  
  return value;
}
```

### 5.2 Pair Distribution Strategy
```typescript
function distributePairs(context: ShuffleContext): void {
  // Sort positions by strategic value
  const sortedPositions = context.positions
    .sort((a, b) => calculateMoveValue(b) - calculateMoveValue(a));
  
  // Assign pairs to highest-value positions first
  const pairs = extractPairs(context.typePool);
  
  for (const pair of pairs) {
    const pos1 = sortedPositions.shift();
    const pos2 = sortedPositions.shift();
    
    if (pos1 && pos2) {
      assignType(pos1, pair[0]);
      assignType(pos2, pair[1]);
    }
  }
}
```

## 6. Implementation Guidelines

### 6.1 Core Algorithm Structure
```typescript
function shuffleWithGuaranteedMoves(tiles: MjTile[]): void {
  // Phase 1: Analysis
  const context = analyzeBoard(tiles);
  
  // Phase 2: Strategic Assignment
  const assignment = createOptimalAssignment(context);
  
  // Phase 3: Apply and Validate
  applyAssignment(tiles, assignment);
  
  // Phase 4: Verify and Correct
  if (!hasValidMoves(tiles)) {
    applyEmergencyCorrection(tiles, context);
  }
  
  // Phase 5: Optimize if possible
  if (countValidMoves(tiles) < 3) {
    attemptMoveMaximization(tiles, context);
  }
}
```

### 6.2 Testing Requirements
```yaml
test_cases:
  - "Minimal configuration": 2, 3, 4 tiles
  - "All blocked except 2": Tower formation
  - "Single type dominance": 90% same type
  - "Perfect pyramid": Symmetric blocking
  - "Random configurations": 1000 iterations
  - "Performance under load": 144 tiles, 100 runs
```

## 7. Success Metrics

### 7.1 Primary Metrics
- **Valid Move Guarantee**: 100% success rate
- **Average Available Moves**: > 3 after shuffle
- **Performance**: < 100ms for full board
- **Move Diversity**: Multiple tile types involved

### 7.2 Quality Metrics
- **Cascade Potential**: Moves that unlock more moves
- **Strategic Depth**: Average moves to complete
- **Player Satisfaction**: No "obvious dead ends"

## 8. Algorithm Pseudocode

```
FUNCTION smartShuffle(activeTiles):
    // Step 1: Build comprehensive tile graph
    graph = buildTileGraph(activeTiles)
    freeTiles = graph.getFreeNodes()
    blockedTiles = graph.getBlockedNodes()
    
    // Step 2: Analyze type distribution
    typePool = extractTypes(activeTiles)
    pairs = groupIntoPairs(typePool)
    singles = extractSingles(typePool)
    
    // Step 3: Ensure minimum viable state
    IF freeTiles.length < 2:
        RETURN handleDegenerateCase(activeTiles)
    
    // Step 4: Calculate required guaranteed pairs
    requiredPairs = CEIL(freeTiles.length / 2)
    guaranteedPairs = pairs.slice(0, requiredPairs)
    remainingPairs = pairs.slice(requiredPairs)
    
    // Step 5: Strategic assignment
    assignments = new Map()
    
    // Assign guaranteed pairs to free tiles
    FOR i = 0 TO guaranteedPairs.length:
        pair = guaranteedPairs[i]
        tile1 = freeTiles[i * 2]
        tile2 = freeTiles[i * 2 + 1]
        assignments.set(tile1, pair.type1)
        assignments.set(tile2, pair.type2)
    
    // Distribute remaining types strategically
    remainingTiles = activeTiles.filter(t => !assignments.has(t))
    remainingTypes = [...remainingPairs.flatMap(p => [p.type1, p.type2]), ...singles]
    
    // Sort by strategic value
    remainingTiles.sort(BY calculateStrategicValue DESC)
    
    // Assign remaining types
    FOR i = 0 TO remainingTiles.length:
        assignments.set(remainingTiles[i], remainingTypes[i])
    
    // Step 6: Apply assignments
    FOR tile IN activeTiles:
        tile.type = assignments.get(tile)
    
    // Step 7: Validate and optimize
    IF NOT hasValidMoves(activeTiles):
        applyEmergencyFix(activeTiles, freeTiles)
    
    RETURN activeTiles

FUNCTION calculateStrategicValue(tile):
    value = 0
    
    // Free tiles have highest value
    IF tile.isFree():
        value += 1000
    
    // Tiles that would become free after one move
    IF tile.blockedBy.length == 1:
        value += 500
    
    // Tiles blocking many others are less valuable
    value -= tile.blocking.length * 50
    
    // Tiles on edges get bonus
    IF tile.isEdgeTile():
        value += 100
    
    RETURN value
```

## 9. Integration Notes

### 9.1 Code Modifications Required
- Replace current `shuffleRemainingTiles()` function
- Add helper functions for graph analysis
- Implement strategic value calculation
- Add comprehensive logging for debugging

### 9.2 Backward Compatibility
- Maintain same public API
- Preserve visual shuffle effect
- Keep undo/redo functionality intact
- Ensure save/load compatibility

## 10. Future Enhancements

### 10.1 Machine Learning Integration
- Learn optimal patterns from player data
- Predict player preferences
- Adaptive difficulty based on success rate

### 10.2 Advanced Strategies
- Multi-move lookahead
- Pattern recognition for specific layouts
- Hint system integration for better suggestions

### 10.3 Performance Optimizations
- Caching of common patterns
- Parallel processing for large boards
- Incremental updates for partial shuffles