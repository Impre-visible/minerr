import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { getJWTSecret } from 'src/utils';

const JWT_SECRET = getJWTSecret();

@Injectable()
export class JwtMiddleware implements NestMiddleware {

    private BYPASS_ROUTES = [
        { url: '/api/auth/login', method: 'POST' },
        { url: '/api/auth/register', method: 'POST' },
        { url: '/api/auth/refresh', method: 'POST' },
    ];

    use(req: Request, res: Response, next: NextFunction) {
        const route = this.BYPASS_ROUTES.find(
            r => r.url === req.baseUrl && r.method === req.method
        );
        if (route) {
            return next(); // Bypass authentication for specified routes
        }
        let token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            token = req.query.access_token as string;
        }
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req['user'] = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Token expired or invalid' });
        }
    }
}
