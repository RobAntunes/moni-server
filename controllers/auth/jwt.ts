import * as jose from "npm:jose";
import { prvk } from "../../main.ts";

export const genTokens = async (userId: string) => {
  const access = await createJWT({ sub: userId }, "5mins");
  const refresh = await createJWT({ sub: userId }, "7days");

  return {
    access,
    refresh,
  };
};

export async function createJWT(
  payload: jose.JWTPayload,
  exp: "5mins" | "7days" | "14days" | "30days"
): Promise<string> {
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("moni")
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(prvk);
  console.log("JWT created:", jwt);
  return jwt;
}

export async function verifyJWT(
  token: string
): Promise<jose.JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, prvk)
    console.log("JWT is valid:", payload);
    return payload;
  } catch (error) {
    console.error("Invalid JWT:", error);
    return null;
  }
}
