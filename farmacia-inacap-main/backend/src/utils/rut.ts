// backend/src/utils/rut.ts
const cleanRut = (rut: string): string => {
  return rut.replace(/\./g, "").replace(/-/g, "").trim().toUpperCase();
};

export const normalizeRut = (rut: string): string => {
  const clean = cleanRut(rut);
  if (clean.length < 2) return clean;
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
};

export const validateRut = (rut: string): boolean => {
  const clean = cleanRut(rut);
  if (clean.length < 7 || clean.length > 9) return false;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);

  if (!/^\d+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body.charAt(i)) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDvNumber = 11 - (sum % 11);
  let expectedDv = "";
  if (expectedDvNumber === 11) expectedDv = "0";
  else if (expectedDvNumber === 10) expectedDv = "K";
  else expectedDv = expectedDvNumber.toString();

  return dv === expectedDv;
};
