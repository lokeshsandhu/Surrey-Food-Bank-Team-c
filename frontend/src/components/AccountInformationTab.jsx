import { Title, Text, Stack, TextInput } from "@mantine/core"
import React, { useEffect, useState } from "react"
import { getAccount } from "../../api/accounts";
import { getFamilyMembers } from "../../../backend/src/modules/familyMembers/familyMembers.service";

export default function AccountInformationTab({ clientUsername }) {
    const token = sessionStorage.getItem('token');
    const [accountInformation, setAccountInformation] = useState(null);
    // const [accountOwner, setAccountOwner] = useState(null);

    if (!token) {
        navigate('/');
        return null;
    }

    const getAccountInformation = async () => {
        // const result = await getAccount(token, clientUsername);
        // // const familyMembers = await getFamilyMembers(token, clientUsername);
        // // const owner = familyMembers.filter(member => member.relationship === 'owner');
        // if (result && owner) {
        //     setAccountInformation(result);
        //     // setAccountOwner(owner);
        //     console.log(result, owner)
        // }
    }

    useEffect(() => {
        getAccountInformation();
    }, [])

    return (
        <>
            <Title order={2}>Account Information</Title>
            {accountInformation !== null &&
                (<Stack mt={15}>
                    <TextInput
                        label="Username"
                        value={accountInformation.username}
                        w={'60%'}
                    />
                </Stack>)}
            {accountInformation === null && <Text>Error loading account Information...</Text>}
        </>
    )
}