"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyBMNy4VpUo3LTjHrAnrawjLVdSgYV-hqo0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "oson-menu.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "oson-menu",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "oson-menu.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "126634447714",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:126634447714:web:5efd8f25784d8aed49123b",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-9K6C5T5K5W",
};

let cachedAuth: Auth | null = null;
let cachedAnalytics: Analytics | null = null;
let cachedStorage: FirebaseStorage | null = null;

function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  if (cachedAuth) {
    return cachedAuth;
  }

  if (typeof window === "undefined") {
    throw new Error("Firebase auth can only be used in browser runtime.");
  }

  if (!firebaseConfig.apiKey) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY.");
  }

  cachedAuth = getAuth(getFirebaseApp());
  return cachedAuth;
}

export async function getFirebaseAnalytics() {
  if (cachedAnalytics) {
    return cachedAnalytics;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const supported = await isSupported();
  if (!supported) {
    return null;
  }

  cachedAnalytics = getAnalytics(getFirebaseApp());
  return cachedAnalytics;
}

export function getFirebaseStorage() {
  if (cachedStorage) {
    return cachedStorage;
  }

  if (typeof window === "undefined") {
    throw new Error("Firebase storage can only be used in browser runtime.");
  }

  cachedStorage = getStorage(getFirebaseApp());
  return cachedStorage;
}
