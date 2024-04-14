
import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAudio {

    @ApiProperty()
    @IsNotEmpty()
    readonly language: string;
  }