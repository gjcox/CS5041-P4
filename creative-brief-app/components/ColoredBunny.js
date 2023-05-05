import { Button } from "react-native-paper";

export const ColoredBunny = (props) => {
  /* This function is taken from https://stackoverflow.com/a/44134328 by icl7126. Accessed 02/05/2023. */
  function hslToHex(h, s, l) {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0"); // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
  /* End of taken code. */
  const hue = props.hueSnapshots[0]?.val().integer ?? 0;
  const sat = props.satSnapshots[0]?.val().integer ?? 0;
  const bri = props.briSnapshots[0]?.val().integer ?? 0;
  return (
    <Button
      icon="rabbit"
      disabled={true}
      labelStyle={{ color: hslToHex(hue, sat, bri) }}
    />
  );
};
