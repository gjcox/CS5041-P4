import { Card, Text } from "react-native-paper";

import {
  equalTo,
  limitToLast,
  orderByChild,
  query,
  ref,
} from "firebase/database";

import { useAuthState } from "react-firebase-hooks/auth";
import { useList } from "react-firebase-hooks/database";

import { auth, database } from "../Firebase";
import { secondsAgo } from "../helper_functions/dateAndTime";
import { GetValKey, groupIDs } from "../helper_functions/groupIDs";

export default function OLEDText({ title, limitTo }) {
  const [user, authLoading, authError] = useAuthState(auth);

  const [snapshots, loading, error] = useList(
    user
      ? query(
          ref(database, "data"),
          orderByChild("groupId"),
          equalTo(groupIDs["OLEDText"]),
          limitToLast(limitTo)
        )
      : null
  );

  return (
    <Card>
      <Card.Title title={title} />
      <Card.Content>
        {snapshots
          .map((el, i) => {
            return (
              <Text key={i}>
                {secondsAgo(el?.val()?.timestamp ?? Date.now()) +
                  "  " +
                  el?.val()[GetValKey(el)] ?? ""}
              </Text>
            );
          })
          .reverse()}
      </Card.Content>
    </Card>
  );
}
