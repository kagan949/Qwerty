import toastBase, { type Toast, type ToastOptions } from "react-hot-toast";

/**
 * Toast wrapper. Central place to keep toast styling and (later) to honour the
 * user's notification preference without touching every call site.
 */
const baseOptions: ToastOptions = {
  duration: 2600,
  style: {
    background: "color-mix(in oklab, var(--surface-2) 88%, transparent)",
    color: "var(--foreground)",
    border: "1px solid var(--border-subtle)",
    backdropFilter: "blur(16px)",
    borderRadius: "14px",
    fontSize: "13.5px",
    fontWeight: 500,
    padding: "10px 14px",
    boxShadow: "0 18px 40px -20px rgb(0 0 0 / 0.85)",
  },
};

function withDefaults(options?: ToastOptions): ToastOptions {
  return { ...baseOptions, ...options, style: { ...baseOptions.style, ...options?.style } };
}

export const toast = Object.assign(
  (message: string, options?: ToastOptions): string => toastBase(message, withDefaults(options)),
  {
    success: (message: string, options?: ToastOptions): string => toastBase.success(message, withDefaults(options)),
    error: (message: string, options?: ToastOptions): string => toastBase.error(message, withDefaults(options)),
    loading: (message: string, options?: ToastOptions): string => toastBase.loading(message, withDefaults(options)),
    dismiss: (id?: string): void => toastBase.dismiss(id),
    remove: (id?: string): void => toastBase.remove(id),
    promise: toastBase.promise,
    custom: toastBase.custom,
  },
);

export type { Toast };
