import { db, kv } from "../../main.ts";
import { userSchema } from "./schema.ts";
import { scrypt } from "@noble/hashes/scrypt";
import {
  randomBytes,
  bytesToHex,
  hexToBytes,
  utf8ToBytes,
} from "@noble/hashes/utils";
import { Document, ObjectId, WithId } from "npm:mongodb";
import { genTokens } from "./jwt.ts";

export const signUp = async (email: string, pw: string) => {
  if (!email || !pw) {
    return new Response("Email and password are required.");
  }
  const id = bytesToHex(ObjectId.generate());
  const valid = userSchema.safeParse({
    id,
    email,
    password: pw,
  });
  if (!valid.data) {
    return new Response("Invalid email or password.", {
      status: 400,
      statusText: "Invalid email or password",
    });
  }
  const users = db.collection("users");
  const exists = await users.findOne({ email: { $eq: valid.data.email } });
  if (exists) {
    return new Response("User already exists.", {
      status: 409,
      statusText: "User already exists.",
    });
  }

  const params = { N: 2 ** 17, r: 8, p: 1, dkLen: 32 };
  const salt = randomBytes(16);
  const hashed = scrypt(valid.data.password, salt, params);
  const hex = bytesToHex(hashed);
  const hexedSalt = bytesToHex(salt);

  await users.insertOne({
    id: valid.data.id,
    email: valid.data.email,
    password: hex,
    salt: hexedSalt,
    params,
  });
  try {
    const tokens = await genTokens(id);
    console.log(tokens);
    await kv.set([`${id}_access-token`], tokens.access);
    await kv.set([`${id}_refresh-token`], tokens.refresh);
    console.log(tokens);
    return new Response(JSON.stringify({ id, email }), {
      status: 201,
    });
  } catch (e) {
    console.log(e);
  }
};

export const login = async (email: string, pw: string) => {
  console.log(email, pw);
  const valid = userSchema.safeParse({
    email,
    password: pw,
  });
  console.log(valid);
  if (valid.success) {
    const users = db.collection("users");
    const exists: WithId<Document> | null = await users.findOne({
      email: { $eq: valid.data.email },
    });
    if (!exists) {
      return new Response("User does not exist.", {
        status: 404,
        statusText: "Not Found",
      });
    }

    const { password, salt, params } = exists;
    console.log(salt, valid.data.password, params);
    const bytespw = utf8ToBytes(valid.data.password);
    const bytesalt = hexToBytes(salt);
    const hashed = scrypt(bytespw, bytesalt, params);
    const hex = bytesToHex(hashed);
    const data = {
      id: exists.id,
      email: exists.email,
    };

    return password === hex
      ? new Response(JSON.stringify(data), { status: 200, statusText: "" })
      : new Response("Invalid email or password.", {
          status: 404,
          statusText: "Not Found",
        });
  }
  return new Response("Invalid email or password.", {
    status: 400,
    statusText: "Invalid email or password.",
  });
};

export const signout = async (id: string) => {
  try {
    await kv.delete([`${id}_access-token`]);
    await kv.delete([`${id}_refresh-token`]);
    return new Response("OK", {
      status: 200,
      statusText: "OK",
    });
  } catch (e) {
    return new Response("Internal Server Error", {
      status: 500,
      statusText: "Internal Server Error",
    });
  }
};
