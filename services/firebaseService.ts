
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, getDocs, where, orderBy, limit, enableIndexedDbPersistence } from "firebase/firestore";

// ملاحظة لمحمد: إذا تركت هذه القيم كما هي، سيعمل التطبيق في وضع "أوفلاين" (مجاني تماماً)
// لتفعيل السحابة، ضع مفاتيح مشروعك هنا.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app: any;
let auth: any = null;
let db: any = null;
let isCloudEnabled = false;

try {
  // Only initialize if a real API Key is provided
  const hasKey = firebaseConfig.apiKey && 
                 firebaseConfig.apiKey !== "YOUR_API_KEY" && 
                 firebaseConfig.apiKey.length > 10;
  
  if (hasKey) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isCloudEnabled = true;
    
    if (typeof window !== "undefined") {
      enableIndexedDbPersistence(db).catch(() => console.warn("Persistence failed"));
    }
  } else {
    console.log("MoEco: Running in Local-Sovereign mode (No Firebase keys detected).");
  }
} catch (e) {
  console.error("MoEco: Firebase initialization skipped.", e);
}

export { auth, db, isCloudEnabled };

const safeFirestoreCall = async (callback: any, fallback: any) => {
  if (!isCloudEnabled || !db) return fallback;
  try {
    return await callback();
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      console.warn("Cloud Permission Denied: Using local fallback.");
    }
    return fallback;
  }
};

export const cloudSync = {
  saveUser: async (user: any) => {
    await safeFirestoreCall(() => setDoc(doc(db, "users", user.id), user, { merge: true }), null);
  },

  getUserByEmail: async (email: string) => {
    return await safeFirestoreCall(async () => {
      const q = query(collection(db, "users"), where("email", "==", email), limit(1));
      const snap = await getDocs(q);
      return !snap.empty ? snap.docs[0].data() : null;
    }, null);
  },

  getGlobalStats: async () => {
    const defaultStats = { totalUsers: 1, totalCO2: 0, totalProducts: 0 };
    return await safeFirestoreCall(async () => {
      const usersSnap = await getDocs(collection(db, "users"));
      return { totalUsers: usersSnap.size || 1, totalCO2: 0, totalProducts: 0 };
    }, defaultStats);
  },

  getLeaderboard: async () => {
    return await safeFirestoreCall(async () => {
      const q = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
      const snap = await getDocs(q);
      return snap.docs.map(doc => doc.data());
    }, []);
  },

  saveProduct: async (product: any) => {
    await safeFirestoreCall(() => setDoc(doc(db, "products", product.id), product), null);
  },

  getProducts: async () => {
    return await safeFirestoreCall(async () => {
      const q = query(collection(db, "products"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(doc => doc.data());
    }, []);
  },

  getAppConfig: async () => {
    const def = { maintenance: false, globalMessage: "", valuationFactor: 120 };
    return await safeFirestoreCall(async () => {
      const snap = await getDoc(doc(db, "config", "global"));
      return snap.exists() ? snap.data() : def;
    }, def);
  },

  updateAppConfig: async (config: any) => {
    await safeFirestoreCall(() => setDoc(doc(db, "config", "global"), config), null);
  },

  getChallenges: async () => {
    return await safeFirestoreCall(async () => {
      const q = query(collection(db, "challenges"));
      const snap = await getDocs(q);
      return snap.docs.map(doc => doc.data());
    }, []);
  },

  saveChallenge: async (challenge: any) => {
    await safeFirestoreCall(() => setDoc(doc(db, "challenges", challenge.id), challenge), null);
  }
};
