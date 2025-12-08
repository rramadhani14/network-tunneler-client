import { JsonRpcSuccessResponse, JsonRpcErrrorResponse } from "../model/jsonrpc";

export async function handleHttp(socket: WebSocket, url: string, id: string, serializedRequest: string) {
    const lines = serializedRequest.split("\n");
    const startLine = lines[0]?.split(" ") ?? [];
    const method = startLine[0] ?? "GET";
    const path = startLine[1] ?? "/";
    const httpVersion = startLine[2] ?? "HTTP/1.1";
    const headersEnd = lines.indexOf("");
    const headers = lines.slice(1, headersEnd).map(it => it.split(':').map(it => it.trim()));
    const body = lines.slice(headersEnd).map(it => it.trim()).join();
    const response = await fetch(url, {
        method: method,
        headers: headers,
        body: body
    });

    const serializedResponse = await serializeResponse(httpVersion, response);
    const status = response.status;
    if(status < 400) {
        socket.send(JSON.stringify(JsonRpcSuccessResponse.parse({
            id: id,
            result: serializedResponse
        })))
    } else {
        socket.send(JSON.stringify(JsonRpcErrrorResponse.parse({
            id: id,
            error: {
                code: -32000,
                message: response.statusText,
                data: serializedResponse
            }
        })))
    }
}

async function serializeResponse(httpVersion: string, response: Response) {
    const startLine = `${httpVersion} ${response.status} ${response.statusText}`;
    const headers = [...response.headers.entries()].map(it => `${it[0]}: ${it[1]}`);
    const body = await response.text();
    return `${startLine}\n${headers}\n\n${body}\r\n`;
}