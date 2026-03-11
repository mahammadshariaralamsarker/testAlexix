import { IsNotEmpty, IsNumber, IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ example: 'uuid-of-buyer' })
  @IsUUID()
  buyerId: string;

  @ApiProperty({ example: 'uuid-of-seller' })
  @IsUUID()
  sellerId: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'EUR' })
  @IsString()
  currency: string;

  @ApiProperty({ example: 'Payment for used iPhone 13' })
  @IsOptional()
  @IsString()
  description?: string;
}
