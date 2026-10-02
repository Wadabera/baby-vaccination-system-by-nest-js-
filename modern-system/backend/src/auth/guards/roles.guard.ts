import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

/**
 * Enforces the `@Roles(...)` metadata set by the decorator.
 *
 * Metadata is read from both the handler and the controller class so that a
 * class-level `@Roles(...)` actually restricts every route in that controller,
 * while a handler-level `@Roles(...)` narrows further. The handler value wins
 * when both are present.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const handlerRoles = this.reflector.get<string[] | undefined>(
      'roles',
      context.getHandler(),
    );
    const classRoles = this.reflector.get<string[] | undefined>(
      'roles',
      context.getClass(),
    );

    const allowed = handlerRoles ?? classRoles;
    if (!allowed || allowed.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = request.user?.role;

    return !!role && allowed.includes(role);
  }
}
