import { program } from "commander";
import { JsonRpcRequest } from "./model/jsonrpc";
import { handleHttp } from "./handler/httpHandler";
import { handleConfig } from "./handler/configHandler";
import { handleMethodNotFound } from "./handler/methodNotFoundHandler";
import { EventEmitter } from "node:events";

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
  const eventEmitter = new EventEmitter();
  let retryAllowed = false;
  eventEmitter.addListener("succeed", () => {
    retryAllowed = true;
  })
  eventEmitter.addListener("reconnect", async () => {
    if(retryAllowed) {
        retryAllowed = false;
        await retryable(listen, 3, 5000)(eventEmitter);
    }
  })
  await retryable(listen, 3, 3000)(eventEmitter);
  console.log("Succeed");
}

function retryable(func: Function, time: number, delayInMs: number) {
  return async (...args: any) => {
    let counter = 0;
    while (counter < time) {
      console.log(counter);
      try {
        if (counter >= 0) {
          console.log("retrying...");
        }
        const result = await func(...args);
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

function listen(eventEmitter: EventEmitter): Promise<WebSocket> {
  function func(resolve: any, reject: any) {
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
      if (eventEmitter != null) {
        console.log("reconnecting...");
        eventEmitter.emit("succeed");
      }
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
      if (eventEmitter != null) {
        console.log("reconnecting...");
        eventEmitter.emit("reconnect");
      }
    });

    socket.addEventListener("error", (event) => {
      console.log("error", event);
      clearInterval(ping);
      reject();
      if (eventEmitter != null) {
        console.log("reconnecting...");
        eventEmitter.emit("reconnect");
      }
    });
  }

  return new Promise(func);
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
