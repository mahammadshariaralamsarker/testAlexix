import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EscrowService } from './escrow.service';
import { EscrowController } from './escrow.controller';

@Module({
  imports: [HttpModule],
  controllers: [EscrowController],
  providers: [EscrowService],
  exports: [EscrowService],
})
export class EscrowModule {}
