import { Card, Text } from 'react-native-paper';

import { Grid } from '@mui/material';

import { equalTo, limitToLast, orderByChild, query, ref } from "firebase/database";

import { useList } from 'react-firebase-hooks/database';

import { styles } from '../Styles';
import { database } from '../Firebase';
import { GetValKey } from '../App';
import { useState } from 'react';

export default function DebugScreen({ user }) {

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

    /**
     * Converts a Date object into a time of day representation as minutes from midnight. 
     * 
     * @param {Date} date 
     * @returns a number between 0 and 1440
     */
    function getMinuteTime(date) {
        var hours = date.getHours()
        var mins = date.getMinutes()
        return 60 * hours + mins
    }

    function getSeason(month) {
        if (month in [10, 11, 0]) {
            return 0 // winter
        } else if (month in [1, 2, 3]) {
            return 1 // spring
        } else if (month in [4, 5, 6]) {
            return 2 // summer
        } else if (month in [7, 8, 9]) {
            return 3 // autumn
        }
    }

    const Activity = Object.freeze({
        sleep: 'sleep',
        feed: 'feed',
        hide: 'hide',
        shelter: 'shelter',
        play: 'play',
        exercise: 'exercise',
        lookout: 'lookout'
    })

    const [simTemp, setSimTemp] = useState(0)
    const [simRain, setSimRain] = useState(false)
    const [simTime, setSimTime] = useState(getMinuteTime(new Date()))
    const [simSeason, setSimSeason] = useState(getSeason((new Date().getMonth())))
    const [simPredator, setSimPredator] = useState(true)
    const [simRandomChoice, setRandomChoice] = useState(50)
    const [simRabbitInside, setSimRabbitInside] = useState(false)
    const [simActivity, setSimActivity] = useState(Activity.play)

    return (
        <Grid container columns={8} spacing={2} style={styles.container}>
            {Object.keys(data).map((key, i) => {
                const [snapshots, loading, error] = useList(user ? query(ref(database, 'data'), orderByChild('groupId'), equalTo(data[key]), limitToLast(5)) : null);

                if (snapshots) {
                    return (
                        <Grid item sm={8} md={key == 'OLEDText' ? 8 : 4} lg={key == 'OLEDText' ? 8 : 2} key={i}>
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