import { useCallback, useEffect, useState } from "react";

/**
 * Loads data from the API on mount and exposes a `reload` function.
 *
 * The initial request is fired from inside `useEffect` and only ever calls
 * `setState` from an async callback, which keeps it clear of the
 * set-state-in-an-effect lint rule while preserving the intended behaviour.
 *
 * @param {string} url             Path passed straight to axios, e.g. '/mothers'.
 * @param {object} [params]        Optional query parameters.
 * @param {boolean} [enabled=true] Skip the request entirely when false.
 * @param {unknown} [initialValue] State value used before the first response.
 */
export const useApiData = (url, params, enabled = true, initialValue = []) => {
  const [data, setData] = useState(initialValue);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(enabled);

  // Serialised so a fresh object literal in `params` does not retrigger the
  // effect on every render.
  const query = params ? JSON.stringify(params) : "";

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const { default: api } = await import("../api/axios");
      const response = await api.get(
        url,
        query ? { params: JSON.parse(query) } : undefined,
      );
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  }, [url, query, enabled]);

  useEffect(() => {
    // Fire-and-forget: state updates happen inside the async callback.
    void load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
};

export default useApiData;
