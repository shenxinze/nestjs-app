import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { Permission } from './user/entities/permission.entity'
import { Request } from 'express'

interface JwtUserData {
  userId: number
  username: string
  roles: string[]
  permissions: Permission[]
}
declare module 'express' {
  interface Request {
    user: JwtUserData
  }
}

@Injectable()
export class PermissionGuard implements CanActivate {
  @Inject(Reflector)
  private reflector: Reflector
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest()
    if (!request.user) {
      return true
    }
    const permissions = request.user.permissions
    const requirePermissions = this.reflector.getAllAndOverride<string[]>(
      'require-permission',
      [context.getClass(), context.getHandler()]
    )
    console.log('requirePermissions', requirePermissions)
    if (!requirePermissions) {
      return true
    }
    for (let i = 0; i < requirePermissions.length; i++) {
      const curPermission = requirePermissions[i]
      const found = permissions.find((item) => item.code === curPermission)
      if (!found) {
        throw new UnauthorizedException('没有接口访问权限')
      }
    }
    return true
  }
}
