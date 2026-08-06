import { useCallback, useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback(value => {
    if (!value) return;
    setToast(typeof value === 'string' ? { message: value } : value);
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  return { toast, showToast, clearToast };
}
