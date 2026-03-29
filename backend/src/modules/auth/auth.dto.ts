export interface LoginDTO {
    username: string;
    password: string;
}

export interface PasswordResetRequestDTO {
    identifier: string;
}

export interface PasswordResetConfirmDTO {
    token: string;
    newPassword: string;
}
