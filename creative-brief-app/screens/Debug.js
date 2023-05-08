import { useContext } from "react";

import { View } from "react-native";

import { Card, Text } from "react-native-paper";

import { Grid } from "@mui/material";

import {
  equalTo,
  limitToLast,
  orderByChild,
  query,
  ref,
} from "firebase/database";

import { useAuthState } from "react-firebase-hooks/auth";
import { useList } from "react-firebase-hooks/database";

import { Context } from "../Context";
import { auth, database } from "../Firebase";
import { styles } from "../Styles";
import {
  getTimeFromMinutes,
  seasons,
  secondsAgo,
} from "../helper_functions/dateAndTime";
import { GetValKey, groupIds } from "../helper_functions/groupIds";

export default function DebugScreen() {
  const [user, authLoading, authError] = useAuthState(auth);
  const { simEnvData, raining, rabbitInside, rabbitActivity } =
    useContext(Context);

  return (
    <View style={styles.container}>
      <Grid container columns={8} spacing={2} style={styles.container}>
        {/* Rabbit sim */}
        <Grid item sm={8} lg={4}>
          <Card>
            <Card.Title title={"Rabbit Sim"} />
            <Card.Content>
              {Object.keys(simEnvData)
                .map((key, i) => {
                  let value = simEnvData[key].value ?? "";
                  if (key == "time") {
                    value = getTimeFromMinutes(value);
                  } else if (key == "temp") {
                    value = value + "°C";
                  } else if (key == "season") {
                    value = seasons[value];
                  }

                  return (
                    <Text key={i}>
                      {`${key}:` + `\t${key.length < 12 ? "\t\t" : ""}` + value}
                    </Text>
                  );
                })
                .reverse()}
              <Text>{`raining:\t\t\t${raining}`}</Text>
              <Text>{`rabbitInside:\t\t${rabbitInside}`}</Text>
              <Text>{`rabbitActivity:\t\t${rabbitActivity}`}</Text>
            </Card.Content>
          </Card>
        </Grid>

        {/* IoT devices */}
        {Object.keys(groupIds).map((key, i) => {
          const [snapshots, loading, error] = useList(
            user
              ? query(
                  ref(database, "data"),
                  orderByChild("groupId"),
                  equalTo(groupIds[key]),
                  limitToLast(key == "OLEDText" ? 10 : 5)
                )
              : null
          );
          if (snapshots) {
            return (
              <Grid
                item
                sm={8}
                md={key == "OLEDText" ? 8 : 4}
                lg={key == "OLEDText" ? 4 : 2}
                key={i}
              >
                <Card>
                  <Card.Title title={key} />
                  <Card.Content>
                    {snapshots
                      .map((el, i) => {
                        return (
                          <Text key={i}>
                            {secondsAgo(el?.val()?.timestamp ?? Date.now()) +
                              "  " +
                              el?.val()[GetValKey(el)] ?? ""}
                          </Text>
                        );
                      })
                      .reverse()}
                  </Card.Content>
                </Card>
              </Grid>
            );
          } else {
            return null;
          }
        })}
      </Grid>
    </View>
  );
}
