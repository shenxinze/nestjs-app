import { IsEmail, IsNotEmpty } from 'class-validator'

export class UpdateUserDto {
  head_pic: string

  nick_name: string

  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string

  @IsNotEmpty({ message: '验证码不能为空' })
  captcha: string
}
