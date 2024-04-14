import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class queryDto {
    @ApiProperty()
    @IsOptional()
    page: number;

    @ApiProperty()
    @IsOptional()
    size: number; 

    @ApiProperty()
    @IsOptional()
    sort: string; 

    @ApiProperty()
    @IsOptional()
    name: string; 

    @ApiProperty()
    @IsOptional()
    active_only: boolean; 

    @ApiProperty()
    @IsOptional()
    user_interest: boolean; 

    @ApiProperty()
    @IsOptional()
    search: string; 
  }

export class idDto {
    @ApiProperty()
    @IsOptional()
    id: string;
}