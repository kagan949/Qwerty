/**
 * Structural type for the message catalog. Every locale file must export an
 * object with exactly the same shape; values are plain strings (or nested
 * objects), which keeps translations type-checked without freezing literals.
 */
export type MessagesShape = {
  [key: string]: string | MessagesShape;
};
