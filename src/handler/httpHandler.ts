import { JsonRpcSuccessResponse, JsonRpcErrrorResponse } from "../model/jsonrpc";

export async function handleHttp(socket: WebSocket, url: string, id: string, serializedRequest: string) {
    const lines = serializedRequest.split("\n");
    const startLine = lines[0]?.split(" ") ?? [];
    const method = startLine[0] ?? "GET";
    const path = startLine[1] ?? "/";
    const httpVersion = startLine[2] ?? "HTTP/1.1";
    const headersEnd = lines.indexOf("");
    const headers = lines.slice(1, headersEnd).map(it => {
        const semicolon = it.indexOf(":");
        return [it.substring(0, semicolon).trim(), it.substring(semicolon + 1).trim()]
    });
    const body = lines.slice(headersEnd).map(it => it.trim()).join("");
    console.log(method);
    console.log(path);
    console.log(headers);
    console.log(body);
    const response = await fetch(url + path , {
        method: method,
        headers: headers,
        body: ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase()) ? null: body
    });

    const serializedResponse = await serializeResponse(httpVersion, response);
    const status = response.status;
    if(status < 400) {
        socket.send(JSON.stringify(JsonRpcSuccessResponse.parse({
            jsonrpc: "2.0",
            id: id,
            result: serializedResponse
        })))
    } else {
        socket.send(JSON.stringify(JsonRpcErrrorResponse.parse({
            jsonrpc: "2.0",
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
    const headers = [...response.headers.entries()].map(it => `${it[0]}: ${it[1]}`).join("\n");
    const body = await response.text();
    return `${startLine}\n${headers}\n\n${body}\r\n`;
}