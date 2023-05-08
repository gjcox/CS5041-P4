import { useState } from "react";
import { View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { push, ref, serverTimestamp } from "firebase/database";
import { database } from "../Firebase";

export const Group20Input = ({ user }) => {
  const [text, setText] = useState("");

  return (
    <View style={{ display: "flex", flexDirection: "row" }}>
      <TextInput
        style={{ margin: 10 }}
        label="Message"
        value={text}
        onChangeText={(text) => setText(text)}
      ></TextInput>
      <Button
        style={{ margin: 10, alignSelf: "center" }}
        icon="send"
        onPress={() => {
          push(ref(database, "data"), {
            userId: user.uid,
            groupId: 20,
            timestamp: serverTimestamp(),
            type: "str",
            string: text.toString(),
          });
        }}
      >
        post
      </Button>
    </View>
  );
};
