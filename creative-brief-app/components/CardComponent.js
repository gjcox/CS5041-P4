import { Card } from "react-native-paper";

function LoggedNull({ i, iMax }) {
  console.log(`CardComponent was passed empty message. i=${i} iMax=${iMax}.`);
  return null;
}

export const CardComponent = ({ message, i, iMax }) => {
  if (message != "") {
    return (
      <Card
        style={{
          marginLeft: 10,
          marginRight: 10,
          marginTop: i === 0 ? 0 : 10,
          marginBottom: i === iMax ? 0 : 10,
        }}
      >
        <Card.Title title={message} />
      </Card>
    );
  } else {
    return <LoggedNull i={i} iMax={iMax} />;
  }
};
