import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getRandomIds } from '../utils/generateRandomIds.js';

const adminSchema = new mongoose.Schema({
    admin_id: {
        type: String,
        unique: true,
    },
    admin_name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    auth_details: {
        role: {
            type: String,
            default: "admin",
            enum: ['admin'],
        },
        password: {
            type: String,
            required: true,
        },
        passwordResetToken: {
            type: String,
            default: null,
        },
        passwordResetExpiresAt: {
            type: Date,
            default: null,
        },
    },
    lastActive: {
        type: Date,
        default: new Date(),
    },
},
{ timestamps: true }
);

adminSchema.pre("save", async function (next) {
    if (!this.isModified("auth_details.password")) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.auth_details.password = await bcrypt.hash(this.auth_details.password, salt);

    const existingAdminsCount = await mongoose.model("admins").countDocuments();
    if (!this.admin_id && existingAdminsCount >= 2) {
        return next(new Error("Admin account limit reached. Only 2 admins are allowed."));
    }

    if (!this.admin_id) {
        let isUnique = false;
        let retries = 0;
        const maxRetries = 5;

        while (!isUnique && retries < maxRetries) {
            const randomString = getRandomIds({ prefix: 'ADMIN-' });
            const existingAdmin = await mongoose.model("admins").findOne({ admin_id: randomString });

            if(!existingAdmin) {
                this.admin_id = randomString;
                isUnique = true;
            } else {
                retries += 1 ;
            }
        }

        if(!isUnique) {
            return next(new Error("Failed to generate a unique ADMIN_ID after several attempts"));
        }
    }

    next();
});

adminSchema.methods.isPasswordMatched = async function (inputPassword) {
    return bcrypt.compareSync(inputPassword, this.auth_details.password);
};

adminSchema.methods.generatePasswordResetToken = async function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetTokenEncry = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
    this.auth_details.passwordResetToken = passwordResetTokenEncry;
    this.auth_details.passwordResetExpiresAt = Date.now() + 5 * 60 * 1000;
    return resetToken;
};

export const adminModal = mongoose.model("admins", adminSchema);