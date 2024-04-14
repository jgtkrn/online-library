
import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddAudioDto {

    @ApiProperty()
    @IsNotEmpty()
    readonly id: string;

    @ApiProperty()
    @IsNotEmpty()
    readonly audio: string;

    @ApiProperty()
    @IsNotEmpty()
    readonly language: string;
  }