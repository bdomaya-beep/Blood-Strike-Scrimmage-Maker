import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(24) username!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() displayName?: string;
  @ApiProperty() @IsString() @MinLength(8) password!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() region?: string;
}

export class LoginDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() password!: string;
}

export class OtpRequestDto {
  @ApiProperty({ enum: ['email', 'sms'] }) @IsString() channel!: string;
}

export class OtpVerifyDto {
  @ApiProperty() @IsString() @MinLength(6) @MaxLength(6) otp!: string;
}

export class RefreshTokenDto {
  @ApiProperty() @IsString() refreshToken!: string;
}

export class SocialAuthDto {
  @ApiProperty() @IsString() code!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() redirectUri?: string;
}

export class RequestRoleDto {
  @ApiProperty({ enum: ['tournament_organizer', 'clan_leader', 'clan_moderator', 'spectator'] })
  @IsString()
  @IsIn(['tournament_organizer', 'clan_leader', 'clan_moderator', 'spectator'])
  roleCode!: string;
}

export class ReviewRoleRequestDto {
  @ApiProperty()
  @IsBoolean()
  approve!: boolean;
}
