import { IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class forgetPassword {

    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    readonly email: string;

}
