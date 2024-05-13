import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Like, Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { RegisterUserDto } from './dto/create-user.dto'
import { RedisService } from 'src/redis/redis.service'
import { md5 } from 'src/utils'
import { Role } from './entities/role.entity'
import { Permission } from './entities/permission.entity'
import { LoginUserDto } from './dto/login-user.dto'
import { LoginUserVo } from './vo/login-user.vo'
import { UpdateUserPasswordDto } from './dto/update-user-password.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UserService {
  private logger = new Logger()

  @Inject(RedisService)
  private readonly redisService: RedisService

  @InjectRepository(User)
  private readonly userRepository: Repository<User>

  @InjectRepository(Role)
  private readonly roleRepository: Repository<Role>

  @InjectRepository(Permission)
  private readonly permissionRepository: Repository<Permission>

  // 初始化数据
  async initData() {
    const user1 = new User()
    user1.username = 'zhangsan'
    user1.password = md5('888888')
    user1.nick_name = '张三'
    user1.email = 'zhangsan@qq.com'
    user1.is_admin = true
    user1.phone_number = '13288888888'

    const user2 = new User()
    user2.username = 'lisi'
    user2.password = md5('888888')
    user2.nick_name = '李四'
    user2.email = 'lisi@qq.com'

    const role1 = new Role()
    role1.name = '管理员'

    const role2 = new Role()
    role2.name = '普通用户'

    const permission1 = new Permission()
    permission1.code = 'ccc'
    permission1.description = '访问 ccc 接口'

    const permission2 = new Permission()
    permission2.code = 'ddd'
    permission2.description = '访问 ddd 接口'

    user1.roles = [role1]
    user2.roles = [role2]

    role1.permissions = [permission1, permission2]
    role2.permissions = [permission1]

    await this.permissionRepository.save([permission1, permission2])
    await this.roleRepository.save([role1, role2])
    await this.userRepository.save([user1, user2])
  }

  async register(registerUser: RegisterUserDto) {
    const captcha = await this.redisService.get(`captcha_${registerUser.email}`)

    if (!captcha) {
      throw new HttpException('验证码已过期', HttpStatus.BAD_REQUEST)
    }
    if (captcha !== registerUser.captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST)
    }
    const user = await this.userRepository.findOneBy({
      username: registerUser.username
    })
    if (user) {
      throw new HttpException('用户名已存在', HttpStatus.BAD_REQUEST)
    }

    const newUser = new User()
    newUser.username = registerUser.username
    newUser.password = md5(registerUser.password)
    newUser.nick_name = registerUser.nick_name
    newUser.email = registerUser.email
    newUser.phone_number = registerUser.phone_number

    try {
      await this.userRepository.save(newUser)
      return '注册成功'
    } catch (error) {
      this.logger.error(error, UserService)
      return '注册失败'
    }
  }

  async login(loginUser: LoginUserDto, is_admin: boolean) {
    const user = await this.userRepository.findOne({
      where: {
        username: loginUser.username,
        is_admin
      },
      relations: ['roles', 'roles.permissions']
    })
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST)
    }
    if (user.password !== md5(loginUser.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST)
    }
    const vo = new LoginUserVo()
    vo.userInfo = {
      id: user.id,
      username: user.username,
      nike_name: user.nick_name,
      email: user.email,
      head_pic: user.head_pic,
      phone_number: user.phone_number,
      is_forzen: user.is_forzen,
      is_admin: user.is_admin,
      create_time: user.create_time,
      update_time: user.update_time,
      roles: user.roles.map((role) => role.name),
      permissions: user.roles.reduce((arr, item) => {
        item.permissions.forEach((permission: Permission) => {
          if (arr.indexOf(permission) === -1) {
            arr.push(permission)
          }
        })
        return arr
      }, [])
    }
    return vo
  }

  async findUserById(userId: number, is_admin: boolean) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId
      },
      relations: ['roles', 'roles.permissions']
    })
    return {
      id: user.id,
      username: user.username,
      is_admin: user.is_admin,
      roles: user.roles.map((role) => role.name),
      permissions: user.roles.reduce((arr, item) => {
        item.permissions.forEach((permission) => {
          if (arr.indexOf(permission) === -1) {
            arr.push(permission)
          }
        })
        return arr
      }, [])
    }
  }

  async findUserDetailById(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId
      }
    })
    return user
  }

  async updatePassword(userId: number, passwordDto: UpdateUserPasswordDto) {
    const captcha = await this.redisService.get(
      `update_password_captcha_${passwordDto.email}`
    )
    if (!captcha) {
      throw new HttpException('验证码已过期', HttpStatus.BAD_REQUEST)
    }
    if (passwordDto.captcha !== captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST)
    }
    const foundUser = await this.userRepository.findOneBy({ id: userId })

    foundUser.password = md5(passwordDto.password)

    try {
      await this.userRepository.save(foundUser)
      return '修改密码成功'
    } catch (err) {
      this.logger.error(err, UserService)
      return '修改密码失败'
    }
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    const captcha = await this.redisService.get(
      `update_user_captcha_${updateUserDto.email}`
    )
    if (!captcha) {
      throw new HttpException('验证码已过期', HttpStatus.BAD_REQUEST)
    }
    if (updateUserDto.captcha !== captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST)
    }
    const foundUser = await this.userRepository.findOneBy({ id: userId })
    if (updateUserDto.nick_name) {
      foundUser.nick_name = updateUserDto.nick_name
    }
    if (updateUserDto.head_pic) {
      foundUser.head_pic = updateUserDto.head_pic
    }
    try {
      await this.userRepository.save(foundUser)
      return '用户信息修改成功'
    } catch (err) {
      this.logger.error(err, UserService)
      return '用户信息修改失败'
    }
  }

  async freezeUserById(id: number) {
    const user = await this.userRepository.findOneBy({ id })
    user.is_forzen = true
    await this.userRepository.update({ id }, user)
  }

  async findUsersByPage(
    username: string,
    nickName: string,
    email: string,
    page: number,
    size: number
  ) {
    const skip = (page - 1) * size
    const condition: Record<string, any> = {}
    if (username) {
      condition.username = Like(`%${username}%`)
    }
    if (nickName) {
      condition.nick_name = Like(`%${nickName}%`)
    }
    if (email) {
      condition.email = Like(`%${email}%`)
    }
    const [users, total] = await this.userRepository.findAndCount({
      select: [
        'id',
        'username',
        'nick_name',
        'email',
        'phone_number',
        'is_forzen',
        'head_pic',
        'create_time'
      ],
      skip,
      take: size,
      where: condition
    })
    return {
      users,
      total
    }
  }
}
