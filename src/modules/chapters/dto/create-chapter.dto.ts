import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChapterDto {
    @IsNotEmpty()
    @ApiProperty()
    readonly book_label: string;

    @ApiProperty()
    readonly number: number;

    @ApiProperty()
    readonly title: string;

    @ApiProperty()
    readonly content: string;
  }