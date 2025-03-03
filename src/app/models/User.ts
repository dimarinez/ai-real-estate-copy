import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    name?: string;
    password?: string;
    subscriptionStatus: string;
    lastFreeGeneration?: string;
    dailyGenerations: number;
    savedListings: { title: string; description: string; date: Date }[];
}

const UserSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    name: { type: String },
    password: { type: String, select: false },
    subscriptionStatus: { type: String, default: 'free' },
    lastFreeGeneration: { type: String },
    dailyGenerations: { type: Number, default: 0 },
    savedListings: [
        {
            title: { type: String, required: true },
            description: { type: String, required: true },
            date: { type: Date, default: Date.now },
        },
    ],
});

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
