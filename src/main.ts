import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app/modules/app.module";
import { env } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (env.corsOrigins.length > 0) {
    app.enableCors({
      origin: env.corsOrigins,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Idempotency-Key",
        "x-internal-api-key",
      ],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    });
  }

  const config = new DocumentBuilder()
    .setTitle("Rituo Checkout API")
    .setDescription("Catálogo, órdenes y pagos (Mercado Pago) de Rituo")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  await app.listen(env.port);
}

void bootstrap();
