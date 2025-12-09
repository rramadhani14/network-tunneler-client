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

async function start() {
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
  await retryable(listen, 3, 3000)();
}

function retryable(func: Function, time: number, delayInMs: number) {
  return async () => {
    let counter = 0;
    while (counter < time) {
      console.log(counter);
      try {
        if (counter >= 0) {
          console.log("retrying...");
        }
        const result = await func();
        if (result != null || counter >= time) {
          return result;
        }
      } catch (e) {
        console.log("Failed to run function: " + func.name);
      } finally {
        counter++;
        let wait = new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(null);
          }, delayInMs);
        });
        await wait;
      }
    }
  };
}

function listen(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const { serverHost, serverPort, path, unsecure } = program.opts();
    const protocol = unsecure ? "ws" : "wss";
    let socket = new WebSocket(
      `${protocol}://${serverHost}:${serverPort}${path}`
    );
    const ping = setInterval(() => {
      socket.ping();
    }, 5000);

    socket.addEventListener("open", (event) => {
      console.log("opened");
      socket.addEventListener("message", (event) => {
        const payload = JsonRpcRequest.parse(JSON.parse(event.data));
        const { id, method, params } = payload;
        console.log(payload);
        handleMethod(socket, method, id, params);
      });
      resolve(socket);
    });

    socket.addEventListener("close", (event) => {
      console.log("closed");
      clearInterval(ping);
      reject();
    });

    socket.addEventListener("error", (event) => {
      console.log("error", event);
      clearInterval(ping);
      reject();
    });
  });
}

function handleMethod(
  socket: WebSocket,
  method: string,
  id: string,
  params: any[]
) {
  let { clientPort, path } = program.opts();
  if (method === "config") {
    handleConfig(params[0]);
  } else if (method === "http") {
    handleHttp(socket, `localhost:${clientPort}`, id, params[0]);
  } else {
    handleMethodNotFound(socket, id);
  }
}

start();
