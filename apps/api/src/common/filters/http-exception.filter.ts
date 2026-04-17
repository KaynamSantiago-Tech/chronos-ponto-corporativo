import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

interface ErrorShape {
  statusCode: number;
  message: string;
  code: string;
  details?: unknown;
  path: string;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { statusCode, message, code, details } = this.normalize(exception);

    if (statusCode >= 500) {
      this.logger.error(
        `${req.method} ${req.url} → ${statusCode}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorShape = {
      statusCode,
      message,
      code,
      details,
      path: req.url,
      timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(body);
  }

  private normalize(exception: unknown): Omit<ErrorShape, "path" | "timestamp"> {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === "string") {
        return { statusCode: status, message: resp, code: this.defaultCode(status) };
      }
      const r = resp as Record<string, unknown>;
      return {
        statusCode: status,
        message: (r.message as string) ?? exception.message,
        code: (r.code as string) ?? this.defaultCode(status),
        details: r.details,
      };
    }
    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
        code: "INTERNAL_ERROR",
      };
    }
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Erro desconhecido",
      code: "INTERNAL_ERROR",
    };
  }

  private defaultCode(status: number): string {
    switch (status) {
      case 400: return "BAD_REQUEST";
      case 401: return "UNAUTHORIZED";
      case 403: return "FORBIDDEN";
      case 404: return "NOT_FOUND";
      case 409: return "CONFLICT";
      case 422: return "UNPROCESSABLE";
      case 429: return "TOO_MANY_REQUESTS";
      default: return "ERROR";
    }
  }
}
