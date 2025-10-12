import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null && 'message' in res) {
        const msg = (res as { message: string | string[] }).message;
        message = Array.isArray(msg) ? msg.join(', ') : msg;
      }
    }

    response.status(status).json({
      success: false,
      message,
      data: null,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

export class ErrorResponse extends HttpException {
  success: boolean;
  statusCode: number;
  constructor(
    message: string,
    statusCode: number = 500,
    success: boolean = false,
  ) {
    super({ success, message }, statusCode);
    this.statusCode = statusCode;
    this.success = success;
  }
}
