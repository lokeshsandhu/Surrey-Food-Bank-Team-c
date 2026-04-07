export const isMinAge = (val) => {
    const dobDate = new Date(val);
    const today = new Date();

    // Minimum DOB to be 18 years old
    const minDob = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
    );

    if (dobDate > minDob) {
        return false;
    }

    return true;
};