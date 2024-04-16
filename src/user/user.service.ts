import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { RegisterUserDto } from './dto/create-user.dto'
import { RedisService } from 'src/redis/redis.service'
import { md5 } from 'src/utils'
import { Role } from './entities/role.entity'
import { Permission } from './entities/permission.entity'

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
}
