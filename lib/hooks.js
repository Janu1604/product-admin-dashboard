'use client';

import { useEffect, useState } from 'react';

// Returns `value`, but only after it hasn't changed for `delay` ms.
// Used so we don't call the API on every keystroke while searching.
export function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
