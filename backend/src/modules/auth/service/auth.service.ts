import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { getJWTSecret } from 'src/utils';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) { }

    async validateUser(username: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return user;
    }

    async login(user: User) {
        const payload = { username: user.username, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
            refresh_token: this.jwtService.sign(payload, { expiresIn: '30d' }),
        };
    }

    async register(username: string, password: string) {
        let alreadyExists = await this.prisma.user.count() > 0;

        if (alreadyExists) {
            throw new UnauthorizedException('This application allows only one user.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                username,
                password: hashedPassword,
            },
        });

        return user;
    }

    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: getJWTSecret(),
            });

            return {
                access_token: this.jwtService.sign(
                    { username: payload.username, sub: payload.sub },
                    { expiresIn: '15m' },
                ),
            };
        } catch (e) {
            throw new Error('Invalid refresh token');
        }
    }
}
