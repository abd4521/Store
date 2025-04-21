function setupAdminUI() {
    // Set user info in header
    const userInfo = document.querySelector('.admin-user div');
    userInfo.innerHTML = `
      <div>${currentUser.displayName || 'Admin User'}</div>
      <small>Super Admin</small>
    `;

    // Add logout functionality
    const userDropdown = document.querySelector('.user-dropdown');
    document.querySelector('.admin-user img').addEventListener('click', function() {
      userDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.admin-user')) {
        userDropdown.classList.remove('show');
      }
    });

    // Setup logout button
    document.querySelector('.user-dropdown a[onclick="logout()"]').addEventListener('click', logout);
  }

  // Logout function
  function logout() {
    auth.signOut().then(() => {
      window.location.href = 'login.html';
    }).catch(error => {
      console.error('Logout error:', error);
      alert('Error logging out. Please try again.');
    });
  }

  // Load dashboard statistics
  function loadDashboardStats() {
    // Total Orders
    db.collection('orders').get().then(snapshot => {
      document.querySelector('.dashboard-card:nth-child(1) .card-value').textContent = snapshot.size;
      document.querySelector('.dashboard-card:nth-child(1) .card-progress-bar').style.width = 
        `${Math.min(100, (snapshot.size / 2000) * 100)}%`;
    });

    // Total Products
    db.collection('products').get().then(snapshot => {
      document.querySelector('.dashboard-card:nth-child(2) .card-value').textContent = snapshot.size;
      document.querySelector('.dashboard-card:nth-child(2) .card-progress-bar').style.width = 
        `${Math.min(100, (snapshot.size / 500) * 100)}%`;
    });

    // Total Revenue
    db.collection('orders').get().then(snapshot => {
      let total = 0;
      snapshot.forEach(doc => {
        total += doc.data().total || 0;
      });
      document.querySelector('.dashboard-card:nth-child(3) .card-value').textContent = 
        `PKR ${total.toLocaleString()}`;
      document.querySelector('.dashboard-card:nth-child(3) .card-progress-bar').style.width = 
        `${Math.min(100, (total / 5000000) * 100)}%`;
    });

    // Total Customers
    db.collection('users').get().then(snapshot => {
      document.querySelector('.dashboard-card:nth-child(4) .card-value').textContent = snapshot.size;
      document.querySelector('.dashboard-card:nth-child(4) .card-progress-bar').style.width = 
        `${Math.min(100, (snapshot.size / 1000) * 100)}%`;
    });

    // Low Stock Items
    db.collection('products').where('stock', '<=', 5).get().then(snapshot => {
      document.querySelector('.dashboard-card:nth-child(5) .card-value').textContent = snapshot.size;
      document.querySelector('.dashboard-card:nth-child(5) .card-progress-bar').style.width = 
        `${Math.min(100, (snapshot.size / 50) * 100)}%`;
    });

    // Active Discounts
    db.collection('discounts')
      .where('startDate', '<=', new Date())
      .where('endDate', '>=', new Date())
      .get().then(snapshot => {
        document.querySelector('.dashboard-card:nth-child(6) .card-value').textContent = snapshot.size;
        document.querySelector('.dashboard-card:nth-child(6) .card-progress-bar').style.width = 
          `${Math.min(100, (snapshot.size / 20) * 100)}%`;
      });
  }

  // Load recent orders for dashboard
  function loadRecentOrders() {
    const tbody = document.querySelector('#dashboard tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading"><span class="loading-spinner"></span> Loading orders...</td></tr>';

    db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get()
      .then(snapshot => {
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
          tbody.innerHTML = '<tr><td colspan="6">No recent orders found</td></tr>';
          return;
        }

        snapshot.forEach(doc => {
          const order = doc.data();
          const tr = document.createElement('tr');
          
          tr.innerHTML = `
            <td>#${doc.id.substring(0, 8)}</td>
            <td>${order.userName || 'Guest'}</td>
            <td>${order.createdAt?.toDate().toLocaleDateString() || 'N/A'}</td>
            <td>PKR ${order.total?.toLocaleString() || '0'}</td>
            <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'Pending'}</span></td>
            <td>
              <button class="action-btn view" onclick="viewOrder('${doc.id}')">View</button>
              <button class="action-btn edit" onclick="editOrder('${doc.id}')">Edit</button>
            </td>
          `;
          
          tbody.appendChild(tr);
        });
      })
      .catch(error => {
        console.error('Error loading recent orders:', error);
        tbody.innerHTML = '<tr><td colspan="6">Error loading orders</td></tr>';
      });
  }

  // Load low stock items for dashboard
  function loadLowStockItems() {
    const tbody = document.querySelector('#dashboard table:nth-of-type(2) tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading"><span class="loading-spinner"></span> Loading inventory...</td></tr>';

    db.collection('products')
      .where('stock', '<=', 5)
      .orderBy('stock', 'asc')
      .limit(3)
      .get()
      .then(snapshot => {
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
          tbody.innerHTML = '<tr><td colspan="7">No low stock items</td></tr>';
          return;
        }

        snapshot.forEach(doc => {
          const product = doc.data();
          const tr = document.createElement('tr');
          
          tr.innerHTML = `
            <td>#${doc.id.substring(0, 6)}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.stock || 0}</td>
            <td>5</td>
            <td><span class="status-badge status-pending">Low Stock</span></td>
            <td>
              <button class="action-btn edit" onclick="restockProduct('${doc.id}')">Restock</button>
            </td>
          `;
          
          tbody.appendChild(tr);
        });
      })
      .catch(error => {
        console.error('Error loading low stock items:', error);
        tbody.innerHTML = '<tr><td colspan="7">Error loading inventory</td></tr>';
      });
  }

  // Show tab content
  function showTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Update menu active state
    document.querySelectorAll('.admin-menu a').forEach(link => {
      link.classList.remove('active');
    });
    
    // Find and activate the corresponding menu item
    const menuItem = document.querySelector(`.admin-menu a[onclick="showTab('${tabId}')"]`);
    if (menuItem) {
      menuItem.classList.add('active');
    }
    
    // Load data for the tab if needed
    switch(tabId) {
      case 'orders':
        loadOrders();
        break;
      case 'products':
        showProductTab('all-products');
        break;
      case 'categories':
        showCategoryTab('all-categories');
        break;
      case 'customers':
        loadCustomers();
        break;
      case 'marketing':
        showMarketingTab('discounts');
        break;
      case 'reports':
        showReportTab('sales');
        break;
      case 'settings':
        showSettingsTab('general');
        break;
    }
  }

  // Show product sub-tab
  function showProductTab(tabId) {
    // Hide all product tab contents
    document.querySelectorAll('#products .tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Update tab active state
    document.querySelectorAll('#products .admin-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Activate the selected tab
    document.querySelector(`#products .admin-tab[onclick="showProductTab('${tabId}')"]`).classList.add('active');
    
    // Load data if needed
    if (tabId === 'all-products') {
      loadProducts();
    } else if (tabId === 'inventory') {
      loadInventory();
    }
  }

  // Show category sub-tab
  function showCategoryTab(tabId) {
    // Hide all category tab contents
    document.querySelectorAll('#categories .tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Update tab active state
    document.querySelectorAll('#categories .admin-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Activate the selected tab
    document.querySelector(`#categories .admin-tab[onclick="showCategoryTab('${tabId}')"]`).classList.add('active');
    
    // Load data if needed
    if (tabId === 'all-categories') {
      loadCategories();
    }
  }

  // Show marketing sub-tab
  function showMarketingTab(tabId) {
    // Hide all marketing tab contents
    document.querySelectorAll('#marketing .tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Update tab active state
    document.querySelectorAll('#marketing .admin-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Activate the selected tab
    document.querySelector(`#marketing .admin-tab[onclick="showMarketingTab('${tabId}')"]`).classList.add('active');
    
    // Load data if needed
    if (tabId === 'discounts') {
      loadDiscounts();
    } else if (tabId === 'coupons') {
      loadCoupons();
    } else if (tabId === 'promotions') {
      loadPromotions();
    }
  }

  // Show report sub-tab
  function showReportTab(tabId) {
    // Hide all report tab contents
    document.querySelectorAll('#reports .tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Update tab active state
    document.querySelectorAll('#reports .admin-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Activate the selected tab
    document.querySelector(`#reports .admin-tab[onclick="showReportTab('${tabId}')"]`).classList.add('active');
    
    // Load data if needed
    if (tabId === 'sales') {
      generateSalesReport();
    } else if (tabId === 'products') {
      generateProductReport();
    } else if (tabId === 'customers') {
      generateCustomerReport();
    } else if (tabId === 'inventory') {
      generateInventoryReport();
    }
  }

  // Show settings sub-tab
  function showSettingsTab(tabId) {
    // Hide all settings tab contents
    document.querySelectorAll('#settings .tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Update tab active state
    document.querySelectorAll('#settings .admin-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Activate the selected tab
    document.querySelector(`#settings .admin-tab[onclick="showSettingsTab('${tabId}')"]`).classList.add('active');
  }