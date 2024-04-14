import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePromotionalCodeDto {
    @ApiProperty()
    readonly month_value: number;
  }