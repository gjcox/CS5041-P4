import { useEffect, useRef, useState } from 'react';

import { equalTo, limitToLast, onValue, orderByChild, push, query, ref, serverTimestamp } from "firebase/database";

import { useAuthState } from 'react-firebase-hooks/auth';

import { auth, database } from '../Firebase';

const Activity = Object.freeze({
    sleep: 'sleep',
    feed: 'feed',
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
        humidity: {updateFromDisplay: true, value: 50}, 
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
        if ([10, 11, 0].includes(month)) {
            return 0 // winter
        } else if ([1, 2, 3].includes(month)) {
            return 1 // spring
        } else if ([4, 5, 6].includes(month)) {
            return 2 // summer
        } else if ([7, 8, 9].includes(month)) {
            return 3 // autumn
        }
    }

    function setActivityMsgWrapper(newMsg) {
        if (newMsg != activityMsg || Date.now() - lastActivityMsgTime > maxMsBetweenActivityMsg) {
            setActivityMsg(newMsg)
            setLastActivityMsgTime(Date.now())
        }
    }

    function writeActivityMessage() {
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

    function rabbitWakeful() {
        // TODO 
        return true
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

    function badWeather() {
        return raining || tooCold() || tooWarm()
    }

    function setActivity(newIsInside, newActivity) {
        setRabbitInside(newIsInside)
        setRabbitActivity(newActivity)
    }

    useEffect(() => {
        console.log('rabbitHidingCounter: ', rabbitHidingCounter)
    }, [rabbitHidingCounter])

    useEffect(() => {
        let nowRaining = simEnvData.humidity.value >= 1.5 * simEnvData.temp.value + 50 
        if (nowRaining != raining) {
            setRaining(nowRaining)
        }
    }, [simEnvData])

    // When the rabbit's environment changes, determine its new activity
    // Also determine new activity when counter increments
    useEffect(() => {
        updateRabbitActivity()
    }, [simEnvData, raining, rabbitInside])

    // Every activityUpdatePeriod ms, update rabbit activity
    const activityUpdatePeriod = 60 * 1000 // ms 
    useInterval(() => {
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
        let scaleBrightToTime = scale([0, 100], [0, 1220])
        let scaledTime = Math.round(scaleBrightToTime(Math.max(0, Math.min(100, newBrightness))))
        if (newBrightness % 2 == 1) scaledTime += 1220 // odd values are noon to midnight 
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
        if (rabbitActivity == Activity.hide) {
            setRabbitHidingCounter(rabbitHidingCounter + 1)
        } else if (rabbitInside) {
            setRabbitHidingCounter(Math.max(0, rabbitHidingCounter - 1))
        } else {
            setRabbitHidingCounter(0)
        }

        if (rabbitInside == false) {
            // rabbit is outside 
            if (simEnvData.visitor1.value || simEnvData.visitor2.value) {
                setActivityMsgWrapper("The rabbit has seen a visitor and has run inside to hide!")
                setActivity(true, Activity.hide)
            } else if (!rabbitWakeful()) {
                setActivityMsgWrapper("The rabbit is sleepy and has gone inside to nap.")
                setActivity(true, Activity.sleep)
            } else if (tooCold()) {
                setActivityMsgWrapper("The rabbit is too cold and has gone inside to shelter.")
                setActivity(true, Activity.shelter)
            } else if (tooWarm()) {
                setActivityMsgWrapper("The rabbit is too hot and has gone inside to shelter.")
                setActivity(true, Activity.shelter)
            } else if (raining) {
                setActivityMsgWrapper("It is raining so the rabbit has gone inside to shelter.")
                setActivity(true, Activity.shelter)
            } else if (simEnvData.randomChoice.value <= 33) {
                setActivityMsgWrapper("The rabbit is eating outside.")
                setActivity(false, Activity.feed)
            } else if (simEnvData.randomChoice.value <= 66) {
                setActivityMsgWrapper("The rabbit is playing outside with the grey rabbit.")
                setActivity(false, Activity.play)
            } else {
                setActivityMsgWrapper("The rabbit is running around outside for exercise.")
                setActivity(false, Activity.exercise)
            }
        } else if (rabbitInside == true) {
            // rabbit is inside 
            if (rabbitActivity == Activity.hide && (simEnvData.visitor1.value || simEnvData.visitor2.value) && rabbitHidingCounter < maxRabbitHide) {
                setActivityMsgWrapper("The visitor is still there so the rabbit keeps hiding inside.")
            } else if (rabbitActivity == Activity.hide && (simEnvData.visitor1.value || simEnvData.visitor2.value)) {
                setActivityMsgWrapper("The rabbit is getting used to the visitor and will stop hiding soon.")
            } else if (simEnvData.visitor1.value || simEnvData.visitor2.value  && rabbitHidingCounter < maxRabbitHide) {
                setActivityMsgWrapper("The rabbit stays inside to hide because it can hear a visitor.")
                setActivity(true, Activity.hide)
            } else if (rabbitActivity == Activity.shelter && badWeather()) {
                setActivityMsgWrapper("The weather is still bad so the rabbit keeps sheltering inside.")
            } else if (badWeather()) {
                setActivityMsgWrapper("The rabbit stays inside to shelter from bad weather.")
                setActivity(true, Activity.shelter)
            } else if (rabbitActivity == Activity.sleep && !rabbitWakeful()) {
                setActivityMsgWrapper("The rabbit keeps sleeping inside.")
            } else if (!rabbitWakeful()) {
                setActivityMsgWrapper("The rabbit stays inside and goes to sleep.")
                setActivity(true, Activity.sleep)
            } else if (simEnvData.randomChoice.value <= 20) {
                setActivityMsgWrapper("The rabbit stays inside and eats some food.")
                setActivity(true, Activity.feed)
            } else if (simEnvData.randomChoice.value <= 40) {
                setActivityMsgWrapper("The rabbit stays inside and plays with the white rabbit.")
                setActivity(true, Activity.play)
            } // below this, the rabbit moves outside 
            else if (simEnvData.randomChoice.value <= 60) {
                setActivityMsgWrapper("The rabbit goes outside and eats some food.")
                setActivity(false, Activity.feed)
            } else if (simEnvData.randomChoice.value <= 80) {
                setActivityMsgWrapper("The rabbit goes outside and plays with the grey rabbit.")
                setActivity(false, Activity.feed)
            } else {
                setActivityMsgWrapper("The rabbit goes outside and runs around to exercise.")
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