import { IsNotEmpty , IsEmail, MinLength} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { registration_platform } from '../../../helpers/util';

export class createUser {

    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    readonly email: string;

    @IsNotEmpty()
    @ApiProperty()
    readonly first_name: string
    
    @ApiProperty()
    readonly last_name: string


    @ApiProperty()
    readonly registration_platform: registration_platform

    @IsNotEmpty()
    @MinLength(6)
    @ApiProperty()
    readonly password: string
}
