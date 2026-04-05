import { Radio, Group, TextInput, Text, Fieldset, Select } from '@mantine/core';
import React from 'react';
import { useState, useEffect } from 'react';
import '../styles/global-styles.css';
import '../styles/Register.css';
import { IMaskInput } from 'react-imask';
import { provinceOptions, canadaStatusOptions } from '../constants/FormOptions';
import CanadaStatusAlert from './alerts/CanadaStatusAlert';
import CityAlert from './alerts/CityAlert';
import ProvinceAlert from './alerts/ProvinceAlert';
import { CHARLIMITS } from '../constants/Validation';

export default function ElegibilityQuestions({ form }) {
    const [isCityEligible, setIsCityEligible] = useState(true);
    const [isProvinceEligible, setIsProvinceEligible] = useState(true);

    const checkIsCityEligible = () => {
        const city = form.getValues().addr.city.trim().toLowerCase();
        setIsCityEligible(
            city.length === 0
            || city === 'surrey'
            || city === 'north delta'
            || city === 'cloverdale'
        );
    };

    const checkIsProvinceEligible = () => {
        const province = form.getValues().addr.province.trim().toUpperCase();
        setIsProvinceEligible(province.length === 0 || province === 'BC');
    };

    useEffect(() => {
        checkIsCityEligible();
        checkIsProvinceEligible();
    }, [form.values.addr.city, form.values.addr.province]);

    return (
        <Group>
            <div style={{ width: '100%' }}>
                <h2 className='login-title'>Eligibility Questions</h2>
            </div>
            <Radio.Group
                name="canada-status"
                label="1. Immigration Status in Canada"
                withAsterisk
                className='question-section'
                key={form.key('canada_status')}
                {...form.getInputProps('canada_status')}
            >
                <Text size='sm' mb={3}>Please select the option that best describes your status in Canada. </Text>
                <Text size='sm' my={0} fs='italic'>Note: Visitors or international students that have stayed in Canada for less than 6 months do not qualify for this program.</Text>
                <Group mt="xs">
                    <Radio
                        value={canadaStatusOptions.citizen.value}
                        label={canadaStatusOptions.citizen.label}
                    />
                    <Radio
                        value={canadaStatusOptions.permanentResident.value}
                        label={canadaStatusOptions.permanentResident.label}
                    />
                    <Radio
                        value={canadaStatusOptions.intlStudentMoreThan6.value}
                        label={canadaStatusOptions.intlStudentMoreThan6.label}
                    />
                    <Radio
                        value={canadaStatusOptions.visitorIntlStudentLessThan6.value}
                        label={canadaStatusOptions.visitorIntlStudentLessThan6.label}
                    />
                    <Radio
                        value={canadaStatusOptions.other.value}
                        label={canadaStatusOptions.other.label}
                    />
                </Group>
            </Radio.Group>
            {
                (
                    form.values.canada_status === canadaStatusOptions.visitorIntlStudentLessThan6.value ||
                    form.values.canada_status ===
                    canadaStatusOptions.other.value
                ) &&
                <CanadaStatusAlert />
            }
            <Fieldset legend="2. Address" variant='unstyled'>
                <Text size='sm' mb={3}>Please enter your residential address.</Text>
                <Text size='sm' my={0} fs='italic'>Note: In order to be eligible for the program, clients must reside in British Columbia within Surrey, North Delta, or Cloverdale, north of 40th Avenue.</Text>
                <Group className='address' my={10}>
                    <TextInput
                        label="Address Line 1"
                        placeholder="e.g. 1234 78th Ave"
                        withAsterisk
                        key={form.key('addr.line1')}
                        {...form.getInputProps('addr.line1')}
                        maxLength={CHARLIMITS.addr}
                    />
                    <TextInput
                        label="Address Line 2 (optional)"
                        placeholder="e.g. Apt. 101"
                        key={form.key('addr.line2')}
                        {...form.getInputProps('addr.line2')} 
                        maxLength={CHARLIMITS.addr}
                    />
                </Group>
                <Group>
                    <TextInput
                        label="City"
                        placeholder="e.g. Surrey"
                        withAsterisk
                        key={form.key('addr.city')}
                        {...form.getInputProps('addr.city')}
                        onBlur={(e) => {
                            form.getInputProps('addr.city').onBlur(e);
                            checkIsCityEligible();
                        }}
                        onChange={(e) => {
                            form.getInputProps('addr.city').onChange(e);
                            setIsCityEligible(true);
                        }}
                        maxLength={CHARLIMITS.city}
                    />
                    <Select
                        label='Province'
                        placeholder='Select Province'
                        data={provinceOptions}
                        key={form.key('addr.province')}
                        {...form.getInputProps('addr.province')}
                        withAsterisk
                        w={150}
                        onChange={(value) => {
                            form.setFieldValue('addr.province', value);
                            checkIsProvinceEligible();
                        }}
                    />
                    <TextInput
                        label="Postal Code"
                        placeholder="e.g. V1M 3B5"
                        component={IMaskInput}
                        mask='a0a 0a0'
                        definitions={{ a: /[A-Za-z]/ }}
                        prepare={(str) => str.toUpperCase()}
                        withAsterisk
                        key={form.key('addr.postal_code')}
                        {...form.getInputProps('addr.postal_code')}
                    />
                </Group>
            </Fieldset>

            {
                !isCityEligible
                && <CityAlert />
            }
            {!isProvinceEligible && <ProvinceAlert />}
        </Group>
    );
}
