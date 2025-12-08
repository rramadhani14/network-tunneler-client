import { Config } from "../model/config";

export function handleConfig(serializedConfig: string) {
    const parsedConfig = Config.parse(JSON.parse(serializedConfig));
    console.log(`Server can be reached at host:port/${parsedConfig.path}`);
}
