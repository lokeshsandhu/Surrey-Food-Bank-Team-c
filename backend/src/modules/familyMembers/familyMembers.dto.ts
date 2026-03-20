export interface FamilyMemberDTO {
    id?: number;
    username: string;
    f_name: string;
    l_name?: string;
    dob?: string;
    phone?: string;
    email?: string;
    relationship?: string;
}

export interface UpdateFamilyMemberDTO {
    f_name: string;
    l_name?: string;
    dob?: string;
    phone?: string;
    email?: string;
    relationship?: string;
}
