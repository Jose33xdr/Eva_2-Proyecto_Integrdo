import { describe, expect, it } from "vitest";
import { normalizeRut, validateRut } from "../rut.js";

describe("RUT Utilities (src/utils/rut.ts)", () => {
  it("normaliza limpiando puntos, espacios y guiones manteniendo formato cuerpo-dv en mayúscula", () => {
    expect(normalizeRut(" 11.111.111-1 ")).toBe("11111111-1");
    expect(normalizeRut("12.345.678-5")).toBe("12345678-5");
    expect(normalizeRut("11.111.111-k")).toBe("11111111-K");
  });

  it("valida correctamente dígitos verificadores numéricos (0-9) y letra K", () => {
    expect(validateRut("11.111.111-1")).toBe(true);
    expect(validateRut("11111111-1")).toBe(true);
    expect(validateRut("12.345.678-5")).toBe(true);
    expect(validateRut("7.608.642-7")).toBe(true);
    expect(validateRut("6-4")).toBe(false); // demasiado corto (< 7)
    // RUT con DV = K (ej: 10.000.013-K)
    expect(validateRut("10.000.013-K")).toBe(true);
    expect(validateRut("10000013-k")).toBe(true);
    // RUT con DV = 0 (ej: 10.000.004-0)
    expect(validateRut("10.000.004-0")).toBe(true);
  });

  it("rechaza RUTs malformados, con dígito verificador incorrecto o longitud fuera de rango", () => {
    expect(validateRut("11.111.111-2")).toBe(false);
    expect(validateRut("12.345.678-K")).toBe(false);
    expect(validateRut("abc.def.ghi-1")).toBe(false);
    expect(validateRut("123-4")).toBe(false);
    expect(validateRut("1234567890-1")).toBe(false);
    expect(validateRut("")).toBe(false);
  });
});
