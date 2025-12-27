import { HttpException, HttpStatus } from '@nestjs/common';

export class TupiApiException extends HttpException {
    constructor(message: string, statusCode = HttpStatus.BAD_GATEWAY) {
        super(
            {
                statusCode,
                message,
                error: 'TUPI_API_ERROR',
            },
            statusCode,
        );
    }
}
