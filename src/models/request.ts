import z from "zod";


export const HttpRequest = z.object({
    type: z.string("http").readonly(),
    request: z.string()
})