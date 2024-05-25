import { ApiProperty } from '@nestjs/swagger'

class User {
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
  is_forzen: boolean

  @ApiProperty()
  create_time: Date
}

export class UserListVo {
  @ApiProperty({ type: [User] })
  users: User[]

  @ApiProperty()
  total: number
}
