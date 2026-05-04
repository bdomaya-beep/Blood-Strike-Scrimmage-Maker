import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

const ROLE_ALIASES: Record<string, string[]> = {
  admin: ['super_admin'],
  moderator: ['tournament_organizer', 'clan_moderator'],
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    const userRoles = req.user?.roles ?? [];
    const hasRole = required.some((requiredRole) => {
      if (userRoles.includes(requiredRole)) return true;
      const aliases = ROLE_ALIASES[requiredRole] ?? [];
      return aliases.some((alias) => userRoles.includes(alias));
    });

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
