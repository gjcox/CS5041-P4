import { useEffect, useState } from "react";

import { View } from "react-native";

import { NavigationContainer } from "@react-navigation/native";

import { Provider as PaperProvider, Text } from "react-native-paper";

import { signInAnonymously } from "firebase/auth";
import {
  equalTo,
  limitToLast,
  orderByChild,
  query,
  ref,
} from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import { useList } from "react-firebase-hooks/database";

import { Context } from "./Context";
import { auth, database } from "./Firebase";
import { styles } from "./Styles";
import ColouredBunny from "./components/ColouredBunny";
import Instructions from "./components/Instructions";
import MicrobitHandler from "./components/MicrobitHandler";
import OLEDText from "./components/OLEDText";
import RabbitSim, { Activity } from "./components/RabbitSim";
import Table from "./components/Table";
import { getMinuteTime, getSeason } from "./helper_functions/dateAndTime";
import { groupIds } from "./helper_functions/groupIds";
import scale from "./helper_functions/scale";
import P5Screen from "./screens/P5Screen";

var debounceTimer;

export default function App() {
  const [user, authLoading, authError] = useAuthState(auth);
  const linking = {
    prefixes: [],
  };

  const [simEnvData, setSimEnvData] = useState({
    // user/physical inputs
    temp: { value: 19 },
    humidity: { value: 50 },
    time: { value: getMinuteTime(new Date()) },
    season: { value: getSeason(new Date().getMonth()) },
    visitor: { value: false },
    randomChoice: { value: 50 }, // maps to saturation; 0-100
  });

  const [simEnvUpdate, setSimEnvUpdate] = useState({
    temp: true,
    humidity: true,
    time: true,
    season: true,
    visitor: true,
    randomChoice: true,
  });

  const [h, setH] = useState(Math.floor(Math.random() * 360));
  const [s, setS] = useState(Math.floor(Math.random() * 100));
  const [b, setB] = useState(Math.floor(Math.random() * 80));

  // function for getting snapshots for a given groupId
  const snapshots = (groupId) =>
    useList(
      user
        ? query(
          ref(database, "data"),
          orderByChild("groupId"),
          equalTo(groupId),
          limitToLast(10)
        )
        : null
    );

  const [hueSnapshots, hueLoading, hueError] = snapshots(groupIds.LightHue);
  const [satSnapshots, satLoading, satError] = snapshots(
    groupIds.LightSaturation
  );
  const [brightSnapshots, brightLoading, brightError] = snapshots(
    groupIds.LightBrightness
  );
  const [motion1Snapshots, motion1Loading, motion1Error] = snapshots(
    groupIds.Motion1
  );
  const [humiditySnapshots, humidityLoading, humidityError] = snapshots(
    groupIds.OutsideHumidity
  );
  const [greySnapshots, greyLoading, greyError] = snapshots(
    groupIds.GreyRabbitContact
  );
  const [whiteSnapshots, whiteLoading, whiteError] = snapshots(
    groupIds.WhiteRabbitContact
  );

  /**
   * Updates the simulation to reflect values from the Firebase database.
   * Values should have already been converted to reflect the intended feature.
   *
   * Updates are debounced to try to cope with other students spamming the database.
   *
   * @param {*} key the simulated environment feature
   * @param {*} newValue the new value for the feature
   */
  function updateSimValue(key, newValue) {
    if (simEnvUpdate[key] && newValue != simEnvData[key].value) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setSimEnvData({
          ...simEnvData,
          [key]: { ...simEnvData[key], value: newValue },
        });

        console.log(
          `updateSimValue[${key}].value=${newValue} (${typeof newValue})`
        );
      }, 1000);
    }
  }

  // On light hue change, update the temperature
  useEffect(() => {
    if (hueSnapshots && (!hueLoading || hueError)) {
      let snapshot = hueSnapshots[0];
      let newHue = snapshot?.val()?.integer ?? Math.random() * 360; // 0-360
      let scaleHueToTemp = scale([0, 360], [0, 20]);
      let scaledTemp = Math.round(
        scaleHueToTemp(Math.max(0, Math.min(360, newHue)))
      );
      updateSimValue("temp", scaledTemp);
      setH(newHue);
    }
  }, [hueSnapshots]);

  // On light saturation change, update the random choice
  useEffect(() => {
    if (satSnapshots && (!satLoading || satError)) {
      let snapshot = satSnapshots[0];
      let newRandomChoice = Math.round(snapshot?.val()?.integer ?? Math.random() * 100);
      updateSimValue("randomChoice", newRandomChoice);
      setS(newRandomChoice);
    }
  }, [satSnapshots]);

  // On light brightness change, update the time of day
  useEffect(() => {
    if (brightSnapshots && (!brightLoading || brightError)) {
      let snapshot = brightSnapshots[0];
      let newBrightness = Math.round(snapshot?.val()?.integer ?? Math.random() * 100);
      let scaleBrightToTime = scale([0, 100], [0, 720]); // 0-100 -> 0-1440
      let scaledTime = Math.round(
        scaleBrightToTime(Math.max(0, Math.min(100, newBrightness)))
      );
      if (newBrightness % 2 == 1) scaledTime = 1440 - scaledTime; // odd values are noon to midnight
      updateSimValue("time", scaledTime);
      setB(newBrightness);
    }
  }, [brightSnapshots]);

  // On motion detector 1 change, update visitor presence
  useEffect(() => {
    if (motion1Snapshots && (!motion1Loading || motion1Error)) {
      let snapshot = motion1Snapshots[0];
      let newVisitor = snapshot?.val()?.integer ?? 0 == 1;
      updateSimValue("visitor", newVisitor);
    }
  }, [motion1Snapshots]);

  // On change to outside humidity, update simulation state
  useEffect(() => {
    if (humiditySnapshots && (!humidityLoading || humidityError)) {
      let snapshot = humiditySnapshots[0];
      let newHumidity = Math.round(snapshot?.val()?.integer ?? 100 * Math.random());
      updateSimValue("humidity", newHumidity);
    }
  }, [humiditySnapshots]);

  const [raining, setRaining] = useState(false);
  const [rabbitInside, setRabbitInside] = useState(false);
  const [rabbitActivity, setRabbitActivity] = useState(Activity.play);

  // On white rabbit contact, move the rabbit outside
  useEffect(() => {
    if (greySnapshots && (!greyLoading || greyError)) {
      let snapshot = greySnapshots[0];
      let withGreyRabbit = snapshot?.val()?.integer ?? 0 == 1;
      if (withGreyRabbit && rabbitInside) {
        setRabbitInside(false);
      }
    }
  }, [greySnapshots]);

  // On white rabbit contact, move the rabbit inside
  useEffect(() => {
    if (whiteSnapshots && (!whiteLoading || whiteError)) {
      let snapshot = whiteSnapshots[0];
      let withWhiteRabbit = snapshot?.val()?.integer ?? 0 == 1;
      if (withWhiteRabbit && !rabbitInside) {
        setRabbitInside(true);
      }
    }
  }, [whiteSnapshots]);

  /* Anonymous sign in on load */
  useEffect(() => {
    async () => {
      await signInAnonymously(auth);
    }
  }, [])

  // Set document title  
  useEffect(() => {
    document.title = 'Interactive Rabbit Simulator';
  })

  // log when simEnvData actually updates
  useEffect(() => {
    console.log(`new simEnvData: `);
    console.log(simEnvData);
  }, [simEnvData]);

  // add p5 library to DOM upon load
  useEffect(() => {
    const script = document.createElement("script");

    script.src = "https://cdn.jsdelivr.net/npm/p5@1.2.0/lib/p5.js";
    script.async = true;

    document.body.appendChild(script);
    console.log("Added p5");

    return () => {
      document.body.removeChild(script);
      console.log("Removed p5");
    };
  }, []);

  return (
    <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>} >
      <PaperProvider>
        <Context.Provider
          value={{
            simEnvData: simEnvData,
            setSimEnvData: setSimEnvData,
            simEnvUpdate: simEnvUpdate,
            setSimEnvUpdate: setSimEnvUpdate,
            raining: raining,
            setRaining: setRaining,
            rabbitInside: rabbitInside,
            setRabbitInside: setRabbitInside,
            rabbitActivity: rabbitActivity,
            setRabbitActivity: setRabbitActivity,
          }}
        >
          <RabbitSim style={{ width: "100%" }} />
          <View style={styles.container}>
            <View
              style={{
                ...styles.container,
                flexDirection: "row",
                padding: 0,
              }}
            >
              <P5Screen />
              <View
                style={{
                  ...styles.container,
                  gap: 10,
                  justifyContent: "flex-start",
                  height: "100%",
                }}
              >
                <View
                  style={{
                    ...styles.container,
                    flexDirection: "row",
                    margin: 10,
                    gap: 5
                  }}
                >
                  <ColouredBunny h={h} s={s} l={b} />
                  <MicrobitHandler />
                </View>
                <Instructions width="100%" />
                <OLEDText title="Messages" limitTo={10} width="100%" />
              </View>
            </View>
            <Table />
          </View>
        </Context.Provider>
      </PaperProvider>
    </NavigationContainer>
  );
}
