import { describe, expect, it } from "vitest";
import {
  getPagination,
  paginationMeta,
  paginationSchema,
} from "../pagination.js";

describe("Pagination Utilities (src/utils/pagination.ts)", () => {
  it("calcula exactamente skip y take para Prisma según página y límite", () => {
    expect(getPagination(1, 20)).toEqual({ skip: 0, take: 20 });
    expect(getPagination(2, 20)).toEqual({ skip: 20, take: 20 });
    expect(getPagination(3, 15)).toEqual({ skip: 30, take: 15 });
  });

  it("aplica valores por defecto ante parámetros vacíos en paginationSchema", () => {
    const parsed = paginationSchema.parse({});
    expect(parsed).toEqual({
      page: 1,
      limit: 20,
      search: undefined,
    });
  });

  it("impone límites mínimos y máximos por página (1 a 100) y limpia el término de búsqueda", () => {
    const valid = paginationSchema.parse({
      page: "2",
      limit: "50",
      search: "  paracetamol  ",
    });
    expect(valid).toEqual({
      page: 2,
      limit: 50,
      search: "paracetamol",
    });

    expect(() => paginationSchema.parse({ page: 0 })).toThrow();
    expect(() => paginationSchema.parse({ limit: 0 })).toThrow();
    expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
  });

  it("construye metadatos de paginación asegurando al menos 1 página cuando total es 0", () => {
    expect(paginationMeta(1, 20, 0)).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      pages: 1,
    });

    expect(paginationMeta(2, 10, 45)).toEqual({
      page: 2,
      limit: 10,
      total: 45,
      pages: 5,
    });
  });
});
