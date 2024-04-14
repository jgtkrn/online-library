import { IsNotEmpty , IsEmail, MinLength, IsEnum, IsOptional} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { role_type } from '../../../../../src/helpers/util';

export class manageUserCreate {

    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    readonly email: string;

    @IsNotEmpty()
    @ApiProperty()
    readonly username: string

    @IsNotEmpty()
    @ApiProperty()
    readonly first_name: string
    
    @ApiProperty()
    readonly last_name: string

    @IsNotEmpty()
    @MinLength(6)
    @ApiProperty()
    readonly password: string

    @IsEnum(role_type)
    @IsOptional()
    @ApiProperty()
    readonly role: string;
}
