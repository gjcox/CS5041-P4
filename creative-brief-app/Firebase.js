import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDBjUEw_DQNMQsZJWfTtLL0PQJoH-xF0kk",
  authDomain: "sta-cs5041.firebaseapp.com",
  databaseURL: "https://sta-cs5041-p4.firebaseio.com",
  projectId: "sta-cs5041",
  storageBucket: "sta-cs5041.appspot.com",
  messagingSenderId: "639987847762",
  appId: "1:639987847762:web:c5a35616a1aa1cf243458b",
};
export const firebaseToken = "51c494eb-8642-45b7-8c6a-04839e9a62ea";
const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const database = getDatabase(firebaseApp);
export const functions = getFunctions(firebaseApp);
