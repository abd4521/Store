const firebaseConfig = {
    apiKey: "AIzaSyDjbEkfu8fJmPTDQ8xksGehPday9lrcSrg",
    authDomain: "abdullah-bb8ab.firebaseapp.com",
    projectId: "abdullah-bb8ab",
    storageBucket: "abdullah-bb8ab.appspot.com",
    messagingSenderId: "286504008164",
    appId: "1:286504008164:web:8642bc9d56f36393052ff1"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();
  const storage = firebase.storage();

  // Global variables
  let currentUser = null;
  let salesChart = null;
  let revenueChart = null;
  let salesReportChart = null;
  let productReportChart = null;
  let customerReportChart = null;
  let inventoryReportChart = null;
  let selectedOrderId = null;
  let selectedProductId = null;
  let selectedCustomerId = null;
  let selectedDiscountId = null;
  let confirmCallback = null;

  // DOM Ready
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI components
    initMenuToggles();
    initImageUploads();
    initBulkUpdateType();
    initCharts();
    
    // Check authentication state
    checkAuthState();
  });
  // Check authentication state
auth.onAuthStateChanged(async (user) => {
if(!user){
window.loaction.href='login.html';
}

if (user) {
// Verify admin status
const adminDoc = await db.collection('admins').doc(user.uid).get();
if(adminDoc.exists){
  setupAdminUI();
            loadDashboardStats();
            loadRecentOrders();
            loadLowStockItems();
}
if (!adminDoc.exists) {
  // Not an admin - redirect to login
  window.location.href = 'login.html';
}
// Else continue loading the dashboard
} else {
// Not logged in - redirect to login
window.location.href = 'login.html';
}
});