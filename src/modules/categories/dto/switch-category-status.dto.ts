import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SwitchCategoryStatusDto {

    @IsNotEmpty()
    @ApiProperty()
    readonly status: boolean;
  }
