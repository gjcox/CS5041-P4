/* This code is adapted from https://github.com/atorov/react-hooks-p5js by Veselin. Accessed 04/05/2023.*/
import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../Context'
import P5WrapperConstructor from '../components/P5Wrapper'
import { Activity } from '../components/RabbitSim'
import NPC from '../sketch/NPC'
import {
    DIRT,
    GRASS,
    ROOM,
    SKY,
    WALL,
    canvasHeight,
    canvasWidth,
    gridDims,
    littleRabbitHeight,
    littleRabbitWidth,
    npcRabbitHeight,
    npcRabbitWidth,
    pixelHeight,
    pixelWidth,
    skyDepth,
    visitorHeight,
    visitorWidth
} from '../sketch/canvasSettings'
import sketch from '../sketch/sketch'

const P5Wrapper1 = P5WrapperConstructor("RabbitSim")

export default function P5Screen() {


    // variable state 
    const [pixels, setPixels] = useState([])
    const [greyRabbit, setGreyRabbit] = useState({})
    const [whiteRabbit, setWhiteRabbit] = useState({})
    const [visitor, setVisitor] = useState({})
    const [littleRabbit, setLittleRabbit] = useState({})

    const {
        simEnvData,
        raining,
        rabbitInside,
        rabbitActivity,
    } = useContext(Context)


    // rooms in the warren 
    const rooms = [
        // row, col, width, height
        [10, skyDepth + 1, 5, 10], // 0 vertical tunnel into warren
        [15, skyDepth + 6, 10, 5], // 1 horizontal tunnel into warren 
        [20, skyDepth + 6, 5, 10], // 2 vertical step into room 3
        [25, skyDepth + 11, 25, 10], // 3 room with white rabbit
        [50, skyDepth + 16, 10, 5], // 4 horizontal tunnel into room 5
        [60, skyDepth + 14, 10, 7], // 5 room with food/bedding
        [25, skyDepth + 21, 5, 5], // 6 vertical tunnel into room 7 
        [15, skyDepth + 26, 15, 7], // 7 room for hiding
        [1, 1, Math.floor(gridDims[0] * 0.33), skyDepth - 2], // left-hand third above ground 
        [Math.floor(gridDims[0] * 0.33), 1, Math.floor(gridDims[0] * 0.66), skyDepth - 2], // middle third above ground 
        [Math.floor(gridDims[0] * 0.66), 1, gridDims[0], skyDepth - 2], // right-hand third above ground 
    ];

    const insideRooms = [2, 3, 4, 5, 6, 7]
    const outsideRooms = [8, 9, 10]

    /**
     * N.B. x and y are relative to gridDims, not canvas
     */
    function digRoom(tempPixels, x, y, w, h) {
        for (var row = y - 1; row <= y + h; row++) {
            for (var col = x - 1; col <= x + w; col++) {
                if (tempPixels[row][col] == DIRT || tempPixels[row][col] == WALL) {
                    // excavate dirt and wall
                    if (row == y - 1 || row == y + h || col == x - 1 || col == x + w) {
                        // wall around excavation
                        tempPixels[row][col] = WALL;
                    } else {
                        // room of excavation
                        tempPixels[row][col] = ROOM;
                    }
                } else if (tempPixels[row][col] == GRASS) {
                    // floating grass becomes sky
                    tempPixels[row][col] = SKY;
                }
            }
        }
        return tempPixels
    }

    function getCenterOfRoom(roomIndex) {
        let room = rooms[roomIndex];
        return [
            (room[0] + room[2] / 2) * pixelHeight,
            (room[1] + room[3] / 2) * pixelWidth,
        ];
    }

    /**
     * Determines if an (x,y) coordinate on the canvas is at the top of a grass or wall pixel.
     * @param {*} x 
     * @param {*} y 
     * @returns 
     */
    function onGroundWrapper(tempPixels) {
        return (x, y) => {
            let row = Math.floor(y / pixelHeight);
            let col = Math.floor(x / pixelWidth);
            return [GRASS, WALL].includes(tempPixels[row][col]);
        }
    }

    function worldSetup() {
        // create the heavens and the earth
        let tempPixels = []
        for (let row = 0; row < gridDims[0]; row++) {
            let pixelRow = [];
            for (let col = 0; col < gridDims[1]; col++) {
                if (row < skyDepth) {
                    pixelRow.push(SKY);
                } else if (row == skyDepth) {
                    pixelRow.push(GRASS);
                } else if (row == skyDepth + 1) {
                    pixelRow.push(WALL);
                } else {
                    pixelRow.push(DIRT);
                }
            }
            tempPixels.push(pixelRow);
        }

        // excavate warren
        for (var room of rooms) {
            digRoom(tempPixels, ...room);
        }

        setPixels(tempPixels);

        // add white and grey rabbits
        setGreyRabbit(new NPC({
            xy: [canvasWidth * 0.5, 0],
            w: npcRabbitWidth,
            h: npcRabbitHeight,
            colour: "grey",
            onGround: onGroundWrapper(tempPixels)
        }));
        setWhiteRabbit(new NPC({
            xy: getCenterOfRoom(3),
            w: npcRabbitWidth,
            h: npcRabbitHeight,
            colour: "white",
            onGround: onGroundWrapper(tempPixels)
        }));

        // add visitor
        setVisitor(new NPC({
            xy: [canvasWidth * 0.8, 0],
            w: visitorWidth,
            h: visitorHeight,
            colour: "orangered",
            onGround: onGroundWrapper(tempPixels)
        }
        ))

        // add little rabbit 
        setLittleRabbit(new NPC({
            xy: getCenterOfRoom(5),
            w: littleRabbitWidth,
            h: littleRabbitHeight,
            colour: "lightgrey",
            onGround: onGroundWrapper(tempPixels)
        }))
    }

    // set up the world when component renders 
    useEffect(() => {
        worldSetup()
    }, [])

    // move the little rabbit when the activity changes 
    useEffect(() => {
        if (littleRabbit instanceof NPC) {
            let xy
            switch (rabbitActivity) {
                case Activity.sleep:
                    xy = getCenterOfRoom(5)
                    break
                case Activity.feed:
                    if (rabbitInside.value) {
                        xy = getCenterOfRoom(5)
                    } else {
                        xy = getCenterOfRoom(outsideRooms[Math.floor(Math.random() * outsideRooms.length)])
                    }
                    break
                case Activity.play:
                    if (rabbitInside.value) {
                        xy = getCenterOfRoom(3)
                    } else {
                        xy = getCenterOfRoom(9)
                    }
                    break;
                case Activity.hide:
                    xy = getCenterOfRoom(7)
                    break;                
                case Activity.shelter:
                    xy = getCenterOfRoom(insideRooms[Math.floor(Math.random() * insideRooms.length)])
                case Activity.exercise:
                    if (rabbitInside.value) {
                        xy = getCenterOfRoom(3)
                    } else {
                        xy = getCenterOfRoom(outsideRooms[Math.floor(Math.random() * outsideRooms.length)])
                    }
                    break;
                default:
                    xy = getCenterOfRoom(3)
            }
            setLittleRabbit(new NPC({ ...littleRabbit, xy: xy }))
        }
    }, [rabbitActivity])

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
                    canvasHeight: canvasHeight,
                    greyRabbit: greyRabbit,
                    whiteRabbit: whiteRabbit,
                    visitor: visitor,
                    littleRabbit: littleRabbit,
                }}
            /> : false
            }
        </div>
    )
}
/* End of adapted code */