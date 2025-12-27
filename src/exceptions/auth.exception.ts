import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthException extends HttpException {
    constructor(message: string) {
        super(
            {
                statusCode: HttpStatus.UNAUTHORIZED,
                message,
                error: 'AUTHENTICATION_ERROR',
            },
            HttpStatus.UNAUTHORIZED,
        );
    }
}
