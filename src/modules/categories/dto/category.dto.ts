import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CategoryDto {

    @IsNotEmpty()
    @ApiProperty()
    readonly label: string;

    @IsNotEmpty()
    @ApiProperty()
    readonly thumbnail: string;
    
    @IsNotEmpty()
    @ApiProperty()
    readonly english_name : string;

    @IsNotEmpty()
    @ApiProperty()
    readonly cantonese_name : string;

    @IsNotEmpty()
    @ApiProperty()
    readonly is_active : boolean;

  }
