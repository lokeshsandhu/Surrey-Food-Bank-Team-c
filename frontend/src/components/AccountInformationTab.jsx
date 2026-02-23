import { Title, Text, Stack, TextInput, Radio, Group } from "@mantine/core"
import { DateInput } from "@mantine/dates";
import React, { useEffect, useState } from "react"
import { getAccount } from "../../api/accounts";
import { getFamilyMembers } from "../../api/familyMembers";

export default function AccountInformationTab({ clientUsername }) {
    const token = sessionStorage.getItem('token');
    const [accountInformation, setAccountInformation] = useState(null);
    const [accountOwner, setAccountOwner] = useState(null);

    if (!token) {
        navigate('/');
        return null;
    }

    const getAccountInformation = async () => {
        const result = await getAccount(token, clientUsername);
        const familyMembers = await getFamilyMembers(token, clientUsername);
        const owner = familyMembers.filter(member => member.relationship === 'owner');
        // TODO: Rewrite (better practices)
        if (result && owner[0]) {
            setAccountInformation(result);
            setAccountOwner(owner[0]);
            // console.log(result)
        }
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
                        readOnly
                    />
                    <TextInput
                        label="First Name"
                        value={accountOwner.f_name}
                        w={'60%'}
                        readOnly
                    />
                    <TextInput
                        label="Last Name"
                        value={accountOwner.l_name}
                        w={'60%'}
                        readOnly
                    />
                    <DateInput
                        label="Date of Birth"
                        placeholder="YYYY MM DD"
                        value={accountOwner.dob}
                        w={'30%'}
                    />
                    <TextInput
                        label="Email"
                        value={accountOwner.email}
                        w={'60%'}
                        readOnly
                    />
                    <TextInput
                        label="Phone"
                        value={accountOwner.phone}
                        w={'60%'}
                        readOnly
                    />
                </Stack>)}
            {/* <Radio.Group
                name="baby_or_pregnant"
                label="6. Does your family have any babies or pregnant mothers?"
                description="Families with babies and pregnant mothers qualify for the Tiny Bundles Program that happen on Wednesdays."
                withAsterisk
                className='question-section'
            >
                <Group mt="xs">
                    <Radio value='true' label="Yes" checked={accountInformation.baby_or_pregnant} />
                    <Radio value='false' label="No" checked={!accountInformation.baby_or_pregnant} />
                </Group>
            </Radio.Group> */}
            {accountInformation === null && <Text>Error loading account Information...</Text>}
        </>
    )
}