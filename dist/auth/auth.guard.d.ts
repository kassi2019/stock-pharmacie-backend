import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthGuard implements CanActivate {
    private readonly jwt;
    private readonly reflector;
    private readonly prisma;
    constructor(jwt: JwtService, reflector: Reflector, prisma: PrismaService);
    canActivate(ctx: ExecutionContext): Promise<boolean>;
}
