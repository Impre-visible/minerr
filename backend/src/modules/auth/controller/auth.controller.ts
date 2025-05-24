import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../service/auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req) {
        return this.authService.login(req.user);
    }

    @Post('register')
    async register(@Body() body) {
        return this.authService.register(body.username, body.password);
    }

    @Post('refresh')
    async refreshToken(@Body() body: { refresh_token: string }) {
        return this.authService.refreshToken(body.refresh_token);
    }
}