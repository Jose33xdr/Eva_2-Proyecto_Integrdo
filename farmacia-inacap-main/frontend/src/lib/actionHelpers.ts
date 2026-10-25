import { getApiErrorMessage } from "./api";
import { notify } from "./notify";

export const nullable = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

export const numeric = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const optionalDate = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

export const runApiAction = async (
  action: () => Promise<unknown>,
  setBusy: (value: boolean) => void,
  setError: (value: string) => void,
  onSuccess?: () => void | Promise<void>,
  successMessage?: string,
) => {
  setBusy(true);
  setError("");
  try {
    await action();
    await onSuccess?.();
    if (successMessage) notify(successMessage);
    return true;
  } catch (error) {
    setError(getApiErrorMessage(error));
    return false;
  } finally {
    setBusy(false);
  }
};
