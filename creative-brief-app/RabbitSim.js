import { useState } from "react";

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

export const [simData, setSimData] = useState({
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

function writeMessage(text) {
    // TODO write to OLED 
    // TODO update custom channel 
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

export function updateState() {
    var options
    if (!simData.rabbitInside.value) {
        // rabbit is outside 
        if (simData.predator.value) {
            writeMessage("The rabbit has seen a predator and has run inside to hide!")
            return setActivity(true, Activity.hide)
        } else if (!rabbitWakeful()) {
            writeMessage("The rabbit is sleepy and has gone inside to nap.")
            return setActivity(true, Activity.sleep)
        } else if (tooCold()) {
            writeMessage("The rabbit is too cold and has gone inside to shelter.")
            return setActivity(true, Activity.shelter)
        } else if (tooWarm()) {
            writeMessage("The rabbit is too hot and has gone inside to shelter.")
            return setActivity(true, Activity.shelter)
        } else if (simData.raining.value) {
            writeMessage("It is raining so the rabbit has gone inside to shelter.")
            return setActivity(true, Activity.shelter)
        } else if (simData.randomChoice.value <= 33) {
            writeMessage("The rabbit is eating outside.")
            return setActivity(false, Activity.feed)
        } else if (simData.randomChoice.value <= 66) {
            writeMessage("The rabbit is playing outside with the grey rabbit.")
            return setActivity(false, Activity.play)
        } else {
            writeMessage("The rabbit is running around outside for exercise.")
            return setActivity(false, Activity.exercise)
        }
    } else {
        // rabbit is inside 
        if (simData.rabbitActivity.value == Activity.hide && simData.predator.value) {
            writeMessage("The predator is still outside so the rabbit keeps hiding inside.")
            return
        } else if (simData.predator.value()) {
            writeMessage("The rabbit stays inside to hide because it can hear a predator outside.")
            return setActivity(true, Activity.hide)
        } else if (simData.rabbitActivity.value == Activity.shelter && badWeather()) {
            writeMessage("The weather is still bad so the rabbit keeps sheltering inside.")
            return
        } else if (badWeather()) {
            writeMessage("The rabbit stays inside to shelter from bad weather.")
            return setActivity(true, Activity.shelter)
        } else if (simData.rabbitActivity.value == Activity.sleep && !rabbitWakeful()) {
            writeMessage("The rabbit keeps sleeping inside.")
            return
        } else if (!rabbitWakeful()) {
            writeMessage("The rabbit stays inside and goes to sleep.")
            return setActivity(true, Activity.sleep)
        } else if (simData.randomChoice.value <= 20) {
            writeMessage("The rabbit stays inside and eats some food.")
            return setActivity(true, Activity.feed)
        } else if (simData.randomChoice.value <= 40) {
            writeMessage("The rabbit stays inside and plays with the white rabbit.")
            return setActivity(true, Activity.play)
        } else if (simData.randomChoice.value <= 60) {
            writeMessage("The rabbit goes outside and eats some food.")
            return setActivity(false, Activity.feed)
        } else if (simData.randomChoice.value <= 80) {
            writeMessage("The rabbit goes outside and plays with the grey rabbit.")
            return setActivity(false, Activity.feed)
        } else {
            writeMessage("The rabbit goes outside and runs around to exercise.")
            return setActivity(false, Activity.exercise)
        }

    }
}