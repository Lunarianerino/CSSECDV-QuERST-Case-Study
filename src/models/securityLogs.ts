import mongoose, { Schema, Document, models, model } from "mongoose";

export enum SecurityEvent {
  AUTH_SIGNIN = "auth.signin",
  AUTH_SIGNOUT = "auth.signout",
  AUTH_ERROR = "auth.error",
  VALIDATION = "validation",
  ACCESS_DENIED = "access.denied",
  ACCESS_GRANTED = "access.granted",

  // CRUD logs
  OPERATION_CREATE = "operation.create",
  OPERATION_READ = "operation.read",
  OPERATION_UPDATE = "operation.update",
  OPERATION_DELETE = "operation.delete",
}

export type SecurityOutcome = "success" | "failure";

export interface ISecurityLog extends Document {
  event: SecurityEvent;
  outcome: SecurityOutcome;
  userId?: string;
  actorEmail?: string;
  resource?: string;
  message?: string;
  ip?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export const SecurityLogSchema = new Schema<ISecurityLog>(
  {
    event: { type: String, required: true, enum: Object.values(SecurityEvent) },
    outcome: { type: String, required: true, enum: ["success", "failure"] },
    userId: { type: String },
    actorEmail: { type: String },
    resource: { type: String },
    message: { type: String },
    ip: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);


