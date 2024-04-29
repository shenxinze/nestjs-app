interface UserInfo {
  id: number
  username: string
  nike_name: string
  email: string
  head_pic: string
  phone_number: string
  is_forzen: boolean
  is_admin: boolean
  create_time: Date
  update_time: Date
  roles: string[]
  permissions: string[]
}

export class LoginUserVo {
  userInfo: UserInfo
  access_token: string
  refresh_token: string
}
