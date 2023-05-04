/* This code is adapted from https://github.com/atorov/react-hooks-p5js by Veselin. Accessed 04/05/2023.*/
import React, { useContext } from 'react'

import sketch from '../sketch/sketch'
import P5WrapperConstructor from '../components/P5Wrapper'
import { Context } from '../Context'

const P5Wrapper1 = P5WrapperConstructor()

export default function P5Screen() {
    const {
        simEnvData,
        raining,
        rabbitInside,
        rabbitActivity,
    } = useContext(Context)

    return (
        <div >
            {window.p5 ? <P5Wrapper1
                sketch={sketch}
                state={{
                    simEnvData: simEnvData,
                    raining: raining,
                    rabbitInside: rabbitInside,
                    rabbitActivity: rabbitActivity,
                }}
            /> : false
            }
        </div>
    )
}
/* End of adapted code */