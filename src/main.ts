import { program } from "commander"

program
.name("network-tunneler-client")
.option("--host <host>", "Host of the network-tunneler server", "localhost")
.option("--port <port>", "Port of the network-tunneler server", "3000")
.option("--unsecure", "Disable TLS", false);

program.parse();
console.log(program.opts())
let { unsecure, host, port } = program.opts();
const protocol = unsecure ? "ws" : "wss";
const socket = new WebSocket(`${protocol}://${host}:${port}/ws`);

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
    console.log(event);
});

setInterval(() => {
    socket.ping()
}, 5000)