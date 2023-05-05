/* This code is adapted from https://github.com/atorov/react-hooks-p5js by Veselin. Accessed 04/05/2023.*/

import { checkNearDawnDusk, getTimeFromMinutes, seasonalDawnDusk } from "../helper_functions/dateAndTime"

export default function (s) {
    s.state = {}
    // s.dispatch = () => { }

    s.setup = () => {
        s.createCanvas(800, 800)
        // s.createCanvas(s.state.canvasWidth, s.state.canvasHeight)
        // console.log("sketch has been initialised with state: ", Object.keys(s.state))
    }

    s.draw = () => {
        s.noStroke();
        // s.colorMode(s.HSB);
        // s.background(...skyColour(s.state.simEnvData.time.value, s.state.simEnvData.season.value, s.state.raining))

        for (let row = 0; row < s.state.pixels.length; row++) {
            let y = row * s.state.pixelHeight;
            for (let col = 0; col < s.state.pixels[row].length; col++) {
                let x = col * s.state.pixelWidth;
                s.colorMode(s.HSB);
                let colour = pixelColour(s.state.pixels[row][col]);
                if (typeof colour == 'string') {
                    s.fill(colour)
                } else {
                    s.fill(...colour)
                }
                s.square(x, y, s.state.pixelWidth, s.state.pixelHeight);
            }
        }
    }

    function pixelColour(int) {
        switch (int) {
            case 0:
                // sky 
                return skyColour(
                    s.state.simEnvData.time.value,
                    s.state.simEnvData.season.value,
                    s.state.raining
                )
            case 1:
                // dirt 
                return 'sienna'
            case 2:
                // warren wall
                return 'saddlebrown'
            case 3:
                // warren room
                return 'tan'
            case 4:
                // grass
                return 'forestgreen'
        }
    }

    function skyColour(time, season, raining) {
        let { dawn, dusk } = seasonalDawnDusk[season]
        if (raining) {
            if (time > 720) {
                time = 1440 - time
            }
            let brightness = s.map(time, 0, 720, 15, 75)
            return [215, 20, brightness]
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
    }
}

/* End of adapted code */