import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class verifyDto {
    @ApiProperty()
    @IsNotEmpty()
    readonly token: string;

  }