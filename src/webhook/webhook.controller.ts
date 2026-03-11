import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { WebhookService, TrustapWebhookPayload } from './webhook.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('trustap')
  @HttpCode(200)
  @ApiOperation({ summary: 'Trustap webhook endpoint — receives real-time payment events' })
  handleWebhook(@Body() payload: TrustapWebhookPayload, @Headers() headers: Record<string, string>) {
    return this.webhookService.handleEvent(payload);
  }
}
