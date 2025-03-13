import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  password?: string;
  subscriptionStatus: string;
  lastFreeGeneration?: string;
  dailyGenerations: number;
  savedListings: {
    title: string;
    description: string;
    location?: string;
    date: Date;
    social?: {
      twitter?: string;
      instagram?: string;
      facebook?: string;
      linkedin?: string;
    };
    analytics?: {
      views: number;
      trackableUrl?: string;
      redirectUrl?: string;
      lastUpdated?: Date;
    };
  }[];
  isVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: number;
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
      location: String,
      date: { type: Date, default: Date.now },
      social: {
        twitter: { type: String },
        instagram: { type: String },
        facebook: { type: String },
        linkedin: { type: String },
      },
      analytics: {
        views: { type: Number, default: 0 },
        trackableUrl: String,
        redirectUrl: String,
        lastUpdated: Date,
      },
    },
  ],
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, unique: true, sparse: true },
  resetToken: { type: String, unique: true, sparse: true },
  resetTokenExpiry: { type: Number },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;