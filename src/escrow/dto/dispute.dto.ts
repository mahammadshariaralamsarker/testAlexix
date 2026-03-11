import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DisputeDto {
  @ApiProperty({ example: 'Item was not as described' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
