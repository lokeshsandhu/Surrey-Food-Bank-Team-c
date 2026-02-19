
export interface CreateAppointmentsInRangeDTO {
    appt_date: string;
    start_time: string; 
    end_time: string;   
    appt_notes?: string;
}
export interface AppointmentDTO {
    appt_date: string;
    start_time: string;
    end_time: string;
    appt_notes?: string;
    username?: string;
}

export interface CreateSlotDTO {
    appt_date: string;
    start_time: string;
    end_time: string;
    appt_notes?: string;
}

export interface BookAppointmentDTO {
    appt_date: string;
    start_time: string;
}
