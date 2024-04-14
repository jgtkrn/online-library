import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class resetPassword {

    @IsNotEmpty()
    @ApiProperty()
    readonly old_password: string

    @IsNotEmpty()
    @ApiProperty()
    readonly new_password: string

    @IsNotEmpty()
    @ApiProperty()
    readonly repeat_password: string
}
