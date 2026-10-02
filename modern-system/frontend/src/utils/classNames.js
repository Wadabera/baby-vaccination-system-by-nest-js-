/**
 * Joins truthy class names. Falsy entries are dropped, so conditional
 * variants can be inlined without producing "undefined" in the output.
 *
 *   cx('card', isActive && 'ring-2 ring-primary')
 */
export const cx = (...parts) => parts.filter(Boolean).join(" ");

export default cx;
