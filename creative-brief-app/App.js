import { ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';

import { Provider as PaperProvider, TextInput } from 'react-native-paper';
import { Button } from 'react-native-paper';

import { StatusBar } from 'expo-status-bar';

import { SafeAreaView } from 'react-native-safe-area-context';

import { signInWithCustomToken } from "firebase/auth";
import { ref, push, serverTimestamp, query, orderByChild, equalTo, limitToLast } from "firebase/database";
import { httpsCallable } from 'firebase/functions';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useList } from 'react-firebase-hooks/database';

import { CardComponent } from './components/CardComponent';
import { database, auth, functions, firebaseToken } from './Firebase';

const Group20Input = ({ user }) => {

  const [text, setText] = useState("");

  return (
    <View style={{ display: 'flex', flexDirection: 'row' }}>
      <TextInput style={{ margin: 10 }}
        label="Message"
        value={text}
        onChangeText={text => setText(text)}
      ></TextInput>
      <Button style={{ margin: 10, alignSelf: "center" }} icon="send" onPress={() => {
        push(ref(database, "data"), {
          userId: user.uid,
          groupId: 20,
          timestamp: serverTimestamp(),
          type: "str",
          string: text.toString()
        });
      }}>
        post
      </Button>
    </View>
  )
}

const Messages = (props) => {
  return (
    <ScrollView style={{ margin: 10 }}>
      {props.messages.map((el, i) =>
        <CardComponent key={i} message={el} iMax={props.messages.length} i={i}></CardComponent>
      )}
    </ScrollView>
  )
}

const ColoredBunny = (props) => {
  /* This function is taken from https://stackoverflow.com/a/44134328 by icl7126. Accessed 02/05/2023. */
  function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
  /* End of taken code. */

  const hue = props.hueSnapshots[0]?.val().integer ?? 0
  const sat = props.satSnapshots[0]?.val().integer ?? 0
  const bri = props.briSnapshots[0]?.val().integer ?? 0
  return (
    <Button icon="rabbit" disabled={true} labelStyle={{ color: hslToHex(hue, sat, bri) }} />)
}

const GetValKey = (snapshot) => (
  snapshot.val().type == "str" ? "string" : "integer"
)

export default function App() {

  const [user, authLoading, authError] = useAuthState(auth);

  useEffect(() => {
    (async () => {
      const getToken = httpsCallable(functions, "getToken");
      const token = await getToken({ token: firebaseToken });
      if (token?.data?.result === "ok" && token?.data?.token) {
        signInWithCustomToken(auth, token.data.token);
      } else {
        console.error(token?.data?.reason ?? "unknownError")
      }
    })();
  }, []);

  const [oledSnapshots, oledLoading, oledError] = useList(user ? query(ref(database, 'data'), orderByChild('groupId'), equalTo(20), limitToLast(5)) : null);
  const [insideSnapshots, insideLoading, insideError] = useList(user ? query(ref(database, 'data'), orderByChild('groupId'), equalTo(2), limitToLast(5)) : null);
  const [hueSnapshots, hueLoading, hueError] = useList(user ? query(ref(database, 'data'), orderByChild('groupId'), equalTo(21), limitToLast(1)) : null);
  const [satSnapshots, satLoading, satError] = useList(user ? query(ref(database, 'data'), orderByChild('groupId'), equalTo(22), limitToLast(1)) : null);
  const [briSnapshots, briLoading, briError] = useList(user ? query(ref(database, 'data'), orderByChild('groupId'), equalTo(23), limitToLast(1)) : null);

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <Group20Input user={user}></Group20Input>
        {/* {oledSnapshots ?
          <Messages messages={oledSnapshots.map(el => el?.val()[GetValKey(el)] ?? '')}></Messages>
          : null}
        {insideSnapshots ?
          <Messages messages={insideSnapshots.map(el => el?.val()[GetValKey(el)] ?? '')}></Messages>
          : null} */}
        {hueSnapshots && satSnapshots && briSnapshots ?
          <ColoredBunny hueSnapshots={hueSnapshots} satSnapshots={satSnapshots} briSnapshots={briSnapshots} />
          : null}
        <StatusBar style="auto" />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});