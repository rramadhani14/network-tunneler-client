import z from "zod";

export const JsonRpcRequest = z.object({
    jsonrpc: z.string("2.0").readonly(),
    method: z.string(),
    params: z.array(z.any()),
    id: z.string()
});

export const JsonRpcSuccessResponse = z.object({
    jsonrpc: z.string("2.0").readonly(),
    result: z.object(),
    id: z.object()
});

export const JsonRpcErrrorResponse = z.object({
    jsonrpc: z.string("2.0").readonly(),
    error: z.object({
        code: z.string(),
        message: z.string().optional(),
        data: z.string().optional()
    }),
    id: z.string()
})