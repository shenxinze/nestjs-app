import { ApiProperty } from '@nestjs/swagger'

class UserInfo {
  @ApiProperty()
  id: number
  @ApiProperty({ example: 'zhangsan' })
  username: string
  @ApiProperty({ example: '张三' })
  nike_name: string
  @ApiProperty({ example: 'xxx@xx.com' })
  email: string
  @ApiProperty({ example: 'xxx.png' })
  head_pic: string
  @ApiProperty({ example: '13888888888' })
  phone_number: string
  @ApiProperty()
  is_forzen: boolean
  @ApiProperty()
  is_admin: boolean
  @ApiProperty()
  create_time: Date
  @ApiProperty()
  update_time: Date
  @ApiProperty({ example: ['管理员'] })
  roles: string[]
  @ApiProperty({ example: ['query_aaa', 'query_bbb'] })
  permissions: string[]
}

export class LoginUserVo {
  @ApiProperty()
  userInfo: UserInfo
  @ApiProperty()
  access_token: string
  @ApiProperty()
  refresh_token: string
}
