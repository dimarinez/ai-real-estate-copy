import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISubscription extends Document {
    userId: Types.ObjectId;
    plan: 'free' | 'starter' | 'pro' | 'agency';
    status: 'active' | 'canceled' | 'expired';
    currentPeriodEnd: Date;
    createdAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: ['free', 'starter', 'pro', 'agency'], required: true },
    status: { type: String, enum: ['active', 'canceled', 'expired'], default: 'active' },
    currentPeriodEnd: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
export default Subscription;
