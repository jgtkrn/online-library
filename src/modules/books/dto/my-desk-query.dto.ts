import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { sort, desk_status } from '../../../../src/helpers/util';

export class myDeskQueryDto {
    @ApiProperty()
    @IsOptional()
    page: number;

    @ApiProperty()
    @IsOptional()
    size: number; 

    @ApiProperty()
    @IsOptional()
    sort: sort;

    @ApiProperty()
    @IsOptional()
    is_completed: boolean;

    @ApiProperty()
    @IsOptional()
    status: desk_status;
}