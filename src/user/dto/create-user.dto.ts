import { ApiProperty } from '@nestjs/swagger'
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  MinLength
} from 'class-validator'
export class RegisterUserDto {
  @ApiProperty()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string

  @ApiProperty({ minLength: 6 })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码不能少于6位' })
  password: string

  @ApiProperty()
  @IsNotEmpty({ message: '昵称不能为空' })
  nick_name: string

  @ApiProperty()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string

  @IsOptional()
  @IsPhoneNumber('CN', { message: '手机号格式不正确' })
  phone_number: string

  @ApiProperty()
  @IsNotEmpty({ message: '验证码不能为空' })
  captcha: string
}
