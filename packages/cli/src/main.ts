#!/usr/bin/env node
import { Command } from "commander";
import { runValidate } from "./commands/validate";
import { runFmt } from "./commands/fmt";
import { runGenSchema } from "./commands/gen-schema";
import { runLint } from "./commands/lint";
import { runRules } from "./commands/rules";
import { runBundlePack, runBundleVerify } from "./commands/bundle";
import { runAdmit } from "./commands/admit";

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
  .option("--policy <policy>", "Validation policy: default|strict|runtime|ci", "default")
  .action(async (file: string, options: any) => {
    const format = (options.format === "json") ? "json" : "text";
    const policy = options.strict ? "strict" : options.policy;
    const { exitCode, output } = await runValidate(file, { format, policy });
    process.stdout.write(output);
    process.exit(exitCode);
  });

program
  .command("format")
  .description("Format agent definition files")
  .argument("<file>", "Agent definition file (.json|.yaml|.yml)")
  .option("--stdout", "Write formatted output to stdout", false)
  .action((file: string, options: any) => {
    const { exitCode, output } = runFmt(file, { stdout: !!options.stdout });
    if (output) process.stdout.write(output);
    process.exit(exitCode);
  });

program
  .command("generate")
  .description("Generate artifacts")
  .command("schema")
  .option("--out <dir>", "Output directory", "dist")
  .option("--project <dir>", "Project directory", process.cwd())
  .option("--core-only", "Generate only the core schema", false)
  .option("--plugins-only", "Generate only plugin schemas and index (core emitted if missing)", false)
  .option("--include-builtins", "Include built-in step registry in the plugin index", true)
  .option("--emit-builtins-plugin", "Emit built-in steps as a plugin schema file", false)
  .option("--generated-at", "Include generatedAt timestamp in schema.index.json", false)
  .action(async (options: any) => {
    const { exitCode, output } = await runGenSchema({
      outDir: options.out,
      projectDir: options.project,
      coreOnly: options.coreOnly,
      pluginsOnly: options.pluginsOnly,
      includeBuiltins: options.includeBuiltins,
      emitBuiltinsPlugin: options.emitBuiltinsPlugin,
      noGeneratedAt: !options.generatedAt,
    });
    if (output) process.stdout.write(output);
    process.exit(exitCode);
  });

program
  .command("lint")
  .argument("<file>", "Agent definition file (.json|.yaml|.yml)")
  .option("--format <format>", "Output format: text|json", "text")
  .option("--strict", "Fail on warnings", false)
  .option("--policy <policy>", "Validation policy: default|strict|runtime|ci", "default")
  .action((file: string, options: any) => {
    const format = options.format === "json" ? "json" : "text";
    const policy = options.strict ? "strict" : options.policy;
    const { exitCode, output } = runLint(file, { format, policy });
    process.stdout.write(output);
    process.exit(exitCode);
  });

program
  .command("rules")
  .description("Show validation rules")
  .option("--code <code>", "Show details for a single rule code")
  .action((options: any) => {
    const { exitCode, output } = runRules({ code: options.code });
    process.stdout.write(output);
    process.exit(exitCode);
  });

const bundle = program.command("bundle").description("Signed bundle operations");

bundle
  .command("pack")
  .description("Pack agent definition into .agentkit bundle")
  .argument("<agentfile>", "Agent definition file (.json|.yaml|.yml)")
  .option("--out <file>", "Output .agentkit bundle path", "agent.bundle.agentkit")
  .action(async (agentfile: string, options: any) => {
    const { exitCode, output } = await runBundlePack(agentfile, options.out);
    if (output) process.stdout.write(output);
    process.exit(exitCode);
  });

bundle
  .command("verify")
  .description("Verify .agentkit bundle")
  .argument("<bundle>", "Path to .agentkit bundle")
  .action(async (bundlePath: string) => {
    const { exitCode, output } = await runBundleVerify(bundlePath);
    if (output) process.stdout.write(output);
    process.exit(exitCode);
  });

program
  .command("admit")
  .description("Admit agent definition files")
  .argument("<input>", "Agent definition file or .agentkit bundle")
  .option("--policy <policy>", "Validation policy: runtime|ci|default", "runtime")
  .action(async (input: string, options: any) => {
    const policy = options.policy || "runtime";
    const { exitCode, output } = await runAdmit(input, policy);
    if (output) process.stdout.write(output);
    process.exit(exitCode);
  });

program.parse(process.argv);
