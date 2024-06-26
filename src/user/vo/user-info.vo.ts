import { ApiProperty } from '@nestjs/swagger'

export class UserDetailVo {
  @ApiProperty()
  id: number
  @ApiProperty()
  username: string
  @ApiProperty()
  nick_name: string
  @ApiProperty()
  email: string
  @ApiProperty()
  head_pic: string
  @ApiProperty()
  phone_number: string
  @ApiProperty()
  is_frozen: boolean
  @ApiProperty()
  create_time: Date
}
