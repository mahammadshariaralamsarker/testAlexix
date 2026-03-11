import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Trustap Escrow Payment API is running! Visit /api/docs for Swagger documentation.';
  }
}
