import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookDto {

    @ApiProperty()
    readonly cover_image: string;

    @ApiProperty()
    readonly isbn: string;

    @ApiProperty()
    readonly ref_link: string;

    @IsNotEmpty()
    @ApiProperty()
    readonly title: string;

    @ApiProperty()
    readonly subtitle: string;

    @ApiProperty({ example: ["CT01","CT02"] })
    readonly authors: string[];

    @IsNotEmpty()
    @ApiProperty()
    readonly duration: string;

    @ApiProperty()
    @ApiProperty()
    readonly introduction: string;

    @ApiProperty()
    @IsNotEmpty()
    readonly suitable_audience: string;

    @ApiProperty()
    readonly active: boolean;
    
    @ApiProperty()
    readonly note: string;

    @ApiProperty({ example: ["CT01","CT02"] })
    readonly categories: string[];
  }