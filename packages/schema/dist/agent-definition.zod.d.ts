import { z } from "zod";
export declare const SemVer: z.ZodString;
export declare const StepId: z.ZodString;
export declare const StepType: z.ZodString;
export declare const Trigger: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"manual">;
    config: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strict", z.ZodTypeAny, {
    type: "manual";
    config: Record<string, any>;
}, {
    type: "manual";
    config?: Record<string, any> | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"schedule">;
    config: z.ZodObject<{
        cron: z.ZodString;
        timezone: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        cron: string;
        timezone?: string | undefined;
    }, {
        cron: string;
        timezone?: string | undefined;
    }>;
}, "strict", z.ZodTypeAny, {
    type: "schedule";
    config: {
        cron: string;
        timezone?: string | undefined;
    };
}, {
    type: "schedule";
    config: {
        cron: string;
        timezone?: string | undefined;
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"webhook">;
    config: z.ZodObject<{
        path: z.ZodString;
        auth: z.ZodDefault<z.ZodEnum<["none", "workspace", "shared_secret"]>>;
    }, "strict", z.ZodTypeAny, {
        path: string;
        auth: "none" | "workspace" | "shared_secret";
    }, {
        path: string;
        auth?: "none" | "workspace" | "shared_secret" | undefined;
    }>;
}, "strict", z.ZodTypeAny, {
    type: "webhook";
    config: {
        path: string;
        auth: "none" | "workspace" | "shared_secret";
    };
}, {
    type: "webhook";
    config: {
        path: string;
        auth?: "none" | "workspace" | "shared_secret" | undefined;
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"event">;
    config: z.ZodObject<{
        source: z.ZodString;
        event_type: z.ZodString;
        resource: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        source: string;
        event_type: string;
        resource: string;
    }, {
        source: string;
        event_type: string;
        resource: string;
    }>;
}, "strict", z.ZodTypeAny, {
    type: "event";
    config: {
        source: string;
        event_type: string;
        resource: string;
    };
}, {
    type: "event";
    config: {
        source: string;
        event_type: string;
        resource: string;
    };
}>]>;
export declare const AgentFlow: z.ZodObject<{
    entrypoint: z.ZodString;
}, "strict", z.ZodTypeAny, {
    entrypoint: string;
}, {
    entrypoint: string;
}>;
export declare const BaseStep: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    params: z.ZodRecord<z.ZodString, z.ZodAny>;
    outputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    flow: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strict", z.ZodTypeAny, {
    type: string;
    params: Record<string, any>;
    id: string;
    outputs?: Record<string, any> | undefined;
    flow?: Record<string, any> | undefined;
}, {
    type: string;
    params: Record<string, any>;
    id: string;
    outputs?: Record<string, any> | undefined;
    flow?: Record<string, any> | undefined;
}>;
export declare const AgentDefinitionSchema: z.ZodObject<{
    schema_version: z.ZodString;
    kind: z.ZodLiteral<"agent_definition">;
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    template_version: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    trigger: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"manual">;
        config: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strict", z.ZodTypeAny, {
        type: "manual";
        config: Record<string, any>;
    }, {
        type: "manual";
        config?: Record<string, any> | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"schedule">;
        config: z.ZodObject<{
            cron: z.ZodString;
            timezone: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            cron: string;
            timezone?: string | undefined;
        }, {
            cron: string;
            timezone?: string | undefined;
        }>;
    }, "strict", z.ZodTypeAny, {
        type: "schedule";
        config: {
            cron: string;
            timezone?: string | undefined;
        };
    }, {
        type: "schedule";
        config: {
            cron: string;
            timezone?: string | undefined;
        };
    }>, z.ZodObject<{
        type: z.ZodLiteral<"webhook">;
        config: z.ZodObject<{
            path: z.ZodString;
            auth: z.ZodDefault<z.ZodEnum<["none", "workspace", "shared_secret"]>>;
        }, "strict", z.ZodTypeAny, {
            path: string;
            auth: "none" | "workspace" | "shared_secret";
        }, {
            path: string;
            auth?: "none" | "workspace" | "shared_secret" | undefined;
        }>;
    }, "strict", z.ZodTypeAny, {
        type: "webhook";
        config: {
            path: string;
            auth: "none" | "workspace" | "shared_secret";
        };
    }, {
        type: "webhook";
        config: {
            path: string;
            auth?: "none" | "workspace" | "shared_secret" | undefined;
        };
    }>, z.ZodObject<{
        type: z.ZodLiteral<"event">;
        config: z.ZodObject<{
            source: z.ZodString;
            event_type: z.ZodString;
            resource: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            source: string;
            event_type: string;
            resource: string;
        }, {
            source: string;
            event_type: string;
            resource: string;
        }>;
    }, "strict", z.ZodTypeAny, {
        type: "event";
        config: {
            source: string;
            event_type: string;
            resource: string;
        };
    }, {
        type: "event";
        config: {
            source: string;
            event_type: string;
            resource: string;
        };
    }>]>;
    inputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    runtime: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    flow: z.ZodObject<{
        entrypoint: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        entrypoint: string;
    }, {
        entrypoint: string;
    }>;
    steps: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        params: z.ZodRecord<z.ZodString, z.ZodAny>;
        outputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        flow: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strict", z.ZodTypeAny, {
        type: string;
        params: Record<string, any>;
        id: string;
        outputs?: Record<string, any> | undefined;
        flow?: Record<string, any> | undefined;
    }, {
        type: string;
        params: Record<string, any>;
        id: string;
        outputs?: Record<string, any> | undefined;
        flow?: Record<string, any> | undefined;
    }>, "many">;
    error_handling: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strict", z.ZodTypeAny, {
    id: string;
    flow: {
        entrypoint: string;
    };
    schema_version: string;
    kind: "agent_definition";
    name: string;
    template_version: string;
    trigger: {
        type: "manual";
        config: Record<string, any>;
    } | {
        type: "schedule";
        config: {
            cron: string;
            timezone?: string | undefined;
        };
    } | {
        type: "webhook";
        config: {
            path: string;
            auth: "none" | "workspace" | "shared_secret";
        };
    } | {
        type: "event";
        config: {
            source: string;
            event_type: string;
            resource: string;
        };
    };
    steps: {
        type: string;
        params: Record<string, any>;
        id: string;
        outputs?: Record<string, any> | undefined;
        flow?: Record<string, any> | undefined;
    }[];
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    inputs?: Record<string, any> | undefined;
    runtime?: Record<string, any> | undefined;
    error_handling?: Record<string, any> | undefined;
}, {
    id: string;
    flow: {
        entrypoint: string;
    };
    schema_version: string;
    kind: "agent_definition";
    name: string;
    template_version: string;
    trigger: {
        type: "manual";
        config?: Record<string, any> | undefined;
    } | {
        type: "schedule";
        config: {
            cron: string;
            timezone?: string | undefined;
        };
    } | {
        type: "webhook";
        config: {
            path: string;
            auth?: "none" | "workspace" | "shared_secret" | undefined;
        };
    } | {
        type: "event";
        config: {
            source: string;
            event_type: string;
            resource: string;
        };
    };
    steps: {
        type: string;
        params: Record<string, any>;
        id: string;
        outputs?: Record<string, any> | undefined;
        flow?: Record<string, any> | undefined;
    }[];
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    inputs?: Record<string, any> | undefined;
    runtime?: Record<string, any> | undefined;
    error_handling?: Record<string, any> | undefined;
}>;
export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;
export declare const supportedSchemaVersions: string[];
