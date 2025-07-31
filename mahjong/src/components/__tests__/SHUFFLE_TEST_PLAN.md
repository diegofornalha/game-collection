# Shuffle Algorithm Test Plan

## Overview
This document outlines the comprehensive test plan for the `shuffleRemainingTiles` algorithm in the Mahjong game. The algorithm must guarantee at least one valid move exists after shuffling while maintaining game integrity.

## Test Categories

### 1. Normal Shuffle Scenarios
Tests the algorithm under typical game conditions with reasonable tile counts and distributions.

#### Test Cases:
- **Many Tiles (50-60 tiles)**: Verify shuffle works correctly with a large number of tiles
- **Medium Board (20-30 tiles)**: Standard mid-game scenario
- **Valid Move Guarantee**: Ensure at least one matching pair exists on free tiles after shuffle

**Expected Behavior**: 
- Algorithm completes within 100ms
- At least one valid move is available
- Free tiles are prioritized for matching pairs

### 2. Edge Cases
Tests boundary conditions and minimal configurations.

#### Test Cases:
- **2 Tiles Only**: Minimum possible game state
  - Expected: Both tiles should match if they're free
- **3 Tiles**: Odd number edge case
  - Expected: At least 2 tiles match
- **4 Tiles**: Small even number
  - Expected: 2 pairs or at least 1 pair guaranteed

**Expected Behavior**: 
- No crashes or infinite loops
- Valid moves still guaranteed
- Graceful handling of limited options

### 3. Heavily Blocked Configurations
Tests scenarios where most tiles are inaccessible.

#### Test Cases:
- **Pyramid Structure**: Classic blocking pattern
  - Base layer tiles blocked by upper layers
  - Only corner/edge tiles free
- **Tower Formation**: Vertical stacking
  - Most tiles have blockers above
- **Dense Packing**: Minimal free tiles

**Expected Behavior**:
- Algorithm identifies all free tiles correctly
- Matching pairs placed on available free tiles
- Strategic value calculation considers future moves

### 4. Single Free Tile Scenario
Tests extreme case where player has very limited options.

#### Test Cases:
- **Line Formation**: Tiles in a row with only end tile free
- **Surrounded Tile**: One tile with all neighbors blocked

**Expected Behavior**:
- Algorithm identifies semi-free tiles (one move away from freedom)
- Ensures the free tile has a match with a semi-free tile
- Considers cascade effects when tiles are removed

### 5. No Initial Valid Moves
Tests recovery mechanisms when random distribution creates no matches.

#### Test Cases:
- **All Different Types**: Each free tile has unique type
- **Mismatched Distribution**: Types don't align with free positions

**Expected Behavior**:
- Algorithm detects no valid moves
- Applies strategic recovery:
  1. Finds types with multiple instances
  2. Swaps types to create matches on free tiles
  3. Falls back to forcing any matching pair if needed
- Logs warnings for debugging

### 6. Strategic Value Calculation
Tests the tile prioritization system.

#### Test Cases:
- **Layer-based Values**: Higher layers = lower value
- **Freedom Status**: Free > Semi-free > Blocked
- **Position Values**: Center tiles slightly favored
- **Blocking Penalty**: Tiles blocking many others penalized

**Expected Behavior**:
- Free tiles always have highest strategic value (≥100 points)
- Values decrease with more blockers
- Center bias is subtle (≤20 points)

### 7. Performance Tests
Ensures algorithm scales well.

#### Test Cases:
- **Full Board (144 tiles)**: Maximum tile count
- **Rapid Shuffles**: Multiple consecutive shuffles
- **Complex Layouts**: Intricate blocking patterns

**Expected Behavior**:
- Completes within 100ms for any tile count
- No memory leaks
- Consistent performance across runs

### 8. Algorithm Guarantees
Validates core promises of the algorithm.

#### Test Cases:
- **Always Has Moves**: Random configurations (1000 iterations)
- **Wildcard Handling**: Match-any tiles work correctly
- **Type Distribution**: Pairs distributed optimally

**Expected Behavior**:
- 100% success rate for valid move guarantee
- Wildcards match within their group only
- Maximum number of moves when possible

## Test Implementation Details

### Mock Setup
- `TileFactory`: Creates tiles with specific properties
- `setupTileRelationships()`: Establishes blocking/adjacency
- Mock game store for integration

### Key Assertions
1. `hasValidMoves(tiles)` returns true after shuffle
2. Free tiles contain matching pairs
3. Strategic values calculated correctly
4. Recovery mechanisms activate when needed
5. Performance within acceptable bounds

### Test Data Patterns
- **Type Groups**: num, ball, bam, wind, dragon, season, flower
- **Blocking Patterns**: pyramid, tower, line, grid
- **Distribution**: Even, skewed, single-type dominant

## Integration Points

### Game Store Integration
- `clearSelection()`: Called after shuffle
- `clearUndoRedo()`: Stacks reset
- `permanentHint`: Triggers hint update if enabled

### UI Updates
- Tiles array reassignment triggers Vue reactivity
- Hint system updates for new valid moves
- Visual shuffle animation considerations

## Success Metrics

1. **Functional Success**:
   - 100% of shuffles result in valid moves
   - All edge cases handled gracefully
   - Recovery mechanisms work reliably

2. **Performance Success**:
   - <100ms execution time
   - Minimal memory allocation
   - No UI freezing

3. **Quality Success**:
   - Average 3+ valid moves after shuffle
   - Strategic depth maintained
   - Player satisfaction (no obvious dead ends)

## Running the Tests

```bash
# Run all shuffle tests
npm test -- TileFieldShuffle.test.ts ShuffleAlgorithm.test.ts

# Run with coverage
npm test -- --coverage TileFieldShuffle.test.ts

# Run specific test suite
npm test -- -t "Edge Cases"
```

## Future Enhancements

1. **Machine Learning Integration**: Learn optimal shuffle patterns
2. **Difficulty Adjustment**: Vary number of valid moves based on skill
3. **Pattern Recognition**: Detect and avoid problematic configurations
4. **Analytics**: Track shuffle effectiveness over time