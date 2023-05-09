import { Avatar } from "react-native-paper";

export default ({ h, s, l }) => {
  return <Avatar.Icon icon="rabbit" color={`hsl(${h}, ${s}%, ${l}%)`} />;
};
