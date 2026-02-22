export interface ClientDTO {
    username: string;
    canada_status?: string;
    household_size?: number;
    addr?: string;
    baby_or_pregnant?: boolean;
}

export interface ClientDetailDTO extends ClientDTO {
    family_members: FamilyMemberDTO[];
    appointments: AppointmentSummaryDTO[];
}

export interface FamilyMemberDTO {
    username: string;
    f_name: string;
    l_name?: string;
    dob?: string;
    phone?: string;
    email?: string;
    relationship?: string;
}

export interface AppointmentSummaryDTO {
    appt_date: string;
    start_time: string;
    end_time: string;
    appt_notes?: string;
    username?: string;
}
