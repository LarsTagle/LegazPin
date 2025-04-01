// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOwUWVZ_cA9fSGiudQiXHv2uN0mq1a_OE",
  authDomain: "legazpin-8bb24.firebaseapp.com",
  projectId: "legazpin-8bb24",
  storageBucket: "legazpin-8bb24.firebasestorage.app",
  messagingSenderId: "285790615822",
  appId: "1:285790615822:web:7a65b30ce40b2b567cff5f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
