import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class generateTokenDto {
    @IsNotEmpty()
    @ApiProperty()
    readonly email: string;

    @IsNotEmpty()
    @ApiProperty()
    readonly password: string;

  }