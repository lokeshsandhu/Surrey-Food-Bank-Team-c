export const splitAddress = (address) => {
    if (typeof address !== 'string' || address.trim().length === 0) {
        return {
            line1: '',
            line2: '',
            city: '',
            province: '',
            postal_code: '',
        };
    }

    const addrParts = address.split(', ').map(p => p.trim());

    return {
        line1: addrParts[0] ?? '',
        line2: addrParts[1] ?? '',
        city: addrParts[2] ?? '',
        province: addrParts[3] ?? '',
        postal_code: addrParts[4] ?? '',
    };
};
