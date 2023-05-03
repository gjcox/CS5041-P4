import { useEffect, useRef, useState } from 'react';

import { equalTo, limitToLast, onValue, orderByChild, push, query, ref, serverTimestamp } from "firebase/database";

import { useAuthState } from 'react-firebase-hooks/auth';

import { auth, database } from '../Firebase';

const Activity = Object.freeze({
    sleep: 'sleep',
    feed: 'eat',
    hide: 'hide',
    shelter: 'shelter',
    play: 'play',
    exercise: 'exercise',
})

/* The following code is adapted from https://github.com/cs5041/p4/blob/main/interaction/index.js, by CS5041 (probably Xue Zhu). Accessed 03/05/2023. */
function scale(fromRange, toRange) {
    const d = (toRange[1] - toRange[0]) / (fromRange[1] - fromRange[0]);
    return from => (from - fromRange[0]) * d + toRange[0];
};
/* End of adapted code. */

export default function RabbitSim() {

    const maxRabbitHide = 1 // max number of times the rabbit will hide in a row

    const [user, authLoading, authError] = useAuthState(auth);

    const [activityMsg, setActivityMsg] = useState("")
    const [simEnvData, setSimEnvData] = useState({
        // user/physical inputs 
        temp: { updateFromDisplay: true, value: 19 },
        humidity: { updateFromDisplay: true, value: 50 },
        time: { updateFromDisplay: true, value: getMinuteTime(new Date()) },
        season: { updateFromDisplay: true, value: getSeason((new Date().getMonth())) },
        visitor1: { updateFromDisplay: true, value: false },
        visitor2: { updateFromDisplay: true, value: false },
        randomChoice: { updateFromDisplay: true, value: 50 }, // maps to saturation; 0-100
    })

    const maxMsBetweenActivityMsg = 60 * 1000
    const [lastActivityMsgTime, setLastActivityMsgTime] = useState(Date.now())

    const [raining, setRaining] = useState(false)
    const [rabbitInside, setRabbitInside] = useState(false)
    const [rabbitActivity, setRabbitActivity] = useState(Activity.play)
    const [rabbitHidingCounter, setRabbitHidingCounter] = useState(0)
    const [rabbitSleepingCounter, setRabbitSleepingCounter] = useState(0)

    /* The following code is taken from https://overreacted.io/making-setinterval-declarative-with-react-hooks/, by Dan Abramov. Accessed 03/05/2023.*/
    function useInterval(callback, delay) {
        const savedCallback = useRef();

        // Remember the latest callback.
        useEffect(() => {
            savedCallback.current = callback;
        }, [callback]);

        // Set up the interval.
        useEffect(() => {
            function tick() {
                savedCallback.current();
            }
            if (delay !== null) {
                let id = setInterval(tick, delay);
                return () => clearInterval(id);
            }
        }, [delay]);
    }
    /* End of code by Dan Abramov. */


    function incrementCounters() {
        if (rabbitActivity == Activity.hide) {
            setRabbitHidingCounter(rabbitHidingCounter + 1)
            console.log('rabbitHidingCounter: ', rabbitHidingCounter + 1)
        } else {
            setRabbitHidingCounter(Math.max(0, rabbitHidingCounter - 1))
            console.log('rabbitHidingCounter: ', Math.max(0, rabbitHidingCounter - 1))
        }

        if (!checkNearDawnDusk()) {
            if (rabbitActivity == Activity.sleep) {
                setRabbitSleepingCounter(rabbitSleepingCounter + 1)
                console.log('rabbitSleepingCounter: ', rabbitSleepingCounter + 1)
            } else {
                setRabbitSleepingCounter(rabbitSleepingCounter - 1)
                console.log('rabbitSleepingCounter: ', rabbitSleepingCounter - 1)
            }
        }
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

    function getTimeFromMinutes(minuteTime) {
        let hour = Math.round(minuteTime / 60)
        let minutes = minuteTime % 60
        return `${hour}:${minutes}`
    }

    const seasons = ['winter', 'spring', 'summer', 'autumn']

    function getSeason(month) {
        if ([11, 0, 1].includes(month)) {
            return 0 // winter
        } else if ([2, 3, 4].includes(month)) {
            return 1 // spring
        } else if ([5, 6, 7].includes(month)) {
            return 2 // summer
        } else if ([8, 9, 10].includes(month)) {
            return 3 // autumn
        }
    }

    function buildMessage(moving, nowInside, activity, reason) {
        let motionVerb = (moving ? "going" : "staying")
        let place = (nowInside ? "inside" : "outside")
        return `I am ${motionVerb} ${place} to ${activity}${reason ? ' because ' + reason : ''}.`
    }

    function setActivityMsgWrapper(newMsg) {
        let msElapsed = Date.now() - lastActivityMsgTime
        console.log(`newMsg is new: ${newMsg != activityMsg}; msElapsed since last message: ${msElapsed} out of ${maxMsBetweenActivityMsg}`)

        if (newMsg != activityMsg) {
            setActivityMsg(newMsg)
            setLastActivityMsgTime(Date.now())
        } else if (msElapsed >= maxMsBetweenActivityMsg) {
            setActivityMsg(newMsg + " Still.")
            setLastActivityMsgTime(Date.now())
        }
    }

    function writeActivityMessage() {
        if (activityMsg.toString() == '') {
            return
        }
        if (user) {
            console.log(`RabbitSim.writeMessage: "${activityMsg}"`)
            push(ref(database, "data"), {
                userId: user.uid,
                groupId: 20,
                timestamp: serverTimestamp(),
                type: "str",
                string: activityMsg.toString()
            });
        } else {
            console.log(`RabbitSim.writeMessage called when user==null`)
        }
        // TODO update custom channel for P5 
    }

    // Approximate daylight hours taken from https://www.scotlandinfo.eu/daylight-hours-sunrise-and-sunset-times/. Accessed 03/05/2023. 
    const seasonalDawnDusk = [
        { dawn: 8 * 60 + 45, dusk: 16 * 60 + 25 }, // daylight 8:45-16:25 in winter 
        { dawn: 6 * 60 + 20, dusk: 20 * 60 + 30 }, // daylight 6:20-20:30 in spring 
        { dawn: 5 * 60 + 0, dusk: 22 * 60 + 0 }, // daylight 5:00-22:00 in summer 
        { dawn: 7 * 60 + 55, dusk: 18 * 60 + 25 }, // daylight 7:55-18:25 in autumn 
    ]

    function checkNearDawnDusk() {
        let dawn = seasonalDawnDusk[simEnvData.season.value].dawn
        let dusk = seasonalDawnDusk[simEnvData.season.value].dusk
        let marginOfError = 2 // hours either side of dawn and dusk 
        if (Math.min(Math.abs(simEnvData.time.value - dawn), Math.abs(simEnvData.time.value - dusk)) < marginOfError * 60) {
            return true
        }
    }

    function checkRabbitWakeful() {
        let dawn = seasonalDawnDusk[simEnvData.season.value].dawn
        let dusk = seasonalDawnDusk[simEnvData.season.value].dusk
        if (checkNearDawnDusk()) {
            // rabbit active for a couple of hours either side of dawn and dusk 
            return true
        } else if (simEnvData.time.value < dawn || simEnvData.time.value > dusk) {
            // rabbit somewhat active at night 
            if (rabbitActivity == Activity.sleep) {
                return rabbitSleepingCounter >= Math.floor(Math.random() * 60) // at most 60 periods asleep 
            } else {
                return rabbitSleepingCounter <= -Math.floor(Math.random() * 30) // at most 30 periods awake 
            }
        } else {
            // rabbit less active during the day 
            if (rabbitActivity == Activity.sleep) {
                return rabbitSleepingCounter >= (Math.floor(Math.random() * 60) + 60) // at most 120 periods asleep
            } else {
                return rabbitSleepingCounter <= -Math.floor(Math.random() * 15) // at most 15 periods awake 
            }
        }
    }

    /**
     * N.B. The museum's exhibit limits hue <-> temperature conversions to 0-20°C.
     */
    function tooCold() {
        if ([0, 3].includes(simEnvData.season.value)) {
            // it is winter or autumn so the rabbit has grown its winter fur 
            // TODO communicate this to guests 
            return simEnvData.temp.value <= -10
        } else {
            return simEnvData.temp.value <= 5
        }
    }

    /**
     * N.B. The museum's exhibit limits hue <-> temperature conversions to 0-20°C.
     */
    function tooWarm() {
        if ([0, 3].includes(simEnvData.season.value)) {
            // it is winter or autumn so the rabbit has grown its winter fur 
            // TODO communicate this to guests 
            return simEnvData.temp.value >= 20
        } else {
            return simEnvData.temp.value >= 25
        }
    }

    function checkBadWeather() {
        if (raining) {
            return "it is raining"
        } else if (tooCold()) {
            return `it is too cold (${simEnvData.temp.value}°C in ${seasons[simEnvData.season.value]})`
        } else if (tooWarm()) {
            return `it is too hot (${simEnvData.temp.value}°C in ${seasons[simEnvData.season.value]})`
        } else {
            false
        }
    }

    function setActivity(newIsInside, newActivity) {
        if (newIsInside != rabbitInside) {
            setRabbitInside(newIsInside)
            console.log(`newIsInside = ${newIsInside}`)
        }
        if (newActivity != rabbitActivity) {
            setRabbitActivity(newActivity)
            console.log(`newActivity = ${newActivity}`)
        }
    }

    useEffect(() => {
        console.log('rabbitHidingCounter: ', rabbitHidingCounter)
    }, [rabbitHidingCounter])

    useEffect(() => {
        let nowRaining = simEnvData.humidity.value >= 1.5 * simEnvData.temp.value + 60
        if (nowRaining != raining) {
            setRaining(nowRaining)
            console.log('raining: ', nowRaining)
        }
    }, [simEnvData])

    // When the rabbit's environment changes, determine its new activity
    // Also determine new activity when counter increments
    useEffect(() => {
        updateRabbitActivity()
    }, [simEnvData, raining, /*rabbitInside*/])

    // Every activityUpdatePeriod ms, update rabbit activity
    const activityUpdatePeriod = 60 * 1000 // ms 
    useInterval(() => {
        incrementCounters()
        updateRabbitActivity()
    }, activityUpdatePeriod)

    // When the rabbit's activity changes, write the new activity
    useEffect(() => {
        writeActivityMessage()
    }, [activityMsg])

    function updateSimValue(key, newValue) {
        if (simEnvData[key].updateFromDisplay && newValue != simEnvData[key].value) {
            setSimEnvData({
                ...simEnvData,
                [key]: { ...simEnvData[key], value: newValue },
            })
            console.log(`simEnvData[${key}].value = ${newValue}`)
            if (key == 'visitor1' && newValue == 0) {
                setActivityMsgWrapper("I think the visitor has gone away.")
            }
        }
    }

    // On light hue change, update the temperature 
    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(21), limitToLast(1)), (snapshot) => {
        let newHue = Object.values(snapshot?.val())[0].integer ?? 0 // 0-360
        let scaleHueToTemp = scale([0, 360], [0, 20])
        let scaledTemp = Math.round(scaleHueToTemp(Math.max(0, Math.min(360, newHue))))
        updateSimValue('temp', scaledTemp)
    });

    // On light saturation change, update the random choice  
    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(22), limitToLast(1)), (snapshot) => {
        let newRandomChoice = Math.round(Object.values(snapshot?.val())[0].integer ?? 0) // 0-100
        updateSimValue('randomChoice', newRandomChoice)
    });

    // On light brightness change, update the time of day
    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(22), limitToLast(1)), (snapshot) => {
        let newBrightness = Math.round(Object.values(snapshot?.val())[0].integer ?? 0) // 0-100 -> 0-1440
        let scaleBrightToTime = scale([0, 100], [0, 720])
        let scaledTime = Math.round(scaleBrightToTime(Math.max(0, Math.min(100, newBrightness))))
        if (newBrightness % 2 == 1) scaledTime += 720 // odd values are noon to midnight 
        updateSimValue('time', scaledTime)
    });

    // On motion detector 1 change, update visitor presence  
    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(3), limitToLast(1)), (snapshot) => {
        let newVisitor = Object.values(snapshot?.val())[0].integer ?? 0 == 1
        updateSimValue('visitor1', newVisitor)
    });

    // On motion detector 2 change, update visitor presence  
    // Might get rid of this, since it changes hue anyway 
    // onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(4), limitToLast(1)), (snapshot) => {
    //     let newVisitor = Object.values(snapshot?.val())[0].integer ?? 0 == 1
    //     updateSimValue('visitor2', newVisitor)
    // });

    // On change to outside humidity, determine if it is raining 
    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(11), limitToLast(1)), (snapshot) => {
        let newHumidity = Object.values(snapshot?.val())[0].integer ?? 0
        updateSimValue('humidity', newHumidity)
    });

    // On grey rabbit contact, move the rabbit outside   
    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(8), limitToLast(1)), (snapshot) => {
        let withGreyRabbit = Object.values(snapshot?.val())[0].integer ?? 0 == 1
        if (withGreyRabbit && rabbitInside) {
            setRabbitInside(false)
        }
    });

    // On white rabbit contact, move the rabbit inside   
    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(8), limitToLast(1)), (snapshot) => {
        let withWhiteRabbit = Object.values(snapshot?.val())[0].integer ?? 0 == 1
        if (withWhiteRabbit && !rabbitInside) {
            setRabbitInside(true)
        }
    });

    /**
     * This is the rabbit's brain.
     */
    function updateRabbitActivity() {
        let badWeather = checkBadWeather()
        let rabbitWakeful = checkRabbitWakeful()

        if (!rabbitInside) {
            // rabbit is outside 
            if (simEnvData.visitor1.value || simEnvData.visitor2.value) {
                setActivityMsgWrapper(buildMessage(true, true, Activity.hide, "I have seen a visitor"))
                setActivity(true, Activity.hide)
            } else if (!rabbitWakeful) {
                setActivityMsgWrapper(buildMessage(true, true, Activity.sleep, `rabbits are crepuscular and it is ${getTimeFromMinutes(simEnvData.time.value)}`))
                setActivity(true, Activity.sleep)
            } else if (badWeather) {
                setActivityMsgWrapper(buildMessage(true, true, Activity.shelter, badWeather))
                setActivity(true, Activity.shelter)
            } else if (simEnvData.randomChoice.value <= 33) {
                setActivityMsgWrapper(buildMessage(false, false, Activity.feed, "I am hungry"))
                setActivity(false, Activity.feed)
            } else if (simEnvData.randomChoice.value <= 66) {
                setActivityMsgWrapper(buildMessage(false, false, `${Activity.play} with the grey rabbit`, "I am feeling playful"))
                setActivity(false, Activity.play)
            } else {
                setActivityMsgWrapper(buildMessage(false, false, Activity.exercise, "I want to"))
                setActivity(false, Activity.exercise)
            }
        } else {
            // rabbit is inside 
            if (rabbitActivity == Activity.hide && (simEnvData.visitor1.value || simEnvData.visitor2.value) && rabbitHidingCounter < maxRabbitHide) {
                setActivityMsgWrapper(buildMessage(false, true, Activity.hide, "the visitor is still outside"))
            } else if (rabbitActivity == Activity.hide && (simEnvData.visitor1.value || simEnvData.visitor2.value) && rabbitHidingCounter == maxRabbitHide) {
                setActivityMsgWrapper("I am getting used to the visitor and will stop hiding soon.")
            } else if ((simEnvData.visitor1.value || simEnvData.visitor2.value) && rabbitHidingCounter < maxRabbitHide) {
                setActivityMsgWrapper(buildMessage(false, true, Activity.hide, "I heard a visitor outside"))
                setActivity(true, Activity.hide)
            } else if (badWeather) {
                setActivityMsgWrapper(buildMessage(false, true, Activity.shelter, `${badWeather} outside`))
                setActivity(true, Activity.shelter)
            } else if (rabbitActivity == Activity.sleep && !rabbitWakeful) {
                setActivityMsgWrapper("Zzzzzz")
            } else if (!rabbitWakeful) {
                setActivityMsgWrapper(buildMessage(false, true, Activity.sleep, `rabbits are crepuscular and it is ${getTimeFromMinutes(simEnvData.time.value)}`))
                setActivity(true, Activity.sleep)
            } else if (simEnvData.randomChoice.value <= 20) {
                setActivityMsgWrapper(buildMessage(false, true, Activity.feed, "I am hungry"))
                setActivity(true, Activity.feed)
            } else if (simEnvData.randomChoice.value <= 40) {
                setActivityMsgWrapper(buildMessage(false, true, `${Activity.play} with the white rabbit`, "I am feeling playful"))
                setActivity(true, Activity.play)
            } // below this, the rabbit moves outside 
            else if (simEnvData.randomChoice.value <= 60) {
                setActivityMsgWrapper(buildMessage(true, false, Activity.feed, "I am hungry"))
                setActivity(false, Activity.feed)
            } else if (simEnvData.randomChoice.value <= 80) {
                setActivityMsgWrapper(buildMessage(true, false, `${Activity.play} with the grey rabbit`, "I am feeling playful"))
                setActivity(false, Activity.feed)
            } else {
                setActivityMsgWrapper(buildMessage(true, false, Activity.exercise, "I want to"))
                setActivity(false, Activity.exercise)
            }
        }
    }

    return (
        <div>
            {
                user && activityMsg ? true : false
            }
        </div>
    )
}