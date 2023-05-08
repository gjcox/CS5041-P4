import { Checkbox, DataTable } from "react-native-paper";

import { useContext, useEffect, useState } from "react";

import { Grid } from "@mui/material";

import { Context } from "../Context";
import { getTimeFromMinutes, seasons } from "../helper_functions/dateAndTime";

const propsFromFeature = {
  temp: { label: "Temperature", range: [0, 20] },
  humidity: { label: "Outdoor Humidity", range: [0, 100] },
  time: { label: "Time", range: [0, 1440] },
  season: { label: "Season", range: [0, 3] },
  visitor: { label: "Visitor", range: [0, 1] },
  randomChoice: { label: "Random Choice", range: [0, 100] },
  rain: { label: "Raining", range: [0, 1] },
};

export default function TableRow({ feature }) {
  const props = propsFromFeature[feature];
  const { simEnvData, setSimEnvData, simEnvUpdate, setSimEnvUpdate } =
    useContext(Context);
  const [sliderVal, setSliderVal] = useState(0);

  useEffect(() => {
    setSliderVal(+simEnvData[feature].value);
  }, []);

  useEffect(() => {
    if (!simEnvUpdate[feature]) {
      setSliderVal(+simEnvData[feature].value);
    }
  }, [simEnvData]);

  function toggleUpdateFromDisplay() {
    console.log(
      `toggleUpdateFromDisplay: ${feature}=${!simEnvUpdate[feature]}`
    );
    setSimEnvUpdate({
      ...simEnvUpdate,
      [feature]: !simEnvUpdate[feature],
    });
  }

  function setSimValue() {
    let newValue = feature != "visitor" ? +sliderVal : sliderVal == 1;
    console.log(`setSimValue: ${feature}=${newValue}`);
    setSimEnvData({
      ...simEnvData,
      [feature]: { ...simEnvData[feature], value: newValue },
    });
    console.log(
      `simEnvData[${feature}].value = ${newValue} (${typeof newValue})`
    );
  }

  function formatValue(val) {
    switch (feature) {
      case "time":
        return getTimeFromMinutes(val);
      case "visitor":
        return (val == 1).toString();
      case "temp":
        return val + "°C";
      case "season":
        return seasons[val];
      case "humidity":
        return val + "%";
      default:
        return val;
    }
  }

  return (
    <DataTable.Row
      // empty onPress allows children to be clickable
      onPress={() => {
        return;
      }}
    >
      {/* DataTable.Cell components cannot be clickable (a bug),
        hence using a Grid as a pseudo-row */}
      <Grid container columns={4} alignItems="center">
        <Grid item sm={1}>
          {props.label}
        </Grid>
        <Grid item sm={1}>
          {formatValue(simEnvData[feature].value)}
        </Grid>
        <Grid item sm={1}>
          <Checkbox
            status={!simEnvUpdate[feature] ? "checked" : "unchecked"}
            onPress={toggleUpdateFromDisplay}
          />
        </Grid>
        <Grid item sm={1}>
          {formatValue(props.range[0])}
          <input
            type="range"
            disabled={simEnvUpdate[feature]}
            min={props.range[0]}
            max={props.range[1]}
            value={sliderVal}
            onChange={({ target: { value: newValue } }) => {
              setSliderVal(newValue);
            }}
            onMouseUp={setSimValue}
          />
          {formatValue(props.range[1])}
        </Grid>
      </Grid>
    </DataTable.Row>
  );
}
