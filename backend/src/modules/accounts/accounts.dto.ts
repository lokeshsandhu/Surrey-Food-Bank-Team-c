export interface AccountDTO {
    username: string;
    user_password: string;
    canada_status?: string;
    household_size?: number;
    addr?: string;
    baby_or_pregnant?: boolean;
    language_spoken?: string;
    account_notes?: string;
}

export interface UpdateAccountDTO {
    username: string;
    canada_status?: string;
    household_size?: number;
    addr?: string;
    baby_or_pregnant?: boolean;
    language_spoken?: string;
    account_notes?: string;
}
