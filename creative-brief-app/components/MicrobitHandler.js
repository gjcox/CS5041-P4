import { useCallback, useContext, useEffect, useState } from "react";

import { Button } from "react-native-paper";

import { push, ref, serverTimestamp } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";

import { Context } from "../Context";
import { auth, database } from "../Firebase";
import { getMinuteTime } from "../helper_functions/dateAndTime";
import { groupIds } from "../helper_functions/groupIds";
import scale from "../helper_functions/scale";

export default function MicrobitHandler() {
  const [user, authLoading, authError] = useAuthState(auth);
  const { simEnvData } = useContext(Context);

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
        <Button
         mode="contained-tonal" onPress={closeMicrobitPort}>
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

  function writeToFirebase(groupId, value) {
    if (user) {
      console.log(`MicrobitHandler.writeToFirebase: "${Math.floor(+value)}"`);
      push(ref(database, "data"), {
        userId: user.uid,
        groupId: groupId,
        timestamp: serverTimestamp(),
        type: "int",
        integer: Math.floor(+value),
      });
    } else {
      console.log(`MicrobitHandler.writeToFirebase called when user==${user}`);
    }
  }

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
              // randomise light hue (and temperature)
              writeToFirebase(groupIds.LightHue, Math.random() * 360);
            } else {
              // set light hue to simulation temperature
              let scaleTempToHue = scale([0, 20], [0, 360]);
              let scaledHue = scaleTempToHue(
                Math.max(0, Math.min(20, simEnvData.temp.value))
              );
              writeToFirebase(groupIds.LightHue, scaledHue);
            }
            break;
          case "Button2":
            // randomise light saturation (and random variable)
            writeToFirebase(groupIds.LightSaturation, Math.random() * 100);
            break;
          case "Button3":
            if (split[1] == 1) {
              writeToFirebase(groupIds.LightBrightness, Math.random() * 100);
            } else {
              // set light brightness (and time) to actual time
              let tempTime = getMinuteTime(new Date());
              if (tempTime > 720) {
                tempTime = 1440 - tempTime;
              }
              let scaleTimeToBright = scale([0, 720], [0, 100]);
              let scaledBrightness = scaleTimeToBright(
                Math.max(0, Math.min(720, tempTime))
              );
              writeToFirebase(groupIds.LightBrightness, scaledBrightness);
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
