export interface AccountDTO {
    username: string;
    user_password: string;
    canada_status?: string;
    household_size?: number;
    addr?: string;
    baby_or_pregnant?: boolean;
}

export interface UpdateAccountDTO {
    canada_status?: string;
    household_size?: number;
    addr?: string;
    baby_or_pregnant?: boolean;
}
