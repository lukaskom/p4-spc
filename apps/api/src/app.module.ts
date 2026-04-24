import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { CatalogsController } from './catalogs/catalogs.controller.js';
import { SpcController } from './spc/spc.controller.js';
import { ValidationController } from './validation/validation.controller.js';

@Module({
  controllers: [
    HealthController,
    CatalogsController,
    SpcController,
    ValidationController,
  ],
})
export class AppModule {}
