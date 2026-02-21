export interface FamilyMemberDTO {
    username: string;
    f_name: string;
    l_name?: string;
    dob?: string;
    phone?: string;
    email?: string;
    relationship?: string;
}

export interface UpdateFamilyMemberDTO {
    l_name?: string;
    dob?: string;
    phone?: string;
    email?: string;
    relationship?: string;
}
