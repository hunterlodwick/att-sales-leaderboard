/* ============================================================
   firebase-config.js — Firebase Firestore Integration
   Uses the Keystone OS Firebase project for persistent storage.
   localStorage serves as offline fallback/cache.
   ============================================================ */

const FirebaseDB = (() => {
  const COLLECTION = 'att_sales_deals';
  let db = null;
  let isReady = false;
  let unsubscribe = null;
  let onChangeCallback = null;

  // Initialize Firebase — called after SDK scripts load
  function init() {
    try {
      const firebaseConfig = {
        apiKey: "REDACTED_FIREBASE_KEY",
        authDomain: "keystone-os-77666.firebaseapp.com",
        projectId: "keystone-os-77666",
        storageBucket: "keystone-os-77666.firebasestorage.app",
        messagingSenderId: "515055414694",
        appId: "1:515055414694:web:9ecb99ab67d548c896b367"
      };

      // Check if already initialized
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      db = firebase.firestore();
      isReady = true;
      console.log('[Firebase] Firestore connected');
      return true;
    } catch (error) {
      console.error('[Firebase] Init failed:', error.message);
      isReady = false;
      return false;
    }
  }

  // ---- CRUD Operations ----

  async function saveDeal(deal) {
    if (!isReady || !db) return false;
    try {
      await db.collection(COLLECTION).doc(deal.id).set(deal, { merge: true });
      return true;
    } catch (error) {
      console.error('[Firebase] Save failed:', error.message);
      return false;
    }
  }

  async function updateDeal(id, updates) {
    if (!isReady || !db) return false;
    try {
      await db.collection(COLLECTION).doc(id).update({
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('[Firebase] Update failed:', error.message);
      return false;
    }
  }

  async function deleteDeal(id) {
    if (!isReady || !db) return false;
    try {
      await db.collection(COLLECTION).doc(id).delete();
      return true;
    } catch (error) {
      console.error('[Firebase] Delete failed:', error.message);
      return false;
    }
  }

  async function loadAll() {
    if (!isReady || !db) return null;
    try {
      const snapshot = await db.collection(COLLECTION).get();
      const deals = [];
      snapshot.forEach(doc => {
        deals.push(doc.data());
      });
      // Sort newest first by createdAt
      deals.sort((a, b) => {
        const da = new Date(b.createdAt || 0);
        const db2 = new Date(a.createdAt || 0);
        return da - db2;
      });
      console.log(`[Firebase] Loaded ${deals.length} deals`);
      return deals;
    } catch (error) {
      console.error('[Firebase] Load failed:', error.message);
      return null;
    }
  }

  // ---- Real-time Listener ----
  function listen(onChange) {
    if (!isReady || !db) return null;

    // Clean up existing listener
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    onChangeCallback = onChange;

    try {
      unsubscribe = db.collection(COLLECTION).onSnapshot(snapshot => {
        const deals = [];
        snapshot.forEach(doc => deals.push(doc.data()));
        deals.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        if (onChangeCallback) onChangeCallback(deals);
      }, error => {
        console.warn('[Firebase] Listener error:', error.message);
      });

      console.log('[Firebase] Real-time sync active');
      return unsubscribe;
    } catch (error) {
      console.error('[Firebase] Listener setup failed:', error.message);
      return null;
    }
  }

  function stopListening() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  // ---- Migration ----
  // Migrate localStorage data to Firestore (one-time)
  async function migrateFromLocalStorage(localDeals) {
    if (!isReady || !db || !localDeals || localDeals.length === 0) return 0;

    let migrated = 0;
    const batch = db.batch();

    for (const deal of localDeals) {
      if (!deal.id) continue;
      const docRef = db.collection(COLLECTION).doc(deal.id);
      batch.set(docRef, deal, { merge: true });
      migrated++;
    }

    try {
      await batch.commit();
      console.log(`[Firebase] Migrated ${migrated} deals from localStorage`);
      return migrated;
    } catch (error) {
      console.error('[Firebase] Migration failed:', error.message);
      return 0;
    }
  }

  return {
    init,
    saveDeal,
    updateDeal,
    deleteDeal,
    loadAll,
    listen,
    stopListening,
    migrateFromLocalStorage,
    get isReady() { return isReady; }
  };
})();

window.FirebaseDB = FirebaseDB;
