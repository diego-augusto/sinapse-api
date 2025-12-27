import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FinanceDocument = HydratedDocument<Finance>;

@Schema({ timestamps: true })
export class Finance {
    @Prop({ required: true })
    id: string;

    @Prop()
    mongoID: string;

    @Prop({ required: true })
    ident: string;

    @Prop({ required: true })
    name: string;

    @Prop()
    address: string;

    @Prop({ type: Number, default: 0 })
    tupiCouponsTotalValue: number;

    @Prop({ type: Number, default: 0 })
    clientCouponsTotalValue: number;

    @Prop({ type: Number, default: 0 })
    thirdPartyTotalValue: number;

    @Prop({ type: Number, default: 0 })
    tupiTotalValue: number;

    @Prop({ type: Number, default: 0 })
    balanceTotalValue: number;

    @Prop()
    startAt: Date;

    @Prop()
    endAt: Date;
}

export const FinanceSchema = SchemaFactory.createForClass(Finance);
