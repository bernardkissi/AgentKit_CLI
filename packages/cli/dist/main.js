#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const validate_1 = require("./commands/validate");
const fmt_1 = require("./commands/fmt");
const gen_schema_1 = require("./commands/gen-schema");
const lint_1 = require("./commands/lint");
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
program
    .command("fmt")
    .argument("<file>", "Agent definition file (.json|.yaml|.yml)")
    .option("--stdout", "Write formatted output to stdout", false)
    .action((file, options) => {
    const { exitCode, output } = (0, fmt_1.runFmt)(file, { stdout: !!options.stdout });
    if (output)
        process.stdout.write(output);
    process.exit(exitCode);
});
program
    .command("gen")
    .description("Generate artifacts")
    .command("schema")
    .option("--out <dir>", "Output directory", "dist")
    .action((options) => {
    const { exitCode, output } = (0, gen_schema_1.runGenSchema)({ outDir: options.out });
    if (output)
        process.stdout.write(output);
    process.exit(exitCode);
});
program
    .command("lint")
    .argument("<file>", "Agent definition file (.json|.yaml|.yml)")
    .option("--format <format>", "Output format: text|json", "text")
    .option("--strict", "Fail on warnings", false)
    .action((file, options) => {
    const format = options.format === "json" ? "json" : "text";
    const { exitCode, output } = (0, lint_1.runLint)(file, { format, strict: !!options.strict });
    process.stdout.write(output);
    process.exit(exitCode);
});
program.parse(process.argv);
//# sourceMappingURL=main.js.map