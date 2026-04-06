export interface LoginDTO {
    identifier: string;
    password: string;
}

export interface PasswordResetRequestDTO {
    identifier: string;
}

export interface PasswordResetConfirmDTO {
    token: string;
    newPassword: string;
}
