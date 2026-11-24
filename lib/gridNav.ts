/**
 * Keyboard movement for a rows × cols grid of buttons (the Fidel chart).
 *
 * The chart uses a "roving tabindex": only the selected letter is in the Tab
 * order, and the arrow keys move between letters. That turns 182 Tab stops
 * into one, the pattern screen-reader and keyboard users expect for grids.
 */
export type GridPos = { row: number; col: number };

/**
 * Where `key` moves from `pos`, or null if the key isn't a grid key.
 * Arrows stop at the edges (no wrapping). Home/End go to the start/end of the
 * row; Ctrl/Cmd+Home/End go to the first/last cell of the grid; PageUp/PageDown
 * jump `pageSize` rows.
 */
export function moveInGrid(
  pos: GridPos,
  key: string,
  rows: number,
  cols: number,
  opts: { ctrl?: boolean; pageSize?: number } = {}
): GridPos | null {
  const clamp = (n: number, max: number) => Math.min(Math.max(n, 0), max - 1);
  const page = opts.pageSize ?? 5;
  const { row, col } = pos;

  switch (key) {
    case "ArrowLeft":
      return { row, col: clamp(col - 1, cols) };
    case "ArrowRight":
      return { row, col: clamp(col + 1, cols) };
    case "ArrowUp":
      return { row: clamp(row - 1, rows), col };
    case "ArrowDown":
      return { row: clamp(row + 1, rows), col };
    case "Home":
      return opts.ctrl ? { row: 0, col: 0 } : { row, col: 0 };
    case "End":
      return opts.ctrl ? { row: rows - 1, col: cols - 1 } : { row, col: cols - 1 };
    case "PageUp":
      return { row: clamp(row - page, rows), col };
    case "PageDown":
      return { row: clamp(row + page, rows), col };
    default:
      return null;
  }
}
