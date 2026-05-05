import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, OtpRequestDto, OtpVerifyDto, RefreshTokenDto, RequestRoleDto, ReviewRoleRequestDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../../common/guards/jwt-auth.guard';
import { SetMetadata } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refreshTokens(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.getMe(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { displayName?: string; region?: string; avatarUrl?: string },
  ) {
    return this.auth.updateProfile(user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  requestOtp(@CurrentUser() user: AuthenticatedUser, @Body() dto: OtpRequestDto) {
    // TODO: implement OTP generation and delivery
    return { message: 'OTP sent to ' + dto.channel };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@CurrentUser() user: AuthenticatedUser, @Body() dto: OtpVerifyDto) {
    // TODO: verify OTP hash and mark user as verified
    return { message: 'Account verified' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout() {
    // TODO: revoke refresh token in sessions table
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('roles/request')
  @HttpCode(HttpStatus.CREATED)
  requestRole(@CurrentUser() user: AuthenticatedUser, @Body() dto: RequestRoleDto) {
    return this.auth.requestRole(user.id, dto.roleCode);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('roles/bootstrap-super-admin')
  @HttpCode(HttpStatus.OK)
  bootstrapSuperAdmin(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.bootstrapSuperAdmin(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('admin/role-requests')
  @Roles('super_admin')
  listRoleRequests(@Query('status') status = 'open') {
    return this.auth.listRoleRequests(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post('admin/role-requests/:requestId/review')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  reviewRoleRequest(
    @Param('requestId') requestId: string,
    @Body() dto: ReviewRoleRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.auth.reviewRoleRequest(requestId, dto.approve, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post('admin/users/:userId/roles/:roleCode')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  grantRoleDirect(
    @Param('userId') userId: string,
    @Param('roleCode') roleCode: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.auth.grantRole(userId, roleCode, user.id);
  }

  // ── Admin: User Management ──────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('admin/users')
  @Roles('super_admin')
  listUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.auth.listUsers(+page, +limit, search);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post('admin/users')
  @Roles('super_admin')
  @HttpCode(HttpStatus.CREATED)
  createUser(
    @Body() dto: RegisterDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.auth.adminCreateUser(dto, admin.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Patch('admin/users/:userId/status')
  @Roles('super_admin')
  setUserStatus(
    @Param('userId') userId: string,
    @Body('status') status: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.auth.setUserStatus(userId, status, admin.id);
  }
}
