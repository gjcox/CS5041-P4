import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabNavigator from "./TabNavigator";
import DebugScreen from "../screens/Debug";
import P5Screen from "../screens/P5Screen";
import { styles } from "../Styles";
import { View } from "react-native";
import { Tabs } from "./TabNavigator";

/** Create a stack navigator */
const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <View style={styles.containerBlack}>
      {/*Stack navigator*/}
      <Stack.Navigator>
        <Stack.Screen
          name={Tabs.p5}
          component={P5Screen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={Tabs.debug}
          component={DebugScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </View>
  );
}
