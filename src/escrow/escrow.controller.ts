import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { DisputeDto } from './dto/dispute.dto';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Escrow')
@Controller('escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  // STEP 3: Create transaction
  @Post('transaction')
  @ApiOperation({ summary: 'Create a new escrow transaction (funds held by Trustap)' })
  createTransaction(@Body() dto: CreateTransactionDto) {
    return this.escrowService.createTransaction(dto);
  }

  // STEP 5: Get status
  @Get('transaction/:id')
  @ApiOperation({ summary: 'Get status and details of a transaction' })
  getStatus(@Param('id') id: string) {
    return this.escrowService.getTransactionStatus(id);
  }

  // Get all
  @Get('transactions')
  @ApiOperation({ summary: 'List all escrow transactions' })
  getAll() {
    return this.escrowService.getAllTransactions();
  }

  // STEP 4: Payment link
  @Get('payment-link/:id')
  @ApiOperation({ summary: 'Get the buyer payment URL for a transaction' })
  getPaymentLink(@Param('id') id: string) {
    return this.escrowService.getPaymentLink(id);
  }

  // Calculate fee
  @Get('charge')
  @ApiOperation({ summary: 'Calculate Trustap escrow fee for an amount' })
  @ApiQuery({ name: 'currency', example: 'EUR' })
  @ApiQuery({ name: 'price', example: 150 })
  calculateCharge(@Query('currency') currency: string, @Query('price') price: string) {
    return this.escrowService.calculateCharge(currency, parseFloat(price));
  }

  // STEP 7: Release funds
  @Post('release/:id')
  @ApiOperation({ summary: 'Release escrowed funds to the seller (buyer confirms delivery)' })
  releaseFunds(@Param('id') id: string) {
    return this.escrowService.releaseFunds(id);
  }

  // STEP 8: Raise dispute
  @Post('dispute/:id')
  @ApiOperation({ summary: 'Raise a dispute on a transaction' })
  raiseDispute(@Param('id') id: string, @Body() dto: DisputeDto) {
    return this.escrowService.raiseDispute(id, dto);
  }

  // Balance
  @Get('balance')
  @ApiOperation({ summary: 'Get Trustap account balance (available & pending)' })
  getBalance() {
    return this.escrowService.getBalance();
  }
}
