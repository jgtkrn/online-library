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
    title: string;

    @ApiProperty()
    @IsOptional()
    status: string;

    @ApiProperty()
    @IsOptional()
    category: string;

    @ApiProperty()
    @IsOptional()
    sort: sort;

    @ApiProperty()
    @IsOptional()
    search: string;
  }

export class idDto {
    @ApiProperty()
    @IsOptional()
    id: string;
}

export class labelDto {
  @ApiProperty()
  @IsOptional()
  label: string;
}