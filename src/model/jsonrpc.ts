import z from "zod";

export const JsonRpcRequest = z.object({
    jsonrpc: z.string("2.0").readonly(),
    method: z.string(),
    params: z.array(z.any()),
    id: z.string()
});

export const JsonRpcSuccessResponse = z.object({
    jsonrpc: z.string("2.0").readonly(),
    result: z.any().optional(),
    id: z.string()
});

export const JsonRpcErrrorResponse = z.object({
    jsonrpc: z.string("2.0").readonly(),
    error: z.object({
        code: z.number(),
        message: z.string().optional(),
        data: z.any().optional()
    }),
    id: z.string()
})