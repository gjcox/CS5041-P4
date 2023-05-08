export const groupIds = {
  OLEDText: 20,
  LightHue: 21,
  LightSaturation: 22,
  LightBrightness: 23,
  Button1: 5,
  Button2: 6,
  Button3: 7,
  OutsideTemperature: 1,
  InsideTemperature: 2,
  OutsideHumidity: 11,
  InsideHumidity: 12,
  Motion1: 3,
  Motion2: 4,
  GreyRabbitContact: 8,
  WhiteRabbitContact: 9,
};

export const GetValKey = (snapshot) =>
  snapshot.val().type == "str" ? "string" : "integer";
