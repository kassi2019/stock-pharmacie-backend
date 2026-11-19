"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genererCode = genererCode;
async function genererCode(prefixe, nombreExistant, existe) {
    for (let n = nombreExistant + 1;; n++) {
        const code = `${prefixe}-${String(n).padStart(4, '0')}`;
        if (!(await existe(code)))
            return code;
    }
}
//# sourceMappingURL=codes.js.map