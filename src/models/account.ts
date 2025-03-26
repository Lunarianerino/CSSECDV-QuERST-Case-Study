import mongoose, { Schema, Document } from "mongoose";
import { hashSync, genSaltSync, compareSync } from "bcrypt-ts";

export interface IAccount extends Document {
  name: string;
  email: string;
  password: string;
  type: string;
}

const AccountSchema: Schema = new Schema(
  {
    name: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: { type: String, required: true, enum: ["tutor", "student", "admin", "unknown"], default: "unknown" },
    onboarded: { type: Boolean, required: true, default: false },
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
  return next();
});

AccountSchema.methods.comparePassword = function (
  candidatePassword: string,
  cb: (err: mongoose.CallbackError | null, isMatch?: boolean) => void 
) {
  const result = compareSync(candidatePassword, this.password);
  cb(null, result);
};

const Account = mongoose.models?.Account || mongoose.model<IAccount>("Account", AccountSchema);
export default Account;