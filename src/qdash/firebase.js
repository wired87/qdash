import { useCallback, useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onChildChanged, onChildAdded, off, onValue, push, set, get, query, limitToLast } from "firebase/database";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getNodeColor } from "./get_color";

export function useFirebaseListeners(
  fbCreds,
  updateEnv,
  setMessages
) {
  const [fbIsConnected, setFbIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const firebaseApp = useRef(null);
  const firebaseDb = useRef(null);
  const firebaseAuth = useRef(null);
  const firebaseFirestore = useRef(null);
  const firebaseFunctions = useRef(null);
  const listenerRefs = useRef([]);

  // --- Firebase Init ---
  useEffect(() => {
    if (!fbIsConnected && fbCreds) {
      try {
        firebaseApp.current = initializeApp({
          credential: fbCreds.creds, // Ensure this contains apiKey, authDomain etc.
          databaseURL: fbCreds.db_path,
          apiKey: fbCreds.creds.apiKey, // Explicitly mapping if needed, though initializeApp handles object
          authDomain: fbCreds.creds.authDomain,
          projectId: fbCreds.creds.projectId,
          storageBucket: fbCreds.creds.storageBucket,
          messagingSenderId: fbCreds.creds.messagingSenderId,
          appId: fbCreds.creds.appId
        });
        firebaseDb.current = getDatabase(firebaseApp.current);
        firebaseAuth.current = getAuth(firebaseApp.current);
        firebaseFirestore.current = getFirestore(firebaseApp.current);
        firebaseFunctions.current = getFunctions(firebaseApp.current);

        setFbIsConnected(true);
      } catch (e) {
        console.error("Firebase Init Error:", e);
        setFbIsConnected(false);
      }
    }
  }, [fbCreds, fbIsConnected]);

  // --- Auth Listener ---
  useEffect(() => {
    if (fbIsConnected && firebaseAuth.current) {
      const unsubscribe = onAuthStateChanged(firebaseAuth.current, (currentUser) => {
        setUser(currentUser);
      });
      return () => unsubscribe();
    }
  }, [fbIsConnected]);

  // --- User Profile Listener ---
  useEffect(() => {
    let unsubscribeDoc = () => { };

    if (fbIsConnected && user && firebaseFirestore.current) {
      const userRef = doc(firebaseFirestore.current, "users", user.uid);
      unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      });
    } else {
      setUserProfile(null);
    }

    return () => unsubscribeDoc();
  }, [fbIsConnected, user]);



  const signUpWithEmail = async (email, password) => {
    if (!firebaseAuth.current) return;
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(firebaseAuth.current, email, password);
    } catch (error) {
      console.error("Error signing up with email", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email, password) => {
    if (!firebaseAuth.current) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth.current, email, password);
    } catch (error) {
      console.error("Error signing in with email", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!firebaseAuth.current) return;
    try {
      await signOut(firebaseAuth.current);
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  };

  // --- Handle Data Changes ---
  const handleDataChange = useCallback(
    (
      snapshot,
      env_id,
      listener_type,
    ) => {
      const changedData = snapshot.val();
      const nodeId = snapshot.key;

      if (!changedData) return;
      updateEnv(
        listener_type,
        env_id,
        { id: nodeId, ...changedData }
      )
    },
    []
  );

  const handleStatusChange = useCallback(
    (snapshot, env_id) => {
      const status = snapshot.val();
      if (status) {
        updateEnv("status", env_id, status);
      }
    },
    [updateEnv]
  );

  const handleLogChange = useCallback(
    (snapshot, env_id) => {
      const logs = snapshot.val();
      if (logs) {
        updateEnv("logs", env_id, logs);
      }
    },
    [updateEnv]
  );

  // --- Message Handling ---
  const messagesRef = firebaseDb.current ? ref(firebaseDb.current, 'messages') : null;

  const saveMessage = async (message) => {
    if (!messagesRef) return;
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, message);
  };

  useEffect(() => {
    if (!messagesRef) return;

    // Use onChildAdded to listen for new messages (and existing ones initially)
    // We use a query to limit to the last 100 messages to avoid loading too much history
    const recentMessagesQuery = query(messagesRef, limitToLast(100));

    const unsubscribe = onChildAdded(recentMessagesQuery, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates (though onChildAdded shouldn't fire duplicates for the same listener)
          // But since we use strict mode in React dev, it might fire twice.
          // A simple check:
          if (prev.some(msg => msg.timestamp === val.timestamp && msg.text === val.text)) {
            return prev;
          }
          return [...prev, val];
        });
      }
    });

    return () => {
      // Unsubscribe logic depends on SDK version, but usually returning the unsubscribe function works if onChildAdded returns it.
      // In modular SDK, onChildAdded returns Unsubscribe.
      unsubscribe();
    };
  }, [messagesRef, setMessages]);


  useEffect(() => {
    if (fbIsConnected && fbCreds && firebaseDb.current) {
      // Alte Listener entfernen
      listenerRefs.current.forEach(({ refObj, callback }) =>
        off(refObj, "child_changed", callback)
      );
      listenerRefs.current = [];

      Object.entries(fbCreds.listener_paths).forEach(([env_id, struct]) => {
        Object.entries(struct).forEach(([listener_type, all_paths]) => {
          if (listener_type === 'status') {
            const dbRef = ref(firebaseDb.current, all_paths);
            const _callback = (snapshot) => handleStatusChange(snapshot, env_id);
            onValue(dbRef, _callback);
            listenerRefs.current.push({ refObj: dbRef, callback: _callback });
          } else if (listener_type === 'logs') {
            const dbRef = ref(firebaseDb.current, all_paths);
            const _callback = (snapshot) => handleLogChange(snapshot, env_id);
            onValue(dbRef, _callback);
            listenerRefs.current.push({ refObj: dbRef, callback: _callback });
          }
          else {
            all_paths.forEach((path) => {
              const dbRef = ref(firebaseDb.current, path);

              const _callback = (snapshot) =>
                handleDataChange(
                  snapshot,
                  env_id,
                  listener_type // meta, edge || node
                );

              onChildChanged(dbRef, _callback);
              listenerRefs.current.push({ refObj: dbRef, callback: _callback });
            });
          }
        });
      });
    }
    return () => {
      listenerRefs.current.forEach(({ refObj, callback }) =>
        off(refObj, "value", callback)
      );
      listenerRefs.current.forEach(({ refObj, callback }) =>
        off(refObj, "child_changed", callback)
      );
    };
  }, [fbIsConnected, fbCreds, firebaseDb, handleDataChange, handleStatusChange, handleLogChange]);

  // --- User Config Persistence (RTDB) ---
  const saveUserWorldConfig = async (uid, config) => {
    if (!firebaseDb.current || !uid) return;
    try {
      const configRef = ref(firebaseDb.current, `users/${uid}/worldConfig`);
      await set(configRef, config);
      console.log("User config saved to Firebase");
    } catch (error) {
      console.error("Error saving user config:", error);
      throw error;
    }
  };

  const listenToUserWorldConfig = useCallback((uid, onConfigUpdate) => {
    if (!firebaseDb.current || !uid) return () => { };

    const configRef = ref(firebaseDb.current, `users/${uid}/worldConfig`);
    const unsubscribe = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        onConfigUpdate(data);
      }
    });

    return unsubscribe;
  }, [firebaseDb]);

  const updateUser = async (uid, data) => {
    if (!firebaseFirestore.current || !uid) return;
    const userRef = doc(firebaseFirestore.current, "users", uid);
    await setDoc(userRef, data, { merge: true });
  };

  const getPaymentUrl = async (plan, compute_hours) => {
    if (!firebaseFunctions.current) throw new Error("Functions not initialized");
    const fn = httpsCallable(firebaseFunctions.current, 'get_payment_url');
    // Default to 'magician' plan and 10 hours if not specified
    const res = await fn({ plan: plan || 'magician', compute_hours: compute_hours || 10 });
    return res.data.url;
  };

  return {
    fbIsConnected,
    firebaseDb,
    saveMessage,
    user,
    userProfile,
    loading,
    error,

    signInWithEmail,
    signUpWithEmail,
    logout,
    saveUserWorldConfig,
    listenToUserWorldConfig,
    updateUser,
    getPaymentUrl
  };
}
