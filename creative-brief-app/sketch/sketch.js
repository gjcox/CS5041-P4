/* This code is adapted from https://github.com/atorov/react-hooks-p5js by Veselin. Accessed 04/05/2023.*/

export default function (s) {
    s.state = {}
    // s.dispatch = () => { }

    s.setup = () => {
        s.createCanvas(800, 800)

        console.log("sketch has been initialised")
    }

    s.draw = () => {
        s.colorMode(s.HSB);
        let hue = s.map(s.state.simEnvData.temp.value, 0, 20, 0, 360)
        let saturation = s.state.simEnvData.randomChoice.value
        let time = s.state.simEnvData.time.value
        if (time > 720) {
            time = 1440 - time
        }
        let brightness = s.map(time, 0, 720, 0, 100)
        s.background(hue, saturation, brightness)
    }
}

/* End of adapted code */