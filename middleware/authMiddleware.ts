import { db, kv, prvk, secret } from "../main.ts";
import { genTokens } from "../controllers/auth/jwt.ts";
import { Next, Context } from "hono";
import { decodeJwt } from "jose/jwt/decode";
import { jwtVerify } from "jose";

export const authMiddleware = async (
  c: Context<{ Variables: any }>,
  next: Next
) => {
  try {
    console.log((await c.req.json()));
    const {email, password}: any = (await c.req.json())
    console.log(email, password)
    const id = (await db.collection("users").findOne({ email: { $eq: email } }))
      ?.id;
    if (!id) {
      await next();
      return;
    }
    const accessToken = (await kv.get([`${id}_access-token`])).value as string;
    console.log(accessToken)
    if (!accessToken) {
      await next();
      return;
    }
    const { sub, exp } = (await jwtVerify(accessToken, prvk)).payload;
    const now = Math.floor(Date.now() / 1000);

    if (exp && exp < now) {
      // Access token has expired
      const refresh = await kv.get([`${sub}_refresh-token`]);

      if (refresh && refresh.value) {
        // Refresh token exists
        try {
          const { exp: refreshExp } = (
            await jwtVerify(refresh.value as string, prvk)
          ).payload;
          if (refreshExp && refreshExp < now) {
            // Refresh token also expired
            throw new Error("Refresh token expired");
          }

          // Refresh the tokens
          const tokens = await genTokens(sub as string);
          await kv.set([`${sub}_access-token`], tokens.access);
          await kv.set([`${sub}_refresh-token`], tokens.refresh);

          await next();
          return;
        } catch (e) {
          console.error("Error refreshing token:", e);
          c.status(401);
          return;
        }
      } else {
        // No refresh token (possible first-time login after signup)
        c.status(401);
        return c.redirect("/auth/login");
      }
    } else {
      // Access token is valid
      const access = await kv.get([`${sub}_access-token`]);
      if (access.value === accessToken) {
        await next();
        return;
      } else {
        // Access token mismatch (possible tampering)
        c.status(401);
        return c.redirect("/auth/login");
      }
    }
  } catch (e) {
    console.error("Error validating access token:", e);
    c.status(401);
    return c.redirect("/auth/login");
  }
};
