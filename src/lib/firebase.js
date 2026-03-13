// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDXAA8yB9ZSv9D4jCPtpi0Jr64pWGtedJA",
  authDomain: "iot-81ea9.firebaseapp.com",
  projectId: "iot-81ea9",
  storageBucket: "iot-81ea9.firebasestorage.app",
  messagingSenderId: "629957530411",
  appId: "1:629957530411:web:b1b0aa9a58553f05416b6e",
  measurementId: "G-Y38FYXSJM3"
};

// Khởi tạo Firebase (Tránh lỗi khởi tạo nhiều lần trong Next.js)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Xuất db để mình dùng ở các trang Dashboard
export const db = getFirestore(app);