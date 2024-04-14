import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { sort } from '../../../../src/helpers/util';

export class queryDto {
    @ApiProperty()
    @IsOptional()
    page: number;

    @ApiProperty()
    @IsOptional()
    size: number; 

    @ApiProperty()
    @IsOptional()
    code: string;

    @ApiProperty()
    @IsOptional()
    sort: sort;

    @ApiProperty()
    @IsOptional()
    search: string;
  }
