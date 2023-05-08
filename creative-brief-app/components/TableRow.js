import { Button, Checkbox, DataTable } from "react-native-paper";

import { TouchableOpacity } from "react-native-gesture-handler";

import { useContext } from "react";

import { Context } from "../Context";

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
  let props = propsFromFeature[feature];
  const {
    simEnvData,
    setSimEnvData,
    updateSimValue,
    raining,
    rabbitInside,
    rabbitActivity,
  } = useContext(Context);

  function toggleUpdateFromDisplay() {
    console.log(!simEnvData[feature].updateFromDisplay);
    setSimEnvData({
      ...simEnvData,
      [feature]: {
        ...simEnvData[feature],
        updateFromDisplay: !simEnvData[feature].updateFromDisplay,
      },
    });
  }

  return (
    <DataTable.Row onPress={toggleUpdateFromDisplay}>
      <DataTable.Cell>{props.label}</DataTable.Cell>
      <DataTable.Cell>{simEnvData[feature].value.toString()}</DataTable.Cell>
      <DataTable.Cell>
        <Checkbox
          status={
            simEnvData[feature].updateFromDisplay ? "checked" : "unchecked"
          }
        />
      </DataTable.Cell>
      <DataTable.Cell>
        <input type="range" min={props.range[0]} max={props.range[1]} />
      </DataTable.Cell>
    </DataTable.Row>
  );
}
