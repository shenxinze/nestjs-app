import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty } from 'class-validator'

export class UpdateUserDto {
  @ApiProperty()
  head_pic: string

  @ApiProperty()
  nick_name: string

  @ApiProperty()
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string

  @ApiProperty()
  @IsNotEmpty({ message: '验证码不能为空' })
  captcha: string
}
