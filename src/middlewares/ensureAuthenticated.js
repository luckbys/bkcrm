import { verify } from 'jsonwebtoken';
export function ensureAuthenticated(request, response, next) {
    // Validar token JWT
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        throw new Error('JWT token is missing');
    }
    const [, token] = authHeader.split(' ');
    try {
        const decoded = verify(token, process.env.JWT_SECRET || '');
        request.user = {
            id: decoded.sub,
            role: decoded.role
        };
        return next();
    }
    catch {
        throw new Error('Invalid JWT token');
    }
}
