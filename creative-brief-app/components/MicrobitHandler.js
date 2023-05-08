import { useCallback, useEffect, useState } from "react";

import { Button } from "react-native-paper";

export default function MicrobitHandler() {
  /* Start of serial-handler code reused from P3. 
Originally adapted from https://sparkfunx.github.io/WebTerminalDemo/, by SparkX. Accessed 28/03/23 */
  const debuggingIO = true;

  // Serial I/O state
  const [microbitPort, setMicrobitPort] = useState(null);
  const [microbitRStreamClosed, setMicrobitRStreamClosed] = useState(null);
  const [microbitReader, setMicrobitReader] = useState(null);
  const [microbitClosed, setMicrobitClosed] = useState(false);

  /**
   * Opens a browser-level dialogue to allow the user to select the microbit port.
   * If the port is successfully opened, then the microbit reader is set.
   */
  const requestMicrobitPort = useCallback(async () => {
    const port = await navigator.serial.requestPort();
    port.open({ baudRate: 115200 }).then(
      () => {
        setMicrobitPort(port);
        console.log("The microbit port has been set.");

        // Get a text decoder, pipe it to the SerialPort object, and get a reader
        const textDecoder = new TextDecoderStream();
        let reader = textDecoder.readable.getReader();
        // use port (not microbitPort) for concurrency reasons
        setMicrobitRStreamClosed(port.readable.pipeTo(textDecoder.writable));
        setMicrobitReader(reader);
        console.log("The microbit reader has been set.");
      },
      () => {
        console.log("The microbit port could not be set.");
      }
    );
  });

  /**
   * Forcefully closes the microbit reader and catches the error, then closes the port.
   */
  async function closeMicrobitPort() {
    microbitReader.cancel();
    await microbitRStreamClosed.catch(() => {
      /* ignore error */
    });
    setMicrobitReader(null);
    console.log("The microbit reader has been closed.");

    await microbitPort.close();
    setMicrobitPort(null);
    setMicrobitClosed(true); // disables open button
    console.log("The microbit port has been closed.");
  }

  // Start handling microbit input once microbitReader is set.
  useEffect(() => {
    if (microbitReader) {
      handleMicrobitInput();
    }
  }, [microbitReader]);

  const MicrobitButton = () => {
    if (microbitPort) {
      return (
        <Button mode="contained-tonal" onPress={closeMicrobitPort}>
          Close micro:bit Port
        </Button>
      );
    } else {
      return (
        <Button
          buttonColor="#8676b6"
          disabled={microbitClosed}
          mode="contained"
          onPress={requestMicrobitPort}
        >
          Request micro:bit Port
        </Button>
      );
    }
  };

  /* End of reused code. */

  /**
   * Uses microbit input to update the start/stop state.
   */
  async function handleMicrobitInput() {
    while (true) {
      const { value, done } = await microbitReader.read();

      if (debuggingIO) {
        console.log("handleMicrobitInput: " + value);
      }

      const split = value.split(":");
      if (split.length == 2) {
        switch (split[0]) {
          case "Button1":
            if (split[1] == 1) {
              // TODO randomise light hue
            } else {
              // TODO set light hue to actual temperature
            }
            break;
          case "Button2":
            // TODO randomise light saturation
            break;
          case "Button3":
            if (split[1] == 1) {
              // TODO randomise light brightness
            } else {
              // TODO set light brightness to actual time
            }
            break;
          default:
          // do nothing
        }
      }

      if (done) {
        if (debuggingIO) {
          console.log("handleMicrobitInput: microbitReader released");
        }
        microbitReader.releaseLock(); // release the lock on the reader so the owner port can be closed
        break;
      }
    }
  }

  return <MicrobitButton />;
}
