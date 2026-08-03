// ============================================================
// BODORO - Configuration Firebase
// ============================================================

const firebaseConfig = {
  apiKey:            "AIzaSyBkoefGJhiWFh5eHEwA4gnlsU5mOUoIM7I",
  authDomain:        "bodoro-menu.firebaseapp.com",
  projectId:         "bodoro-menu",
  storageBucket:     "bodoro-menu.firebasestorage.app",
  messagingSenderId: "766107406239",
  appId:             "1:766107406239:web:8d768e00dfd8f7885577aa"
};

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();

// Collections Firestore
const FS = {
  config:       () => firestore.collection('config').doc('restaurant'),
  categories:   () => firestore.collection('categories'),
  items:        () => firestore.collection('items'),
  orders:       () => firestore.collection('orders'),
  promotions:   () => firestore.collection('promotions'),
  testimonials: () => firestore.collection('testimonials'),
};
