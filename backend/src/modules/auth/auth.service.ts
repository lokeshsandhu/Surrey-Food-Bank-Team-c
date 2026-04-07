import { getAccountWithPassword, updateAccountPassword } from "../accounts/accounts.service";
import { comparePassword } from "../../shared/crypto/password";
import { signPasswordResetToken, signToken, verifyPasswordResetToken } from "../../shared/crypto/jwt";
import { LoginDTO } from "./auth.dto";
import { sendRecoveryMessage } from "../email/email.service";
import { env } from "../../config/env";
import { getOwnerEmailByUsername } from "../familyMembers/familyMembers.service";
import { isAdminUsername } from "../../shared/auth/adminUsers";

// Verify if account with given username/email and password exists and role (admin or client), return role and token
export async function login(data: LoginDTO) {
    const account = await getAccountWithPassword(data.identifier);
    if (!account) {
        return null;
    }

    const valid = await comparePassword(data.password, account.user_password);
    if (!valid) {
        return null;
    }

    const role = isAdminUsername(account.username) ? "admin" : "client";
    const token = signToken({ username: account.username, role });

    return {
        success: true,
        username: account.username,
        role,
        token,
    };
}

export async function requestPasswordReset(identifier: string): Promise<void> {
    const account = await getAccountWithPassword(identifier);
    if (!account) {
        return;
    }

    const emailTo = await getOwnerEmailByUsername(account.username);
    if (!emailTo) {
        return;
    }

    const token = signPasswordResetToken(account.username);
    const baseUrl = env.FRONTEND_BASE_URL.replace(/\/+$/, "");
    const link = `${baseUrl}/resetPassword?token=${encodeURIComponent(token)}`;

    const result = await sendRecoveryMessage(emailTo, link, account.username);
    if (!result) {
        throw new Error("Failed to send recovery email");
    }
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<boolean> {
    try {
        const username = verifyPasswordResetToken(token);
        return updateAccountPassword(username, newPassword);
    } catch {
        return false;
    }
}
