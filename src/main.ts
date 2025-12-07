import { program } from "commander"
import { JsonRpcErrrorResponse, JsonRpcRequest, JsonRpcSuccessResponse } from "./models/jsonrpc";
import { Config } from "./models/config";

program
.name("network-tunneler-client")
.option("--server-host <host>", "Host of the network tunneler server", "localhost")
.option("--server-port <port>", "Port of the network tunneler server", "3000")
.option("--client-port <port>", "Port of the network tunneler client", "3001")
.option("--path <path>", "Path for the subscription endpoint of network tunneler server, start with /", "/tunneler/ws")
.option("--unsecure", "Disable TLS", false);

program.parse();
console.log(program.opts())
let { unsecure, serverHost, serverPort, path, clientPort } = program.opts();
const protocol = unsecure ? "ws" : "wss";
const socket = new WebSocket(`${protocol}://${serverHost}:${serverPort}${path}`);
socket.addEventListener("open", (event => {
    console.log("opened");
}))

socket.addEventListener("close", (event) => {
    console.log("closed");
})

socket.addEventListener("error", (event) => {
    console.log("error", event);
})

socket.addEventListener("message", (event) => {
    const payload = JsonRpcRequest.parse(JSON.parse(event.data));
    const { id, method, params } = payload;
    handleMethod(socket, method, id, params); 

});

setInterval(() => {
    socket.ping()
}, 5000)

function handleMethod(socket: WebSocket, method: string, id: string, params: any[]) {
    if(method === "config") {
        handleConfig(params[0]);
    } else if (method === "http") {
        handleHttp(socket, id, params[0]);
    } else {
        socket.send(JSON.stringify(JsonRpcErrrorResponse.parse({
            jsonrpc: "2.0",
            id: id,
            error: {
                code: -32601
            }
        })))
    }
}

function handleConfig(serializedConfig: string) {
    const parsedConfig = Config.parse(JSON.parse(serializedConfig));
    console.log(`Server can be reached at host:port/${parsedConfig.path}`);
}

async function handleHttp(socket: WebSocket, id: string, serializedRequest: string) {
    const lines = serializedRequest.split("\n");
    const startLine = lines[0]?.split(" ") ?? [];
    const method = startLine[0] ?? "GET";
    const path = startLine[1] ?? "/";
    const httpVersion = startLine[2] ?? "HTTP/1.1";
    const headersEnd = lines.indexOf("");
    const headers = lines.slice(1, headersEnd).map(it => it.split(':').map(it => it.trim()));
    const body = lines.slice(headersEnd).map(it => it.trim()).join();
    const response = await fetch(`localhost:${clientPort}${path}`, {
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
                // code: z.string(),
                //         message: z.string().optional(),
                //         data: z.string().optional()
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