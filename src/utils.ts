import { BadRequestException, ParseIntPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as crypto from 'crypto'
import { RefreshTokenVo } from './user/vo/refresh-token.vo'

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

export const createToken = (
  jwtService: JwtService,
  configService: ConfigService,
  user: User
) => {
  const vo = new RefreshTokenVo()
  vo.access_token = jwtService.sign(
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
  vo.refresh_token = jwtService.sign(
    {
      useId: user.id
    },
    {
      expiresIn: configService.get('JWT_REFRESH_TOKEN_EXPIRES_TIME') || '7d'
    }
  )
  return vo
}

export function generateParseIntPipe(name: string, tip = '应该传数字') {
  return new ParseIntPipe({
    exceptionFactory() {
      throw new BadRequestException(name + ' ' + tip)
    }
  })
}
