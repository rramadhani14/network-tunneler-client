import { program } from "commander";
import { Config } from "../model/config";

export function handleConfig(serializedConfig: string) {
    const parsedConfig = Config.parse(JSON.parse(serializedConfig));
    const { serverHost, serverPort, path, unsecure } = program.opts();
    console.log(`Server can be reached at ${serverHost}:${serverPort}/${parsedConfig.path}`);
}
