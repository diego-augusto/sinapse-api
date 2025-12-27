import { IsISO8601, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetStationsSummaryDto {
    @ApiProperty({
        description: 'Data inicial no formato ISO 8601',
        example: '2025-12-01T00:00:00.000Z',
    })
    @IsNotEmpty()
    @IsISO8601()
    startAt: string;

    @ApiProperty({
        description: 'Data final no formato ISO 8601',
        example: '2025-12-31T23:59:59.999Z',
    })
    @IsNotEmpty()
    @IsISO8601()
    endAt: string;
}
