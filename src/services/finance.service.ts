import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Finance, FinanceDocument } from '../schemas/finance.schema';
import { TupiService } from './tupi.service';
import { TupiApiException } from '../exceptions/tupi-api.exception';

interface StationData {
    id: string;
    mongoID: string;
    ident: string;
    name: string;
    address: string;
    tupiCouponsTotalValue: number;
    clientCouponsTotalValue: number;
    thirdPartyTotalValue: number;
    tupiTotalValue: number;
    balanceTotalValue: number;
}

@Injectable()
export class FinanceService {
    private readonly logger = new Logger(FinanceService.name);

    constructor(
        @InjectModel(Finance.name)
        private financeModel: Model<FinanceDocument>,
        private tupiService: TupiService,
    ) { }

    /**
     * Busca dados de estações da TUPI e salva no banco de dados
     */
    async fetchAndSaveStationsSummary(
        startAt: string,
        endAt: string,
    ): Promise<any> {
        try {
            this.logger.log(
                `Iniciando busca de dados TUPI para período: ${startAt} a ${endAt}`,
            );

            // Busca dados da TUPI
            const tupiResponse = await this.tupiService.getStationsSummary(
                startAt,
                endAt,
            );

            if (!tupiResponse.results || tupiResponse.results.length === 0) {
                this.logger.warn(
                    'Nenhum resultado encontrado na TUPI para o período especificado',
                );
                return {
                    message: 'Nenhum resultado encontrado',
                    count: 0,
                    results: [],
                };
            }

            // Processa e salva cada estação
            const savedRecords = await this.saveStations(
                tupiResponse.results,
                startAt,
                endAt,
            );

            this.logger.log(`${savedRecords.length} registros salvos com sucesso`);

            return {
                message: 'Dados salvos com sucesso',
                count: savedRecords.length,
                meta: tupiResponse.meta,
                results: savedRecords,
            };
        } catch (error) {
            if (error instanceof TupiApiException) {
                throw error;
            }

            this.logger.error(
                `Erro ao buscar e salvar dados: ${error.message}`,
                error.stack,
            );
            throw new TupiApiException(
                `Falha ao processar dados de estações: ${error.message}`,
                500,
            );
        }
    }

    /**
     * Salva dados de estações no MongoDB
     */
    private async saveStations(
        stations: StationData[],
        startAt: string,
        endAt: string,
    ): Promise<any[]> {
        const savedRecords: any[] = [];

        for (const station of stations) {
            try {
                // Atualiza ou cria o documento
                const record = await this.financeModel.findOneAndUpdate(
                    { id: station.id, ident: station.ident },
                    {
                        ...station,
                        startAt: new Date(startAt),
                        endAt: new Date(endAt),
                    },
                    { upsert: true, new: true, lean: false },
                );

                savedRecords.push(record);
            } catch (error) {
                this.logger.error(
                    `Erro ao salvar estação ${station.ident}: ${error.message}`,
                );
                throw error;
            }
        }

        return savedRecords;
    }

    /**
     * Recupera registros de transações por período
     */
    async getTransactionsByDateRange(
        startAt: string,
        endAt: string,
    ): Promise<any> {
        try {
            const startDate = new Date(startAt);
            const endDate = new Date(endAt);

            const records = await this.financeModel
                .find({
                    startAt: { $gte: startDate },
                    endAt: { $lte: endDate },
                })
                .exec();

            return {
                count: records.length,
                results: records,
            };
        } catch (error) {
            this.logger.error(
                `Erro ao recuperar transações: ${error.message}`,
                error.stack,
            );
            throw new TupiApiException(
                `Falha ao recuperar transações: ${error.message}`,
                500,
            );
        }
    }

    /**
     * Remove registros antigos (limpeza de banco)
     */
    async deleteOldRecords(beforeDate: Date): Promise<any> {
        try {
            const result = await this.financeModel.deleteMany({
                createdAt: { $lt: beforeDate },
            });

            this.logger.log(`${result.deletedCount} registros antigos deletados`);

            return {
                message: 'Registros antigos deletados',
                deletedCount: result.deletedCount,
            };
        } catch (error) {
            this.logger.error(`Erro ao deletar registros antigos: ${error.message}`);
            throw new TupiApiException(
                `Falha ao deletar registros: ${error.message}`,
                500,
            );
        }
    }
}
