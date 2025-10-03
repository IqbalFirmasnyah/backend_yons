import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;

    this.logger.log(`=== REQUEST DEBUG ===`);
    this.logger.log(`Method: ${method}`);
    this.logger.log(`URL: ${url}`);
    this.logger.log(`Headers: ${JSON.stringify(headers, null, 2)}`);
    this.logger.log(`Body: ${JSON.stringify(body, null, 2)}`);
    this.logger.log(`Body type: ${typeof body}`);
    this.logger.log(`Body keys: ${Object.keys(body || {})}`);
    this.logger.log(`=====================`);

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`Response sent for ${method} ${url}`);
      }),
    );
  }
}