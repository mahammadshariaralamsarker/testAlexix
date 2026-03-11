import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EscrowService } from './escrow.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { DisputeDto } from './dto/dispute.dto';

@ApiTags('Escrow')
@Controller('escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Post('transaction')
  @ApiOperation({ summary: 'Create a new escrow transaction' })
  create(@Body() dto: CreateTransactionDto) {
    return this.escrowService.createTransaction(dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List all transactions' })
  getAll() {
    return this.escrowService.getAllTransactions();
  }
}
