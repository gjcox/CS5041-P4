/* This code is adapted from https://github.com/atorov/react-hooks-p5js by Veselin. Accessed 04/05/2023.*/
import React, { useContext, useState, useEffect } from 'react'

import sketch from '../sketch/sketch'
import P5WrapperConstructor from '../components/P5Wrapper'
import { Context } from '../Context'

const P5Wrapper1 = P5WrapperConstructor()

export default function P5Screen() {
    const canvasWidth = 800;
    const canvasHeight = 800;
    const gridDims = [100, 100];
    const skyDepthFactor = 0.5; // how screen is sky
    const skyDepth = skyDepthFactor * gridDims[1];
    const pixelWidth = canvasWidth / gridDims[0];
    const pixelHeight = canvasHeight / gridDims[1];

    const [pixels, setPixels] = useState([])

    const {
        simEnvData,
        raining,
        rabbitInside,
        rabbitActivity,
    } = useContext(Context)

    function worldSetup() {
        // create the heavens and the earth
        let tempPixels = [] 
        for (let row = 0; row < gridDims[0]; row++) {
            let pixelRow = [];
            for (let col = 0; col < gridDims[1]; col++) {
                if (row < skyDepth) {
                    pixelRow.push(0);
                } else if (row == skyDepth) {
                    pixelRow.push(4);
                } else if (row == skyDepth + 1) {
                    pixelRow.push(2);
                } else {
                    pixelRow.push(1);
                }
            }
            tempPixels.push(pixelRow);
        }
        console.log(`pixels: ${tempPixels}`)
        setPixels(tempPixels);
    }

    useEffect(() => {
        worldSetup()
    }, [])

    return (
        <div >
            {window.p5 ? <P5Wrapper1
                sketch={sketch}
                state={{
                    simEnvData: simEnvData,
                    raining: raining,
                    rabbitInside: rabbitInside,
                    rabbitActivity: rabbitActivity,
                    pixels: pixels,
                    pixelWidth: pixelWidth,
                    pixelHeight: pixelHeight,
                    canvasWidth: canvasWidth,
                    canvasHeight: canvasHeight
                }}
            /> : false
            }
        </div>
    )
}
/* End of adapted code */