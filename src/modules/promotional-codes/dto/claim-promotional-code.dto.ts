import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClaimPromotionalCodeDto {
    @ApiProperty()
    @IsNotEmpty()
    readonly code: string;
  }