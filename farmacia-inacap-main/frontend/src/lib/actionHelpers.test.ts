import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it, vi } from "vitest";
import {
  nullable,
  numeric,
  optionalDate,
  runApiAction,
} from "./actionHelpers";
import { getApiErrorMessage } from "./api";

describe("Action Helpers & API Error Normalization (src/lib/actionHelpers.ts & src/lib/api.ts)", () => {
  it("normaliza valores de formulario con nullable, numeric y optionalDate", () => {
    expect(nullable("  Hola  ")).toBe("Hola");
    expect(nullable("   ")).toBeNull();
    expect(nullable(null)).toBeNull();

    expect(numeric("1500", 0)).toBe(1500);
    expect(numeric("invalido", 42)).toBe(42);

    expect(optionalDate(" 2026-12-31 ")).toBe("2026-12-31");
    expect(optionalDate("")).toBeNull();
  });

  it("normaliza errores de Axios y de red provenientes de src/lib/api.ts", () => {
    const config = {} as InternalAxiosRequestConfig;

    const structuredError = new AxiosError(
      "Request failed",
      "ERR_BAD_REQUEST",
      config,
      {},
      {
        status: 409,
        statusText: "Conflict",
        headers: {},
        config,
        data: {
          ok: false,
          error: { message: "Esta caja ya tiene una sesión abierta" },
        },
      },
    );
    expect(getApiErrorMessage(structuredError)).toBe(
      "Esta caja ya tiene una sesión abierta",
    );

    const flatAxiosError = new AxiosError(
      "Request failed",
      "ERR_BAD_REQUEST",
      config,
      {},
      {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
        data: { message: "Datos de entrada inválidos" },
      },
    );
    expect(getApiErrorMessage(flatAxiosError)).toBe(
      "Datos de entrada inválidos",
    );

    expect(getApiErrorMessage(new Error("Fallo de red local"))).toBe(
      "Fallo de red local",
    );
    expect(getApiErrorMessage("error desconocido")).toBe(
      "No fue posible completar la solicitud",
    );
  });

  it("ejecuta runApiAction gestionando estados busy/error y callbacks de éxito o fallo", async () => {
    const busyStates: boolean[] = [];
    let lastError = "previo";
    const onSuccess = vi.fn();

    const ok = await runApiAction(
      async () => ({ ok: true }),
      (b) => busyStates.push(b),
      (err) => {
        lastError = err;
      },
      onSuccess,
    );

    expect(ok).toBe(true);
    expect(busyStates).toEqual([true, false]);
    expect(lastError).toBe("");
    expect(onSuccess).toHaveBeenCalledOnce();

    const failBusy: boolean[] = [];
    const failed = await runApiAction(
      async () => {
        throw new Error("Stock insuficiente");
      },
      (b) => failBusy.push(b),
      (err) => {
        lastError = err;
      },
    );

    expect(failed).toBe(false);
    expect(failBusy).toEqual([true, false]);
    expect(lastError).toBe("Stock insuficiente");
  });
});
