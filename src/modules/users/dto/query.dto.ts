import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { IsEnum } from 'class-validator';
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
    sort: sort;

    @IsOptional()
    // @ApiProperty({
    //   description: 'Role type',
    //   enum: roles_type,
    //   default: [],
    //   isArray : true
    // })
    @ApiProperty()
    role: string;

    @ApiProperty()
    @IsOptional()
    search: string;
  }
