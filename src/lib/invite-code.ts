import { randomBytes } from "node:crypto";

// 16 bytes geram 32 caracteres hexadecimais imprevisíveis.
export function criarCodigoConvite(): string {
  return randomBytes(16).toString("hex");
}
