import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class appleLogin {

    @ApiProperty()
    readonly email: string;

    @ApiProperty()
    readonly first_name: string;

    @ApiProperty()
    readonly last_name: string;

    @IsNotEmpty()
    @ApiProperty()
    readonly apple_id: string;

    @IsNotEmpty()
    @ApiProperty()
    readonly token: string;

    @ApiProperty()
    readonly registration_platform: string;

  }
