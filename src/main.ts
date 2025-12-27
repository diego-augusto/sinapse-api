import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './exceptions/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Filtro global de exceções
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Configuração de validação global
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Sinapse API')
    .setDescription('API para integração com TUPI e gerenciamento de dados financeiros')
    .setVersion('1.0.0')
    .setContact(
      'Support',
      'https://github.com/sinapse-api',
      'support@sinapse.com',
    )
    .addServer('http://localhost:3000', 'Development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Aplicação iniciada na porta ${port}`);
  console.log(`Swagger disponível em http://localhost:${port}/api/docs`);
}
bootstrap();
