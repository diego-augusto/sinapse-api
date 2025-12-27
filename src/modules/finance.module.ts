import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FinanceController } from '../controllers/finance.controller';
import { FinanceService } from '../services/finance.service';
import { TupiService } from '../services/tupi.service';
import { Finance, FinanceSchema } from '../schemas/finance.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Finance.name, schema: FinanceSchema },
        ]),
    ],
    controllers: [FinanceController],
    providers: [FinanceService, TupiService],
    exports: [FinanceService, TupiService],
})
export class FinanceModule { }
