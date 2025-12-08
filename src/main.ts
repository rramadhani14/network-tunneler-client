import { program } from "commander";
import {
  JsonRpcErrrorResponse,
  JsonRpcRequest,
  JsonRpcSuccessResponse,
} from "./model/jsonrpc";
import { Config } from "./model/config";
import { handleHttp } from "./handler/httpHandler";
import { handleConfig } from "./handler/configHandler";
import { handleMethodNotFound } from "./handler/methodNotFoundHandler";

function start() {
  program
    .name("network-tunneler-client")
    .option(
      "--server-host <host>",
      "Host of the network tunneler server",
      "localhost"
    )
    .option(
      "--server-port <port>",
      "Port of the network tunneler server",
      "3000"
    )
    .option(
      "--client-port <port>",
      "Port of the network tunneler client",
      "3001"
    )
    .option(
      "--path <path>",
      "Path for the subscription endpoint of network tunneler server, start with /",
      "/tunneler/ws"
    )
    .option("--unsecure", "Disable TLS", false);

  program.parse();
  console.log(program.opts());
  let { unsecure, serverHost, serverPort, path, clientPort } = program.opts();
  const protocol = unsecure ? "ws" : "wss";
  let socket = new WebSocket(
    `${protocol}://${serverHost}:${serverPort}${path}`
  );
  socket.addEventListener("open", (event) => {
    console.log("opened");
  });

  socket.addEventListener("close", (event) => {
    console.log("closed");
  });

  socket.addEventListener("error", (event) => {
    console.log("error", event);
  });

  socket.addEventListener("message", (event) => {
    const payload = JsonRpcRequest.parse(JSON.parse(event.data));
    const { id, method, params } = payload;
    handleMethod(socket, method, id, params);
  });

  setInterval(() => {
    socket.ping();
  }, 5000);

  function handleMethod(
    socket: WebSocket,
    method: string,
    id: string,
    params: any[]
  ) {
    if (method === "config") {
      handleConfig(params[0]);
    } else if (method === "http") {
      handleHttp(socket, `localhost:${clientPort}${path}`, id, params[0]);
    } else {
      handleMethodNotFound(socket, id);
    }
  }
}

start();
