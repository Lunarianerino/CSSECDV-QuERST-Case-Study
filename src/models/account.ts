import mongoose, { Schema, Document } from "mongoose";
import { hashSync, genSaltSync, compareSync } from "bcrypt-ts";
export enum AccountType {
  TUTOR = "tutor",
  STUDENT = "student",
  ADMIN = "admin",
  UNKNOWN = "unknown",
}
export interface IAccount extends Document {
  name: string;
  email: string;
  password: string;
  type: string;
  disabled: boolean;
  passwordHistory: [{ hash: string; changedAt: Date }];
  passwordChangedAt: Date;
}

export const AccountSchema: Schema = new Schema(
  {
    name: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: { type: String, required: true, enum: AccountType, default: AccountType.UNKNOWN },
    onboarded: { type: Boolean, required: true, default: false },
    disabled: { type: Boolean, required: true, default: false },
    passwordHistory: {
      type: [
        {
          hash: { type: String, required: true },
          changedAt: { type: Date, required: true, default: Date.now },
        },
      ],
      default: [],
    },
    passwordChangedAt: { type: Date, required: true, default: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  },
  {
    timestamps: true,
  }
);

AccountSchema.pre("save", function (next) {
  const account = this as unknown as IAccount;
  //TODO: Add session checking to see if they are modifying their own account
  if (!account.isModified("password")) return next();
  const hash = hashSync(account.password, 10);
  account.password = hash;
  account.passwordChangedAt = new Date();
  return next();
});

AccountSchema.methods.comparePassword = function (
  candidatePassword: string,
  cb: (err: mongoose.CallbackError | null, isMatch?: boolean) => void
) {
  const result = compareSync(candidatePassword, this.password);
  cb(null, result);
};
