import { useCallback, useEffect, useState } from "react";
import { api, getApiErrorMessage } from "../lib/api";

export const useResource = <T, R = unknown>(
  endpoint: string,
  selector: (data: R) => T,
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<R>(endpoint);
      setData(selector(response.data));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [endpoint, selector]);

  useEffect(() => {
    let active = true;

    api
      .get<R>(endpoint)
      .then((response) => {
        if (!active) return;
        setError("");
        setData(selector(response.data));
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(getApiErrorMessage(requestError));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [endpoint, selector]);

  return { data, loading, error, reload: load };
};
