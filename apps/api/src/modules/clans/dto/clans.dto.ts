import { IsString, IsOptional, MinLength, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClanDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() @MaxLength(6) tag!: string;
  @ApiProperty() @IsString() region!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bannerUrl?: string;
}

export class UpdateClanDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bannerUrl?: string;
}

export class InviteMemberDto {
  @ApiProperty() @IsUUID() userId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() message?: string;
}

export class CreateRecruitmentPostDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() @MinLength(10) body!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() requiredRank?: string;
  @ApiPropertyOptional() @IsOptional() slots?: number;
}
