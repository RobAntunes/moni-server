import { Hono } from "hono";
import { login, signout, signUp } from "../controllers/auth/auth.ts";
import type { Response } from "./types.ts";
import { kv } from "../main.ts";

export const auth = new Hono<{ Variables: Response }>();

auth.post("/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;
    const res = await signUp(email, password);
    if (res) {
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
      });
    }
  } catch (e) {
    console.log(e);
    return new Response("Internal Server Error");
  }
});

auth.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;
    const res = await login(email, password);
    if (res.status === 200) {
      const data = await res.json();
      return new Response(data, {
        status: res.status,
        statusText: res.statusText,
      });
    } else {
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
      });
    }
  } catch (e) {
    return new Response("Internal Server Error", {
      status: 500,
      statusText: "Internal Server Error",
    });
  }
});

auth.post("/signout", async (c) => {
  try {
    const body = await c.req.json();
    const res = await signout(body.id);
    console.log(res);
    const data = await res.json();
    try {
      return new Response(data.body, {
        status: res.status,
        statusText: res.statusText,
      });
    } catch (e) {
      return new Response(data.body, {
        status: res.status,
        statusText: res.statusText,
      });
    }
  } catch (e) {
    return new Response("Internal Server Error", {
      status: 500,
      statusText: "Internal Server Error",
    });
  }
});
