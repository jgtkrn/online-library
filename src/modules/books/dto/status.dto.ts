import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class statusDto {
    @ApiProperty()
    @IsOptional()
    active: boolean;
  }
