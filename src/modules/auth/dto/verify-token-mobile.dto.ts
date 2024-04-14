import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { oauth_platform } from '../../../helpers/util';

export class verifyTokenMobileDto {
    @ApiProperty()
    @IsNotEmpty()
    readonly platform: oauth_platform;

    @ApiProperty()
    readonly interest: boolean;

  }