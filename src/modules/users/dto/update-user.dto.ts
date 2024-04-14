import { ApiProperty } from '@nestjs/swagger';

export class updateUser {

    @ApiProperty()
    readonly firstname: string
    
    @ApiProperty()
    readonly lastname: string

    @ApiProperty()
    readonly avatar: string

    @ApiProperty()
    readonly language: string

    @ApiProperty()
    readonly birthday: Date

    @ApiProperty()
    last_login_at: Date
}
