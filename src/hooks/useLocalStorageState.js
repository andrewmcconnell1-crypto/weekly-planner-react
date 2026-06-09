import { useEffect, useState } from "react";

// useState that transparently persists to localStorage under `key`.
//
// `initialValue` is used when nothing is stored yet (it may be a factory
// function, like useState). `deserialize` lets a caller migrate / normalise the
// parsed JSON before it becomes state (e.g. merging in new starter data).
export function useLocalStorageState(key, initialValue, { deserialize } = {}) {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(key);

    if (saved === null) {
      return typeof initialValue === "function" ? initialValue() : initialValue;
    }

    const parsed = JSON.parse(saved);
    return deserialize ? deserialize(parsed) : parsed;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}
