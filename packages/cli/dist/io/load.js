"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDoc = loadDoc;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const yaml_1 = __importDefault(require("yaml"));
function loadDoc(filePath) {
    const raw = node_fs_1.default.readFileSync(filePath, "utf8");
    const ext = node_path_1.default.extname(filePath).toLowerCase();
    if (ext === ".yaml" || ext === ".yml") {
        return { doc: yaml_1.default.parse(raw), format: "yaml" };
    }
    // default JSON
    return { doc: JSON.parse(raw), format: "json" };
}
//# sourceMappingURL=load.js.map