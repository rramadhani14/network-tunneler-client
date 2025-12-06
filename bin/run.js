#!/usr/bin/env node


import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const executablePath = join(__dirname, "../dist", "network-tunneler-client");
const result = spawnSync(executablePath, process.argv.slice(2), {
    stdio: "inherit"
});

process.exit(result.status ?? 0);