import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token từ email' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Mật khẩu mới', minimum: 6 })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  newPassword: string;
}
