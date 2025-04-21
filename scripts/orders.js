function loadOrders() {
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = '<tr><td colspan="7" class="loading"><span class="loading-spinner"></span> Loading orders...</td></tr>';

    let query = db.collection('orders').orderBy('createdAt', 'desc');

    // Apply status filter if selected
    const statusFilter = document.getElementById('order-status-filter').value;
    if (statusFilter) {
      query = query.where('status', '==', statusFilter);
    }

    // Apply search filter if entered
    const searchTerm = document.getElementById('order-search').value.trim();
    if (searchTerm) {
      // This is a simplified search - in a real app you'd need a more robust solution
      query = query.where('orderNumber', '>=', searchTerm)
                  .where('orderNumber', '<=', searchTerm + '\uf8ff');
    }

    query.get().then(snapshot => {
      tbody.innerHTML = '';
      
      if (snapshot.empty) {
        tbody.innerHTML = '<tr><td colspan="7">No orders found</td></tr>';
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
          <td>${order.paymentStatus || 'Pending'}</td>
          <td>
            <button class="action-btn view" onclick="viewOrder('${doc.id}')">View</button>
            <button class="action-btn edit" onclick="editOrder('${doc.id}')">Edit</button>
          </td>
        `;
        
        tbody.appendChild(tr);
      });
    }).catch(error => {
      console.error('Error loading orders:', error);
      tbody.innerHTML = '<tr><td colspan="7">Error loading orders</td></tr>';
    });
  }

  // View order details
  function viewOrder(orderId) {
selectedOrderId = orderId;

db.collection('orders').doc(orderId).get().then(doc => {
    if (!doc.exists) {
        alert('Order not found');
        return;
    }

    const order = doc.data();
    const modal = document.getElementById('order-modal');

    // Fill modal with order data
    document.getElementById('modal-order-id').value = `#${orderId.substring(0, 8)}`;
    document.getElementById('modal-order-date').value = order.createdAt?.toDate().toLocaleString() || 'N/A';
    document.getElementById('modal-order-customer').value = order.userName || 'Guest';
    document.getElementById('modal-order-status').value = order.status || 'pending';
    document.getElementById('modal-order-note').value = order.note || '';
    document.getElementById('modal-tracking-number').value = order.trackingNumber || '';
    document.getElementById('modal-shipping-method').value = order.shippingMethod || 'Standard';
    document.getElementById('modal-shipping-address').value = `${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.province || ''}` || '';
    document.getElementById('modal-payment-method').value = order.paymentMethod || 'Cash on Delivery';
    document.getElementById('modal-payment-status').value = order.paymentStatus || 'pending';

    // Clear and populate order items
    const itemsTbody = document.getElementById('modal-order-items');
    itemsTbody.innerHTML = '';

    if (order.products) {
        let subtotal = 0;

        // Iterate over the products map
        Object.keys(order.products).forEach(key => {
            const item = order.products[key];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.name}</td>
                <td>PKR ${item.price?.toLocaleString() || '0'}</td>
                <td>${item.quantity || 1}</td>
                <td>PKR ${(item.price * item.quantity).toLocaleString()}</td>
            `;
            itemsTbody.appendChild(tr);
            subtotal += item.price * item.quantity;
        });

        // Calculate totals
        const shipping = order.shippingFee || 0;
        const tax = order.tax || 0; // Ensure tax is defined in your order structure
        const discount = order.discount || 0; // Ensure discount is defined in your order structure
        const total = subtotal + shipping + tax - discount;

        document.getElementById('modal-order-subtotal').textContent = `PKR ${subtotal.toLocaleString()}`;
        document.getElementById('modal-order-shipping').textContent = `PKR ${shipping.toLocaleString()}`;
        document.getElementById('modal-order-tax').textContent = `PKR ${tax.toLocaleString()}`;
        document.getElementById('modal-order-discount').textContent = `PKR ${discount.toLocaleString()}`;
        document.getElementById('modal-order-total').textContent = `PKR ${total.toLocaleString()}`;
    }

    // Show modal
    modal.classList.add('show');
}).catch(error => {
    console.error('Error loading order:', error);
    alert('Error loading order details');
});
}

  // Edit order
  function editOrder(orderId) {
    selectedOrderId = orderId;
    viewOrder(orderId); // For simplicity, we're using the same modal
  }

  // Save order changes
  function saveOrderChanges() {
    const status = document.getElementById('modal-order-status').value;
    const trackingNumber = document.getElementById('modal-tracking-number').value;
    const paymentStatus = document.getElementById('modal-payment-status').value;

    const updates = {
      status,
      trackingNumber,
      paymentStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('orders').doc(selectedOrderId).update(updates)
      .then(() => {
        alert('Order updated successfully');
        closeModal('order-modal');
        loadOrders();
        loadRecentOrders();
      })
      .catch(error => {
        console.error('Error updating order:', error);
        alert('Error updating order');
      });
  }

  // Cancel order
  function cancelOrder() {
    showConfirmModal(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      function() {
        db.collection('orders').doc(selectedOrderId).update({
          status: 'cancelled',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
          alert('Order cancelled successfully');
          closeModal('order-modal');
          loadOrders();
          loadRecentOrders();
        })
        .catch(error => {
          console.error('Error cancelling order:', error);
          alert('Error cancelling order');
        });
      }
    );
  }

  // Show create order modal
  function showCreateOrderModal() {
    const modal = document.getElementById('create-order-modal');
    
    // Reset form
    document.getElementById('new-order-customer').value = '';
    document.getElementById('new-order-date').valueAsDate = new Date();
    document.getElementById('new-order-product').value = '';
    document.getElementById('new-order-quantity').value = 1;
    document.getElementById('new-order-items').innerHTML = '';
    document.getElementById('new-order-subtotal').textContent = 'PKR 0';
    document.getElementById('new-order-shipping').value = 'standard';
    document.getElementById('new-order-discount').value = '';
    document.getElementById('new-order-note').value = '';
    document.getElementById('new-order-address').value = '';
    
    // Show modal
    modal.classList.add('show');
  }

  // Add item to new order
  function addOrderItem() {
    const productSelect = document.getElementById('new-order-product');
    const quantityInput = document.getElementById('new-order-quantity');
    
    if (!productSelect.value) {
      alert('Please select a product');
      return;
    }
    
    const productText = productSelect.options[productSelect.selectedIndex].text;
    const priceMatch = productText.match(/PKR ([\d,]+)/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
    const quantity = parseInt(quantityInput.value) || 1;
    const total = price * quantity;
    
    const tbody = document.getElementById('new-order-items');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${productText}</td>
      <td>PKR ${price.toLocaleString()}</td>
      <td>${quantity}</td>
      <td>PKR ${total.toLocaleString()}</td>
      <td><button class="action-btn delete" onclick="removeOrderItem(this)">Remove</button></td>
    `;
    tr.dataset.price = price;
    tr.dataset.quantity = quantity;
    tbody.appendChild(tr);
    
    // Update subtotal
    updateOrderSubtotal();
    
    // Reset inputs
    productSelect.value = '';
    quantityInput.value = 1;
  }

  // Remove item from new order
  function removeOrderItem(button) {
    const tr = button.closest('tr');
    tr.remove();
    updateOrderSubtotal();
  }

  // Update order subtotal
  function updateOrderSubtotal() {
    const rows = document.getElementById('new-order-items').querySelectorAll('tr');
    let subtotal = 0;
    
    rows.forEach(row => {
      subtotal += parseFloat(row.dataset.price) * parseInt(row.dataset.quantity);
    });
    
    document.getElementById('new-order-subtotal').textContent = `PKR ${subtotal.toLocaleString()}`;
  }

  // Create new order
  function createNewOrder() {
    const customerId = document.getElementById('new-order-customer').value;
    const customerText = document.getElementById('new-order-customer').options[document.getElementById('new-order-customer').selectedIndex].text;
    const orderDate = document.getElementById('new-order-date').value;
    const shippingMethod = document.getElementById('new-order-shipping').value;
    const shippingCost = shippingMethod === 'express' ? 500 : 200;
    const discountCode = document.getElementById('new-order-discount').value;
    const note = document.getElementById('new-order-note').value;
    const address = document.getElementById('new-order-address').value;
    
    // Get order items
    const items = [];
    const rows = document.getElementById('new-order-items').querySelectorAll('tr');
    
    if (rows.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }
    
    let subtotal = 0;
    rows.forEach(row => {
      const name = row.cells[0].textContent.split(' - ')[0];
      const price = parseFloat(row.dataset.price);
      const quantity = parseInt(row.dataset.quantity);
      
      items.push({
        name,
        price,
        quantity,
        productId: row.dataset.productId || ''
      });
      
      subtotal += price * quantity;
    });
    
    // Calculate totals
    const discount = 0; // In a real app, you'd calculate this based on discount code
    const tax = 0; // In a real app, you'd calculate tax
    const total = subtotal + shippingCost + tax - discount;
    
    // Create order object
    const order = {
      customerId,
      customerName: customerText.split(' (')[0],
      items,
      subtotal,
      shippingCost,
      tax,
      discount,
      total,
      status: 'pending',
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'pending',
      shippingMethod: shippingMethod === 'express' ? 'Express Shipping' : 'Standard Shipping',
      shippingAddress: address,
      note,
      createdAt: firebase.firestore.Timestamp.fromDate(new Date(orderDate)),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Add order to Firestore
    db.collection('orders').add(order)
      .then(docRef => {
        alert(`Order created successfully with ID: ${docRef.id}`);
        closeModal('create-order-modal');
        loadOrders();
        loadRecentOrders();
      })
      .catch(error => {
        console.error('Error creating order:', error);
        alert('Error creating order');
      });
  }

  // Export orders
  function exportOrders() {
    alert('Exporting orders to CSV...');
    // In a real app, you would generate and download a CSV file
  }
