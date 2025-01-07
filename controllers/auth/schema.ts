import zod from "npm:zod"
import { db } from "../../main.ts";


export const userSchema = zod.object({
    id: zod.string().optional(),
    email: zod.string().email("Invalid email or password."),
    password: zod.string().min(8, "Password must have a minimum of 8 characters.")
})