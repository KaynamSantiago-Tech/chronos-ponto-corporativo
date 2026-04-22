import "./instrument";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as Sentry from "@sentry/node";
import helmet from "helmet";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.enableCors({
    origin:
      process.env.CORS_ORIGIN?.split(",")
        .map((o) => o.trim())
        .filter(Boolean) ?? ["http://localhost:3000"],
    credentials: true,
  });
  app.setGlobalPrefix("");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const exporSwagger =
    process.env.NODE_ENV !== "production" || process.env.EXPOSE_SWAGGER === "true";
  if (exporSwagger) {
    const swagger = new DocumentBuilder()
      .setTitle("Midrah Ponto API")
      .setDescription("API interna de ponto corporativo")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();
    SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swagger));
  }

  const port = Number(process.env.PORT ?? 3333);
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`[api] ready on :${port}`);
}

bootstrap().catch((err) => {
  Sentry.captureException(err);
  // eslint-disable-next-line no-console
  console.error("bootstrap failed", err);
  process.exit(1);
});
