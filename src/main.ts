import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Trustap Escrow Payment System')
    .setDescription('Complete Escrow-based payment API powered by Trustap')
    .setVersion('1.0')
    .addTag('Users')
    .addTag('Escrow')
    .addTag('Webhook')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server running: http://localhost:${port}`);
  console.log(`📖 Swagger Docs: http://localhost:${port}/api/docs`);
}
bootstrap();
