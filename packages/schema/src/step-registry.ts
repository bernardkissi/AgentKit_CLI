import { z } from "zod";

export interface StepTypeDef {
    type: string;
    title: string;
    description?: string;
    paramsSchema: z.ZodTypeAny;
    outputsSchema?: z.ZodTypeAny;
}

export const StepRegistry: Record<string, StepTypeDef> = {
    "llm.prompt": {
        type: "llm.prompt",
        title: "LLM Prompt",
        paramsSchema: z.object({
            user_prompt: z.string().min(1),
            model: z.string().optional()
        }).strict(),
        outputsSchema: z.object({
            text: z.string()
        }).strict()
    },

    "action.gmail.send_email": {
        type: "action.gmail.send_email",
        title: "Send Email (Gmail)",
        paramsSchema: z.object({
            connection: z.string().min(1),
            to: z.string().min(3),
            subject: z.string().min(1),
            body: z.string().min(1),
            idempotency_key: z.string().optional()
        }).strict()
    }
};