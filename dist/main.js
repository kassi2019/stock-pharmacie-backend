"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const prisma_exception_filter_1 = require("./common/prisma-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    const origines = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    app.enableCors({ origin: origines.length === 1 ? origines[0] : origines });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true, stopAtFirstError: true }));
    app.useGlobalFilters(new prisma_exception_filter_1.PrismaExceptionFilter());
    await app.listen(process.env.PORT ?? 3005);
}
bootstrap();
//# sourceMappingURL=main.js.map