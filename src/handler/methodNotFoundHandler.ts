import { JsonRpcErrrorResponse } from "../model/jsonrpc";

export function handleMethodNotFound(socket: WebSocket, id: string) {
    socket.send(JSON.stringify(JsonRpcErrrorResponse.parse({
            jsonrpc: "2.0",
            id: id,
            error: {
                code: -32601
            }
        })))
}