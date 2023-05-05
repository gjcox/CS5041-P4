/* This code is adapted from https://github.com/atorov/react-hooks-p5js by Veselin. Accessed 04/05/2023.*/
import React, { useContext, useState, useEffect } from 'react'

import sketch from '../sketch/sketch'
import P5WrapperConstructor from '../components/P5Wrapper'
import { Context } from '../Context'

const P5Wrapper1 = P5WrapperConstructor("RabbitSim")

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


    // rooms in the warren 
    const rooms = [
        // row, col, width, height
        [10, skyDepth + 1, 5, 10],
        [15, skyDepth + 6, 10, 5],
        [20, skyDepth + 6, 5, 10],
        [25, skyDepth + 11, 25, 10], // room with white rabbit
        [50, skyDepth + 16, 10, 5],
        [60, skyDepth + 14, 10, 7], // room with food/bedding
        [25, skyDepth + 21, 5, 5],
        [15, skyDepth + 26, 15, 7], // room for hiding
    ];

    /**
     * N.B. x and y are relative to gridDims, not canvas
     */
    function digRoom(tempPixels, x, y, w, h) {
        for (var row = y - 1; row <= y + h; row++) {
            for (var col = x - 1; col <= x + w; col++) {
                if (tempPixels[row][col] == 1 || tempPixels[row][col] == 2) {
                    // excavate dirt and wall
                    if (row == y - 1 || row == y + h || col == x - 1 || col == x + w) {
                        // wall around excavation
                        tempPixels[row][col] = 2;
                    } else {
                        // room of excavation
                        tempPixels[row][col] = 3;
                    }
                } else if (tempPixels[row][col] == 4) {
                    // floating grass becomes sky
                    tempPixels[row][col] = 0;
                }
            }
        }
        return tempPixels
    }

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

        // excavate warren
        for (var room of rooms) {
            digRoom(tempPixels, ...room);
        }

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