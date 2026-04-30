import { Schema, model, models } from "mongoose";

export type UserDocument = {
  firebaseUid: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  stripeCustomerId?: string;
  subscriptionStatus?: "active" | "inactive";
  currentPlan?: string;
  currentPeriodEnd?: Date | null;
  createdAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    stripeCustomerId: { type: String, default: "", index: true },
    subscriptionStatus: { type: String, enum: ["active", "inactive"], default: "inactive" },
    currentPlan: { type: String, default: "" },
    currentPeriodEnd: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

export const UserModel = models.User || model<UserDocument>("User", userSchema);
