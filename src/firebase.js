import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDw3Q2-A5uiSMRywzOn8bYZ3s9nA7r7BEQ",
    authDomain: "laims-bakery-and-pastry.firebaseapp.com",
    databaseURL: "https://laims-bakery-and-pastry-default-rtdb.firebaseio.com",
    projectId: "laims-bakery-and-pastry",
    storageBucket: "laims-bakery-and-pastry.firebasestorage.app",
    messagingSenderId: "488480581743",
    appId: "1:488480581743:web:abb03d755fdc33469e059a",
    measurementId: "G-PSYLBK48MN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };