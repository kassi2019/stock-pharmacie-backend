"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utilisateur = exports.Roles = exports.CLE_ROLES = exports.Public = exports.CLE_PUBLIC = void 0;
const common_1 = require("@nestjs/common");
exports.CLE_PUBLIC = 'public';
const Public = () => (0, common_1.SetMetadata)(exports.CLE_PUBLIC, true);
exports.Public = Public;
exports.CLE_ROLES = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.CLE_ROLES, roles);
exports.Roles = Roles;
exports.Utilisateur = (0, common_1.createParamDecorator)((_, ctx) => ctx.switchToHttp().getRequest().utilisateur);
//# sourceMappingURL=decorateurs.js.map