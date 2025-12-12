#!/usr/bin/env node
import { Command } from "commander";
import { runValidate } from "./commands/validate";

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

program.parse(process.argv);
