import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { DataMaskingService } from './data-masking.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly dataMaskingService: DataMaskingService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto, this.actorId(req));
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.REGISTRAR)
  async findAll(
    @Query('activeOnly') activeOnly: string = 'true',
    @Query('role') role?: UserRole,
    @Query('clinicId') clinicId?: string,
    @Req() req?: Request,
  ): Promise<UserResponseDto[]> {
    const isActiveOnly = activeOnly !== 'false';

    let users: UserResponseDto[];
    if (role) {
      users = await this.usersService.findByRole(role, isActiveOnly);
    } else if (clinicId) {
      users = await this.usersService.findByClinic(clinicId, isActiveOnly);
    } else {
      users = await this.usersService.findAll(isActiveOnly);
    }

    return this.dataMaskingService.maskUsersList(
      users,
      this.actorRole(req),
      this.actorId(req),
    );
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.REGISTRAR)
  async search(
    @Query('q') searchTerm: string,
    @Query('role') role?: UserRole,
    @Req() req?: Request,
  ): Promise<UserResponseDto[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }
    const users = await this.usersService.searchUsers(searchTerm.trim(), role);
    return this.dataMaskingService.maskUsersList(
      users,
      this.actorRole(req),
      this.actorId(req),
    );
  }

  @Get('profile')
  async getProfile(@Req() req: Request): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(this.requireActorId(req));
    return this.dataMaskingService.maskUser(
      user,
      this.actorRole(req),
      this.actorId(req),
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.REGISTRAR)
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id);
    return this.dataMaskingService.maskUser(
      user,
      this.actorRole(req),
      this.actorId(req),
    );
  }

  @Patch('profile')
  async updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const actorId = this.requireActorId(req);
    // A user may only ever edit their own profile through this route.
    return this.usersService.update(
      actorId,
      this.stripPrivilegedFields(updateUserDto),
      actorId,
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto, this.actorId(req));
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivate(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    return this.usersService.deactivate(id, this.actorId(req));
  }

  // --- helpers -------------------------------------------------------------

  private actor(req?: Request): AuthenticatedRequest['user'] | undefined {
    return (req as AuthenticatedRequest | undefined)?.user;
  }

  private actorId(req?: Request): string | undefined {
    return this.actor(req)?.userId;
  }

  private actorRole(req?: Request): UserRole | undefined {
    return this.actor(req)?.role;
  }

  private requireActorId(req: Request): string {
    const id = this.actorId(req);
    if (!id) {
      // JwtAuthGuard guarantees this, so reaching here means a misconfigured route.
      throw new Error('Authenticated user id missing from request');
    }
    return id;
  }

  /**
   * Block privilege escalation through the self-service profile route: role,
   * password, activation, clinic and child links are admin-only.
   */
  private stripPrivilegedFields(dto: UpdateUserDto): UpdateUserDto {
    const safe = { ...dto } as Record<string, unknown>;
    for (const key of [
      'role',
      'password',
      'currentPassword',
      'isActive',
      'clinicId',
      'childrenIds',
    ]) {
      delete safe[key];
    }
    return safe;
  }
}
