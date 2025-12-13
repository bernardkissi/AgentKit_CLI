# AgentKit Monorepo — Stage 1

Stage 1 implements:
- JSON/YAML parsing
- Structural validation via Zod (E_SCHEMA_INVALID)
- CLI wiring for `agentkit validate <file>`

No semantic validation or static analysis yet.

## Usage

```bash
pnpm install
pnpm -r build
pnpm test

# fmt
pnpm --filter @agentkit/cli dev -- fmt fixtures/valid/format_me.json --stdout

# gen schema
pnpm --filter @agentkit/cli dev -- gen schema --out dist
cat dist/agent-definition.schema.json | head

# lint
pnpm --filter @agentkit/cli dev -- lint fixtures/warnings/lint_warnings.json --format json
pnpm --filter @agentkit/cli dev -- lint fixtures/warnings/lint_warnings.json --format json --strict
```