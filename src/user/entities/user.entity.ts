import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Role } from './role.entity'

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 50, comment: '用户名' })
  username: string

  @Column({ length: 50, comment: '密码' })
  password: string

  @Column({ length: 50, comment: '昵称' })
  nick_name: string

  @Column({ length: 50, comment: '邮箱' })
  email: string

  @Column({ length: 100, nullable: true, comment: '头像' })
  head_pic: string

  @Column({ length: 20, nullable: true, comment: '手机号' })
  phone_number: string

  @Column({ default: false, comment: '是否被冻结' })
  is_forzen: boolean

  @Column({ default: false, comment: '是否是管理员' })
  is_admin: boolean

  @CreateDateColumn({ comment: '创建时间' })
  create_time: Date

  @UpdateDateColumn({ comment: '更新时间' })
  update_time: Date

  @ManyToMany(() => Role)
  @JoinTable({ name: 'user_roles' })
  roles: Role[]
}
