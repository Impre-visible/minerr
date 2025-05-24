import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { PrismaService } from 'src/prisma/prisma.service';
import { getJWTSecret } from 'src/utils';

@Module({
  imports: [PassportModule, JwtModule.register({
    secret: getJWTSecret(),
    signOptions: { expiresIn: '15m' },
  })],
  providers: [AuthService, LocalStrategy, PrismaService],
  controllers: [AuthController]
})
export class AuthModule { }
