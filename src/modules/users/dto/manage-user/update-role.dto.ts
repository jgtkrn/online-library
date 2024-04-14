import { IsNotEmpty , IsEmail, MinLength, IsEnum, IsOptional} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { role_type } from '../../../../../src/helpers/util';

export class UpdateRoleDto {
    @IsEnum(role_type)
    @IsOptional()
    @ApiProperty()
    readonly role: string;
}
