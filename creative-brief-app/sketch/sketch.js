/* This code is adapted from https://github.com/atorov/react-hooks-p5js by Veselin. Accessed 04/05/2023.*/

import { checkNearDawnDusk, seasonalDawnDusk } from "../helper_functions/dateAndTime"
import scale from "../helper_functions/scale"

export default function (s) {
    s.state = {}
    // s.dispatch = () => { }

    s.setup = () => {
        s.createCanvas(800, 800)

        console.log("sketch has been initialised")
    }

    s.draw = () => {
        s.colorMode(s.HSB);
        // let hue = s.map(s.state.simEnvData.temp.value, 0, 20, 0, 360)
        // let saturation = s.state.simEnvData.randomChoice.value
        // let time = s.state.simEnvData.time.value
        // if (time > 720) {
        //     time = 1440 - time
        // }
        // let brightness = s.map(time, 0, 720, 0, 100)
        s.background(...skyColour(s.state.simEnvData.time.value, s.state.simEnvData.season.value, s.state.raining))
    }

    function skyColour(time, season, raining) {
        let { dawn, dusk } = seasonalDawnDusk[season]
        if (raining) {
            return [215, 20, 35]
        } else if (checkNearDawnDusk(season, time, 0.5)) {
            // sunrise/sunset 
            return [345, 70, 75]
        } else if (time < dawn || time > dusk) {
            //nighttime 
            return [252, 35, 16]
        } else {
            //daytime 
            return [180, 75, 75]
        }
        return [hue, sat, bright]
    }
}

/* End of adapted code */