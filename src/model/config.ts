import z from "zod";


export const Config = z.object({
    path: z.string()
})