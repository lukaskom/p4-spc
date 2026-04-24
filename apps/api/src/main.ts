import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { cors: true },
  );

  const config = new DocumentBuilder()
    .setTitle('p4-spc API')
    .setDescription(
      'Performance4 SPC platform API. Exposes catalogs, SPC computations ' +
        '(control limits, Nelson rules, capability indices) and measurement validation ' +
        'backed by @p4-spc/aqdef-core and @p4-spc/spc-engine.',
    )
    .setVersion('0.0.1')
    .addTag('health')
    .addTag('catalogs')
    .addTag('spc')
    .addTag('validation')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number.parseInt(process.env['API_PORT'] ?? '3100', 10);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`p4-spc API listening on http://localhost:${port}  —  docs at /api/docs`);
}

void bootstrap();
