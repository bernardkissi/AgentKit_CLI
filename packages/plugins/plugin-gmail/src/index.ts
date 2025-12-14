import { z } from "zod";
import type { StepTypeDef } from "@agentkit/schema";

const sendEmail: StepTypeDef = {
    type: "plugin.gmail.send_email",
    title: "Gmail Send Email (Plugin)",
    paramsSchema: z.object({
        connection: z.string().min(1),
        to: z.string().email(),
        subject: z.string().min(1),
        body: z.string().min(1),
        idempotency_key: z.string().optional()
    }).strict(),
    outputsSchema: z.object({
        message_id: z.string()
    }).strict()
};

export const agentkitRegistry = {
    [sendEmail.type]: sendEmail
};
