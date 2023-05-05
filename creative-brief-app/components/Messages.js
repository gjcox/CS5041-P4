import { ScrollView } from "react-native";
import { CardComponent } from "./CardComponent";

const Messages = (props) => {
  return (
    <ScrollView style={{ margin: 10 }}>
      {props.messages.map((el, i) => (
        <CardComponent
          key={i}
          message={el}
          iMax={props.messages.length}
          i={i}
        ></CardComponent>
      ))}
    </ScrollView>
  );
};
