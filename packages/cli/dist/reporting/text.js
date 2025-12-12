"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderText = renderText;
function renderText(findings) {
    if (!findings.length)
        return "OK\n";
    const lines = findings.map(f => {
        const loc = [f.file, f.jsonPath].filter(Boolean).join(" ");
        return `[${f.severity.toUpperCase()}] ${f.code}: ${f.message}${loc ? ` (${loc})` : ""}`;
    });
    return lines.join("\n") + "\n";
}
//# sourceMappingURL=text.js.map