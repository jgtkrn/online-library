import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class passworConfirm {

    @IsNotEmpty()
    @ApiProperty()
    readonly token: string;

    @IsNotEmpty()
    @ApiProperty()
    readonly new_password: string;

    @IsNotEmpty()
    @ApiProperty()
    readonly repeat_password: string;

  }