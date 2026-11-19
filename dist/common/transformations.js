"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideEnNull = exports.Majuscules = void 0;
const class_transformer_1 = require("class-transformer");
const Majuscules = () => (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value);
exports.Majuscules = Majuscules;
const VideEnNull = () => (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' && value.trim() === '' ? null : value);
exports.VideEnNull = VideEnNull;
//# sourceMappingURL=transformations.js.map