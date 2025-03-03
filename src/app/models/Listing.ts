import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IListing extends Document {
  userId: Types.ObjectId;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  features: string[];
  location: string;
  priceRange: string;
  tone: string;
  specialNotes?: string;
  listingDescription: string;
  socialMediaCaption: string;
  createdAt: Date;
}

const ListingSchema = new Schema<IListing>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  propertyType: { type: String, required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  features: { type: [String], default: [] },
  location: { type: String, required: true },
  priceRange: { type: String },
  tone: { type: String, required: true },
  specialNotes: { type: String },
  listingDescription: { type: String, required: true },
  socialMediaCaption: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Listing =
  mongoose.models.Listing || mongoose.model<IListing>('Listing', ListingSchema);

export default Listing;
