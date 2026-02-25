import { useState, useCallback } from 'react';

interface FetchState {
  loading: boolean;
  error: string | null;
}

export function useFetchConfig(onConfig: (config: Record<string, unknown>, name: string) => void) {
  const [state, setState] = useState<FetchState>({ loading: false, error: null });

  const fetchByModelName = useCallback(async (modelName: string) => {
    const trimmed = modelName.trim();
    if (!trimmed) return;

    setState({ loading: true, error: null });
    try {
      const url = `https://huggingface.co/${trimmed}/resolve/main/config.json`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch config: ${res.status} ${res.statusText}`);
      }
      const config = await res.json();
      setState({ loading: false, error: null });
      onConfig(config, trimmed);
    } catch (err) {
      setState({ loading: false, error: (err as Error).message });
    }
  }, [onConfig]);

  const parseJsonInput = useCallback((jsonStr: string) => {
    setState({ loading: false, error: null });
    try {
      const config = JSON.parse(jsonStr);
      if (typeof config !== 'object' || config === null || Array.isArray(config)) {
        throw new Error('Config must be a JSON object');
      }
      onConfig(config, config.model_type || 'custom');
    } catch (err) {
      setState({ loading: false, error: (err as Error).message });
    }
  }, [onConfig]);

  return { ...state, fetchByModelName, parseJsonInput };
}
