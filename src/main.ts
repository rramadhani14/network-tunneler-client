import { program } from "commander"
import { JsonRpcErrrorResponse, JsonRpcRequest } from "./models/jsonrpc";

program
.name("network-tunneler-client")
.option("--host <host>", "Host of the network tunneler server", "localhost")
.option("--port <port>", "Port of the network tunneler server", "3000")
.option("--path <path>", "Path for the subscription endpoint of network tunneler server, start with /", "/tunneler/ws")
.option("--unsecure", "Disable TLS", false);

program.parse();
console.log(program.opts())
let { unsecure, host, port, path } = program.opts();
const protocol = unsecure ? "ws" : "wss";
const socket = new WebSocket(`${protocol}://${host}:${port}${path}`);

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
        setConfig(params[0]);
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

function setConfig(serializedConfig: string) {
    const parsedConfig = JSON.parse(serializedConfig);
    console.log(parsedConfig);
}