"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEnvFilePaths = resolveEnvFilePaths;
const fs_1 = require("fs");
const path_1 = require("path");
function resolveEnvFilePaths() {
    const isProd = process.env.NODE_ENV === 'production';
    const candidates = [
        ...(isProd
            ? [
                (0, path_1.resolve)(process.cwd(), '.env.production'),
                (0, path_1.resolve)(process.cwd(), '../../.env.production'),
                (0, path_1.resolve)(__dirname, '../../.env.production'),
                (0, path_1.resolve)(__dirname, '../../../.env.production'),
                (0, path_1.resolve)(__dirname, '../../../../.env.production'),
                (0, path_1.resolve)(__dirname, '../../../../../.env.production'),
            ]
            : []),
        (0, path_1.resolve)(process.cwd(), '.env'),
        (0, path_1.resolve)(process.cwd(), '../../.env'),
        (0, path_1.resolve)(__dirname, '../../.env'),
        (0, path_1.resolve)(__dirname, '../../../.env'),
        (0, path_1.resolve)(__dirname, '../../../../.env'),
    ];
    const seen = new Set();
    const paths = [];
    for (const file of candidates) {
        if (seen.has(file))
            continue;
        seen.add(file);
        if ((0, fs_1.existsSync)(file))
            paths.push(file);
    }
    return paths;
}
//# sourceMappingURL=env-path.js.map