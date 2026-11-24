// Keyboard answering for multiple-choice quizzes: press 1, 2, 3 … to pick
// the first, second, third … choice (top row or numeric keypad).

export type AnswerKeyEvent = {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  repeat?: boolean;
};

/**
 * The 0-based choice index for a key press, or null when the key doesn't
 * pick a choice (not a digit, out of range, held down, or used with a
 * modifier such as Ctrl+1 for switching browser tabs).
 */
export function choiceIndexForKey(e: AnswerKeyEvent, choiceCount: number): number | null {
  if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return null;
  if (!/^[1-9]$/.test(e.key)) return null;
  const index = Number(e.key) - 1;
  return index < choiceCount ? index : null;
}
