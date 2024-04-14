import { ApiProperty } from '@nestjs/swagger';
import { login_type } from '../../../helpers/util';

export class loginDto {
    @ApiProperty({enum : login_type})
    readonly type: login_type;

    @ApiProperty()
    readonly interest: boolean;

  } 