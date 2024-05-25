import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpStatus,
  Inject,
  ParseIntPipe,
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
import { createToken, generateParseIntPipe } from 'src/utils'
import { RequireLogin, UserInfo } from 'src/custom.decorator'
import { UserDetailVo } from './vo/user-info.vo'
import { UpdateUserPasswordDto } from './dto/update-user-password.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import {
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger'
import { LoginUserVo } from './vo/login-user.vo'
import { RefreshTokenVo } from './vo/refresh-token.vo'
import { UserListVo } from './vo/user-list.vo'

@ApiTags('用户管理模块')
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

  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已过期/验证码错误/用户名已存在',
    type: String
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '注册成功/失败',
    type: String
  })
  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser)
  }

  @ApiQuery({
    name: 'address',
    type: String,
    description: '邮箱地址',
    required: true,
    example: 'xxx@xx.com'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String
  })
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

  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户不存在/密码错误',
    type: String
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息和 token',
    type: LoginUserVo
  })
  @Post('login')
  async userLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, false)
    Object.assign(
      vo,
      createToken(this.jwtService, this.configService, vo.userInfo)
    )
    return vo
  }

  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户不存在/密码错误',
    type: String
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息和 token',
    type: LoginUserVo
  })
  @Post('admin/login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, true)
    Object.assign(
      vo,
      createToken(this.jwtService, this.configService, vo.userInfo)
    )
    return vo
  }

  @ApiQuery({
    name: 'refreshToken',
    type: String,
    description: '刷新 token',
    required: true,
    example: 'xxx.xxx.xxx'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'token 已失效， 请重新登录'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '刷新成功',
    type: RefreshTokenVo
  })
  @Get('refresh')
  async refresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken)
      const user = await this.userService.findUserById(data.userId, false)
      return createToken(this.jwtService, this.configService, user)
    } catch (err) {
      throw new UnauthorizedException('token 已失效， 请重新登录')
    }
  }

  @ApiQuery({
    name: 'refreshToken',
    type: String,
    description: '刷新 token',
    required: true,
    example: 'xxx.xxx.xxx'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'token 已失效， 请重新登录'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '刷新成功',
    type: RefreshTokenVo
  })
  @Get('admin/refresh')
  async adminRefresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken)
      const user = await this.userService.findUserById(data.userId, true)
      return createToken(this.jwtService, this.configService, user)
    } catch (err) {
      throw new UnauthorizedException('token 已失效， 请重新登录')
    }
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息',
    type: UserDetailVo
  })
  @Get('info')
  @RequireLogin()
  async info(@UserInfo('userId') userId: number) {
    const user = await this.userService.findUserDetailById(userId)
    const vo = new UserDetailVo()
    vo.id = user.id
    vo.username = user.username
    vo.nick_name = user.nick_name
    vo.email = user.email
    vo.head_pic = user.head_pic
    vo.phone_number = user.phone_number
    vo.is_frozen = user.is_forzen
    vo.create_time = user.create_time
    return vo
  }

  @ApiBearerAuth()
  @ApiBody({ type: UpdateUserPasswordDto })
  @ApiResponse({
    type: String,
    description: '验证码已失效/不正确'
  })
  @Post(['update_password', 'admin/update_password'])
  @RequireLogin()
  async updatePassword(
    @UserInfo('userId') userId: number,
    @Body() passwordDto: UpdateUserPasswordDto
  ) {
    return await this.userService.updatePassword(userId, passwordDto)
  }

  @ApiBearerAuth()
  @ApiQuery({
    name: 'address',
    description: '邮箱地址',
    type: String
  })
  @ApiResponse({
    type: String,
    description: '发送成功'
  })
  @Get('update_password/captcha')
  async updatePasswordCaptcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8)
    await this.redisService.set(
      `update_password_captcha_${address}`,
      code,
      10 * 60
    )
    await this.emailService.sendMail({
      to: address,
      subject: '修改密码验证码',
      html: '<p>您的验证码是: ' + code + '</p>'
    })
    return '发送成功'
  }

  @ApiBearerAuth()
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已失效/不正确'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
    type: String
  })
  @Post(['update', 'admin/update'])
  @RequireLogin()
  async update(
    @UserInfo('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return await this.userService.update(userId, updateUserDto)
  }

  @ApiQuery({
    name: 'address',
    description: '邮箱地址',
    type: String
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: String,
    description: '发送成功'
  })
  @Get('update/captcha')
  async updateCaptcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8)
    await this.redisService.set(`update_user_captcha_${address}`, code, 10 * 60)
    await this.emailService.sendMail({
      to: address,
      subject: '修改用户信息验证码',
      html: '<p>您的验证码是: ' + code + '</p>'
    })
    return '发送成功'
  }

  @ApiBearerAuth()
  @ApiQuery({
    name: 'id',
    description: '用户id',
    type: Number
  })
  @ApiResponse({
    type: String,
    description: 'success'
  })
  @RequireLogin()
  @Get('freeze')
  async freeze(
    @Query('id', generateParseIntPipe('id'))
    userId: number
  ) {
    await this.userService.freezeUserById(userId)
    return 'success'
  }

  @ApiBearerAuth()
  @ApiQuery({
    name: 'page',
    description: '页码',
    type: Number
  })
  @ApiQuery({
    name: 'size',
    description: '页大小',
    type: Number
  })
  @ApiQuery({
    name: 'username',
    description: '用户名',
    type: String
  })
  @ApiQuery({
    name: 'nick_name',
    description: '昵称',
    type: String
  })
  @ApiQuery({
    name: 'email',
    description: '邮箱地址',
    type: String
  })
  @ApiResponse({
    type: UserListVo,
    description: '用户列表'
  })
  @Get('list')
  async list(
    @Query('page', new DefaultValuePipe(1), generateParseIntPipe('page'))
    page: number,
    @Query('size', new DefaultValuePipe(10), generateParseIntPipe('size'))
    size: number,
    @Query('username') username: string,
    @Query('nick_name') nickName: string,
    @Query('email') email: string
  ) {
    return await this.userService.findUsersByPage(
      username,
      nickName,
      email,
      page,
      size
    )
  }
}
