import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as crypto from 'crypto'

interface User {
  id: number
  username: string
  roles: string[]
  permissions: string[]
}

export const md5 = (str: string) => {
  const hash = crypto.createHash('md5')
  hash.update(str)
  return hash.digest('hex')
}

export const createAccessToken = (
  jwtService: JwtService,
  configService: ConfigService,
  user: User
) => {
  return jwtService.sign(
    {
      userId: user.id,
      username: user.username,
      roles: user.roles,
      permissions: user.permissions
    },
    {
      expiresIn: configService.get('JWT_ACCESS_TOKEN_EXPIRES_TIME') || '30m'
    }
  )
}

export const createRefreshToken = (
  jwtService: JwtService,
  configService: ConfigService,
  user: User
) => {
  return jwtService.sign(
    {
      useId: user.id
    },
    {
      expiresIn: configService.get('JWT_REFRESH_TOKEN_EXPIRES_TIME') || '7d'
    }
  )
}
