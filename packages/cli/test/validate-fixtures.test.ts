import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { runValidate } from '../src/commands/validate';

const root = path.resolve(__dirname, '../../..');
const validFile = path.join(root, 'fixtures/valid/example.json');
const dupId = path.join(root, 'fixtures/invalid/duplicate_step_id.json');
const exprParse = path.join(root, 'fixtures/invalid/expr_parse_error.json');
const exprNs = path.join(root, 'fixtures/invalid/expr_namespace_error.json');

// reference fixtures
const outRef = path.join(root, "fixtures/invalid/output_reference_invalid.json");
const unreachable = path.join(root, "fixtures/warnings/unreachable_step.json");
const cycle = path.join(root, "fixtures/invalid/cycle_detected.json");
// invalid fixtures
const missingEntry = path.join(root, 'fixtures/invalid/entrypoint_missing.json');
const missingTarget = path.join(root,'fixtures/invalid/flow_target_missing.json');
const missingConn = path.join(root, 'fixtures/invalid/connection_missing.json');

describe('agentkit validate (stage 1)', () => {
	it('passes valid fixture', () => {
		const res = runValidate(validFile, { format: 'json', strict: false });
		expect(res.exitCode).toBe(0);
		expect(JSON.parse(res.output).findings).toHaveLength(0);
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
	  
	  it("flags cycles", () => {
		const res = runValidate(cycle, { format: "json", strict: false });
		expect(res.exitCode).toBe(1);
		const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
		expect(codes).toContain("E_CYCLE_DETECTED");
	  });
});
