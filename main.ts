import * as hono from "jsr:@hono/hono";
import { MongoClient } from "npm:mongodb";
import { auth } from "./routes/routes.ts";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/authMiddleware.ts";
import "jsr:@std/dotenv/load";

const app = new hono.Hono();

export const db = new MongoClient("mongodb://127.0.0.1:27017").db(
  "financial-app"
);

export const kv =  await Deno.openKv();
export const secret = Deno.env.get("JWT_SECRET") as string;
export const prvk = new TextEncoder().encode(secret);



app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.use("/*", cors());
app.use(authMiddleware)
app.route("/auth", auth);

Deno.serve(app.fetch);
