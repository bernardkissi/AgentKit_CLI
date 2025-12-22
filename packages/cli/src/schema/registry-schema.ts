import { zodToJsonSchema } from "zod-to-json-schema";
import type { StepRegistry } from "@agentkit/registry";

export function defKeyForStep(stepType: string, kind: "Params" | "Outputs") {
  const norm = stepType.replace(/\./g, "_");
  return `Step${kind}__${norm}`;
}

export function buildStepSchemas(registry: StepRegistry) {
  const defs: Record<string, any> = {};
  const stepVariants: any[] = [];
  const xIndexSteps: Array<{ type: string; paramsDef: string; outputsDef: string }> = [];

  const stepTypes = Object.keys(registry).sort();

  for (const stepType of stepTypes) {
    const def = registry[stepType];
    const paramsKey = defKeyForStep(stepType, "Params");
    const outputsKey = defKeyForStep(stepType, "Outputs");

    defs[paramsKey] = zodToJsonSchema(def.paramsSchema as any, {
      name: paramsKey,
      target: "jsonSchema2019-09",
      $refStrategy: "root",
      definitionPath: "$defs",
    });

    if (def.outputsSchema) {
      defs[outputsKey] = zodToJsonSchema(def.outputsSchema as any, {
        name: outputsKey,
        target: "jsonSchema2019-09",
        $refStrategy: "root",
        definitionPath: "$defs",
      });
    } else {
      defs[outputsKey] = { type: "object", additionalProperties: true };
    }

    stepVariants.push({
      type: "object",
      properties: {
        id: { $ref: "#/$defs/StepId" },
        type: { const: stepType },
        params: { $ref: `#/$defs/${paramsKey}` },
        outputs: { $ref: `#/$defs/${outputsKey}` },
        flow: { type: "object", additionalProperties: true },
      },
      required: ["id", "type", "params"],
      additionalProperties: false,
    });

    xIndexSteps.push({
      type: stepType,
      paramsDef: paramsKey,
      outputsDef: outputsKey,
    });
  }

  return { defs, stepVariants, xIndexSteps };
}

export function buildRegistrySchemaFragments(registry: StepRegistry) {
  const { defs, stepVariants } = buildStepSchemas(registry);

  return {
    defs,
    stepsSchema: {
      type: "array",
      minItems: 1,
      items: { oneOf: stepVariants },
    },
  };
}
