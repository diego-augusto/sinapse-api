import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import NodeCache from 'node-cache';
import { AuthException } from '../exceptions/auth.exception';
import { TupiApiException } from '../exceptions/tupi-api.exception';

interface FirebaseAuthResponse {
    idToken: string;
    expiresIn: string;
}

interface TupiStationsResponse {
    meta: {
        page: number;
        perPage: number;
        count: number;
        search: string;
        pages: number;
    };
    results: any[];
}

@Injectable()
export class TupiService {
    private readonly logger = new Logger(TupiService.name);
    private readonly axiosInstance: AxiosInstance;
    private readonly cache: NodeCache;
    private readonly TOKEN_CACHE_KEY = 'tupi_auth_token';
    private readonly FIREBASE_TOKEN_ENDPOINT =
        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';

    constructor(private configService: ConfigService) {
        this.axiosInstance = axios.create();
        this.cache = new NodeCache({
            stdTTL: this.configService.get('TOKEN_CACHE_TTL') || 3600,
            checkperiod: 600,
        });
    }

    /**
     * Autentica via Firebase/Google Identity Toolkit
     */
    async authenticate(): Promise<string> {
        try {
            const firebaseApiKey = this.configService.get('FIREBASE_API_KEY');
            if (!firebaseApiKey) {
                throw new Error('FIREBASE_API_KEY não configurado');
            }

            const response = await this.axiosInstance.post<FirebaseAuthResponse>(
                `${this.FIREBASE_TOKEN_ENDPOINT}?key=${firebaseApiKey}`,
                {
                    email: this.configService.get('FIREBASE_EMAIL'),
                    password: this.configService.get('FIREBASE_PASSWORD'),
                    returnSecureToken: true,
                    clientType: 'CLIENT_TYPE_WEB',
                },
            );

            if (!response.data.idToken) {
                throw new Error('Token não recebido');
            }

            return response.data.idToken;
        } catch (error) {
            this.logger.error(`Erro ao autenticar no Firebase: ${error.message}`);
            throw new AuthException('Falha na autenticação Firebase');
        }
    }

    /**
     * Obtém token do cache ou faz refresh
     */
    async getOrRefreshToken(): Promise<string> {
        const cachedToken = this.cache.get<string>(this.TOKEN_CACHE_KEY);

        if (cachedToken) {
            this.logger.log('Token obtido do cache');
            return cachedToken;
        }

        this.logger.log('Fazendo novo request de autenticação');
        const newToken = await this.authenticate();
        this.cache.set(this.TOKEN_CACHE_KEY, newToken);

        return newToken;
    }

    /**
     * Busca sumário de estações da API TUPI
     */
    async getStationsSummary(
        startAt: string,
        endAt: string,
        page = 1,
        perPage = 100,
        search = '',
    ): Promise<TupiStationsResponse> {
        try {
            const token = await this.getOrRefreshToken();
            const baseUrl = this.configService.get('TUPI_API_BASE_URL');
            const cpmsId = this.configService.get('TUPI_CPMS_ID');

            if (!baseUrl || !cpmsId) {
                throw new Error('Configurações TUPI não encontradas');
            }

            const url = `${baseUrl}/finance/cpms/${cpmsId}/stations/summary`;

            const response = await this.axiosInstance.get<TupiStationsResponse>(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                params: {
                    page,
                    perPage,
                    search,
                    startAt,
                    endAt,
                    download: false,
                },
            });

            this.logger.log(
                `Estações recuperadas com sucesso. Total: ${response.data.results.length}`,
            );
            return response.data;
        } catch (error) {
            if (error instanceof AuthException) {
                throw error;
            }

            this.logger.error(
                `Erro ao buscar estações da TUPI: ${error.message}`,
                error.response?.data,
            );

            const statusCode = error.response?.status || 502;
            throw new TupiApiException(
                `Falha ao recuperar dados da TUPI: ${error.message}`,
                statusCode,
            );
        }
    }

    /**
     * Invalida o cache de token (força refresh no próximo request)
     */
    invalidateTokenCache(): void {
        this.cache.del(this.TOKEN_CACHE_KEY);
        this.logger.log('Token cache invalidado');
    }
}
