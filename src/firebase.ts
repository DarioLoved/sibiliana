// =======================================================
// CODICE PER IL NUOVO FILE:  src/firebase.ts
// =======================================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Credenziali che mi hai fornito
const firebaseConfig = {
  apiKey: "AIzaSyB9Bc_qg8MVxmQ9HWDKz1yHk2Qsyk5OVTg",
  authDomain: "contascatti-sibiliana-village.firebaseapp.com",
  projectId: "contascatti-sibiliana-village",
  storageBucket: "contascatti-sibiliana-village.appspot.com", // Ho corretto un piccolo typo qui
  messagingSenderId: "865795737084",
  appId: "1:865795737084:web:a2b4aac044118cebaede79"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };