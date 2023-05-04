import { useContext } from 'react';

import { Card, Text } from 'react-native-paper';

import { Grid } from '@mui/material';

import { equalTo, limitToLast, orderByChild, query, ref } from "firebase/database";

import { useAuthState } from 'react-firebase-hooks/auth';
import { useList } from 'react-firebase-hooks/database';

import { GetValKey } from '../App';
import { Context } from '../Context';
import { auth, database } from '../Firebase';
import { styles } from '../Styles';
import { getTimeFromMinutes, seasons } from '../helper_functions/dateAndTime';

export default function DebugScreen() {

    const [user, authLoading, authError] = useAuthState(auth);
    const {
        simEnvData,
        raining,
        rabbitInside,
        rabbitActivity,
    } = useContext(Context)

    function secondsAgo(time) {
        return `${(Math.round((Date.now() - time) / 1000) + "").padStart(4, "0")} s ago`
    }

    const data = {
        OLEDText: 20,
        LightHue: 21, LightSaturation: 22, LightBrightness: 23,
        Button1: 5, Button2: 6, Button3: 7,
        OutsideTemperature: 1, InsideTemperature: 2,
        OutsideHumidity: 11, InsideHumidity: 12,
        Motion1: 3, Motion2: 4,
        GreyRabbitContact: 8, WhiteRabbitContact: 9,
    }

    return (
        <Grid container columns={8} spacing={2} style={styles.container}>
            {/* Rabbit sim */}
            <Grid item sm={8} lg={4}>
                <Card>
                    <Card.Title title={"Rabbit Sim"} />
                    <Card.Content>
                        {Object.keys(simEnvData).map((key, i) => {
                            let value = simEnvData[key].value ?? ''
                            if (key == 'time') {
                                value = getTimeFromMinutes(value)
                            } else if (key == 'temp') {
                                value = value + '°C'
                            } else if (key == 'season') {
                                value = seasons[value]
                            }

                            return (
                                <Text key={i}>{
                                    `${key}:`
                                    + `\t${key.length < 12 ? '\t\t' : ''}`
                                    + value
                                }</Text>
                            )
                        }).reverse()}
                        <Text>{`raining:\t\t\t${raining}`}</Text>
                        <Text>{`rabbitInside:\t\t${rabbitInside}`}</Text>
                        <Text>{`rabbitActivity:\t\t${rabbitActivity}`}</Text>
                    </Card.Content>
                </Card>
            </Grid>

            {/* IoT devices */}
            {Object.keys(data).map((key, i) => {
                const [snapshots, loading, error] = useList(user ?
                    query(ref(database, 'data'), orderByChild('groupId'),
                        equalTo(data[key]), limitToLast((key == 'OLEDText' ? 10 : 5)))
                    : null);
                if (snapshots) {
                    return (
                        <Grid item sm={8} md={key == 'OLEDText' ? 8 : 4} lg={key == 'OLEDText' ? 4 : 2} key={i}>
                            <Card>
                                <Card.Title title={key} />
                                <Card.Content>
                                    {snapshots.map((el, i) => {
                                        return (
                                            <Text key={i}>{
                                                secondsAgo(el?.val()?.timestamp ?? Date.now())
                                                + '  '
                                                + el?.val()[GetValKey(el)] ?? ''
                                            }</Text>)
                                    }).reverse()}
                                </Card.Content>
                            </Card>
                        </Grid>
                    )
                } else {
                    return null
                }
            })}
        </Grid>
    )
}