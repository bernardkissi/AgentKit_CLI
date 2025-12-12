#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const validate_1 = require("./commands/validate");
const program = new commander_1.Command();
program
    .name("agentkit")
    .description("AgentKit CLI")
    .version("0.1.0");
program
    .command("validate")
    .argument("<file>", "Agent definition file (.json|.yaml|.yml)")
    .option("--format <format>", "Output format: text|json", "text")
    .option("--strict", "Treat warnings as errors", false)
    .action((file, options) => {
    const format = (options.format === "json") ? "json" : "text";
    const { exitCode, output } = (0, validate_1.runValidate)(file, { format, strict: !!options.strict });
    process.stdout.write(output);
    process.exit(exitCode);
});
program.parse(process.argv);
//# sourceMappingURL=main.js.map