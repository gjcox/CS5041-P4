import { useContext, useEffect, useState } from 'react';

import { push, ref, serverTimestamp } from "firebase/database";

import { useAuthState } from 'react-firebase-hooks/auth';

import { Context } from '../Context';
import { auth, database } from '../Firebase';
import useInterval from '../helper_functions/useInterval';
import { getTimeFromMinutes, seasons, seasonalDawnDusk } from '../helper_functions/dateAndTime';

export const Activity = Object.freeze({
    sleep: 'sleep',
    feed: 'eat',
    hide: 'hide',
    shelter: 'shelter',
    play: 'play',
    exercise: 'exercise',
})

export default function RabbitSim() {

    const [user, authLoading, authError] = useAuthState(auth);

    const {
        simEnvData, setSimEnvData,
        raining, setRaining,
        rabbitInside, setRabbitInside,
        rabbitActivity, setRabbitActivity,
    } = useContext(Context)

    const maxMsBetweenActivityMsg = 60 * 1000
    const [activityMsg, setActivityMsg] = useState("")
    const [lastActivityMsgTime, setLastActivityMsgTime] = useState(Date.now())

    const [observationMsg, setObservationMsg] = useState("")

    const maxRabbitHide = 1 // max number of times the rabbit will hide in a row
    const [rabbitHidingCounter, setRabbitHidingCounter] = useState(0)
    const [rabbitSleepingCounter, setRabbitSleepingCounter] = useState(0)

    const rabbitFacts = [
        "Rabbits are crepuscular: we are mostly active near dawn and dusk, and at certain times of night.",
        "Rabbits do not like getting wet! We groom ourselves with our tongues to stay clean.",
        /* Following information taken from  https://www.natgeokids.com/uk/discover/animals/general-animals/10-hopping-fun-rabbit-facts/,
        by National Geographic. Accessed 04/05/2023.*/
        "A baby rabbit is called a kit or kitten.",
        "A female rabbit is called a doe.",
        "A male rabbits is called is a buck.",
        "Rabbits are very social creatures, and we get lonely without other rabbits.",
        "Rabbits live in warrens, which are tunnels and rooms that we dig underground.",
        "A rabbit's teeth never stop growing! They are continually worn down when we eat.",
        "Rabbits perform a leap called a 'binky' when we are happy, twisting and kicking in the air.",
        "Rabbits' eyes are on the sides of our heads, so we can see almost all the way around us!",
        "Like cats, rabbits purr when we're content and relaxed.",
        /* End of information from National Geographic. */
        "Rabbits grow thicker fur in winter. This means we can tolerate the cold better, but overheat easily.",
    ]

    function incrementCounters() {
        if (rabbitActivity == Activity.hide) {
            setRabbitHidingCounter(rabbitHidingCounter + 1)
            console.log('rabbitHidingCounter: ', rabbitHidingCounter + 1)
            if (rabbitHidingCounter + 1 > maxRabbitHide) {
                setObservationMsgWrapper("I am used to the visitor outside and might stop hiding.")
            }
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
        } else {
            setRabbitSleepingCounter(0)
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
            // print a random rabbit fact 
            setActivityMsg(rabbitFacts[Math.floor(Math.random() * rabbitFacts.length)])
            setLastActivityMsgTime(Date.now())
        }
    }

    function setObservationMsgWrapper(newMsg) {
        if (newMsg != observationMsg) {
            setObservationMsg(newMsg)
        }
    }

    function writeToOLED(text) {
        if (text == '' || !text) {
            console.log(`RabbitSim.writeToOLED called when text=="${text}"`)

        } else if (user) {
            console.log(`RabbitSim.writeToOLED: "${text}"`)
            push(ref(database, "data"), {
                userId: user.uid,
                groupId: 20,
                timestamp: serverTimestamp(),
                type: "str",
                string: text.toString()
            });
        } else {
            console.log(`RabbitSim.writeToOLED called when user==${user}`)
        }
    }

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
     * Determines if the current temperature is too cold for the rabbit.
     * N.B. The museum's exhibit limits hue <-> temperature conversions to 0-20°C.
     */
    function tooCold() {
        if ([0, 3].includes(simEnvData.season.value)) {
            // it is winter or autumn so the rabbit has grown its winter fur 
            return simEnvData.temp.value <= -10
        } else {
            return simEnvData.temp.value <= 5
        }
    }

    /**
     * Determines if the current temperature is too warm for the rabbit.
     * N.B. The museum's exhibit limits hue <-> temperature conversions to 0-20°C.
     */
    function tooWarm() {
        if ([0, 3].includes(simEnvData.season.value)) {
            // it is winter or autumn so the rabbit has grown its winter fur 
            return simEnvData.temp.value >= 20
        } else {
            return simEnvData.temp.value >= 25
        }
    }

    /**
     * Checks if the current weather will cause the rabbit to seek shelter.
     * @returns false if the rabbit would not shelter, else the reason to shelter.
     */
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

    /**
     * Updates rabbitInside and rabbitActivity. 
     * 
     * @param {boolean} newIsInside 
     * @param {string} newActivity 
     */
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

    /* track how long the rabbit has been hiding*/
    useEffect(() => {
        console.log('rabbitHidingCounter: ', rabbitHidingCounter)
    }, [rabbitHidingCounter])

    // When the environment changes (importantly temp and humidity) determine if raining 
    useEffect(() => {
        let nowRaining = simEnvData.humidity.value >= 1.5 * simEnvData.temp.value + 60
        if (nowRaining != raining) {
            setRaining(nowRaining)
            console.log('raining: ', nowRaining)
            setObservationMsgWrapper(`It has ${nowRaining ? 'started' : 'stopped'} raining.`)
        }
    }, [simEnvData])

    // When the rabbit's environment changes, determine its new activity
    useEffect(() => {
        updateRabbitActivity()
    }, [simEnvData, raining])

    // Every activityUpdatePeriod ms, update rabbit activity
    const activityUpdatePeriod = 60 * 1000 // ms 
    useInterval(() => {
        incrementCounters()
        updateRabbitActivity()
    }, activityUpdatePeriod)

    // When the observation message changes, write the new observation
    useEffect(() => {
        writeToOLED(observationMsg)
    }, [observationMsg])

    // When the activity message changes, write the new activity
    useEffect(() => {
        writeToOLED(activityMsg)
    }, [activityMsg])

    /**
     * This is the rabbit's brain.
     */
    function updateRabbitActivity() {
        let badWeather = checkBadWeather()
        let rabbitWakeful = checkRabbitWakeful()

        if (rabbitWakeful && rabbitActivity == Activity.sleep) {
            setObservationMsgWrapper("I have woken up.")
        }

        if (rabbitActivity == Activity.hide && !simEnvData.visitor) {
            setObservationMsgWrapper("I think the visitor has gone away.")
        }

        if (rabbitInside && rabbitActivity == Activity.sleep && !rabbitWakeful) {
            setActivityMsgWrapper("Zzzzzz")
        } else if (!rabbitWakeful) {
            setActivityMsgWrapper(buildMessage(!rabbitInside, true, Activity.sleep,
                `rabbits are crepuscular and it is ${getTimeFromMinutes(simEnvData.time.value)} in ${seasons[simEnvData.season.value]}`))
            setActivity(true, Activity.sleep)
        } else {
            // rabbit awake 
            if (!rabbitInside) {
                // rabbit is outside 
                if (simEnvData.visitor.value) {
                    setActivityMsgWrapper(buildMessage(true, true, Activity.hide, "I have seen a visitor"))
                    setActivity(true, Activity.hide)
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
                if (rabbitActivity == Activity.hide && (simEnvData.visitor.value) && rabbitHidingCounter < maxRabbitHide) {
                    setActivityMsgWrapper(buildMessage(false, true, Activity.hide, "the visitor is still outside"))
                } /*else if (rabbitActivity == Activity.hide && (simEnvData.visitor.value) && rabbitHidingCounter == maxRabbitHide) {
                    setActivityMsgWrapper("I am getting used to the visitor and will stop hiding soon.")
                }*/ else if ((simEnvData.visitor.value) && rabbitHidingCounter < maxRabbitHide) {
                    setActivityMsgWrapper(buildMessage(false, true, Activity.hide, "I heard a visitor outside"))
                    setActivity(true, Activity.hide)
                } else if (badWeather) {
                    setActivityMsgWrapper(buildMessage(false, true, Activity.shelter, `${badWeather} outside`))
                    setActivity(true, Activity.shelter)
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
    }

    return (
        <div>
            {user ? true : false}
        </div>
    )
}