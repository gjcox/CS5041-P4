import { useEffect, useRef } from 'react';

/* The following code is taken from https://overreacted.io/making-setinterval-declarative-with-react-hooks/, by Dan Abramov. Accessed 03/05/2023.*/
export default function useInterval(callback, delay) {
    const savedCallback = useRef();

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}
    /* End of code by Dan Abramov. */