import { Button } from "react-native-paper";

export default ({h, s, l}) => {
  return (
    <Button
      icon="rabbit"
      disabled={true}
      labelStyle={{ color: `hsl(${h}, ${s}%, ${l}%)`, fontSize: 35 }}
    />
  );
};
