import { Controller, Post, Body, Logger, ValidationPipe } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
} from '@nestjs/swagger';
import { FinanceService } from '../services/finance.service';
import { GetStationsSummaryDto } from '../dtos/get-stations-summary.dto';

@ApiTags('Finance')
@Controller('finance')
export class FinanceController {
    private readonly logger = new Logger(FinanceController.name);

    constructor(private financeService: FinanceService) { }

    @Post('stations-summary')
    @ApiOperation({
        summary: 'Recupera e salva sumário de estações',
        description:
            'Busca dados de transações de estações da API TUPI para o período especificado e salva no banco de dados',
    })
    @ApiBody({
        description: 'Intervalo de datas para buscar dados',
        type: GetStationsSummaryDto,
    })
    @ApiResponse({
        status: 201,
        description: 'Dados salvos com sucesso',
        schema: {
            example: {
                message: 'Dados salvos com sucesso',
                count: 12,
                meta: {
                    page: 1,
                    perPage: 100,
                    count: 12,
                    search: '',
                    pages: 1,
                },
                results: [
                    {
                        _id: '507f1f77bcf86cd799439011',
                        id: '0194890b-2522-7861-bead-eeadd7294427',
                        mongoID: '677708e8e2955e001f1e4d21',
                        ident: 'TS202406033',
                        name: 'Sinapse Solar | Parahyba Mall',
                        address: 'R. Bacharel José de Oliveira Curchatuz, 850 - Jardim Oceania, João Pessoa - PB, 58037-432',
                        tupiCouponsTotalValue: 885.11,
                        clientCouponsTotalValue: 1712.83,
                        thirdPartyTotalValue: 0,
                        tupiTotalValue: 1966.15,
                        balanceTotalValue: 20897.87,
                        startAt: '2025-12-01T00:00:00.000Z',
                        endAt: '2025-12-31T23:59:59.999Z',
                        createdAt: '2025-12-27T00:00:00.000Z',
                        updatedAt: '2025-12-27T00:00:00.000Z',
                    },
                ],
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Dados de entrada inválidos',
        schema: {
            example: {
                statusCode: 400,
                message: ['startAt must be a valid ISO 8601 date string'],
                error: 'Bad Request',
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Erro de autenticação com a API TUPI',
        schema: {
            example: {
                statusCode: 401,
                message: 'Falha na autenticação Firebase',
                error: 'AUTHENTICATION_ERROR',
            },
        },
    })
    @ApiResponse({
        status: 502,
        description: 'Erro ao conectar com a API TUPI',
        schema: {
            example: {
                statusCode: 502,
                message: 'Falha ao recuperar dados da TUPI: Connection timeout',
                error: 'TUPI_API_ERROR',
            },
        },
    })
    async fetchAndSaveStationsSummary(
        @Body(new ValidationPipe({ transform: true }))
        dto: GetStationsSummaryDto,
    ) {
        this.logger.log(
            `Recebido request para buscar dados: startAt=${dto.startAt}, endAt=${dto.endAt}`,
        );
        return this.financeService.fetchAndSaveStationsSummary(
            dto.startAt,
            dto.endAt,
        );
    }
}
