
export interface CreateAppointmentsInRangeDTO {
    appt_date: string;
    start_time: string; 
    end_time: string;   
    appt_notes?: string;
    capacity?: number;
}
export interface AppointmentDTO {
    appt_date: string;
    start_time: string;
    end_time: string;
    appt_notes?: string;
    username?: string;
    capacity?: number;
    booked_count?: number;
    remaining_capacity?: number;
    usernames?: string[];
}

export interface BookAppointmentDTO {
    appt_date: string;
    start_time: string;
}
