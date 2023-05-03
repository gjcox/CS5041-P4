import { useEffect, useState } from "react";

import { push, ref, serverTimestamp } from "firebase/database";

import { useAuthState } from 'react-firebase-hooks/auth';

import { auth, database } from '../Firebase';

export default function RabbitSim() {

    const [user, authLoading, authError] = useAuthState(auth);

    const [activityMsg, setActivityMsg] = useState("")

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
    })

    const [simData, setSimData] = useState({
        // user/physical inputs 
        temp: { updateFromDisplay: true, value: 19 },
        raining: { updateFromDisplay: true, value: false },
        time: { updateFromDisplay: true, value: getMinuteTime(new Date()) },
        season: { updateFromDisplay: true, value: getSeason((new Date().getMonth())) },
        predator: { updateFromDisplay: true, value: false },
        randomChoice: { updateFromDisplay: true, value: 50 }, // maps to saturation; 0-100
        rabbitInside: { updateFromDisplay: true, value: false },
        rabbitActivity: { updateFromDisplay: true, value: Activity.play },
    })

    function writeActivityMessage() {
        console.log(`RabbitSim.writeMessage: "${activityMsg}"`)
        push(ref(database, "data"), {
            userId: user.uid,
            groupId: 20,
            timestamp: serverTimestamp(),
            type: "str",
            string: activityMsg.toString()
        });
        // TODO update custom channel for P5 
    }

    function rabbitWakeful() {
        // TODO 
        return true
    }

    function tooCold() {
        // TODO
        return false
    }

    function tooWarm() {
        // TODO 
        return false
    }

    function badWeather() {
        return simData.raining.value || tooCold() || tooWarm()
    }

    function setActivity(newIsInside, newActivity) {
        setSimData({
            ...simData,
            rabbitInside: { ...simData.rabbitInside, value: newIsInside },
            rabbitActivity: { ...simData.rabbitActivity, value: newActivity },
        })
    }

    // Every barUpdatePeriod ms, update rabbit activity
    const simUpdatePeriod = 60 * 1000 // ms 
    useEffect(() => {
        const interval = setInterval(
            () => {
                updateState()
            }
            , simUpdatePeriod)

        return () => clearInterval(interval)
    }, [])

    // When the rabbit's activity changes, write the new activity
    useEffect(() => {
        if (activityMsg != "") {
            writeActivityMessage()
            setActivityMsg("")
        }
    }, [activityMsg])

    function updateState() {
        if (!simData.rabbitInside.value) {
            // rabbit is outside 
            if (simData.predator.value) {
                setActivityMsg("The rabbit has seen a predator and has run inside to hide!")
                setActivity(true, Activity.hide)
            } else if (!rabbitWakeful()) {
                setActivityMsg("The rabbit is sleepy and has gone inside to nap.")
                setActivity(true, Activity.sleep)
            } else if (tooCold()) {
                setActivityMsg("The rabbit is too cold and has gone inside to shelter.")
                setActivity(true, Activity.shelter)
            } else if (tooWarm()) {
                setActivityMsg("The rabbit is too hot and has gone inside to shelter.")
                setActivity(true, Activity.shelter)
            } else if (simData.raining.value) {
                setActivityMsg("It is raining so the rabbit has gone inside to shelter.")
                setActivity(true, Activity.shelter)
            } else if (simData.randomChoice.value <= 33) {
                setActivityMsg("The rabbit is eating outside.")
                setActivity(false, Activity.feed)
            } else if (simData.randomChoice.value <= 66) {
                setActivityMsg("The rabbit is playing outside with the grey rabbit.")
                setActivity(false, Activity.play)
            } else {
                setActivityMsg("The rabbit is running around outside for exercise.")
                setActivity(false, Activity.exercise)
            }
        } else {
            // rabbit is inside 
            if (simData.rabbitActivity.value == Activity.hide && simData.predator.value) {
                setActivityMsg("The predator is still outside so the rabbit keeps hiding inside.")
            } else if (simData.predator.value()) {
                setActivityMsg("The rabbit stays inside to hide because it can hear a predator outside.")
                setActivity(true, Activity.hide)
            } else if (simData.rabbitActivity.value == Activity.shelter && badWeather()) {
                setActivityMsg("The weather is still bad so the rabbit keeps sheltering inside.")
            } else if (badWeather()) {
                setActivityMsg("The rabbit stays inside to shelter from bad weather.")
                setActivity(true, Activity.shelter)
            } else if (simData.rabbitActivity.value == Activity.sleep && !rabbitWakeful()) {
                setActivityMsg("The rabbit keeps sleeping inside.")
            } else if (!rabbitWakeful()) {
                setActivityMsg("The rabbit stays inside and goes to sleep.")
                setActivity(true, Activity.sleep)
            } else if (simData.randomChoice.value <= 20) {
                setActivityMsg("The rabbit stays inside and eats some food.")
                setActivity(true, Activity.feed)
            } else if (simData.randomChoice.value <= 40) {
                setActivityMsg("The rabbit stays inside and plays with the white rabbit.")
                setActivity(true, Activity.play)
            } else if (simData.randomChoice.value <= 60) {
                setActivityMsg("The rabbit goes outside and eats some food.")
                setActivity(false, Activity.feed)
            } else if (simData.randomChoice.value <= 80) {
                setActivityMsg("The rabbit goes outside and plays with the grey rabbit.")
                setActivity(false, Activity.feed)
            } else {
                setActivityMsg("The rabbit goes outside and runs around to exercise.")
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