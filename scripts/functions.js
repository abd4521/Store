function loadCustomers() {
    const tbody = document.getElementById('customers-table-body');
    tbody.innerHTML = '<tr><td colspan="8" class="loading"><span class="loading-spinner"></span> Loading customers...</td></tr>';

    let query = db.collection('users');

    // Apply status filter if selected
    const statusFilter = document.getElementById('customer-status-filter').value;
    if (statusFilter) {
      query = query.where('active', '==', statusFilter === 'active');
    }

    // Apply search filter if entered
    const searchTerm = document.getElementById('customer-search').value.trim();
    if (searchTerm) {
      query = query.where('name', '>=', searchTerm)
                  .where('name', '<=', searchTerm + '\uf8ff');
    }

    query.get().then(snapshot => {
      tbody.innerHTML = '';
      
      if (snapshot.empty) {
        tbody.innerHTML = '<tr><td colspan="8">No customers found</td></tr>';
        return;
      }

      snapshot.forEach(doc => {
        const customer = doc.data();
        const tr = document.createElement('tr');
        
        // Get order count and total spent (this would be more efficient with a separate query)
        let orderCount = 0;
        let totalSpent = 0;
        
        tr.innerHTML = `
          <td>${doc.id.substring(0, 6)}</td>
          <td>${customer.name || 'Guest'}</td>
          <td>${customer.email || 'N/A'}</td>
          <td>${customer.phone || 'N/A'}</td>
          <td>${orderCount}</td>
          <td>PKR ${totalSpent.toLocaleString()}</td>
          <td><span class="status-badge status-${customer.active ? 'active' : 'inactive'}">${customer.active ? 'Active' : 'Inactive'}</span></td>
          <td>
            <button class="action-btn view" onclick="viewCustomer('${doc.id}')">View</button>
            <button class="action-btn edit" onclick="editCustomer('${doc.id}')">Edit</button>
          </td>
        `;
        
        tbody.appendChild(tr);
      });
    }).catch(error => {
      console.error('Error loading customers:', error);
      tbody.innerHTML = '<tr><td colspan="8">Error loading customers</td></tr>';
    });
  }

  // View customer details
  function viewCustomer(customerId) {
    selectedCustomerId = customerId;
    
    db.collection('users').doc(customerId).get().then(doc => {
      if (!doc.exists) {
        alert('Customer not found');
        return;
      }

      const customer = doc.data();
      const modal = document.getElementById('customer-modal');
      const modalBody = modal.querySelector('.modal-body');
      
      // Fill modal with customer data
      modalBody.innerHTML = `
        <div class="form-row">
          <div class="form-group">
            <label>Customer ID</label>
            <input type="text" value="${customerId.substring(0, 6)}" readonly>
          </div>
          <div class="form-group">
            <label>Status</label>
            <input type="text" value="${customer.active ? 'Active' : 'Inactive'}" readonly>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Name</label>
            <input type="text" value="${customer.name || ''}" readonly>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="text" value="${customer.email || ''}" readonly>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Phone</label>
            <input type="text" value="${customer.phone || ''}" readonly>
          </div>
          <div class="form-group">
            <label>Member Since</label>
            <input type="text" value="${customer.createdAt?.toDate().toLocaleDateString() || 'N/A'}" readonly>
          </div>
        </div>
        <div class="form-group">
          <label>Address</label>
          <textarea readonly>${customer.address || ''}</textarea>
        </div>
        <h4 style="margin: 20px 0 10px;">Order History</h4>
        <table style="width: 100%; margin-bottom: 20px;">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="customer-orders">
            <tr>
              <td colspan="4">Loading orders...</td>
            </tr>
          </tbody>
        </table>
      `;
      
      // Load customer's orders
      db.collection('orders').where('customerId', '==', customerId)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
          const ordersTbody = document.getElementById('customer-orders');
          ordersTbody.innerHTML = '';
          
          if (snapshot.empty) {
            ordersTbody.innerHTML = '<tr><td colspan="4">No orders found</td></tr>';
            return;
          }
          
          snapshot.forEach(orderDoc => {
            const order = orderDoc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><a href="#" onclick="viewOrder('${orderDoc.id}')">#${orderDoc.id.substring(0, 8)}</a></td>
              <td>${order.createdAt?.toDate().toLocaleDateString() || 'N/A'}</td>
              <td>PKR ${order.total?.toLocaleString() || '0'}</td>
              <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'Pending'}</span></td>
            `;
            ordersTbody.appendChild(tr);
          });
        })
        .catch(error => {
          console.error('Error loading customer orders:', error);
          document.getElementById('customer-orders').innerHTML = '<tr><td colspan="4">Error loading orders</td></tr>';
        });
      
      // Show modal
      modal.classList.add('show');
    }).catch(error => {
      console.error('Error loading customer:', error);
      alert('Error loading customer details');
    });
  }

  // Edit customer
  function editCustomer(customerId) {
    selectedCustomerId = customerId;
    
    db.collection('users').doc(customerId).get().then(doc => {
      if (!doc.exists) {
        alert('Customer not found');
        return;
      }

      const customer = doc.data();
      const modal = document.getElementById('customer-modal');
      const modalBody = modal.querySelector('.modal-body');
      
      // Fill modal with customer data
      modalBody.innerHTML = `
        <form id="edit-customer-form">
          <div class="form-row">
            <div class="form-group">
              <label for="edit-customer-name">Name</label>
              <input type="text" id="edit-customer-name" value="${customer.name || ''}" required>
            </div>
            <div class="form-group">
              <label for="edit-customer-email">Email</label>
              <input type="email" id="edit-customer-email" value="${customer.email || ''}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="edit-customer-phone">Phone</label>
              <input type="tel" id="edit-customer-phone" value="${customer.phone || ''}">
            </div>
            <div class="form-group">
              <label for="edit-customer-status">Status</label>
              <select id="edit-customer-status">
                <option value="true" ${customer.active ? 'selected' : ''}>Active</option>
                <option value="false" ${!customer.active ? 'selected' : ''}>Inactive</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="edit-customer-address">Address</label>
            <textarea id="edit-customer-address">${customer.address || ''}</textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModal('customer-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      `;
      
      // Handle form submission
      document.getElementById('edit-customer-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCustomerChanges();
      });
      
      // Show modal
      modal.classList.add('show');
    }).catch(error => {
      console.error('Error loading customer:', error);
      alert('Error loading customer details');
    });
  }

  // Save customer changes
  function saveCustomerChanges() {
    const name = document.getElementById('edit-customer-name').value;
    const email = document.getElementById('edit-customer-email').value;
    const phone = document.getElementById('edit-customer-phone').value;
    const active = document.getElementById('edit-customer-status').value === 'true';
    const address = document.getElementById('edit-customer-address').value;
    
    const updates = {
      name,
      email,
      phone,
      active,
      address,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('users').doc(selectedCustomerId).update(updates)
      .then(() => {
        alert('Customer updated successfully');
        closeModal('customer-modal');
        loadCustomers();
      })
      .catch(error => {
        console.error('Error updating customer:', error);
        alert('Error updating customer');
      });
  }

  // Show create customer modal
  function showCreateCustomerModal() {
    const modal = document.getElementById('customer-modal');
    const modalBody = modal.querySelector('.modal-body');
    
    // Fill modal with empty form
    modalBody.innerHTML = `
      <form id="create-customer-form">
        <div class="form-row">
          <div class="form-group">
            <label for="new-customer-name">Name</label>
            <input type="text" id="new-customer-name" required>
          </div>
          <div class="form-group">
            <label for="new-customer-email">Email</label>
            <input type="email" id="new-customer-email" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="new-customer-phone">Phone</label>
            <input type="tel" id="new-customer-phone">
          </div>
          <div class="form-group">
            <label for="new-customer-password">Password</label>
            <input type="password" id="new-customer-password" required>
          </div>
        </div>
        <div class="form-group">
          <label for="new-customer-address">Address</label>
          <textarea id="new-customer-address"></textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal('customer-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Customer</button>
        </div>
      </form>
    `;
    
    // Handle form submission
    document.getElementById('create-customer-form').addEventListener('submit', function(e) {
      e.preventDefault();
      createNewCustomer();
    });
    
    // Show modal
    modal.classList.add('show');
  }

  // Create new customer
  function createNewCustomer() {
    const name = document.getElementById('new-customer-name').value;
    const email = document.getElementById('new-customer-email').value;
    const phone = document.getElementById('new-customer-phone').value;
    const password = document.getElementById('new-customer-password').value;
    const address = document.getElementById('new-customer-address').value;
    
    // First create auth user
    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        
        // Then create user document
        return db.collection('users').doc(user.uid).set({
          name,
          email,
          phone,
          address,
          active: true,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .then(() => {
        alert('Customer created successfully');
        closeModal('customer-modal');
        loadCustomers();
      })
      .catch(error => {
        console.error('Error creating customer:', error);
        alert('Error creating customer: ' + error.message);
      });
  }

  // Export customers
  function exportCustomers() {
    alert('Exporting customers to CSV...');
    // In a real app, you would generate and download a CSV file
  }

  // Load all discounts
  function loadDiscounts() {
const tbody = document.getElementById('discounts-table-body');
tbody.innerHTML = '<tr><td colspan="2">Loading test...</td></tr>';

db.collection('discounts').get().then(snapshot => {
tbody.innerHTML = '';
snapshot.forEach(doc => {
  const tr = document.createElement('tr');
  const data = doc.data();
  tr.innerHTML = `<td>${data.code}</td><td>${data.name}</td>`;
  tbody.appendChild(tr);
});
}).catch(error => {
console.error('Error loading discounts:', error);
tbody.innerHTML = '<tr><td colspan="2">Error loading discounts</td></tr>';
});
}


  // Edit discount
  function editDiscount(discountId) {
    selectedDiscountId = discountId;
    
    db.collection('discounts').doc(discountId).get().then(doc => {
      if (!doc.exists) {
        alert('Discount not found');
        return;
      }

      const discount = doc.data();
      const modal = document.getElementById('discount-modal');
      const modalBody = modal.querySelector('.modal-body');
      
      // Fill modal with discount data
      modalBody.innerHTML = `
        <form id="edit-discount-form">
          <div class="form-row">
            <div class="form-group">
              <label for="edit-discount-code">Code</label>
              <input type="text" id="edit-discount-code" value="${discount.code || ''}" required>
            </div>
            <div class="form-group">
              <label for="edit-discount-name">Name</label>
              <input type="text" id="edit-discount-name" value="${discount.name || ''}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="edit-discount-type">Type</label>
              <select id="edit-discount-type" required>
                <option value="percentage" ${discount.type === 'percentage' ? 'selected' : ''}>Percentage</option>
                <option value="fixed" ${discount.type === 'fixed' ? 'selected' : ''}>Fixed Amount</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit-discount-value">Value</label>
              <input type="number" id="edit-discount-value" value="${discount.value || '0'}" min="0" step="0.01" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="edit-discount-start">Start Date</label>
              <input type="date" id="edit-discount-start" value="${discount.startDate?.toDate().toISOString().split('T')[0] || ''}" required>
            </div>
            <div class="form-group">
              <label for="edit-discount-end">End Date</label>
              <input type="date" id="edit-discount-end" value="${discount.endDate?.toDate().toISOString().split('T')[0] || ''}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="edit-discount-min">Minimum Order (PKR)</label>
              <input type="number" id="edit-discount-min" value="${discount.minOrder || '0'}" min="0" step="1">
            </div>
            <div class="form-group">
              <label for="edit-discount-limit">Usage Limit</label>
              <input type="number" id="edit-discount-limit" value="${discount.usageLimit || ''}" min="1" placeholder="Leave empty for no limit">
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModal('discount-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      `;
      
      // Handle form submission
      document.getElementById('edit-discount-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveDiscountChanges();
      });
      
      // Show modal
      modal.classList.add('show');
    }).catch(error => {
      console.error('Error loading discount:', error);
      alert('Error loading discount details');
    });
  }

  // Save discount changes
  function saveDiscountChanges() {
    const code = document.getElementById('edit-discount-code').value;
    const name = document.getElementById('edit-discount-name').value;
    const type = document.getElementById('edit-discount-type').value;
    const value = parseFloat(document.getElementById('edit-discount-value').value) || 0;
    const startDate = new Date(document.getElementById('edit-discount-start').value);
    const endDate = new Date(document.getElementById('edit-discount-end').value);
    const minOrder = parseFloat(document.getElementById('edit-discount-min').value) || 0;
    const usageLimit = document.getElementById('edit-discount-limit').value ? 
      parseInt(document.getElementById('edit-discount-limit').value) : null;
    
    const updates = {
      code,
      name,
      type,
      value,
      startDate: firebase.firestore.Timestamp.fromDate(startDate),
      endDate: firebase.firestore.Timestamp.fromDate(endDate),
      minOrder,
      usageLimit,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('discounts').doc(selectedDiscountId).update(updates)
      .then(() => {
        alert('Discount updated successfully');
        closeModal('discount-modal');
        loadDiscounts();
      })
      .catch(error => {
        console.error('Error updating discount:', error);
        alert('Error updating discount');
      });
  }

  // Delete discount
  function deleteDiscount(discountId) {
    showConfirmModal(
      'Delete Discount',
      'Are you sure you want to delete this discount? This action cannot be undone.',
      function() {
        db.collection('discounts').doc(discountId).delete()
          .then(() => {
            alert('Discount deleted successfully');
            loadDiscounts();
          })
          .catch(error => {
            console.error('Error deleting discount:', error);
            alert('Error deleting discount');
          });
      }
    );
  }

  // Show create discount modal
  function showCreateDiscountModal() {
    const modal = document.getElementById('discount-modal');
    const modalBody = modal.querySelector('.modal-body');
    
    // Fill modal with empty form
    modalBody.innerHTML = `
      <form id="create-discount-form">
        <div class="form-row">
          <div class="form-group">
            <label for="new-discount-code">Code</label>
            <input type="text" id="new-discount-code" required>
          </div>
          <div class="form-group">
            <label for="new-discount-name">Name</label>
            <input type="text" id="new-discount-name" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="new-discount-type">Type</label>
            <select id="new-discount-type" required>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div class="form-group">
            <label for="new-discount-value">Value</label>
            <input type="number" id="new-discount-value" min="0" step="0.01" value="10" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="new-discount-start">Start Date</label>
            <input type="date" id="new-discount-start" required>
          </div>
          <div class="form-group">
            <label for="new-discount-end">End Date</label>
            <input type="date" id="new-discount-end" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="new-discount-min">Minimum Order (PKR)</label>
            <input type="number" id="new-discount-min" min="0" step="1" value="0">
          </div>
          <div class="form-group">
            <label for="new-discount-limit">Usage Limit</label>
            <input type="number" id="new-discount-limit" min="1" placeholder="Leave empty for no limit">
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal('discount-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Discount</button>
        </div>
      </form>
    `;
    
    // Set default dates
    const today = new Date();
    document.getElementById('new-discount-start').valueAsDate = today;
    
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    document.getElementById('new-discount-end').valueAsDate = nextWeek;
    
    // Handle form submission
    document.getElementById('create-discount-form').addEventListener('submit', function(e) {
      e.preventDefault();
      createNewDiscount();
    });
    
    // Show modal
    modal.classList.add('show');
  }

  // Create new discount
  function createNewDiscount() {
    const code = document.getElementById('new-discount-code').value;
    const name = document.getElementById('new-discount-name').value;
    const type = document.getElementById('new-discount-type').value;
    const value = parseFloat(document.getElementById('new-discount-value').value) || 0;
    const startDate = new Date(document.getElementById('new-discount-start').value);
    const endDate = new Date(document.getElementById('new-discount-end').value);
    const minOrder = parseFloat(document.getElementById('new-discount-min').value) || 0;
    const usageLimit = document.getElementById('new-discount-limit').value ? 
      parseInt(document.getElementById('new-discount-limit').value) : null;
    
    const discount = {
      code,
      name,
      type,
      value,
      startDate: firebase.firestore.Timestamp.fromDate(startDate),
      endDate: firebase.firestore.Timestamp.fromDate(endDate),
      minOrder,
      usageLimit,
      usageCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('discounts').add(discount)
      .then(() => {
        alert('Discount created successfully');
        closeModal('discount-modal');
        loadDiscounts();
      })
      .catch(error => {
        console.error('Error creating discount:', error);
        alert('Error creating discount');
      });
  }

  // Load all coupons
  function loadCoupons() {
    // Similar to loadDiscounts but for coupons
    // Implementation would be similar to discounts
  }

  // Load all promotions
  function loadPromotions() {
    // Similar to loadDiscounts but for promotions
    // Implementation would be similar to discounts
  }

  // Generate sales report
  function generateSalesReport() {
    const fromDate = document.getElementById('sales-report-from').value;
    const toDate = document.getElementById('sales-report-to').value;
    const reportType = document.getElementById('sales-report-type').value;
    
    if (!fromDate || !toDate) {
      alert('Please select both from and to dates');
      return;
    }
    
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999); // End of day
    
    let query = db.collection('orders')
      .where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(from))
      .where('createdAt', '<=', firebase.firestore.Timestamp.fromDate(to));
    
    query.get().then(snapshot => {
      const tbody = document.getElementById('sales-report-table-body');
      tbody.innerHTML = '';
      
      if (snapshot.empty) {
        tbody.innerHTML = '<tr><td colspan="8">No orders found for selected period</td></tr>';
        return;
      }
      
      // Group data by date
      const dateMap = new Map();
      let totalOrders = 0;
      let totalRevenue = 0;
      let totalTax = 0;
      let totalShipping = 0;
      let totalDiscounts = 0;
      
      snapshot.forEach(doc => {
        const order = doc.data();
        const orderDate = order.createdAt.toDate().toISOString().split('T')[0];
        
        if (!dateMap.has(orderDate)) {
          dateMap.set(orderDate, {
            date: orderDate,
            orders: 0,
            products: 0,
            revenue: 0,
            tax: 0,
            shipping: 0,
            discounts: 0,
            netSales: 0
          });
        }
        
        const dayData = dateMap.get(orderDate);
        dayData.orders++;
        dayData.products += order.items.reduce((sum, item) => sum + item.quantity, 0);
        dayData.revenue += order.total;
        dayData.tax += order.tax || 0;
        dayData.shipping += order.shippingCost || 0;
        dayData.discounts += order.discount || 0;
        dayData.netSales += order.total;
        
        totalOrders++;
        totalRevenue += order.total;
        totalTax += order.tax || 0;
        totalShipping += order.shippingCost || 0;
        totalDiscounts += order.discount || 0;
      });
      
      // Add rows to table
      dateMap.forEach((dayData, date) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${dayData.date}</td>
          <td>${dayData.orders}</td>
          <td>${dayData.products}</td>
          <td>PKR ${dayData.revenue.toLocaleString()}</td>
          <td>PKR ${dayData.tax.toLocaleString()}</td>
          <td>PKR ${dayData.shipping.toLocaleString()}</td>
          <td>PKR ${dayData.discounts.toLocaleString()}</td>
          <td>PKR ${dayData.netSales.toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
      });
      
      // Add totals row
      const totalsRow = document.createElement('tr');
      totalsRow.style.fontWeight = 'bold';
      totalsRow.innerHTML = `
        <td>Total</td>
        <td>${totalOrders}</td>
        <td>${snapshot.docs.reduce((sum, doc) => sum + doc.data().items.reduce((s, item) => s + item.quantity, 0), 0)}</td>
        <td>PKR ${totalRevenue.toLocaleString()}</td>
        <td>PKR ${totalTax.toLocaleString()}</td>
        <td>PKR ${totalShipping.toLocaleString()}</td>
        <td>PKR ${totalDiscounts.toLocaleString()}</td>
        <td>PKR ${totalRevenue.toLocaleString()}</td>
      `;
      tbody.appendChild(totalsRow);
      
      // Update chart
      updateSalesReportChart(Array.from(dateMap.values()));
    }).catch(error => {
      console.error('Error generating sales report:', error);
      document.getElementById('sales-report-table-body').innerHTML = '<tr><td colspan="8">Error generating report</td></tr>';
    });
  }

  // Update sales report chart
  function updateSalesReportChart(data) {
    const labels = data.map(item => item.date);
    const revenueData = data.map(item => item.revenue);
    
    salesReportChart.data.labels = labels;
    salesReportChart.data.datasets = [{
      label: 'Revenue',
      data: revenueData,
      backgroundColor: 'rgba(138, 35, 135, 0.7)',
      borderColor: 'rgba(138, 35, 135, 1)',
      borderWidth: 1
    }];
    
    salesReportChart.update();
  }

  // Generate product report
  function generateProductReport() {
    // Similar to generateSalesReport but for products
    // Implementation would be similar to sales report
  }

  // Generate customer report
  function generateCustomerReport() {
    // Similar to generateSalesReport but for customers
    // Implementation would be similar to sales report
  }

  // Generate inventory report
  function generateInventoryReport() {
    // Similar to generateSalesReport but for inventory
    // Implementation would be similar to sales report
  }

  // Export sales report
  function exportSalesReport() {
    alert('Exporting sales report to CSV...');
    // In a real app, you would generate and download a CSV file
  }

  // Export product report
  function exportProductReport() {
    alert('Exporting product report to CSV...');
    // In a real app, you would generate and download a CSV file
  }

  // Export customer report
  function exportCustomerReport() {
    alert('Exporting customer report to CSV...');
    // In a real app, you would generate and download a CSV file
  }

  // Export inventory report
  function exportInventoryReport() {
    alert('Exporting inventory report to CSV...');
    // In a real app, you would generate and download a CSV file
  }

  // Show bulk update modal
  function showBulkUpdateModal() {
    document.getElementById('bulk-update-modal').classList.add('show');
  }

  // Apply bulk update
  function applyBulkUpdate() {
    const updateType = document.getElementById('bulk-update-type').value;
    const filterType = document.getElementById('bulk-update-filter').value;
    
    let query = db.collection('products');
    
    // Apply filter
    if (filterType === 'category') {
      const category = document.getElementById('bulk-category-value').value;
      query = query.where('category', '==', category);
    } else if (filterType === 'low-stock') {
      query = query.where('stock', '<=', 5);
    } else if (filterType === 'selected') {
      // In a real app, you would have selected products
      alert('Please select products first');
      return;
    }
    
    // Get the update value
    let updateValue;
    if (updateType === 'stock') {
      const method = document.getElementById('bulk-stock-method').value;
      const value = parseInt(document.getElementById('bulk-stock-value').value) || 0;
      
      query.get().then(snapshot => {
        const batch = db.batch();
        
        snapshot.forEach(doc => {
          let newStock = doc.data().stock;
          if (method === 'set') {
            newStock = value;
          } else if (method === 'increase') {
            newStock += value;
          } else if (method === 'decrease') {
            newStock = Math.max(0, newStock - value);
          }
          
          batch.update(doc.ref, {
            stock: newStock,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
        
        return batch.commit();
      }).then(() => {
        alert('Bulk stock update completed successfully');
        closeModal('bulk-update-modal');
        loadProducts();
        loadInventory();
        loadLowStockItems();
      }).catch(error => {
        console.error('Error in bulk stock update:', error);
        alert('Error updating stock');
      });
    } else if (updateType === 'price') {
      const method = document.getElementById('bulk-price-method').value;
      const value = parseFloat(document.getElementById('bulk-price-value').value) || 0;
      
      query.get().then(snapshot => {
        const batch = db.batch();
        
        snapshot.forEach(doc => {
          let newPrice = doc.data().price;
          if (method === 'set') {
            newPrice = value;
          } else if (method === 'increase') {
            newPrice *= (1 + value / 100);
          } else if (method === 'decrease') {
            newPrice *= (1 - value / 100);
          }
          
          batch.update(doc.ref, {
            price: parseFloat(newPrice.toFixed(2)),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
        
        return batch.commit();
      }).then(() => {
        alert('Bulk price update completed successfully');
        closeModal('bulk-update-modal');
        loadProducts();
      }).catch(error => {
        console.error('Error in bulk price update:', error);
        alert('Error updating prices');
      });
    } else if (updateType === 'status') {
      const status = document.getElementById('bulk-status-value').value;
      
      query.get().then(snapshot => {
        const batch = db.batch();
        
        snapshot.forEach(doc => {
          batch.update(doc.ref, {
            active: status === 'active',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
        
        return batch.commit();
      }).then(() => {
        alert('Bulk status update completed successfully');
        closeModal('bulk-update-modal');
        loadProducts();
      }).catch(error => {
        console.error('Error in bulk status update:', error);
        alert('Error updating statuses');
      });
    }
  }

  // Close modal
  function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
  }

  // Show confirmation modal
  function showConfirmModal(title, message, callback) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    confirmCallback = callback;
    document.getElementById('confirm-modal').classList.add('show');
  }

  // Confirm action
  function confirmAction() {
    if (confirmCallback) {
      confirmCallback();
    }
    closeModal('confirm-modal');
  }

  // Change chart period
  function changeChartPeriod(period) {
    // Update active button
    document.querySelectorAll('.chart-control').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update chart data based on period
    let labels, data;
    
    if (period === 'week') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      data = [12000, 19000, 15000, 20000, 25000, 22000, 30000];
    } else if (period === 'month') {
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      data = [80000, 95000, 110000, 105000];
    } else if (period === 'year') {
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      data = [350000, 320000, 380000, 400000, 420000, 450000, 470000, 460000, 480000, 500000, 520000, 550000];
    }
    
    salesChart.data.labels = labels;
    salesChart.data.datasets[0].data = data;
    salesChart.update();
  }

  // Change sales report period
  function changeSalesReportPeriod(period) {
    // Update active button
    document.querySelectorAll('#sales .chart-control').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Set date range based on period
    const today = new Date();
    let fromDate, toDate = today;
    
    if (period === 'week') {
      fromDate = new Date();
      fromDate.setDate(today.getDate() - 7);
    } else if (period === 'month') {
      fromDate = new Date();
      fromDate.setMonth(today.getMonth() - 1);
    } else if (period === 'year') {
      fromDate = new Date();
      fromDate.setFullYear(today.getFullYear() - 1);
    } else if (period === 'custom') {
      // Let user select custom dates
      document.getElementById('sales-report-from').value = '';
      document.getElementById('sales-report-to').value = '';
      return;
    }
    
    document.getElementById('sales-report-from').valueAsDate = fromDate;
    document.getElementById('sales-report-to').valueAsDate = toDate;
    
    // Generate report
    generateSalesReport();
  }

  // Change product report period
  function changeProductReportPeriod(period) {
    // Similar to changeSalesReportPeriod but for products
    // Implementation would be similar to sales report
  }

  // Change customer report period
  function changeCustomerReportPeriod(period) {
    // Similar to changeSalesReportPeriod but for customers
    // Implementation would be similar to sales report
  }

  // Change inventory report view
  function changeInventoryReportView(view) {
    // Similar to changeSalesReportPeriod but for inventory
    // Implementation would be similar to sales report
  }

  // Toggle user dropdown
  function toggleUserDropdown() {
    document.querySelector('.user-dropdown').classList.toggle('show');
  }

  // Add variant option
  function addVariantOption() {
    const container = document.getElementById('product-variants');
    const newOption = document.createElement('div');
    newOption.className = 'variant-option';
    newOption.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>Option Name (e.g. Size, Color)</label>
          <input type="text" class="variant-name" placeholder="Size">
        </div>
        <div class="form-group">
          <label>Option Values (comma separated)</label>
          <input type="text" class="variant-values" placeholder="S,M,L,XL">
        </div>
        <div class="form-group" style="align-self: flex-end;">
          <button type="button" class="btn btn-danger" onclick="removeVariantOption(this)">Remove</button>
        </div>
      </div>
    `;
    container.appendChild(newOption);
  }

  // Remove variant option
  function removeVariantOption(button) {
    button.closest('.variant-option').remove();
  }


  document.getElementById('product-form').addEventListener('submit', function(e) {
e.preventDefault();

// Get form values
const name = document.getElementById('product-name').value;
const category = document.getElementById('product-category').value;
const price = parseFloat(document.getElementById('product-price').value) || 0;
const comparePrice = parseFloat(document.getElementById('product-compare-price').value) || 0;
const stock = parseInt(document.getElementById('product-stock').value) || 0;
const sku = document.getElementById('product-sku').value;
const weight = parseFloat(document.getElementById('product-weight').value) || 0;
const barcode = document.getElementById('product-barcode').value;
const description = document.getElementById('product-description').value;
const seoTitle = document.getElementById('product-seo-title').value;
const seoDescription = document.getElementById('product-seo-description').value;
const image = document.getElementById('product-image-url').value;

// Get variant options
const variants = [];
document.querySelectorAll('.variant-option').forEach(option => {
const name = option.querySelector('.variant-name').value;
const values = option.querySelector('.variant-values').value.split(',').map(v => v.trim());
if (name && values.length > 0) {
  variants.push({ name, values });
}
});

// Create product object
const product = {
name,
category,
price,
comparePrice,
stock,
sku,
weight,
barcode,
description,
seoTitle,
seoDescription,
variants,
image, // Add the image URL to the product object
active: true,
createdAt: firebase.firestore.FieldValue.serverTimestamp(),
updatedAt: firebase.firestore.FieldValue.serverTimestamp()
};

// Add product to Firestore
db.collection('products').add(product)
.then(docRef => {
  alert(`Product created successfully with ID: ${docRef.id}`);
  showProductTab('all-products');
  loadProducts();
})
.catch(error => {
  console.error('Error creating product:', error);
  alert('Error creating product');
});
});
    
    // Add product to Firestore
 

  // Save category form
  document.getElementById('category-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('category-name').value;
    const slug = document.getElementById('category-slug').value;
    const parent = document.getElementById('category-parent').value;
    const description = document.getElementById('category-description').value;
    const seoTitle = document.getElementById('category-seo-title').value;
    const seoDescription = document.getElementById('category-seo-description').value;
    
    // Create category object
    const category = {
      name,
      slug,
      parent: parent || null,
      description,
      seoTitle,
      seoDescription,
      active: true,
      productCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Handle image upload if an image was selected
    const imageInput = document.getElementById('category-image');
    if (imageInput.files.length > 0) {
      // In a real app, you would upload the image and store its URL
      alert('Image upload would be implemented here');
    }
    
    // Add category to Firestore
    db.collection('categories').add(category)
      .then(docRef => {
        alert(`Category created successfully with ID: ${docRef.id}`);
        showCategoryTab('all-categories');
        loadCategories();
      })
      .catch(error => {
        console.error('Error creating category:', error);
        alert('Error creating category');
      });
  });

  // Save settings form
  document.getElementById('settings-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const storeName = document.getElementById('store-name').value;
    const storeEmail = document.getElementById('store-email').value;
    const storePhone = document.getElementById('store-phone').value;
    const storeAddress = document.getElementById('store-address').value;
    const storeCurrency = document.getElementById('store-currency').value;
    const storeTimezone = document.getElementById('store-timezone').value;
    
    // In a real app, you would save these settings to Firestore
    alert('Settings saved successfully');
  });

  // Save payment settings form
  document.getElementById('payment-settings-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // In a real app, you would save these settings to Firestore
    alert('Payment settings saved successfully');
  });

  // Save shipping settings form
  document.getElementById('shipping-settings-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // In a real app, you would save these settings to Firestore
    alert('Shipping settings saved successfully');
  });

  // Save tax settings form
  document.getElementById('tax-settings-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // In a real app, you would save these settings to Firestore
    alert('Tax settings saved successfully');
  });