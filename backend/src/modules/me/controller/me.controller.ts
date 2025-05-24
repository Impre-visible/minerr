import { Controller, Get, Req } from '@nestjs/common';

@Controller('me')
export class MeController {
    @Get()
    getMe(@Req() req: Request & { user: { sub: string; username: string } }) {
        return {
            id: req.user.sub,
            username: req.user.username,
        };
    }
}
