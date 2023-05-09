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
import { GetValKey, groupIds } from "../helper_functions/groupIds";

export default function OLEDText({
  title = "Messages",
  limitTo = 5,
  width = "auto",
}) {
  const [user, authLoading, authError] = useAuthState(auth);

  const [snapshots, loading, error] = useList(
    user
      ? query(
          ref(database, "data"),
          orderByChild("groupId"),
          equalTo(groupIds.OLEDText),
          limitToLast(limitTo)
        )
      : null
  );

  return (
    <Card
      style={{
        width: width,
        minWidth: width,
      }}
    >
      <Card.Title title={title} />
      <Card.Content>
        {snapshots ? (
          snapshots
            .map((el, i) => {
              return (
                <Text key={i}>
                  {secondsAgo(el?.val()?.timestamp ?? Date.now()) +
                    "  " +
                    el?.val()[GetValKey(el)] ?? ""}
                </Text>
              );
            })
            .reverse()
        ) : (
          <Text>"Loading..."</Text>
        )}
      </Card.Content>
    </Card>
  );
}
