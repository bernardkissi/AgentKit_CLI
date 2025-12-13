import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { runValidate } from '../src/commands/validate';
import { runFmt } from "../src/commands/fmt";
import { runLint } from "../src/commands/lint";

const root = path.resolve(__dirname, '../../..');
const validFile = path.join(root, 'fixtures/valid/example.json');
const dupId = path.join(root, 'fixtures/invalid/duplicate_step_id.json');
const exprParse = path.join(root, 'fixtures/invalid/expr_parse_error.json');
const exprNs = path.join(root, 'fixtures/invalid/expr_namespace_error.json');

// reference fixtures
const outRef = path.join(root, "fixtures/invalid/output_reference_invalid.json");
const unreachable = path.join(root, "fixtures/warnings/unreachable_step.json");
const cycle = path.join(root, "fixtures/invalid/cycle_detected.json");
const unknownType = path.join(root, "fixtures/invalid/unknown_step_type.json");
const invalidParams = path.join(root, "fixtures/invalid/invalid_step_params.json");
const lintWarnings = path.join(root, "fixtures/warnings/lint_warnings.json");
// invalid fixtures
const missingEntry = path.join(root, 'fixtures/invalid/entrypoint_missing.json');
const missingTarget = path.join(root,'fixtures/invalid/flow_target_missing.json');
const missingConn = path.join(root, 'fixtures/invalid/connection_missing.json');

describe('agentkit validate (stage 1)', () => {
	it('passes valid fixture', () => {
		const res = runValidate(validFile, { format: 'json', strict: false });
		expect(res.exitCode).toBe(0);
		const findings = JSON.parse(res.output).findings;
		const errors = findings.filter((f: any) => f.severity === "error");
		expect(errors).toHaveLength(0);
	});

	it('fails invalid json', () => {
		const tmp = path.join(root, 'fixtures/invalid/bad.json');
		const res = runValidate(tmp, { format: 'json', strict: false });
		expect([1, 2]).toContain(res.exitCode);
	});

	it('flags duplicate step ids', () => {
		const res = runValidate(dupId, { format: 'json', strict: false });
		expect(res.exitCode).toBe(1);
		const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
		expect(codes).toContain('E_STEP_ID_DUPLICATE');
	});

	it('flags missing entrypoint', () => {
		const res = runValidate(missingEntry, { format: 'json', strict: false });
		expect(res.exitCode).toBe(1);
		const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
		expect(codes).toContain('E_FLOW_ENTRYPOINT_MISSING');
	});

	it('flags missing flow target', () => {
		const res = runValidate(missingTarget, { format: 'json', strict: false });
		expect(res.exitCode).toBe(1);
		const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
		expect(codes).toContain('E_FLOW_TARGET_MISSING');
	});

	it('flags missing connection', () => {
		const res = runValidate(missingConn, { format: 'json', strict: false });
		expect(res.exitCode).toBe(1);
		const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
		expect(codes).toContain('E_CONNECTION_MISSING');
	});
	it('flags expression parse errors', () => {
		const res = runValidate(exprParse, { format: 'json', strict: false });
		expect(res.exitCode).toBe(1);
		const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
		expect(codes).toContain('E_EXPR_PARSE');
	});

	it('flags illegal expression namespaces', () => {
		const res = runValidate(exprNs, { format: 'json', strict: false });
		expect(res.exitCode).toBe(1);
		const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
		expect(codes).toContain('E_EXPR_NAMESPACE');
	});

	it("flags invalid output references", () => {
		const res = runValidate(outRef, { format: "json", strict: false });
		expect(res.exitCode).toBe(1);
		const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
		expect(codes).toContain("E_OUTPUT_REFERENCE_INVALID");
	  });

	  it("flags unknown step types", () => {
		const res = runValidate(unknownType, { format: "json", strict: false });
		expect(res.exitCode).toBe(1);
		const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
		expect(codes).toContain("E_STEP_TYPE_UNKNOWN");
	  });

	  it("flags invalid step params", () => {
		const res = runValidate(invalidParams, { format: "json", strict: false });
		expect(res.exitCode).toBe(1);
		const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
		expect(codes).toContain("E_STEP_PARAMS_INVALID");
	  });
	  
	  it("warns on unreachable step (non-strict)", () => {
		const res = runValidate(unreachable, { format: "json", strict: false });
		expect(res.exitCode).toBe(0);
		const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
		expect(codes).toContain("W_UNREACHABLE_STEP");
	  });
	  
	  it("fails on unreachable step in strict mode", () => {
		const res = runValidate(unreachable, { format: "json", strict: true });
		expect(res.exitCode).toBe(1);
	  });

	  it("fails warnings fixture in strict mode", () => {
		const res = runValidate(lintWarnings, { format: "json", policy: "strict" });
		expect(res.exitCode).toBe(1);
	  });
	  
	  it("flags cycles", () => {
		const res = runValidate(cycle, { format: "json", strict: false });
		expect(res.exitCode).toBe(1);
		const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
		expect(codes).toContain("E_CYCLE_DETECTED");
	  });
});

describe("agentkit fmt and lint", () => {
	it("formats JSON deterministically to stdout", () => {
		const res = runFmt(path.join(root, "fixtures/valid/format_me.json"), { stdout: true });
		expect(res.exitCode).toBe(0);
		expect(res.output).toBeDefined();
		const out = res.output!;
		// pretty printed with newlines/indentation
		expect(out.startsWith('{\n  "flow"')).toBe(true);
		expect(out.trimEnd().endsWith("}")).toBe(true);
		const parsed = JSON.parse(out);
		expect(Object.keys(parsed)).toEqual([
			"flow",
			"id",
			"kind",
			"name",
			"schema_version",
			"steps",
			"template_version",
			"trigger"
		]);
	});

	it("lint returns warnings and strict policy fails", () => {
		const file = lintWarnings;
		const res = runLint(file, { format: "json", policy: "default" });
		expect(res.exitCode).toBe(0);
		const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
		expect(codes).toEqual(expect.arrayContaining([
			"W_NO_DESCRIPTION",
			"W_NO_METADATA_OWNER",
			"W_MISSING_ERROR_HANDLING",
			"W_ACTION_NO_IDEMPOTENCY"
		]));

		const strict = runLint(file, { format: "json", policy: "strict" });
		expect(strict.exitCode).toBe(1);
	});
});
