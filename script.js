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
  const auth = firebase.auth();
  const db = firebase.firestore();

  // App State
  let cart = {};
  let wishlist = [];
  let darkMode = false;
  let currentUser = null;
  let appliedCoupon = null;
  let products = [];
  let orders = [];

  // Valid Coupons
 
  // Load Coupons from Firestore
// Load Coupons from Firestore
async function loadCoupons() {
  try {
    console.log("Fetching coupons from Firestore...");
    const snapshot = await db.collection("discounts").get(); // Ensure this matches your Firestore collection name
    let validCoupons = {}; // Initialize the validCoupons object
    
    if (snapshot.empty) {
      console.log("No coupons found.");
      return; // Exit if no coupons are found
    }

    snapshot.forEach(doc => {
      const data = doc.data(); // Get the document data
      console.log("Document data:", data); // Log the entire document data for debugging
      const currentDate = new Date(); // Get the current date

      // Check if the coupon is valid based on startDate and endDate
      if (data.startDate.toDate() <= currentDate && data.endDate.toDate() >= currentDate) {
        // Store the coupon code and discount in the validCoupons object
        if (data.type === "percentage") {
          validCoupons[data.code] = data.value / 100; // Store discount as a decimal (e.g., 10% as 0.1)
        } else {
          validCoupons[data.code] = 0; // If not a percentage, set discount to 0 or handle accordingly
        }
        console.log(`Coupon loaded: ${data.code}, Discount: ${validCoupons[data.code]}`);
      } else {
        console.log(`Coupon ${data.code} is not valid (startDate or endDate).`);
      }
    });

    // Optionally, you can return or use the validCoupons object here
    console.log("Valid Coupons:", validCoupons);
  } catch (error) {
    console.error("Error loading coupons:", error); // Log any errors that occur
  }
}


  // DOM Elements
  const authModal = document.getElementById("authModal");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const loginError = document.getElementById("loginError");
  const signupError = document.getElementById("signupError");
  const resetError = document.getElementById("resetError");
  const userGreeting = document.getElementById("userGreeting");
  const authButton = document.getElementById("authButton");
  const productList = document.getElementById("product-list");
  const cartModal = document.getElementById("cartModal");
  const cartItemsList = document.getElementById("cartItems");
  const totalPriceElem = document.getElementById("totalPrice");
  const popup = document.getElementById("popup");
  const checkoutModal = document.getElementById("checkoutModal");
  const searchInput = document.getElementById("searchInput");
  const filterSidebar = document.getElementById("filterSidebar");
  const filterOverlay = document.getElementById("filterOverlay");
  const orderHistoryModal = document.getElementById("orderHistoryModal");
  const orderHistoryList = document.getElementById("orderHistoryList");
  const orderTrackingModal = document.getElementById("orderTrackingModal");
  const trackingDetails = document.getElementById("trackingDetails");
  const loadingPlaceholder = document.querySelector(".loading-placeholder");

  // Initialize the app
  function init() {
    loadCart();
    loadCoupons();
    loadWishlist();
    loadProducts();
    checkAuthState();
    setupPaymentListeners();
    setupProvinceCityMapping();
    
    // Check for saved dark mode preference
    if (localStorage.getItem("darkMode") === "true") {
      document.body.classList.add("dark-mode");
      darkMode = true;
    }

    // Event listeners
    document.querySelector('.view-orders-btn')?.addEventListener('click', viewOrderHistory);
    searchInput?.addEventListener('input', searchProducts);
    document.querySelectorAll('input[name="category"]').forEach(input => {
      input.addEventListener('change', applyFilters);
    });
    document.querySelectorAll('input[name="price"]').forEach(input => {
      input.addEventListener('change', applyFilters);
    });
  }

  // Product Functions
  async function loadProducts() {
    try {
      loadingPlaceholder.style.display = 'block';
      productList.innerHTML = '';

      const snapshot = await db.collection("products").get();

      if (snapshot.empty) {
        showNoProductsMessage();
        return;
      }

      products = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Unnamed Product",
          price: data.price || 0,
          category: data.category || "uncategorized",
          image: data.image || "https://via.placeholder.com/300",
          stock: data.stock || 0,
          description: data.description || ""
        };
      });

      renderProducts(products);
    } catch (error) {
      console.error("Error loading products:", error);
      showErrorLoadingProducts();
    } finally {
      loadingPlaceholder.style.display = 'none';
    }
  }

  function renderProducts(productsToRender = products) {
    productList.innerHTML = "";

    if (!productsToRender || productsToRender.length === 0) {
      showNoProductsMessage();
      return;
    }

    const fragment = document.createDocumentFragment();
    
    productsToRender.forEach(product => {
      const isInWishlist = wishlist.includes(product.id);
      const productCard = document.createElement("div");
      productCard.className = "product-card";
      productCard.dataset.id = product.id;
      productCard.dataset.name = product.name.toLowerCase();
      productCard.dataset.category = product.category;
      productCard.dataset.price = product.price;
      
      productCard.innerHTML = `
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <h3>${product.name}</h3>
        <p>PKR ${product.price.toLocaleString()}</p>
        <p>${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
        <div class="product-actions">
          <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist('${product.id}')">
            ${isInWishlist ? '❤️' : '🤍'}
          </button>
          <button class="cart-button" onclick="addToCart('${product.id}', '${product.name}', ${product.price}, '${product.image}')" 
            ${product.stock <= 0 ? 'disabled' : ''}>
            <i class="fas fa-cart-plus"></i> Add to Cart
          </button>
        </div>
      `;
      
      fragment.appendChild(productCard);
    });
    
    productList.appendChild(fragment);
  }
  async function toggleWishlist(productId) {
  if (!currentUser) {
    openAuthModal(); // Prompt the user to log in if they're not authenticated
    return;
  }

  try {
    const userWishlistRef = db.collection("userWishlists").doc(currentUser.uid);
    const doc = await userWishlistRef.get();

    if (doc.exists) {
      const wishlist = doc.data().wishlist || [];
      const index = wishlist.indexOf(productId);

      if (index === -1) {
        // Add product to wishlist
        wishlist.push(productId);
      } else {
        // Remove product from wishlist
        wishlist.splice(index, 1);
      }

      // Update Firestore
      await userWishlistRef.set({ wishlist }, { merge: true });
    } else {
      // Create a new wishlist for the user
      await userWishlistRef.set({ wishlist: [productId] });
    }

    // Update local wishlist
    wishlist = await fetchWishlistFromFirebase();
    renderProducts(); // Refresh the product list to update wishlist icons
  } catch (error) {
    console.error("Error updating wishlist:", error);
    alert("Failed to update wishlist. Please try again.");
  }
}
  async function fetchWishlistFromFirebase() {
  if (!currentUser) return [];

  try {
    const userWishlistRef = db.collection("userWishlists").doc(currentUser.uid);
    const doc = await userWishlistRef.get();

    if (doc.exists) {
      return doc.data().wishlist || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return [];
  }
}
 
  async function viewWishlist() {
  if (!currentUser) {
    openAuthModal(); // Prompt the user to log in if they're not authenticated
    return;
  }

  try {
    // Fetch wishlist from Firestore
    const wishlist = await fetchWishlistFromFirebase();

    // Create a modal to display the wishlist
    const wishlistModal = document.createElement("div");
    wishlistModal.className = "modal";
    wishlistModal.style.display = "flex"; // Display the modal
    wishlistModal.innerHTML = `
      <div class="modal-content">
        <span class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</span>
        <h2>Your Wishlist</h2>
        <div id="wishlistItems" style="margin-top: 15px;">
          ${wishlist.length === 0 ? "<p>Your wishlist is empty.</p>" : ""}
        </div>
      </div>
    `;

    // Append the modal to the body
    document.body.appendChild(wishlistModal);

    // Render wishlist items
    const wishlistItems = wishlistModal.querySelector("#wishlistItems");
    if (wishlist.length > 0) {
      for (const productId of wishlist) {
        const product = products.find(p => p.id === productId);
        if (product) {
          const productCard = document.createElement("div");
          productCard.className = "product-card";
          productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <h3>${product.name}</h3>
            <p>PKR ${product.price.toLocaleString()}</p>
            <div class="product-actions">
              <button class="wishlist-btn active" onclick="toggleWishlist('${product.id}')">❤️</button>
              <button class="cart-button" onclick="addToCart('${product.id}', '${product.name}', ${product.price}, '${product.image}')">
                <i class="fas fa-cart-plus"></i> Add to Cart
              </button>
            </div>
          `;
          wishlistItems.appendChild(productCard);
        }
      }
    }
  } catch (error) {
    console.error("Error loading wishlist:", error);
    alert("Failed to load wishlist. Please try again.");
  }
}
  function searchProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
      const name = card.dataset.name;
      card.style.display = name.includes(searchTerm) ? 'block' : 'none';
    });
  }

  function applyFilters() {
    const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(el => el.value);
    const priceRange = document.querySelector('input[name="price"]:checked')?.value || 'all';
    
    const filteredProducts = products.filter(product => {
      if (!selectedCategories.includes(product.category)) return false;
      
      switch(priceRange) {
        case '0-2000': return product.price <= 2000;
        case '2000-5000': return product.price > 2000 && product.price <= 5000;
        case '5000-10000': return product.price > 5000 && product.price <= 10000;
        case '10000+': return product.price > 10000;
        default: return true;
      }
    });
    
    renderProducts(filteredProducts);
    closeFilterSidebar();
  }

  // Filter sidebar functions
  function openFilterSidebar() {
    filterSidebar?.classList.add('active');
    filterOverlay?.classList.add('active');
  }

  function closeFilterSidebar() {
    filterSidebar?.classList.remove('active');
    filterOverlay?.classList.remove('active');
  }

  function resetFilters() {
    document.querySelectorAll('input[name="category"]').forEach(input => {
      input.checked = true;
    });
    document.querySelector('input[name="price"][value="all"]').checked = true;
    renderProducts(products);
  }

  // Authentication Functions
  function checkAuthState() {
    auth.onAuthStateChanged(user => {
      currentUser = user;
      
      if (user) {
        userGreeting.textContent = `Hello, ${user.displayName || user.email.split('@')[0]}`;
        userGreeting.style.display = "inline";
        authButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        authButton.onclick = logout;
        
        loadUserCart(user.uid);
        loadUserWishlist(user.uid);
        loadUserOrders(user.uid);
      } else {
        userGreeting.textContent = "";
        userGreeting.style.display = "none";
        authButton.innerHTML = '<i class="far fa-user"></i> Login';
        authButton.onclick = openAuthModal;
      }
    });
  }

  function openAuthModal() {
    authModal.style.display = "flex";
    switchAuthTab('login');
  }

  function closeAuthModal() {
    authModal.style.display = "none";
    loginError.textContent = "";
    signupError.textContent = "";
    resetError.textContent = "";
  }

  function switchAuthTab(tab) {
    if (tab === "login") {
      document.querySelector(".auth-tab:nth-child(1)").classList.add("active");
      document.querySelector(".auth-tab:nth-child(2)").classList.remove("active");
      loginForm.classList.add("active");
      signupForm.classList.remove("active");
      resetPasswordForm.classList.remove("active");
    } else if (tab === "signup") {
      document.querySelector(".auth-tab:nth-child(1)").classList.remove("active");
      document.querySelector(".auth-tab:nth-child(2)").classList.add("active");
      loginForm.classList.remove("active");
      signupForm.classList.add("active");
      resetPasswordForm.classList.remove("active");
    }
  }

  function showPasswordReset() {
    loginForm.classList.remove("active");
    signupForm.classList.remove("active");
    resetPasswordForm.classList.add("active");
  }

  function login() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    
    if (!validateEmail(email)) {
      loginError.textContent = "Please enter a valid email address";
      return;
    }
    
    if (password.length < 6) {
      loginError.textContent = "Password must be at least 6 characters";
      return;
    }
    
    const btn = document.querySelector('#loginForm .btn-confirm');
    const originalText = showLoading(btn);
    
    auth.signInWithEmailAndPassword(email, password)
      .then(() => closeAuthModal())
      .catch(error => {
        loginError.textContent = error.message;
      })
      .finally(() => hideLoading(btn, originalText));
  }

  function signup() {
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const confirmPassword = document.getElementById("signupConfirmPassword").value.trim();
    
    if (!name) {
      signupError.textContent = "Please enter your name";
      return;
    }
    
    if (!validateEmail(email)) {
      signupError.textContent = "Please enter a valid email address";
      return;
    }
    
    if (password.length < 6) {
      signupError.textContent = "Password must be at least 6 characters";
      return;
    }
    
    if (password !== confirmPassword) {
      signupError.textContent = "Passwords don't match";
      return;
    }
    
    const btn = document.querySelector('#signupForm .btn-confirm');
    const originalText = showLoading(btn);
    
    auth.createUserWithEmailAndPassword(email, password)
      .then(cred => cred.user.updateProfile({ displayName: name }))
      .then(() => closeAuthModal())
      .catch(error => {
        signupError.textContent = error.message;
      })
      .finally(() => hideLoading(btn, originalText));
  }

  function sendPasswordReset() {
    const email = document.getElementById("resetEmail").value.trim();
    
    if (!validateEmail(email)) {
      resetError.textContent = "Please enter a valid email address";
      return;
    }
    
    const btn = document.querySelector('#resetPasswordForm .btn-confirm');
    const originalText = showLoading(btn);
    
    auth.sendPasswordResetEmail(email)
      .then(() => {
        resetError.textContent = "";
        resetError.style.color = "green";
        resetError.textContent = "Password reset email sent. Please check your inbox.";
      })
      .catch(error => {
        resetError.style.color = "#e94057";
        resetError.textContent = error.message;
      })
      .finally(() => hideLoading(btn, originalText));
  }

  function logout() {
    const btn = authButton;
    const originalText = showLoading(btn);
    
    auth.signOut()
      .then(() => {
        saveCart();
        saveWishlist();
      })
      .catch(error => console.error("Logout error:", error))
      .finally(() => hideLoading(btn, originalText));
  }

  // Cart Functions
  function addToCart(productId, productName, price, image) {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    
    if (cart[productId]) {
      cart[productId].quantity += 1;
    } else {
      cart[productId] = { 
        name: productName, 
        price: price, 
        quantity: 1, 
        image: image 
      };
    }
    
    showPopup(`${productName} added to cart!`);
    saveCart();
    
    if (currentUser) {
      saveUserCart(currentUser.uid);
    }
  }

  function removeFromCart(productId) {
    if (cart[productId]) {
      delete cart[productId];
      saveCart();
      openCart();
      
      if (currentUser) {
        saveUserCart(currentUser.uid);
      }
    }
  }

  function updateQuantity(productId, change) {
    if (cart[productId]) {
      cart[productId].quantity += change;
      
      if (cart[productId].quantity <= 0) {
        delete cart[productId];
      }
      
      saveCart();
      openCart();
      
      if (currentUser) {
        saveUserCart(currentUser.uid);
      }
    }
  }

  function openCart() {
    cartItemsList.innerHTML = "";
    let totalPrice = 0;
    
    if (Object.keys(cart).length === 0) {
      cartItemsList.innerHTML = "<p style='text-align: center;'>Your cart is empty</p>";
    } else {
      const fragment = document.createDocumentFragment();
      
      for (let productId in cart) {
        const item = cart[productId];
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        
        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        
        cartItem.innerHTML = `
          <div style="display: flex; gap: 10px;">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
              <p class="cart-item-name">${item.name}</p>
              <p class="cart-item-price">PKR ${item.price.toLocaleString()} x ${item.quantity}</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="quantity-controls">
              <button class="quantity-btn" onclick="updateQuantity('${productId}', -1)">-</button>
              <span>${item.quantity}</span>
              <button class="quantity-btn" onclick="updateQuantity('${productId}', 1)">+</button>
            </div>
            <button class="remove-btn" onclick="removeFromCart('${productId}')">Remove</button>
          </div>
        `;
        
        fragment.appendChild(cartItem);
      }
      
      cartItemsList.appendChild(fragment);
    }
    
    if (appliedCoupon) {
      const discount = totalPrice * appliedCoupon.discount;
      totalPrice -= discount;
      
      totalPriceElem.innerHTML = `
        <span style="text-decoration: line-through;">PKR ${(totalPrice + discount).toLocaleString()}</span>
        PKR ${totalPrice.toLocaleString()}
        <span style="color: green; font-size: 12px;">(${appliedCoupon.code} applied - ${appliedCoupon.discount * 100}% off)</span>
      `;
    } else {
      totalPriceElem.textContent = `PKR ${totalPrice.toLocaleString()}`;
    }
    
    cartModal.style.display = "flex";
  }

  function closeCart() {
    cartModal.style.display = "none";
  }

  function saveCart() {
    localStorage.setItem("timelessTrendsCart", JSON.stringify(cart));
  }

  function loadCart() {
    const savedCart = localStorage.getItem("timelessTrendsCart");
    if (savedCart) {
      cart = JSON.parse(savedCart);
    }
  }

  function saveUserCart(userId) {
    db.collection("userCarts").doc(userId).set({
      cart: cart,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(console.error);
  }

  function loadUserCart(userId) {
    db.collection("userCarts").doc(userId).get()
      .then(doc => {
        if (doc.exists) {
          cart = doc.data().cart || {};
        }
      })
      .catch(console.error);
  }

  // Wishlist Functions
  function toggleWishlist(productId) {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    
    const index = wishlist.indexOf(productId);
    if (index === -1) {
      wishlist.push(productId);
    } else {
      wishlist.splice(index, 1);
    }
    
    saveWishlist();
    renderProducts();
    
    if (currentUser) {
      saveUserWishlist(currentUser.uid);
    }
  }

  function saveWishlist() {
    localStorage.setItem("timelessTrendsWishlist", JSON.stringify(wishlist));
  }

  function loadWishlist() {
    const savedWishlist = localStorage.getItem("timelessTrendsWishlist");
    if (savedWishlist) {
      wishlist = JSON.parse(savedWishlist);
    }
  }

  function saveUserWishlist(userId) {
    db.collection("userWishlists").doc(userId).set({
      wishlist: wishlist,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(console.error);
  }

  function loadUserWishlist(userId) {
    db.collection("userWishlists").doc(userId).get()
      .then(doc => {
        if (doc.exists) {
          wishlist = doc.data().wishlist || [];
          renderProducts();
        }
      })
      .catch(console.error);
  }

  // Order Functions
  function loadUserOrders(userId) {
    orderHistoryList.innerHTML = '<p style="text-align: center;">Loading your orders...</p>';
    
    db.collection("orders")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get()
      .then(snapshot => {
        orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderOrderHistory();
      })
      .catch(error => {
        console.error("Error loading orders:", error);
        orderHistoryList.innerHTML = '<p style="text-align: center; color: #e94057;">Error loading orders. Please try again.</p>';
      });
  }

  function renderOrderHistory() {
    orderHistoryList.innerHTML = '';

    if (orders.length === 0) {
      orderHistoryList.innerHTML = '<p style="text-align: center;">You haven\'t placed any orders yet.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    
    orders.forEach(order => {
      const orderItem = document.createElement("div");
      orderItem.className = "order-history-item";
      
      let productsHtml = '';
      Object.values(order.products).forEach(product => {
        productsHtml += `
          <div class="order-history-product">
            <img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
            <div>
              <p style="font-weight: 500;">${product.name}</p>
              <p style="font-size: 12px; color: #666;">PKR ${product.price.toLocaleString()} x ${product.quantity}</p>
            </div>
          </div>
        `;
      });
      
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Date not available';
      const statusClass = getStatusClass(order.status);
      
      orderItem.innerHTML = `
        <div class="order-history-header">
          <div>
            <strong>Order #${order.id}</strong>
            <p style="font-size: 12px; color: #666;">${orderDate}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>PKR ${order.total.toLocaleString()}</strong></p>
            <span class="status-badge ${statusClass}">${order.status}</span>
          </div>
        </div>
        <div class="order-history-products">
          ${productsHtml}
        </div>
        <div style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 10px;">
          <button class="cart-button" onclick="trackOrder('${order.id}')">
            <i class="fas fa-truck"></i> Track Order
          </button>
        </div>
      `;
      
      fragment.appendChild(orderItem);
    });
    
    orderHistoryList.appendChild(fragment);
  }

  function getStatusClass(status) {
    switch(status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  function viewOrderHistory() {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    
    orderHistoryModal.style.display = "flex";
    loadUserOrders(currentUser.uid);
  }


  // Order Tracking Functions
  function trackOrder(orderId) {
  console.log("Tracking order:", orderId); // Debugging
  trackingDetails.innerHTML = '<div class="loading" style="margin: 20px auto;"></div>';
  orderTrackingModal.style.display = "flex";

  db.collection("orders").doc(orderId).get()
    .then(doc => {
      if (doc.exists) {
        // Include the document ID in the order data
        const orderData = { id: doc.id, ...doc.data() }; 
        console.log("Order found:", orderData); // Debugging
        updateTrackingUI(orderData);
      } else {
        console.error("Order not found"); // Debugging
        trackingDetails.innerHTML = '<p style="text-align: center;">Order not found</p>';
      }
    })
    .catch(error => {
      console.error("Error loading order:", error); // Debugging
      trackingDetails.innerHTML = '<p style="text-align: center;">Error loading order details</p>';
    });
}
function closeOrderTracking() {
  orderTrackingModal.style.display = "none";
}
function closeOrderTracking() {
  orderTrackingModal.style.display = "none";
}
function updateTrackingUI(order) {
  console.log("Updating tracking UI for order:", order); // Debugging
  console.log("Order ID:", order.id); // Debugging

  const trackingSteps = {
    stepOrdered: order.status === 'pending' ? 'active' : 'completed',
    stepProcessed: order.status === 'processing' ? 'active' : ['shipped', 'delivered'].includes(order.status) ? 'completed' : '',
    stepShipped: order.status === 'shipped' ? 'active' : order.status === 'delivered' ? 'completed' : '',
    stepDelivered: order.status === 'delivered' ? 'active' : ''
  };

  trackingDetails.innerHTML = `
    <div class="tracking-progress">
      <div class="tracking-step ${trackingSteps.stepOrdered}" id="stepOrdered">
        <div class="step-icon">📦</div>
        <div class="step-label">Order Placed</div>
      </div>
      <div class="tracking-step ${trackingSteps.stepProcessed}" id="stepProcessed">
        <div class="step-icon">🏭</div>
        <div class="step-label">Processing</div>
      </div>
      <div class="tracking-step ${trackingSteps.stepShipped}" id="stepShipped">
        <div class="step-icon">🚚</div>
        <div class="step-label">Shipped</div>
      </div>
      <div class="tracking-step ${trackingSteps.stepDelivered}" id="stepDelivered">
        <div class="step-icon">🏠</div>
        <div class="step-label">Delivered</div>
      </div>
    </div>
    <div id="trackingUpdates" class="tracking-updates"></div>
  `;

  const trackingUpdates = document.getElementById('trackingUpdates');
  trackingUpdates.innerHTML = '';

  const updates = [
    {
      time: order.createdAt?.toDate() || new Date(),
      message: `Order #${order.id} has been placed`
    }
  ];

  if (['processing', 'shipped', 'delivered'].includes(order.status)) {
    updates.push({
      time: order.processedAt?.toDate() || new Date(order.createdAt?.toDate().getTime() + 86400000),
      message: 'Your order is being processed'
    });
  }

  if (['shipped', 'delivered'].includes(order.status)) {
    updates.push({
      time: order.shippedAt?.toDate() || new Date(order.createdAt?.toDate().getTime() + 172800000),
      message: `Your order has been shipped ${order.trackingNumber ? `(Tracking #: ${order.trackingNumber})` : ''}`
    });
  }

  if (order.status === 'delivered') {
    updates.push({
      time: order.deliveredAt?.toDate() || new Date(order.createdAt?.toDate().getTime() + 345600000),
      message: 'Your order has been delivered'
 });
  }

  console.log("Tracking updates:", updates); // Debugging

  updates.sort((a, b) => b.time - a.time).forEach(update => {
    const updateElement = document.createElement('div');
    updateElement.className = 'tracking-update';
    updateElement.innerHTML = `
      <div class="update-time">${update.time.toLocaleString()}</div>
      <div class="update-message">${update.message}</div>
    `;
    trackingUpdates.appendChild(updateElement);
  });
}
function viewOrderHistory() {
  if (!currentUser) {
    openAuthModal();
    return;
  }

  orderHistoryModal.style.display = "flex";
  loadUserOrders(currentUser.uid);
}
function closeOrderHistory() {
  orderHistoryModal.style.display = "none";
}
  function closeOrderTracking() {
    orderTrackingModal.style.display = "none";
  }

  // Checkout Functions
  function openCheckout() {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    
    if (Object.keys(cart).length === 0) {
      alert("Your cart is empty!");
      return;
    }
    
    document.getElementById('checkoutEmail').value = currentUser.email;
    if (currentUser.displayName) {
      document.getElementById('checkoutName').value = currentUser.displayName;
    }
    
    document.querySelectorAll('.checkout-step').forEach((el, index) => {
      el.classList.remove('active', 'completed');
      if (index === 0) el.classList.add('active');
    });
    
    document.querySelectorAll('.checkout-section').forEach(el => {
      el.classList.remove('active');
    });
    document.getElementById('section1').classList.add('active');
    
    checkoutModal.style.display = "flex";
  }

  function closeCheckout() {
    checkoutModal.style.display = "none";
  }

  function goToStep(step) {
    if (step === 2 && !validateStep1()) return;
    if (step === 3 && !validateStep2()) return;
    
    document.querySelectorAll('.checkout-step').forEach((el, index) => {
      el.classList.remove('active');
      if (index < step - 1) el.classList.add('completed');
      if (index === step - 1) el.classList.add('active');
    });
    
    document.querySelectorAll('.checkout-section').forEach(el => {
      el.classList.remove('active');
    });
    document.getElementById(`section${step}`).classList.add('active');
  }

  function validateStep1() {
    const email = document.getElementById('checkoutEmail').value.trim();
    const name = document.getElementById('checkoutName').value.trim();
    const address = document.getElementById('checkoutAddress').value.trim();
    const city = document.getElementById('checkoutCity').value.trim();
    const province = document.getElementById('checkoutProvince').value;
    const phone = document.getElementById('checkoutContact').value.trim();
    
    if (!email || !name || !address || !city || !province || !phone) {
      alert('Please fill all required fields');
      return false;
    }
    
    if (!validateEmail(email)) {
      alert('Please enter a valid email address');
      return false;
    }
    
    if (!/^\d{10,15}$/.test(phone)) {
      alert('Please enter a valid phone number (10-15 digits)');
      return false;
    }
    
    return true;
  }

  function validateStep2() {
    return true;
  }

  async function confirmOrder() {
    const confirmBtn = document.querySelector('.btn-confirm');
    const originalText = showLoading(confirmBtn);
    
    try {
      const name = document.getElementById('checkoutName').value.trim();
      const email = document.getElementById('checkoutEmail').value.trim();
      const address = document.getElementById('checkoutAddress').value.trim();
      const city = document.getElementById('checkoutCity').value.trim();
      const province = document.getElementById('checkoutProvince').value;
      const phone = document.getElementById('checkoutContact').value.trim();
      const paymentMethod = document.querySelector('input[name="payment"]:checked');
      
      if (!email || !name || !address || !city || !province || !phone) {
        throw new Error('Please fill all required fields');
      }
      
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!/^\d{10,15}$/.test(phone)) {
        throw new Error('Please enter a valid phone number (10-15 digits)');
      }
      
      if (!paymentMethod) {
        throw new Error('Please select a payment method');
      }
      
      let subtotal = 0;
      for (let productId in cart) {
        subtotal += cart[productId].price * cart[productId].quantity;
      }
      
      const shippingFee = document.getElementById('expressShipping').checked ? 800 : 300;
      const freeShipping = subtotal >= 10000;
      let discountAmount = appliedCoupon ? subtotal * appliedCoupon.discount : 0;
      const total = subtotal - discountAmount + (freeShipping ? 0 : shippingFee);
      
      const orderDetails = {
        userId: currentUser.uid,
        userEmail: email,
        userName: name,
        userContact: phone,
        shippingAddress: { address, city, province },
        shippingMethod: document.querySelector('input[name="shipping"]:checked').id,
        shippingFee: freeShipping ? 0 : shippingFee,
        paymentMethod: paymentMethod.id,
        products: cart,
        subtotal,
        discount: appliedCoupon ? { code: appliedCoupon.code, amount: discountAmount } : null,
        total,
        status: "pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const orderRef = await db.collection("orders").add(orderDetails);
      await sendOrderEmail(orderDetails, orderRef.id);
      
      cart = {};
      saveCart();
      appliedCoupon = null;
      
      if (currentUser) {
        saveUserCart(currentUser.uid);
      }
      
      const checkoutMain = document.querySelector('.checkout-section.active');
      checkoutMain.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 60px; color: #4CAF50; margin-bottom: 20px;">
            <i class="fas fa-check-circle"></i>
          </div>
          <h2 style="margin-bottom: 15px;">Order Confirmed!</h2>
          <p style="margin-bottom: 10px;">Thank you for your purchase!</p>
          <p style="margin-bottom: 20px;">Order #${orderRef.id}</p>
          <p style="margin-bottom: 30px;">
            A confirmation has been sent to ${email}
          </p>
          <button onclick="closeCheckout(); closeCart(); window.location.reload();" 
                  style="background: #8a2387; color: white; border: none; 
                         padding: 12px 30px; border-radius: 4px; cursor: pointer;
                         font-size: 16px;">
            Continue Shopping
          </button>
        </div>
      `;
    } catch (error) {
      console.error("Order error:", error);
      alert(error.message || "Failed to place order. Please try again.");
    } finally {
      hideLoading(confirmBtn, originalText);
    }
  }

  async function sendOrderEmail(orderDetails, orderId) {
    const web3formEndpoint = "https://api.web3forms.com/submit";
    const accessKey = "8847c3a9-5ac4-4b89-b85a-6bba70de7550";
    
    const productsList = Object.values(orderDetails.products)
      .map(item => `${item.name} (Qty: ${item.quantity}) - PKR ${item.price * item.quantity}`)
      .join("\n");
    
    const emailData = {
      access_key: accessKey,
      subject: `New Order #${orderId} - Timeless Trends`,
      from_name: "Timeless Trends Store",
      name: orderDetails.userName,
      email: orderDetails.userEmail,
      order_id: orderId,
      replyto: orderDetails.userEmail,
      content_type: "text",
      message: `
NEW ORDER RECEIVED

Order ID: ${orderId}
Customer: ${orderDetails.userName}
Email: ${orderDetails.userEmail}
Phone: ${orderDetails.userContact}

SHIPPING ADDRESS:
${orderDetails.shippingAddress.address}
${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.province}

ORDER DETAILS:
${productsList}

Subtotal: PKR ${orderDetails.subtotal.toLocaleString()}
${orderDetails.discount ? `Discount (${orderDetails.discount.code}): -PKR ${orderDetails.discount.amount.toLocaleString()}\n` : ''}
Shipping: PKR ${orderDetails.shippingFee.toLocaleString()}
Total: PKR ${orderDetails.total.toLocaleString()}

PAYMENT METHOD:
${orderDetails.paymentMethod.replace(/([A-Z])/g, ' $1').trim()}
      `.trim()
    };
    
    try {
      await fetch(web3formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData)
      });
    } catch (error) {
      console.error("Email error:", error);
    }
  }

  // Coupon Functions
  function applyCoupon() {
    const couponCode = document.getElementById("couponCode").value.toUpperCase().trim();
    const couponMessage = document.getElementById("couponMessage");
    
    if (!couponCode) {
      couponMessage.textContent = "Please enter a coupon code";
      couponMessage.style.color = "red";
      return;
    }
    
    if (validCoupons[couponCode]) {
      appliedCoupon = { code: couponCode, discount: validCoupons[couponCode] };
      couponMessage.textContent = `Coupon applied! ${appliedCoupon.discount * 100}% discount`;
      couponMessage.style.color = "green";
      openCart();
    } else {
      appliedCoupon = null;
      couponMessage.textContent = "Invalid coupon code";
      couponMessage.style.color = "red";
      openCart();
    }
  }

  // Province-City Mapping
  function setupProvinceCityMapping() {
    const cities = {
      "Punjab": ["Lahore", "Faisalabad", "Rawalpindi", "Multan", "Gujranwala"],
      "Sindh": ["Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah"],
      "KPK": ["Peshawar", "Abbottabad", "Mardan", "Swat", "Kohat"],
      "Balochistan": ["Quetta", "Gwadar", "Turbat", "Khuzdar", "Sibi"]
    };
    
    document.getElementById("checkoutProvince")?.addEventListener("change", function() {
      const province = this.value;
      const cityInput = document.getElementById("checkoutCity");
      
      if (province && cities[province]) {
        let datalist = document.getElementById("citiesDatalist");
        if (!datalist) {
          datalist = document.createElement("datalist");
          datalist.id = "citiesDatalist";
          document.body.appendChild(datalist);
          cityInput.setAttribute("list", "citiesDatalist");
        }
        
        datalist.innerHTML = '';
        cities[province].forEach(city => {
          const option = document.createElement("option");
          option.value = city;
          datalist.appendChild(option);
        });
      }
    });
  }

  // Payment Method Setup
  function setupPaymentListeners() {
    document.getElementById('easyPaisa')?.addEventListener('change', function() {
      document.getElementById('easyPaisaDetails').classList.toggle('active', this.checked);
    });
    
    document.getElementById('jazzcash')?.addEventListener('change', function() {
      document.getElementById('jazzcashDetails').classList.toggle('active', this.checked);
    });
    
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
      radio.addEventListener('change', function() {
        document.querySelectorAll('.payment-details').forEach(detail => {
          detail.classList.remove('active');
        });
        if (this.id === 'easyPaisa') {
          document.getElementById('easyPaisaDetails').classList.add('active');
        } else if (this.id === 'jazzcash') {
          document.getElementById('jazzcashDetails').classList.add('active');
        }
      });
    });
  }

  // Helper Functions
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function showLoading(button) {
    const originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = '<div class="loading"></div>';
    return originalText;
  }

  function hideLoading(button, originalText) {
    button.disabled = false;
    button.textContent = originalText;
  }

  function showPopup(message) {
    popup.textContent = message;
    popup.style.display = "block";
    setTimeout(() => popup.style.display = "none", 2000);
  }

  function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    darkMode = !darkMode;
    localStorage.setItem("darkMode", darkMode);
  }

  function showNoProductsMessage() {
    productList.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
        <p>No products available at the moment.</p>
        <button onclick="loadProducts()" class="cart-button" style="margin-top: 15px;">
          <i class="fas fa-sync-alt"></i> Try Again
        </button>
      </div>
    `;
  }

  function showErrorLoadingProducts() {
    productList.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
        <p style="color: #e94057;">Failed to load products. Please check your connection.</p>
        <button onclick="loadProducts()" class="cart-button" style="margin-top: 15px;">
          <i class="fas fa-sync-alt"></i> Retry
        </button>
      </div>
    `;
  }

  // Initialize the app when DOM is loaded
  document.addEventListener("DOMContentLoaded", init);