/**
 * Pokemon Sudoku Engine
 * Fast backtracking solver using bitmask optimizations and dynamic puzzle generator.
 */

const SudokuEngine = (() => {
  // Helper to map 2D coordinates to box index (0-8)
  const getBoxIndex = (row, col) => 3 * Math.floor(row / 3) + Math.floor(col / 3);

  /**
   * Backtracking solver with bitmasks.
   * Can solve, count solutions, or check for uniqueness.
   */
  class Solver {
    constructor(board) {
      this.board = [...board]; // 81-element array
      this.rows = new Array(9).fill(0);
      this.cols = new Array(9).fill(0);
      this.boxes = new Array(9).fill(0);
      this.emptyCells = [];

      // Initialize bitmasks and locate empty cells
      for (let i = 0; i < 81; i++) {
        const val = this.board[i];
        const r = Math.floor(i / 9);
        const c = i % 9;
        const b = getBoxIndex(r, c);

        if (val !== 0) {
          const mask = 1 << val;
          this.rows[r] |= mask;
          this.cols[c] |= mask;
          this.boxes[b] |= mask;
        } else {
          this.emptyCells.push(i);
        }
      }
    }

    // Solve and return first found solution, or null if unsolvable
    solve() {
      const solution = [];
      const success = this._backtrackSolve(0, solution);
      return success ? solution : null;
    }

    _backtrackSolve(emptyIdx, outBoard) {
      if (emptyIdx === this.emptyCells.length) {
        // Copy current state to output board
        for (let i = 0; i < 81; i++) {
          outBoard[i] = this.board[i];
        }
        return true;
      }

      const cell = this.emptyCells[emptyIdx];
      const r = Math.floor(cell / 9);
      const c = cell % 9;
      const b = getBoxIndex(r, c);

      const occupied = this.rows[r] | this.cols[c] | this.boxes[b];

      // Try digits 1 to 9
      for (let d = 1; d <= 9; d++) {
        const mask = 1 << d;
        if ((occupied & mask) === 0) {
          // Place digit
          this.board[cell] = d;
          this.rows[r] |= mask;
          this.cols[c] |= mask;
          this.boxes[b] |= mask;

          if (this._backtrackSolve(emptyIdx + 1, outBoard)) {
            return true;
          }

          // Backtrack
          this.board[cell] = 0;
          this.rows[r] &= ~mask;
          this.cols[c] &= ~mask;
          this.boxes[b] &= ~mask;
        }
      }

      return false;
    }

    /**
     * Checks if the board has a unique solution.
     * Returns 0 (no solution), 1 (unique solution), or 2 (multiple solutions).
     */
    countSolutions(limit = 2) {
      let solutionsCount = 0;
      const self = this;

      function backtrack(emptyIdx) {
        if (emptyIdx === self.emptyCells.length) {
          solutionsCount++;
          return solutionsCount >= limit; // Stop searching if limit reached
        }

        const cell = self.emptyCells[emptyIdx];
        const r = Math.floor(cell / 9);
        const c = cell % 9;
        const b = getBoxIndex(r, c);

        const occupied = self.rows[r] | self.cols[c] | self.boxes[b];

        for (let d = 1; d <= 9; d++) {
          const mask = 1 << d;
          if ((occupied & mask) === 0) {
            self.board[cell] = d;
            self.rows[r] |= mask;
            self.cols[c] |= mask;
            self.boxes[b] |= mask;

            const stop = backtrack(emptyIdx + 1);

            self.board[cell] = 0;
            self.rows[r] &= ~mask;
            self.cols[c] &= ~mask;
            self.boxes[b] &= ~mask;

            if (stop) return true;
          }
        }
        return false;
      }

      backtrack(0);
      return solutionsCount;
    }
  }

  // Generates a fully solved Sudoku board
  const generateFullSolvedBoard = () => {
    const board = new Array(81).fill(0);
    const rows = new Array(9).fill(0);
    const cols = new Array(9).fill(0);
    const boxes = new Array(9).fill(0);

    const fillCell = (index) => {
      if (index === 81) return true;

      const r = Math.floor(index / 9);
      const c = index % 9;
      const b = getBoxIndex(r, c);

      // Create shuffled numbers 1-9
      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
      }

      const occupied = rows[r] | cols[c] | boxes[b];

      for (let d of nums) {
        const mask = 1 << d;
        if ((occupied & mask) === 0) {
          board[index] = d;
          rows[r] |= mask;
          cols[c] |= mask;
          boxes[b] |= mask;

          if (fillCell(index + 1)) return true;

          board[index] = 0;
          rows[r] &= ~mask;
          cols[c] &= ~mask;
          boxes[b] &= ~mask;
        }
      }
      return false;
    };

    fillCell(0);
    return board;
  };

  /**
   * Generates a puzzle of specified difficulty.
   * @param {string} difficulty - 'simple', 'medium', 'hard', 'expert', 'master'
   */
  const generatePuzzle = (difficulty) => {
    // Determine target clues/empty cells
    let minClues, maxClues;
    switch (difficulty.toLowerCase()) {
      case 'simple':
        minClues = 45;
        maxClues = 50;
        break;
      case 'medium':
        minClues = 36;
        maxClues = 44;
        break;
      case 'hard':
        minClues = 30;
        maxClues = 35;
        break;
      case 'expert':
        minClues = 24;
        maxClues = 29;
        break;
      case 'master':
        minClues = 17;
        maxClues = 23;
        break;
      default:
        minClues = 40;
        maxClues = 45;
    }

    const solution = generateFullSolvedBoard();
    const puzzle = [...solution];

    // Create a list of all cells and shuffle them
    const cells = Array.from({ length: 81 }, (_, i) => i);
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    const targetEmpty = 81 - (minClues + Math.floor(Math.random() * (maxClues - minClues + 1)));
    let emptyCount = 0;

    // Check cells one by one and remove them if solution remains unique
    for (let cell of cells) {
      if (emptyCount >= targetEmpty) break;

      const tempVal = puzzle[cell];
      puzzle[cell] = 0;

      const solver = new Solver(puzzle);
      if (solver.countSolutions(2) === 1) {
        // Solution is unique, we can keep it empty
        emptyCount++;
      } else {
        // Restoring because removing created multiple solutions
        puzzle[cell] = tempVal;
      }
    }

    return {
      puzzle,    // 81-element array with 0s for empty cells
      solution   // 81-element array fully completed
    };
  };

  /**
   * Checks if a board state is valid so far (ignores 0s, but flags duplicates)
   */
  const checkValidity = (board) => {
    const cellErrors = new Array(81).fill(false);
    
    // Check rows
    for (let r = 0; r < 9; r++) {
      const seen = {};
      for (let c = 0; c < 9; c++) {
        const idx = r * 9 + c;
        const val = board[idx];
        if (val !== 0) {
          if (seen[val] !== undefined) {
            cellErrors[idx] = true;
            cellErrors[seen[val]] = true;
          } else {
            seen[val] = idx;
          }
        }
      }
    }

    // Check columns
    for (let c = 0; c < 9; c++) {
      const seen = {};
      for (let r = 0; r < 9; r++) {
        const idx = r * 9 + c;
        const val = board[idx];
        if (val !== 0) {
          if (seen[val] !== undefined) {
            cellErrors[idx] = true;
            cellErrors[seen[val]] = true;
          } else {
            seen[val] = idx;
          }
        }
      }
    }

    // Check boxes
    for (let b = 0; b < 9; b++) {
      const seen = {};
      const startRow = Math.floor(b / 3) * 3;
      const startCol = (b % 3) * 3;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const idx = (startRow + r) * 9 + (startCol + c);
          const val = board[idx];
          if (val !== 0) {
            if (seen[val] !== undefined) {
              cellErrors[idx] = true;
              cellErrors[seen[val]] = true;
            } else {
              seen[val] = idx;
            }
          }
        }
      }
    }

    return cellErrors;
  };

  /**
   * Scans the current board state and finds a logically solvable cell.
   * Returns: { index, value, message } or null
   */
  const getLogicalHint = (currentBoard, solution) => {
    // Only look at cells that are correct or empty (ignore incorrect cells for logical calculations)
    const cleanBoard = currentBoard.map((val, idx) => val === solution[idx] ? val : 0);

    // Helper to get allowed values for a cell
    const getAllowedValues = (board, idx) => {
      const r = Math.floor(idx / 9);
      const c = idx % 9;
      const b = getBoxIndex(r, c);
      const allowed = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

      // Check row
      for (let col = 0; col < 9; col++) {
        allowed.delete(board[r * 9 + col]);
      }
      // Check column
      for (let row = 0; row < 9; row++) {
        allowed.delete(board[row * 9 + c]);
      }
      // Check box
      const startRow = Math.floor(b / 3) * 3;
      const startCol = (b % 3) * 3;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          allowed.delete(board[(startRow + row) * 9 + (startCol + col)]);
        }
      }
      return Array.from(allowed);
    };

    // 1. Check for Naked Singles (only 1 valid number fits in cell)
    for (let i = 0; i < 81; i++) {
      if (cleanBoard[i] !== 0) continue;
      const allowed = getAllowedValues(cleanBoard, i);
      if (allowed.length === 1) {
        const val = allowed[0];
        const r = Math.floor(i / 9);
        const c = i % 9;
        return {
          index: i,
          value: val,
          message: `At Row ${r + 1}, Column ${c + 1}, ${val} is the only number that can be placed without violating Sudoku rules for its row, column, or block.`
        };
      }
    }

    // 2. Check for Hidden Singles (only 1 cell in a row, column, or box can hold a digit)
    
    // Check Rows
    for (let r = 0; r < 9; r++) {
      for (let val = 1; val <= 9; val++) {
        // If val already in row, skip
        let inRow = false;
        for (let c = 0; c < 9; c++) {
          if (cleanBoard[r * 9 + c] === val) { inRow = true; break; }
        }
        if (inRow) continue;

        // Find cells in row where val can go
        const possibleCols = [];
        for (let c = 0; c < 9; c++) {
          const idx = r * 9 + c;
          if (cleanBoard[idx] === 0) {
            const allowed = getAllowedValues(cleanBoard, idx);
            if (allowed.includes(val)) {
              possibleCols.push(c);
            }
          }
        }
        if (possibleCols.length === 1) {
          const c = possibleCols[0];
          return {
            index: r * 9 + c,
            value: val,
            message: `In Row ${r + 1}, the number ${val} can only fit at Column ${c + 1} because all other cells in this row conflict with ${val} in their columns or boxes.`
          };
        }
      }
    }

    // Check Columns
    for (let c = 0; c < 9; c++) {
      for (let val = 1; val <= 9; val++) {
        // If val already in col, skip
        let inCol = false;
        for (let r = 0; r < 9; r++) {
          if (cleanBoard[r * 9 + c] === val) { inCol = true; break; }
        }
        if (inCol) continue;

        // Find cells in col where val can go
        const possibleRows = [];
        for (let r = 0; r < 9; r++) {
          const idx = r * 9 + c;
          if (cleanBoard[idx] === 0) {
            const allowed = getAllowedValues(cleanBoard, idx);
            if (allowed.includes(val)) {
              possibleRows.push(r);
            }
          }
        }
        if (possibleRows.length === 1) {
          const r = possibleRows[0];
          return {
            index: r * 9 + c,
            value: val,
            message: `In Column ${c + 1}, the number ${val} can only fit at Row ${r + 1} because all other cells in this column conflict with ${val} in their rows or boxes.`
          };
        }
      }
    }

    // Check Boxes
    for (let b = 0; b < 9; b++) {
      for (let val = 1; val <= 9; val++) {
        // If val already in box, skip
        let inBox = false;
        const startRow = Math.floor(b / 3) * 3;
        const startCol = (b % 3) * 3;
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            if (cleanBoard[(startRow + row) * 9 + (startCol + col)] === val) { inBox = true; break; }
          }
        }
        if (inBox) continue;

        // Find cells in box where val can go
        const possibleIndices = [];
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const idx = (startRow + row) * 9 + (startCol + col);
            if (cleanBoard[idx] === 0) {
              const allowed = getAllowedValues(cleanBoard, idx);
              if (allowed.includes(val)) {
                possibleIndices.push(idx);
              }
            }
          }
        }
        if (possibleIndices.length === 1) {
          const idx = possibleIndices[0];
          const r = Math.floor(idx / 9);
          const c = idx % 9;
          return {
            index: idx,
            value: val,
            message: `In the 3x3 block containing Row ${r + 1}, Column ${c + 1}, the number ${val} can only fit in this cell because all other empty cells in this block are blocked by other columns or rows.`
          };
        }
      }
    }

    // 3. Fallback: pick the first empty cell in the solution
    for (let i = 0; i < 81; i++) {
      if (cleanBoard[i] === 0) {
        const val = solution[i];
        const r = Math.floor(i / 9);
        const c = i % 9;
        return {
          index: i,
          value: val,
          message: `By analyzing the constraints, we can determine that Row ${r + 1}, Column ${c + 1} must contain ${val}.`
        };
      }
    }

    return null;
  };

  return {
    generatePuzzle,
    checkValidity,
    getLogicalHint,
    solvePuzzle: (board) => new Solver(board).solve()
  };
})();

// Export for Node/CommonJS if run in test env, or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SudokuEngine;
}
