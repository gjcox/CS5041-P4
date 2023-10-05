import { Card, Text } from "react-native-paper";

export default function Instructions({ width = "auto" }) {
  return (
    <Card
      style={{
        width: width,
        minWidth: width,
      }}
    >
      <Card.Title title="Welcome to the Goldfish Bowl Museum's remote rabbit exhibit!" />
      <Card.Content>
        <Text>
          <p>
            The local and remote exhibit interactions affect the environment
            that our simulated rabbit finds themself in. You can change the
            environment by:
          </p>
          <ul>
            <li>Interacting with the local exhibit</li>
            <li>Setting values with the sliders below</li>
            <li>Pressing buttons on and shaking a connected BBC micro:bit</li>
          </ul>
          <p>Try changing the environment to learn about how bunnies act!</p>
        </Text>
      </Card.Content>
    </Card>
  );
}
