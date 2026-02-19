import { getAccountWithPassword } from "../accounts/accounts.service";
import { comparePassword } from "../../shared/crypto/password";
import { signToken } from "../../shared/crypto/jwt";
import { LoginDTO } from "./auth.dto";

const ADMIN_USERNAMES = new Set(["admin"]);

export async function login(data: LoginDTO) {
    const account = await getAccountWithPassword(data.username);
    if (!account) {
        return null;
    }

    const valid = await comparePassword(data.password, account.user_password);
    if (!valid) {
        return null;
    }

    const role = ADMIN_USERNAMES.has(account.username) ? "admin" : "client";
    const token = signToken({ username: account.username, role });

    return {
        success: true,
        role,
        token,
    };
}
