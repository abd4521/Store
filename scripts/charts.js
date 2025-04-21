function initMenuToggles() {
    const menuItems = document.querySelectorAll('.admin-menu > li > a');
    menuItems.forEach(item => {
      const toggle = item.querySelector('.menu-toggle');
      if (toggle && item.nextElementSibling && item.nextElementSibling.classList.contains('submenu')) {
        item.addEventListener('click', function(e) {
          if (e.target !== toggle && !toggle.contains(e.target)) {
            const submenu = this.nextElementSibling;
            submenu.classList.toggle('show');
            toggle.classList.toggle('rotate');
            e.preventDefault();
          }
        });
      }
    });
  }

  // Initialize image upload functionality
  function initImageUploads() {
    // Product images
    document.getElementById('image-upload').addEventListener('click', function() {
      document.getElementById('product-images').click();
    });
    
    document.getElementById('product-images').addEventListener('change', function(e) {
      handleImageUpload(e, 'image-preview');
    });

    // Category image
    document.getElementById('category-image-upload').addEventListener('click', function() {
      document.getElementById('category-image').click();
    });
    
    document.getElementById('category-image').addEventListener('change', function(e) {
      handleImageUpload(e, 'category-image-preview');
    });

    // Store logo
    document.getElementById('logo-upload').addEventListener('click', function() {
      document.getElementById('store-logo').click();
    });
    
    document.getElementById('store-logo').addEventListener('change', function(e) {
      handleImageUpload(e, 'logo-preview');
    });
  }

  // Handle image upload and preview
  function handleImageUpload(event, previewContainerId) {
    const files = event.target.files;
    const previewContainer = document.getElementById(previewContainerId);
    previewContainer.innerHTML = '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.match('image.*')) continue;

      const reader = new FileReader();
      reader.onload = function(e) {
        const previewDiv = document.createElement('div');
        previewDiv.style.position = 'relative';
        previewDiv.style.display = 'inline-block';
        
        const img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'preview-image';
        
        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-image';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = function() {
          previewDiv.remove();
        };
        
        previewDiv.appendChild(img);
        previewDiv.appendChild(removeBtn);
        previewContainer.appendChild(previewDiv);
      };
      reader.readAsDataURL(file);
    }
  }

  // Initialize bulk update type selector
  function initBulkUpdateType() {
    document.getElementById('bulk-update-type').addEventListener('change', function() {
      document.querySelectorAll('.bulk-update-section').forEach(section => {
        section.style.display = 'none';
      });
      
      const selectedType = this.value;
      document.getElementById(`bulk-update-${selectedType}`).style.display = 'block';
    });

    document.getElementById('bulk-update-filter').addEventListener('change', function() {
      document.getElementById('bulk-update-category').style.display = 
        this.value === 'category' ? 'block' : 'none';
    });
  }

  // Initialize charts
  function initCharts() {
    // Sales Chart
    const salesCtx = document.getElementById('salesChart').getContext('2d');
    salesChart = new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Sales',
          data: [12000, 19000, 15000, 20000, 25000, 22000, 30000],
          backgroundColor: 'rgba(138, 35, 135, 0.2)',
          borderColor: 'rgba(138, 35, 135, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'PKR ' + value.toLocaleString();
              }
            }
          }
        }
      }
    });

    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    revenueChart = new Chart(revenueCtx, {
      type: 'doughnut',
      data: {
        labels: ['Men', 'Women', 'Accessories', 'Other'],
        datasets: [{
          data: [45, 35, 15, 5],
          backgroundColor: [
            'rgba(138, 35, 135, 0.7)',
            'rgba(233, 64, 87, 0.7)',
            'rgba(0, 176, 155, 0.7)',
            'rgba(150, 201, 61, 0.7)'
          ],
          borderColor: [
            'rgba(138, 35, 135, 1)',
            'rgba(233, 64, 87, 1)',
            'rgba(0, 176, 155, 1)',
            'rgba(150, 201, 61, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });

    // Initialize report charts with empty data
    initReportCharts();
  }

  // Initialize report charts
  function initReportCharts() {
    // Sales Report Chart
    const salesReportCtx = document.getElementById('salesReportChart').getContext('2d');
    salesReportChart = new Chart(salesReportCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'PKR ' + value.toLocaleString();
              }
            }
          }
        }
      }
    });

    // Product Report Chart
    const productReportCtx = document.getElementById('productReportChart').getContext('2d');
    productReportChart = new Chart(productReportCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    });

    // Customer Report Chart
    const customerReportCtx = document.getElementById('customerReportChart').getContext('2d');
    customerReportChart = new Chart(customerReportCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    });

    // Inventory Report Chart
    const inventoryReportCtx = document.getElementById('inventoryReportChart').getContext('2d');
    inventoryReportChart = new Chart(inventoryReportCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    });
  }

  // Check authentication state
 
