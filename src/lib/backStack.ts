/**
 * Global back-intercept stack.
 *
 * Overlays (photo viewers, sheets) push a handler while they are open.
 * The app's back button and the hardware back press consume the topmost
 * handler first, so a back press closes the overlay and returns the user to
 * exactly what was underneath it — with its scroll position untouched,
 * because the underlying view is never unmounted.
 */
type BackHandler = () => boolean;

const stack: BackHandler[] = [];

export const pushBackHandler = (handler: BackHandler): (() => void) => {
  stack.push(handler);
  return () => {
    const i = stack.lastIndexOf(handler);
    if (i !== -1) stack.splice(i, 1);
  };
};

/** Returns true when an overlay handled the back press. */
export const consumeBack = (): boolean => {
  for (let i = stack.length - 1; i >= 0; i--) {
    const handled = stack[i]();
    if (handled) return true;
  }
  return false;
};

export const clearBackHandlers = () => {
  stack.length = 0;
};
