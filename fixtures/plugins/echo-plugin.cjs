const { z } = require("zod");

module.exports.agentkitRegistry = {
  "plugin.echo": {
    type: "plugin.echo",
    title: "Echo",
    paramsSchema: z.object({
      message: z.string().min(1)
    }).strict(),
    outputsSchema: z.object({
      message: z.string()
    }).strict()
  }
};
