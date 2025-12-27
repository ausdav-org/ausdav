import { useEffect } from 'react';

type Handler = () => void;

/**
 * Register a handler to run when the global admin refresh event is dispatched.
 * Usage: `useAdminRefresh(() => fetchData())` in admin pages.
 */
export function useAdminRefresh(handler: Handler) {
  useEffect(() => {
    const fn = () => handler();
    window.addEventListener('admin:refresh', fn as EventListener);
    return () => window.removeEventListener('admin:refresh', fn as EventListener);
  }, [handler]);
}

/**
 * Dispatch a global admin refresh event. Admin pages using `useAdminRefresh`
 * will receive the event and can re-fetch their table data.
 */
export function dispatchAdminRefresh() {
  try {
    window.dispatchEvent(new Event('admin:refresh'));
  } catch (e) {
    // ignore
  }
}

export default useAdminRefresh;
