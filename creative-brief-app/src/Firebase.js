import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyB95yyCPBcRytswEjweBc-r8BR98KdqvDA",
  authDomain: "interactive-rabbit-sim.firebaseapp.com",
  projectId: "interactive-rabbit-sim",
  storageBucket: "interactive-rabbit-sim.appspot.com",
  messagingSenderId: "114253338890",
  appId: "1:114253338890:web:5d2216f635fcda5ede02f3",
  measurementId: "G-WS249Z51XZ",
  databaseURL: "https://interactive-rabbit-sim-default-rtdb.europe-west1.firebasedatabase.app/"
};

export const firebaseToken = "51c494eb-8642-45b7-8c6a-04839e9a62ea";
const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const database = getDatabase(firebaseApp);
export const functions = getFunctions(firebaseApp);
