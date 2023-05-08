import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { IconButton } from "react-native-paper";

import Debug from "../screens/Debug";
import P5Screen from "../screens/P5Screen";

export const Tabs = {
  expo: "Expo Interface",
  p5: "P5 Interface",
  debug: "Debug Interface",
};

// Create the Tab Navigator component
const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    // Tab navigator
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          // Change the icon based on the route
          if (route.name === Tabs.expo) {
            iconName = focused ? "text-box" : "text-box-outline";
          } else if (route.name === Tabs.p5) {
            iconName = "rabbit";
          } else if (route.name === Tabs.debug) {
            iconName = focused ? "check-network" : "check-network-outline";
          }

          return <IconButton icon={iconName} size={size} iconColor={color} />;
        },
        tabBarScrollEnabled: true,
        tabBarItemStyle: { width: "auto", minWidth: "100%" },
      })}
    >
      {/* <Tab.Screen name={Tabs.debug} component={Debug} /> */}
      <Tab.Screen name={Tabs.p5} component={P5Screen} />
    </Tab.Navigator>
  );
}
