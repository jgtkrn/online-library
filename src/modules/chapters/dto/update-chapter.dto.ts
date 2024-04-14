import { ApiProperty } from '@nestjs/swagger';

export class updateChapterDto {

    @ApiProperty()
    readonly number: number;

    @ApiProperty()
    readonly title: string;

    @ApiProperty()
    readonly content: string;
  }