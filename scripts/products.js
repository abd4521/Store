function loadProducts() {
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = '<tr><td colspan="8" class="loading"><span class="loading-spinner"></span> Loading products...</td></tr>';

    let query = db.collection('products');

    // Apply category filter if selected
    const categoryFilter = document.getElementById('product-category-filter').value;
    if (categoryFilter) {
      query = query.where('category', '==', categoryFilter);
    }

    // Apply search filter if entered
    const searchTerm = document.getElementById('product-search').value.trim();
    if (searchTerm) {
      // This is a simplified search - in a real app you'd need a more robust solution
      query = query.where('name', '>=', searchTerm)
                  .where('name', '<=', searchTerm + '\uf8ff');
    }

    query.get().then(snapshot => {
      tbody.innerHTML = '';
      
      if (snapshot.empty) {
        tbody.innerHTML = '<tr><td colspan="8">No products found</td></tr>';
        return;
      }

      snapshot.forEach(doc => {
        const product = doc.data();
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
          <td>${doc.id.substring(0, 6)}</td>
          <td><img src="${product.image || 'https://via.placeholder.com/50'}" style="width:50px;height:50px;object-fit:cover;"></td>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>PKR ${product.price?.toLocaleString() || '0'}</td>
          <td>${product.stock || '0'}</td>
          <td><span class="status-badge status-${product.stock > 0 ? 'active' : 'inactive'}">${product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span></td>
          <td>
            <button class="action-btn view" onclick="viewProduct('${doc.id}')">View</button>
            <button class="action-btn edit" onclick="editProduct('${doc.id}')">Edit</button>
            <button class="action-btn delete" onclick="deleteProduct('${doc.id}')">Delete</button>
          </td>
        `;
        
        tbody.appendChild(tr);
      });
    }).catch(error => {
      console.error('Error loading products:', error);
      tbody.innerHTML = '<tr><td colspan="8">Error loading products</td></tr>';
    });
  }

  // View product details
  function viewProduct(productId) {
    selectedProductId = productId;
    
    db.collection('products').doc(productId).get().then(doc => {
      if (!doc.exists) {
        alert('Product not found');
        return;
      }

      const product = doc.data();
      const modal = document.getElementById('product-modal');
      const modalBody = modal.querySelector('.modal-body');
      
      // Fill modal with product data
      modalBody.innerHTML = `
        <div class="form-row">
          <div class="form-group">
            <label>Product Name</label>
            <input type="text" value="${product.name || ''}" readonly>
          </div>
          <div class="form-group">
            <label>SKU</label>
            <input type="text" value="${product.sku || ''}" readonly>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Price (PKR)</label>
            <input type="text" value="${product.price?.toLocaleString() || '0'}" readonly>
          </div>
          <div class="form-group">
            <label>Stock Quantity</label>
            <input type="text" value="${product.stock || '0'}" readonly>
          </div>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea readonly>${product.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Category</label>
          <input type="text" value="${product.category || ''}" readonly>
        </div>
        <div class="form-group">
          <label>Product Image</label>
          <img src="${product.image || 'https://via.placeholder.com/300'}" style="max-width:100%;max-height:200px;display:block;margin-top:10px;">
        </div>
      `;
      
      // Show modal
      modal.classList.add('show');
    }).catch(error => {
      console.error('Error loading product:', error);
      alert('Error loading product details');
    });
  }

  // Edit product
  function editProduct(productId) {
    selectedProductId = productId;
    
    db.collection('products').doc(productId).get().then(doc => {
      if (!doc.exists) {
        alert('Product not found');
        return;
      }

      const product = doc.data();
      const modal = document.getElementById('product-modal');
      const modalBody = modal.querySelector('.modal-body');
      
      // Fill modal with product data
      modalBody.innerHTML = `
        <form id="edit-product-form">
          <div class="form-row">
            <div class="form-group">
              <label for="edit-product-name">Product Name</label>
              <input type="text" id="edit-product-name" value="${product.name || ''}" required>
            </div>
            <div class="form-group">
              <label for="edit-product-sku">SKU</label>
              <input type="text" id="edit-product-sku" value="${product.sku || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="edit-product-price">Price (PKR)</label>
              <input type="number" id="edit-product-price" value="${product.price || '0'}" min="0" step="1" required>
            </div>
            <div class="form-group">
              <label for="edit-product-stock">Stock Quantity</label>
              <input type="number" id="edit-product-stock" value="${product.stock || '0'}" min="0" step="1" required>
            </div>
          </div>
          <div class="form-group">
            <label for="edit-product-description">Description</label>
            <textarea id="edit-product-description" required>${product.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label for="edit-product-category">Category</label>
            <select id="edit-product-category" required>
              <option value="men" ${product.category === 'men' ? 'selected' : ''}>Men's Clothing</option>
              <option value="women" ${product.category === 'women' ? 'selected' : ''}>Women's Clothing</option>
              <option value="accessories" ${product.category === 'accessories' ? 'selected' : ''}>Accessories</option>
            </select>
          </div>
          <div class="form-group">
            <label>Product Image</label>
            <div class="image-upload" id="edit-product-image-upload">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Click to upload new image</p>
              <small>or drag and drop</small>
              <input type="file" id="edit-product-image" style="display: none;">
            </div>
            <div class="image-preview" id="edit-product-image-preview">
              <img src="${product.image || 'https://via.placeholder.com/300'}" class="preview-image">
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModal('product-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      `;
      
      // Initialize image upload for edit
      document.getElementById('edit-product-image-upload').addEventListener('click', function() {
        document.getElementById('edit-product-image').click();
      });
      
      document.getElementById('edit-product-image').addEventListener('change', function(e) {
        handleImageUpload(e, 'edit-product-image-preview');
      });
      
      // Handle form submission
      document.getElementById('edit-product-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveProductChanges();
      });
      
      // Show modal
      modal.classList.add('show');
    }).catch(error => {
      console.error('Error loading product:', error);
      alert('Error loading product details');
    });
  }

  // Save product changes
  function saveProductChanges() {
    const name = document.getElementById('edit-product-name').value;
    const sku = document.getElementById('edit-product-sku').value;
    const price = parseFloat(document.getElementById('edit-product-price').value) || 0;
    const stock = parseInt(document.getElementById('edit-product-stock').value) || 0;
    const description = document.getElementById('edit-product-description').value;
    const category = document.getElementById('edit-product-category').value;
    
    const updates = {
      name,
      sku,
      price,
      stock,
      description,
      category,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Handle image upload if a new image was selected
    const imageInput = document.getElementById('edit-product-image');
    if (imageInput.files.length > 0) {
      const file = imageInput.files[0];
      const storageRef = storage.ref(`products/${selectedProductId}/${file.name}`);
      
      storageRef.put(file).then(snapshot => {
        return snapshot.ref.getDownloadURL();
      }).then(downloadURL => {
        updates.image = downloadURL;
        return db.collection('products').doc(selectedProductId).update(updates);
      }).then(() => {
        alert('Product updated successfully');
        closeModal('product-modal');
        loadProducts();
        loadLowStockItems();
      }).catch(error => {
        console.error('Error updating product:', error);
        alert('Error updating product');
      });
    } else {
      // No image to upload, just update the product data
      db.collection('products').doc(selectedProductId).update(updates)
        .then(() => {
          alert('Product updated successfully');
          closeModal('product-modal');
          loadProducts();
          loadLowStockItems();
        })
        .catch(error => {
          console.error('Error updating product:', error);
          alert('Error updating product');
        });
    }
  }

  // Delete product
  function deleteProduct(productId) {
    showConfirmModal(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      function() {
        db.collection('products').doc(productId).delete()
          .then(() => {
            alert('Product deleted successfully');
            loadProducts();
            loadLowStockItems();
          })
          .catch(error => {
            console.error('Error deleting product:', error);
            alert('Error deleting product');
          });
      }
    );
  }

  // Restock product
  function restockProduct(productId) {
    selectedProductId = productId;
    const newStock = prompt('Enter new stock quantity:', '10');
    
    if (newStock !== null && !isNaN(newStock)) {
      db.collection('products').doc(productId).update({
        stock: parseInt(newStock),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        alert('Product restocked successfully');
        loadProducts();
        loadLowStockItems();
      })
      .catch(error => {
        console.error('Error restocking product:', error);
        alert('Error restocking product');
      });
    }
  }

  // Load inventory
  function loadInventory() {
    const tbody = document.getElementById('inventory-table-body');
    tbody.innerHTML = '<tr><td colspan="9" class="loading"><span class="loading-spinner"></span> Loading inventory...</td></tr>';

    let query = db.collection('products');

    // Apply status filter if selected
    const statusFilter = document.getElementById('inventory-status-filter').value;
    if (statusFilter === 'low-stock') {
      query = query.where('stock', '<=', 5);
    } else if (statusFilter === 'out-of-stock') {
      query = query.where('stock', '==', 0);
    }

    // Apply search filter if entered
    const searchTerm = document.getElementById('inventory-search').value.trim();
    if (searchTerm) {
      query = query.where('name', '>=', searchTerm)
                  .where('name', '<=', searchTerm + '\uf8ff');
    }

    query.get().then(snapshot => {
      tbody.innerHTML = '';
      
      if (snapshot.empty) {
        tbody.innerHTML = '<tr><td colspan="9">No inventory items found</td></tr>';
        return;
      }

      snapshot.forEach(doc => {
        const product = doc.data();
        const tr = document.createElement('tr');
        
        let status = '';
        let statusClass = '';
        if (product.stock === 0) {
          status = 'Out of Stock';
          statusClass = 'inactive';
        } else if (product.stock <= 5) {
          status = 'Low Stock';
          statusClass = 'pending';
        } else {
          status = 'In Stock';
          statusClass = 'active';
        }
        
        tr.innerHTML = `
          <td>#${doc.id.substring(0, 6)}</td>
          <td><img src="${product.image || 'https://via.placeholder.com/50'}" style="width:50px;height:50px;object-fit:cover;"></td>
          <td>${product.name}</td>
          <td>${product.sku || 'N/A'}</td>
          <td>${product.stock || '0'}</td>
          <td>5</td>
          <td><span class="status-badge status-${statusClass}">${status}</span></td>
          <td>${product.updatedAt?.toDate().toLocaleDateString() || 'N/A'}</td>
          <td>
            <button class="action-btn edit" onclick="restockProduct('${doc.id}')">Update Stock</button>
          </td>
        `;
        
        tbody.appendChild(tr);
      });
    }).catch(error => {
      console.error('Error loading inventory:', error);
      tbody.innerHTML = '<tr><td colspan="9">Error loading inventory</td></tr>';
    });
  }

  // Load all categories
  function loadCategories() {
    const tbody = document.getElementById('categories-table-body');
    tbody.innerHTML = '<tr><td colspan="6" class="loading"><span class="loading-spinner"></span> Loading categories...</td></tr>';

    let query = db.collection('categories');

    // Apply search filter if entered
    const searchTerm = document.getElementById('category-search').value.trim();
    if (searchTerm) {
      query = query.where('name', '>=', searchTerm)
                  .where('name', '<=', searchTerm + '\uf8ff');
    }

    query.get().then(snapshot => {
      tbody.innerHTML = '';
      
      if (snapshot.empty) {
        tbody.innerHTML = '<tr><td colspan="6">No categories found</td></tr>';
        return;
      }

      snapshot.forEach(doc => {
        const category = doc.data();
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
          <td>${doc.id.substring(0, 6)}</td>
          <td>${category.name}</td>
          <td>${category.slug}</td>
          <td>${category.productCount || '0'}</td>
          <td><span class="status-badge status-${category.active ? 'active' : 'inactive'}">${category.active ? 'Active' : 'Inactive'}</span></td>
          <td>
            <button class="action-btn edit" onclick="editCategory('${doc.id}')">Edit</button>
            <button class="action-btn delete" onclick="deleteCategory('${doc.id}')">Delete</button>
          </td>
        `;
        
        tbody.appendChild(tr);
      });
    }).catch(error => {
      console.error('Error loading categories:', error);
      tbody.innerHTML = '<tr><td colspan="6">Error loading categories</td></tr>';
    });
  }

  // Edit category
  function editCategory(categoryId) {
    selectedCategoryId = categoryId;
    
    db.collection('categories').doc(categoryId).get().then(doc => {
      if (!doc.exists) {
        alert('Category not found');
        return;
      }

      const category = doc.data();
      const modal = document.getElementById('category-modal') || createModal('category-modal', 'Category Details');
      const modalBody = modal.querySelector('.modal-body');
      
      // Fill modal with category data
      modalBody.innerHTML = `
        <form id="edit-category-form">
          <div class="form-group">
            <label for="edit-category-name">Category Name</label>
            <input type="text" id="edit-category-name" value="${category.name || ''}" required>
          </div>
          <div class="form-group">
            <label for="edit-category-slug">Slug</label>
            <input type="text" id="edit-category-slug" value="${category.slug || ''}" required>
          </div>
          <div class="form-group">
            <label for="edit-category-parent">Parent Category</label>
            <select id="edit-category-parent">
              <option value="">None</option>
              <option value="men" ${category.parent === 'men' ? 'selected' : ''}>Men's Clothing</option>
              <option value="women" ${category.parent === 'women' ? 'selected' : ''}>Women's Clothing</option>
              <option value="accessories" ${category.parent === 'accessories' ? 'selected' : ''}>Accessories</option>
            </select>
          </div>
          <div class="form-group">
            <label for="edit-category-active">Status</label>
            <select id="edit-category-active">
              <option value="true" ${category.active ? 'selected' : ''}>Active</option>
              <option value="false" ${!category.active ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
          <div class="form-group">
            <label>Category Image</label>
            <div class="image-upload" id="edit-category-image-upload">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Click to upload new image</p>
              <small>or drag and drop</small>
              <input type="file" id="edit-category-image" style="display: none;">
            </div>
            <div class="image-preview" id="edit-category-image-preview">
              ${category.image ? `<img src="${category.image}" class="preview-image">` : ''}
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModal('category-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      `;
      
      // Initialize image upload for edit
      document.getElementById('edit-category-image-upload').addEventListener('click', function() {
        document.getElementById('edit-category-image').click();
      });
      
      document.getElementById('edit-category-image').addEventListener('change', function(e) {
        handleImageUpload(e, 'edit-category-image-preview');
      });
      
      // Handle form submission
      document.getElementById('edit-category-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCategoryChanges();
      });
      
      // Show modal
      modal.classList.add('show');
    }).catch(error => {
      console.error('Error loading category:', error);
      alert('Error loading category details');
    });
  }

  // Save category changes
  function saveCategoryChanges() {
    const name = document.getElementById('edit-category-name').value;
    const slug = document.getElementById('edit-category-slug').value;
    const parent = document.getElementById('edit-category-parent').value;
    const active = document.getElementById('edit-category-active').value === 'true';
    
    const updates = {
      name,
      slug,
      parent,
      active,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Handle image upload if a new image was selected
    const imageInput = document.getElementById('edit-category-image');
    if (imageInput.files.length > 0) {
      const file = imageInput.files[0];
      const storageRef = storage.ref(`categories/${selectedCategoryId}/${file.name}`);
      
      storageRef.put(file).then(snapshot => {
        return snapshot.ref.getDownloadURL();
      }).then(downloadURL => {
        updates.image = downloadURL;
        return db.collection('categories').doc(selectedCategoryId).update(updates);
      }).then(() => {
        alert('Category updated successfully');
        closeModal('category-modal');
        loadCategories();
      }).catch(error => {
        console.error('Error updating category:', error);
        alert('Error updating category');
      });
    } else {
      // No image to upload, just update the category data
      db.collection('categories').doc(selectedCategoryId).update(updates)
        .then(() => {
          alert('Category updated successfully');
          closeModal('category-modal');
          loadCategories();
        })
        .catch(error => {
          console.error('Error updating category:', error);
          alert('Error updating category');
        });
    }
  }

  // Delete category
  function deleteCategory(categoryId) {
    showConfirmModal(
      'Delete Category',
      'Are you sure you want to delete this category? Products in this category will not be deleted but will no longer be associated with this category.',
      function() {
        db.collection('categories').doc(categoryId).delete()
          .then(() => {
            alert('Category deleted successfully');
            loadCategories();
          })
          .catch(error => {
            console.error('Error deleting category:', error);
            alert('Error deleting category');
          });
      }
    );
  }
