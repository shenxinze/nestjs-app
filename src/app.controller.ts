import { Controller, Get, SetMetadata } from '@nestjs/common'
import { AppService } from './app.service'
import { RequireLogin, RequirePermissions, UserInfo } from './custom.decorator'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('aaa')
  @RequireLogin()
  @RequirePermissions('ddd')
  aaa(@UserInfo('username') username: string, @UserInfo() userInfo) {
    console.log(username)
    console.log(userInfo)
    return 'aaa'
  }

  @Get('bbb')
  @RequireLogin()
  bbb() {
    return 'bbb'
  }
}
