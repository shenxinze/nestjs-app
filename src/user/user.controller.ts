import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UnauthorizedException
} from '@nestjs/common'
import { UserService } from './user.service'
import { RegisterUserDto } from './dto/create-user.dto'
import { EmailService } from 'src/email/email.service'
import { RedisService } from 'src/redis/redis.service'
import { LoginUserDto } from './dto/login-user.dto'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { createAccessToken, createRefreshToken } from 'src/utils'

@Controller('user')
export class UserController {
  @Inject(EmailService)
  private emailService: EmailService

  @Inject(RedisService)
  private redisService: RedisService

  @Inject(JwtService)
  private jwtService: JwtService

  @Inject(ConfigService)
  private configService: ConfigService

  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser)
  }

  @Get('register-captcha')
  async captcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8)
    await this.redisService.set(`captcha_${address}`, code, 5 * 60)
    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: '<p>您的验证码是:' + code + '</p>'
    })
    return '发送成功'
  }

  @Get('init-data')
  async initData() {
    await this.userService.initData()
    return '初始化成功'
  }

  @Post('login')
  async userLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, false)
    vo.access_token = createAccessToken(
      this.jwtService,
      this.configService,
      vo.userInfo
    )
    vo.refresh_token = createRefreshToken(
      this.jwtService,
      this.configService,
      vo.userInfo
    )
    return vo
  }

  @Post('admin/login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, true)
    vo.access_token = createAccessToken(
      this.jwtService,
      this.configService,
      vo.userInfo
    )
    vo.refresh_token = createRefreshToken(
      this.jwtService,
      this.configService,
      vo.userInfo
    )
    return vo
  }

  @Get('refresh')
  async refresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken)
      const user = await this.userService.findUserById(data.userId, false)
      const access_token = createAccessToken(
        this.jwtService,
        this.configService,
        user
      )
      const refresh_token = createRefreshToken(
        this.jwtService,
        this.configService,
        user
      )
      return {
        access_token,
        refresh_token
      }
    } catch (err) {
      throw new UnauthorizedException('token 已失效， 请重新登录')
    }
  }

  @Get('admin/refresh')
  async adminRefresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken)
      const user = await this.userService.findUserById(data.userId, true)
      const access_token = createAccessToken(
        this.jwtService,
        this.configService,
        user
      )
      const refresh_token = createRefreshToken(
        this.jwtService,
        this.configService,
        user
      )
      return {
        access_token,
        refresh_token
      }
    } catch (err) {
      throw new UnauthorizedException('token 已失效， 请重新登录')
    }
  }
}
