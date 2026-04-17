import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MailService } from './mail.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}), // secrets provided per-call in service
  ],
  providers: [AuthService, MailService, JwtStrategy, JwtRefreshStrategy, GoogleStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
