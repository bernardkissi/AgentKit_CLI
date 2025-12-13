#!/usr/bin/env node
import { Command } from "commander";
import { runValidate } from "./commands/validate";
import { runFmt } from "./commands/fmt";
import { runGenSchema } from "./commands/gen-schema";
import { runLint } from "./commands/lint";
import { runRules } from "./commands/rules";

const program = new Command();

program
  .name("agentkit")
  .description("AgentKit CLI")
  .version("0.1.0");

program
  .command("validate")
  .argument("<file>", "Agent definition file (.json|.yaml|.yml)")
  .option("--format <format>", "Output format: text|json", "text")
  .option("--strict", "Treat warnings as errors", false)
  .action((file: string, options: any) => {
    const format = (options.format === "json") ? "json" : "text";
    const { exitCode, output } = runValidate(file, { format, strict: !!options.strict });
    process.stdout.write(output);
    process.exit(exitCode);
  });

program
  .command("fmt")
  .argument("<file>", "Agent definition file (.json|.yaml|.yml)")
  .option("--stdout", "Write formatted output to stdout", false)
  .action((file: string, options: any) => {
    const { exitCode, output } = runFmt(file, { stdout: !!options.stdout });
    if (output) process.stdout.write(output);
    process.exit(exitCode);
  });

program
  .command("gen")
  .description("Generate artifacts")
  .command("schema")
  .option("--out <dir>", "Output directory", "dist")
  .action((options: any) => {
    const { exitCode, output } = runGenSchema({ outDir: options.out });
    if (output) process.stdout.write(output);
    process.exit(exitCode);
  });

program
  .command("lint")
  .argument("<file>", "Agent definition file (.json|.yaml|.yml)")
  .option("--format <format>", "Output format: text|json", "text")
  .option("--strict", "Fail on warnings", false)
  .action((file: string, options: any) => {
    const format = options.format === "json" ? "json" : "text";
    const { exitCode, output } = runLint(file, { format, strict: !!options.strict });
    process.stdout.write(output);
    process.exit(exitCode);
  });

program
  .command("rules")
  .option("--code <code>", "Show details for a single rule code")
  .action((options: any) => {
    const { exitCode, output } = runRules({ code: options.code });
    process.stdout.write(output);
    process.exit(exitCode);
  });
program.parse(process.argv);
