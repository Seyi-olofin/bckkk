// Modern Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  const menuToggle = document.getElementById('menuToggle');
  const loginModal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const searchInput = document.getElementById('searchInput');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.section');

  // Content Management Elements
  const contentTabs = document.querySelectorAll('.content-tab');
  const contentTabContents = document.querySelectorAll('.content-tab-content');
  const addGeneratorBtn = document.getElementById('addGeneratorBtn');
  const addMineralBtn = document.getElementById('addMineralBtn');
  const addNewsBtn = document.getElementById('addNewsBtn');

  // Modal Elements
  const productModal = document.getElementById('productModal');
  const walletModal = document.getElementById('walletModal');
  const approvalModal = document.getElementById('approvalModal');

  // Form Elements
  const productForm = document.getElementById('productForm');
  const approvalForm = document.getElementById('approvalForm');

  // Button Elements
  const addProductBtn = document.getElementById('addProductBtn');
  const addWalletBtn = document.getElementById('addWalletBtn');
  const addOrderBtn = document.getElementById('addOrderBtn');
  const depositBtn = document.getElementById('depositBtn');
  const withdrawBtn = document.getElementById('withdrawBtn');

  // State
  let currentSection = 'overview';
  let currentProduct = null;
  let currentWallet = null;
  let pendingWithdrawalId = null;
  let adminProfile = null;

  // Initialize
  init();

  function init() {
    setupEventListeners();
    checkAuthentication();
    initializeCharts();
    loadDummyData();
    initializeThemeToggle();
  }

  // Theme toggle functionality
  function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeToggleText = document.getElementById('themeToggleText');

    if (themeToggle && themeToggleText) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    // Load saved theme
    const savedTheme = localStorage.getItem('adminTheme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeToggleText) themeToggleText.textContent = 'Light Mode';
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const themeToggleText = document.getElementById('themeToggleText');

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('adminTheme', newTheme);

    // Update button text
    if (themeToggleText) {
      themeToggleText.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
  }

  // Chart.js integration
  function initializeCharts() {
    // Check if Chart.js is available
    if (typeof Chart !== 'undefined') {
      createSalesChart();
    } else {
      // Fallback to animated bars
      animateChartBars();
    }
  }

  function createSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    // Hide placeholder and show canvas
    document.querySelector('.chart-placeholder').style.display = 'none';
    ctx.style.display = 'block';

    const salesData = [120, 195, 135, 240, 165, 210, 180];

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Sales',
          data: salesData,
          backgroundColor: 'rgba(225, 6, 0, 0.8)',
          borderColor: 'rgba(225, 6, 0, 1)',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
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
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  function animateChartBars() {
    const bars = document.querySelectorAll('.chart-bar.animated');
    bars.forEach((bar, index) => {
      const targetHeight = bar.style.height;
      bar.style.setProperty('--target-height', targetHeight);
      bar.style.height = '0%';
      setTimeout(() => {
        bar.style.height = targetHeight;
      }, index * 100);
    });
  }

  function setupEventListeners() {
    // Navigation
    menuToggle.addEventListener('click', toggleSidebar);
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        switchSection(section);
      });
    });

    // Authentication
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    // Modals - Removed login modal close button handler for security
    document.getElementById('productModalClose').addEventListener('click', () => hideModal(productModal));
    document.getElementById('walletModalClose').addEventListener('click', () => hideModal(walletModal));
    document.getElementById('approvalModalClose').addEventListener('click', () => hideModal(approvalModal));

    // Forms
    productForm.addEventListener('submit', handleProductSubmit);
    walletForm.addEventListener('submit', handleWalletSubmit);
    approvalForm.addEventListener('submit', handleApprovalSubmit);

    // Settings forms
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');

    if (profileForm) profileForm.addEventListener('submit', handleProfileUpdate);
    if (passwordForm) passwordForm.addEventListener('submit', handlePasswordChange);

    // Buttons
    addProductBtn.addEventListener('click', () => openProductModal());
    addWalletBtn.addEventListener('click', () => openWalletModal());
    addOrderBtn.addEventListener('click', () => openOrderModal());
    depositBtn.addEventListener('click', () => handleDeposit());
    withdrawBtn.addEventListener('click', () => handleWithdraw());

    // Search
    searchInput.addEventListener('input', handleSearch);

    // Close modals on outside click
    [loginModal, productModal, walletModal, approvalModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal(modal);
      });
    });

    // Cancel buttons
    document.getElementById('productCancelBtn').addEventListener('click', () => hideModal(productModal));
    document.getElementById('walletCancelBtn').addEventListener('click', () => hideModal(walletModal));

    // Content Management
    contentTabs.forEach(tab => {
      tab.addEventListener('click', () => switchContentTab(tab.dataset.tab));
    });

    addGeneratorBtn.addEventListener('click', () => openGeneratorModal());
    addMineralBtn.addEventListener('click', () => openMineralModal());
    addNewsBtn.addEventListener('click', () => openNewsModal());

    // Settings buttons
    const viewLoginHistoryBtn = document.getElementById('viewLoginHistory');
    if (viewLoginHistoryBtn) viewLoginHistoryBtn.addEventListener('click', () => showToast('Login history feature coming soon', 'info'));
  }

  // Helper function to get API base URL
  function getApiBaseUrl() {
    return window.location.hostname === 'localhost' ? '' : 'https://backyymii.onrender.com'; // Your Render backend URL
  }

  async function checkAuthentication() {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/me`);
      if (response.ok) {
        const data = await response.json();
        if (data.auth) {
          hideModal(loginModal);
          await loadDashboard();
          initializeAfterAuth();
          return;
        }
      }
    } catch (error) {
      console.warn('Auth check failed:', error);
    }
    showModal(loginModal);
  }

  // Security: Auto-logout after inactivity
  let inactivityTimer;
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      handleLogout();
      showToast('Session expired due to inactivity', 'warning');
    }, INACTIVITY_TIMEOUT);
  }

  function setupActivityListeners() {
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        hideModal(loginModal);
        await loadDashboard();
        initializeAfterAuth();
        showToast('Login successful', 'success');
      } else {
        showToast(data.message || 'Login failed', 'error');
      }
    } catch (error) {
      showToast('Login error', 'error');
    }
  }

  // Login modal is now secure - no close button to prevent bypassing authentication

  async function handleLogout() {
    try {
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/api/admin/logout`, { method: 'POST' });
      showModal(loginModal);
      showToast('Logged out successfully', 'success');
    } catch (error) {
      console.warn('Logout error:', error);
    }
  }

  async function loadDashboard() {
    try {
      await Promise.all([
        loadStats(),
        loadOrders(),
        loadProducts(),
        loadWallets(),
        loadRecentActivity(),
        loadAnalyticsData(),
        loadContentData(),
        loadAdminProfile()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      showToast('Failed to load dashboard data', 'error');
    }
  }

  async function loadStats() {
    try {
      const baseUrl = getApiBaseUrl();
      const [ordersRes, productsRes, walletsRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/orders`),
        fetch(`${baseUrl}/api/admin/products`),
        fetch(`${baseUrl}/api/admin/wallets`)
      ]);

      const orders = await ordersRes.json();
      const products = await productsRes.json();
      const wallets = await walletsRes.json();

      // Calculate stats
      const totalOrders = orders.items?.length || 0;
      const totalRevenue = orders.items?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
      const pendingOrders = orders.items?.filter(order => order.status === 'pending').length || 0;
      const totalProducts = products.items?.length || 0;

      // Update UI
      document.getElementById('stat-orders').textContent = totalOrders;
      document.getElementById('stat-revenue').textContent = `₦${totalRevenue.toLocaleString()}`;
      document.getElementById('stat-pending').textContent = pendingOrders;
      document.getElementById('stat-customers').textContent = totalProducts; // Using products as proxy for now
    } catch (error) {
      console.warn('Failed to load stats:', error);
    }
  }

  async function loadOrders() {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/orders`);
      const data = await response.json();

      const tbody = document.getElementById('orders-tbody');
      tbody.innerHTML = '';

      if (data.items && data.items.length > 0) {
        data.items.forEach(order => {
          const row = createOrderRow(order);
          tbody.appendChild(row);
        });
      } else {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="6" style="text-align: center; padding: 2rem;">No orders found</td>';
        tbody.appendChild(emptyRow);
      }
    } catch (error) {
      console.warn('Failed to load orders:', error);
      showToast('Failed to load orders', 'error');
    }
  }

  function createOrderRow(order) {
    const row = document.createElement('tr');

    const statusClass = order.status === 'shipped' ? 'shipped' :
                       order.status === 'delivered' ? 'delivered' : 'pending';

    row.innerHTML = `
      <td>${order.reference || 'N/A'}</td>
      <td>${order.customer?.email || 'N/A'}</td>
      <td>₦${(order.amount || 0).toLocaleString()}</td>
      <td><span class="status ${statusClass}">${order.status || 'pending'}</span></td>
      <td>${new Date(order.created_at || Date.now()).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-ghost" onclick="editOrder(${order.id})">Edit</button>
        <button class="btn btn-ghost" onclick="markShipped(${order.id})">Ship</button>
        <button class="btn btn-ghost" onclick="deleteOrder(${order.id})">Delete</button>
      </td>
    `;

    return row;
  }

  async function loadProducts() {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/products`);
      const data = await response.json();

      const grid = document.getElementById('products-grid');
      grid.innerHTML = '';

      if (data.items && data.items.length > 0) {
        data.items.forEach(product => {
          const card = createProductCard(product);
          grid.appendChild(card);
        });
      } else {
        grid.innerHTML = '<p style="text-align: center; padding: 2rem;">No products found</p>';
      }
    } catch (error) {
      console.warn('Failed to load products:', error);
      showToast('Failed to load products', 'error');
    }
  }

  function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    card.innerHTML = `
      <div class="product-image" style="background-color: #f0f0f0; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 3rem; color: #ccc;">📦</span>
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name || 'Untitled Product'}</h3>
        <p class="product-price">₦${((product.price_cents || 0) / 100).toFixed(2)}</p>
        <p class="product-description">${product.description || 'No description available'}</p>
        <div class="product-actions">
          <button class="btn btn-primary" onclick="editProduct(${product.id})">Edit</button>
          <button class="btn btn-ghost" onclick="deleteProduct(${product.id})">Delete</button>
        </div>
      </div>
    `;

    return card;
  }

  async function loadWallets() {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/wallets`);
      const data = await response.json();

      const overview = document.getElementById('wallet-overview');
      const history = document.getElementById('transactions-history');

      overview.innerHTML = '<h3>Wallet Overview</h3>';
      history.innerHTML = '<h3>Transaction History</h3>';

      if (data.items && data.items.length > 0) {
        data.items.forEach(wallet => {
          const walletCard = createWalletCard(wallet);
          overview.appendChild(walletCard);
        });

        // Load transaction history for first wallet
        await loadTransactionHistory(data.items[0].id);
      } else {
        overview.innerHTML += '<p>No wallets found</p>';
        history.innerHTML += '<p>No transactions found</p>';
      }
    } catch (error) {
      console.warn('Failed to load wallets:', error);
      showToast('Failed to load wallets', 'error');
    }
  }

  function createWalletCard(wallet) {
    const card = document.createElement('div');
    card.className = 'wallet-card';

    card.innerHTML = `
      <h4 class="wallet-owner">${wallet.owner || 'Unknown Owner'}</h4>
      <p class="wallet-balance">₦${((wallet.balance || 0) / 100).toFixed(2)}</p>
      <div style="margin-top: 1rem;">
        <button class="btn btn-secondary" onclick="viewWallet(${wallet.id})">View Details</button>
      </div>
    `;

    return card;
  }

  async function loadTransactionHistory(walletId) {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/wallets/${walletId}/transactions`);
      const data = await response.json();

      const history = document.getElementById('transactions-history');
      history.innerHTML = '<h3>Transaction History</h3>';

      if (data.transactions && data.transactions.length > 0) {
        data.transactions.forEach(transaction => {
          const item = createTransactionItem(transaction);
          history.appendChild(item);
        });
      } else {
        history.innerHTML += '<p>No transactions found</p>';
      }
    } catch (error) {
      console.warn('Failed to load transaction history:', error);
    }
  }

  function createTransactionItem(transaction) {
    const item = document.createElement('div');
    item.className = 'transaction-item';

    const amountClass = transaction.type === 'deposit' ? 'positive' : 'negative';
    const amountPrefix = transaction.type === 'deposit' ? '+' : '-';

    item.innerHTML = `
      <div>
        <div style="font-weight: 600;">${transaction.description || 'Transaction'}</div>
        <div style="font-size: 0.875rem; color: #64748b;">${new Date(transaction.created_at || Date.now()).toLocaleDateString()}</div>
      </div>
      <div class="transaction-amount ${amountClass}">${amountPrefix}₦${((transaction.amount || 0) / 100).toFixed(2)}</div>
    `;

    return item;
  }

  async function loadRecentActivity() {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/activity`);
      const data = await response.json();

      const list = document.getElementById('recent-activity-list');
      list.innerHTML = '';

      if (data.activities && data.activities.length > 0) {
        data.activities.slice(0, 5).forEach(activity => {
          const item = createActivityItem(activity);
          list.appendChild(item);
        });
      } else {
        list.innerHTML = '<p>No recent activity</p>';
      }
    } catch (error) {
      console.warn('Failed to load recent activity:', error);
    }
  }

  function createActivityItem(activity) {
    const item = document.createElement('div');
    item.className = 'activity-item';

    item.innerHTML = `
      <div class="activity-icon">${activity.icon || '📋'}</div>
      <div class="activity-content">
        <h4 class="activity-title">${activity.title || 'Activity'}</h4>
        <p class="activity-description">${activity.description || ''}</p>
      </div>
    `;

    return item;
  }

  // Modal Functions
  function showModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function hideModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  function openProductModal(product = null) {
    currentProduct = product;
    const title = product ? 'Edit Product' : 'Add Product';
    document.getElementById('productModalTitle').textContent = title;

    if (product) {
      document.getElementById('productId').value = product.id;
      document.getElementById('productName').value = product.name || '';
      document.getElementById('productPrice').value = (product.price_cents || 0) / 100;
      document.getElementById('productDescription').value = product.description || '';
    } else {
      productForm.reset();
      document.getElementById('productId').value = '';
    }

    showModal(productModal);
  }

  function openWalletModal(wallet = null) {
    currentWallet = wallet;
    const title = wallet ? 'Wallet Details' : 'Add New Wallet';
    document.getElementById('walletModalTitle').textContent = title;

    const walletForm = document.getElementById('walletForm');
    const walletContent = document.getElementById('walletModalContent');

    if (wallet) {
      // Show wallet details for existing wallet
      walletForm.style.display = 'none';
      walletContent.style.display = 'block';
      walletContent.innerHTML = `
        <div class="wallet-details">
          <div class="wallet-info-card">
            <h4>${wallet.owner || 'Unknown Owner'}</h4>
            <div class="wallet-balance-display">
              <span class="balance-label">Current Balance:</span>
              <span class="balance-amount">₦${((wallet.balance || 0) / 100).toFixed(2)}</span>
            </div>
            <p class="wallet-meta">Created: ${new Date(wallet.created_at || Date.now()).toLocaleDateString()}</p>
          </div>
          <div class="wallet-actions">
            <button class="btn btn-primary" onclick="handleDeposit(${wallet.id})">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V20M20 12H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Deposit Funds
            </button>
            <button class="btn btn-secondary" onclick="handleWithdraw(${wallet.id})">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 12H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Withdraw Funds
            </button>
          </div>
        </div>
      `;
    } else {
      // Show form for new wallet
      walletForm.style.display = 'block';
      walletContent.style.display = 'none';
      walletForm.reset();
    }

    showModal(walletModal);
  }

  function openOrderModal() {
    showToast('Add order functionality coming soon', 'warning');
  }

  // Settings Functions
  async function loadAdminProfile() {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/profile`);
      const data = await response.json();

      if (data.success) {
        adminProfile = data.profile;
        populateProfileForm();
      }
    } catch (error) {
      console.warn('Failed to load admin profile:', error);
    }
  }

  function populateProfileForm() {
    if (!adminProfile) return;

    const nameInput = document.getElementById('adminName');
    const emailInput = document.getElementById('adminEmail');

    if (nameInput) nameInput.value = adminProfile.name || '';
    if (emailInput) emailInput.value = adminProfile.email || '';
  }

  async function handleProfileUpdate(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const profileData = {
      name: formData.get('name'),
      email: formData.get('email')
    };

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        adminProfile = { ...adminProfile, ...profileData };
        showToast('Profile updated successfully', 'success');

        // Update header greeting
        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement) adminNameElement.textContent = profileData.name;
      } else {
        showToast(data.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      showToast('Error updating profile', 'error');
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const passwordData = {
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmPassword: formData.get('confirmPassword')
    };

    // Client-side validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Password changed successfully', 'success');
        e.target.reset();
      } else {
        showToast(data.message || 'Failed to change password', 'error');
      }
    } catch (error) {
      showToast('Error changing password', 'error');
    }
  }

  // Form Handlers
  async function handleProductSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const productData = {
      name: formData.get('name'),
      price_cents: Math.round(parseFloat(formData.get('price')) * 100),
      description: formData.get('description')
    };

    const productId = formData.get('id');

    try {
      const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products';
      const method = productId ? 'PUT' : 'POST';

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}${url}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        hideModal(productModal);
        await loadProducts();
        showToast(`Product ${productId ? 'updated' : 'created'} successfully`, 'success');
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to save product', 'error');
      }
    } catch (error) {
      showToast('Error saving product', 'error');
    }
  }

  async function handleApprovalSubmit(e) {
    e.preventDefault();

    const password = document.getElementById('approvalPassword').value;

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/withdrawals/${pendingWithdrawalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        hideModal(approvalModal);
        await loadWallets();
        showToast('Withdrawal approved successfully', 'success');
      } else {
        showToast(data.message || 'Approval failed', 'error');
      }
    } catch (error) {
      showToast('Approval error', 'error');
    }
  }

  // Form Handlers
  async function handleWalletSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const walletData = {
      owner: formData.get('owner'),
      currency: formData.get('currency') || 'NGN',
      balance: formData.get('initialBalance') ? Math.round(parseFloat(formData.get('initialBalance')) * 100) : 0
    };

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(walletData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        hideModal(walletModal);
        await loadWallets();
        showToast('Wallet created successfully', 'success');
      } else {
        showToast(data.message || 'Failed to create wallet', 'error');
      }
    } catch (error) {
      showToast('Error creating wallet', 'error');
    }
  }

  // Action Handlers
  async function handleDeposit(walletId) {
    const amount = prompt('Enter deposit amount (₦):');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/wallets/${walletId}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(parseFloat(amount) * 100) })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        hideModal(walletModal);
        await loadWallets();
        showToast('Deposit successful', 'success');
      } else {
        showToast(data.message || 'Deposit failed', 'error');
      }
    } catch (error) {
      showToast('Deposit error', 'error');
    }
  }

  async function handleWithdraw(walletId) {
    const amount = prompt('Enter withdrawal amount (₦):');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/wallets/${walletId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(parseFloat(amount) * 100) })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        pendingWithdrawalId = data.withdrawal.id;
        document.getElementById('approvalPassword').value = '';
        hideModal(walletModal);
        showModal(approvalModal);
      } else {
        showToast(data.message || 'Withdrawal request failed', 'error');
      }
    } catch (error) {
      showToast('Withdrawal error', 'error');
    }
  }

  // Global Functions (attached to window for onclick handlers)
  window.editProduct = (id) => {
    const product = { id }; // In real app, fetch product details
    openProductModal(product);
  };

  window.deleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await loadProducts();
        showToast('Product deleted successfully', 'success');
      } else {
        showToast('Failed to delete product', 'error');
      }
    } catch (error) {
      showToast('Error deleting product', 'error');
    }
  };

  window.editOrder = (id) => {
    showToast('Edit order functionality coming soon', 'warning');
  };

  window.markShipped = async (id) => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' })
      });

      if (response.ok) {
        await loadOrders();
        showToast('Order marked as shipped', 'success');
      } else {
        showToast('Failed to update order', 'error');
      }
    } catch (error) {
      showToast('Error updating order', 'error');
    }
  };

  window.deleteOrder = async (id) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/orders/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await loadOrders();
        showToast('Order deleted successfully', 'success');
      } else {
        showToast('Failed to delete order', 'error');
      }
    } catch (error) {
      showToast('Error deleting order', 'error');
    }
  };

  window.viewWallet = (id) => {
    const wallet = { id }; // In real app, fetch wallet details
    openWalletModal(wallet);
  };

  // Utility Functions
  function toggleSidebar() {
    sidebar.classList.toggle('open');
  }

  function switchSection(sectionName) {
    // Update navigation
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === sectionName);
    });

    // Update sections
    sections.forEach(section => {
      section.classList.toggle('active', section.id === sectionName);
    });

    currentSection = sectionName;

    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
      sidebar.classList.remove('open');
    }
  }

  function switchContentTab(tabName) {
    // Update tabs
    contentTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update content
    contentTabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-content`);
    });
  }

  // Content Management Functions
  async function loadAnalyticsData() {
    try {
      // Load analytics metrics
      const baseUrl = getApiBaseUrl();
      const orders = await fetch(`${baseUrl}/api/admin/orders`).then(r => r.json());
      const products = await fetch(`${baseUrl}/api/admin/products`).then(r => r.json());

      const totalSales = orders.items?.length || 0;
      const totalRevenue = orders.items?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
      const uniqueCustomers = new Set(orders.items?.map(order => order.customer?.email).filter(Boolean)).size || 0;

      document.getElementById('analytics-total-sales').textContent = totalSales;
      document.getElementById('analytics-revenue').textContent = `₦${totalRevenue.toLocaleString()}`;
      document.getElementById('analytics-customers').textContent = uniqueCustomers;
      document.getElementById('analytics-conversion').textContent = '94.2%';

      // Load sales activity
      loadSalesActivity(orders.items || []);
    } catch (error) {
      console.warn('Failed to load analytics data:', error);
    }
  }

  async function loadContentData() {
    try {
      await Promise.all([
        loadGenerators(),
        loadMinerals(),
        loadNews()
      ]);
    } catch (error) {
      console.warn('Failed to load content data:', error);
    }
  }

  async function loadGenerators() {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/products`);
      const data = await response.json();

      const grid = document.getElementById('generators-grid');
      grid.innerHTML = '';

      if (data.items && data.items.length > 0) {
        data.items.forEach(product => {
          const item = createContentItem(product, 'generator');
          grid.appendChild(item);
        });
      } else {
        grid.innerHTML = '<p>No generators found</p>';
      }
    } catch (error) {
      console.warn('Failed to load generators:', error);
    }
  }

  async function loadMinerals() {
    try {
      // For now, show placeholder mineral data
      const minerals = [
        { id: 1, name: 'Barite', description: 'High-quality barite mineral for industrial use', image: 'images/minerals/barite.jpg' },
        { id: 2, name: 'Coal', description: 'Premium coal resources for energy production', image: 'images/minerals/coal.jpg' },
        { id: 3, name: 'Gold', description: 'Gold mining and extraction services', image: 'images/minerals/gold.jpg' }
      ];

      const grid = document.getElementById('minerals-grid');
      grid.innerHTML = '';

      minerals.forEach(mineral => {
        const item = createContentItem(mineral, 'mineral');
        grid.appendChild(item);
      });
    } catch (error) {
      console.warn('Failed to load minerals:', error);
    }
  }

  async function loadNews() {
    try {
      // Placeholder news data
      const news = [
        { id: 1, title: 'New Generator Models Available', content: 'We are excited to announce our latest line of high-efficiency generators...', date: '2024-01-15' },
        { id: 2, title: 'Mineral Export Success', content: 'FOLSME achieves record-breaking mineral exports this quarter...', date: '2024-01-10' }
      ];

      const list = document.getElementById('news-list');
      list.innerHTML = '';

      news.forEach(item => {
        const newsItem = createNewsItem(item);
        list.appendChild(newsItem);
      });
    } catch (error) {
      console.warn('Failed to load news:', error);
    }
  }

  function createContentItem(item, type) {
    const div = document.createElement('div');
    div.className = 'content-item';

    div.innerHTML = `
      <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.name}" class="content-image" onerror="this.src='images/placeholder.jpg'">
      <div class="content-info">
        <h3 class="content-title">${item.name}</h3>
        <p class="content-description">${item.description || 'No description available'}</p>
        <div class="content-meta">
          <span>Type: ${type}</span>
          <span>ID: ${item.id}</span>
        </div>
        <div class="content-actions">
          <button class="btn btn-primary" onclick="editContent('${type}', ${item.id})">Edit</button>
          <button class="btn btn-ghost" onclick="deleteContent('${type}', ${item.id})">Delete</button>
        </div>
      </div>
    `;

    return div;
  }

  function createNewsItem(item) {
    const div = document.createElement('div');
    div.className = 'news-item';

    div.innerHTML = `
      <h3 class="news-title">${item.title}</h3>
      <p class="news-content">${item.content}</p>
      <div class="news-meta">
        <span>Published: ${new Date(item.date).toLocaleDateString()}</span>
        <div>
          <button class="btn btn-primary" onclick="editNews(${item.id})">Edit</button>
          <button class="btn btn-ghost" onclick="deleteNews(${item.id})">Delete</button>
        </div>
      </div>
    `;

    return div;
  }

  function loadSalesActivity(orders) {
    const list = document.getElementById('sales-activity-list');
    list.innerHTML = '';

    if (orders && orders.length > 0) {
      orders.slice(0, 5).forEach(order => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        item.innerHTML = `
          <div class="timeline-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="timeline-content">
            <h4>New order received</h4>
            <p>Order #${order.reference || order.id} for ₦${(order.amount || 0).toLocaleString()}</p>
            <span class="timeline-time">${new Date(order.created_at || Date.now()).toLocaleString()}</span>
          </div>
        `;

        list.appendChild(item);
      });
    } else {
      list.innerHTML = '<p>No recent activity</p>';
    }
  }

  // Content Modal Functions
  function openGeneratorModal(generator = null) {
    showToast('Add generator functionality coming soon', 'info');
  }

  function openMineralModal(mineral = null) {
    showToast('Add mineral functionality coming soon', 'info');
  }

  function openNewsModal(news = null) {
    showToast('Add news functionality coming soon', 'info');
  }

  // Global Content Functions
  window.editContent = (type, id) => {
    showToast(`Edit ${type} functionality coming soon`, 'info');
  };

  window.deleteContent = (type, id) => {
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      showToast(`${type} deleted successfully`, 'success');
    }
  };

  window.editNews = (id) => {
    showToast('Edit news functionality coming soon', 'info');
  };

  window.deleteNews = (id) => {
    if (confirm('Are you sure you want to delete this news item?')) {
      showToast('News deleted successfully', 'success');
    }
  };

  function handleSearch(e) {
    const query = e.target.value.toLowerCase();

    // Search functionality would filter current section content
    // For now, just log the query
    console.log('Search query:', query);
  }

  function loadDummyData() {
    // Load dummy data for demonstration
    setTimeout(() => {
      // Update stats with dummy data
      document.getElementById('stat-orders').textContent = '47';
      document.getElementById('stat-revenue').textContent = '₦12,450,000';
      document.getElementById('stat-pending').textContent = '8';
      document.getElementById('stat-customers').textContent = '156';

      // Load dummy orders
      loadDummyOrders();

      // Load dummy products
      loadDummyProducts();

      // Load dummy wallets
      loadDummyWallets();

      // Load dummy activity
      loadDummyActivity();

      // Load dummy analytics
      loadDummyAnalytics();

      // Load dummy finance data
      loadDummyFinance();
    }, 500);
  }

  function loadDummyOrders() {
    const orders = [
      { id: 1, reference: 'FS001', customer: { email: 'john.doe@example.com' }, amount: 2500000, status: 'completed', created_at: '2024-01-15T10:30:00Z' },
      { id: 2, reference: 'FS002', customer: { email: 'sarah.smith@company.com' }, amount: 1800000, status: 'shipped', created_at: '2024-01-14T14:20:00Z' },
      { id: 3, reference: 'FS003', customer: { email: 'mike.johnson@business.ng' }, amount: 8500000, status: 'pending', created_at: '2024-01-13T09:15:00Z' },
      { id: 4, reference: 'FS004', customer: { email: 'emily.davis@corp.com' }, amount: 7200000, status: 'completed', created_at: '2024-01-12T16:45:00Z' },
      { id: 5, reference: 'FS005', customer: { email: 'robert.wilson@enterprise.ng' }, amount: 15000000, status: 'shipped', created_at: '2024-01-11T11:30:00Z' }
    ];

    const tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = '';

    orders.forEach(order => {
      const row = createOrderRow(order);
      tbody.appendChild(row);
    });
  }

  function loadDummyProducts() {
    const products = [
      { id: 1, name: 'Household Generator 5KVA', price_cents: 250000000, description: 'Reliable backup power for homes' },
      { id: 2, name: 'Compact Backup Unit 3KVA', price_cents: 180000000, description: 'Portable generator for small businesses' },
      { id: 3, name: 'Commercial Generator 15KVA', price_cents: 850000000, description: 'Heavy-duty power for commercial use' },
      { id: 4, name: 'Business Power Unit 12KVA', price_cents: 720000000, description: 'Industrial-grade generator' },
      { id: 5, name: 'Heavy Duty Generator 25KVA', price_cents: 1500000000, description: 'Maximum power output generator' }
    ];

    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    products.forEach(product => {
      const card = createProductCard(product);
      grid.appendChild(card);
    });
  }

  function loadDummyWallets() {
    const wallets = [
      { id: 1, owner: 'John Doe', balance: 50000000, created_at: '2024-01-01T00:00:00Z' },
      { id: 2, owner: 'Sarah Smith', balance: 75000000, created_at: '2024-01-05T00:00:00Z' },
      { id: 3, owner: 'Mike Johnson', balance: 25000000, created_at: '2024-01-10T00:00:00Z' }
    ];

    // Update wallet overview
    const overview = document.querySelector('.wallets-container .wallet-overview') || document.createElement('div');
    overview.innerHTML = '<h3>Wallet Overview</h3>';

    wallets.forEach(wallet => {
      const card = createWalletCard(wallet);
      overview.appendChild(card);
    });

    // Load transaction history for first wallet
    loadDummyTransactions(wallets[0].id);
  }

  function loadDummyTransactions(walletId) {
    const transactions = [
      { id: 1, description: 'Deposit - Generator Sale', amount: 25000000, type: 'deposit', created_at: '2024-01-15T10:30:00Z' },
      { id: 2, description: 'Withdrawal - Equipment Purchase', amount: 5000000, type: 'withdraw', created_at: '2024-01-14T14:20:00Z' },
      { id: 3, description: 'Deposit - Mineral Sale', amount: 18000000, type: 'deposit', created_at: '2024-01-13T09:15:00Z' },
      { id: 4, description: 'Deposit - Service Revenue', amount: 12000000, type: 'deposit', created_at: '2024-01-12T16:45:00Z' }
    ];

    const history = document.querySelector('.wallets-container .transactions-history') || document.createElement('div');
    history.innerHTML = '<h3>Transaction History</h3>';

    transactions.forEach(transaction => {
      const item = createTransactionItem(transaction);
      history.appendChild(item);
    });
  }

  function loadDummyActivity() {
    const activities = [
      { id: 1, icon: '📦', title: 'New order received', description: 'Order #FS001 for ₦2,500,000', time: '2 hours ago' },
      { id: 2, icon: '🚚', title: 'Order shipped', description: 'Order #FS002 has been shipped', time: '4 hours ago' },
      { id: 3, icon: '💰', title: 'Payment received', description: '₦1,800,000 payment confirmed', time: '6 hours ago' },
      { id: 4, icon: '👤', title: 'New customer registered', description: 'Emily Davis joined FOLSME', time: '1 day ago' },
      { id: 5, icon: '📈', title: 'Monthly target achieved', description: 'December sales target exceeded by 15%', time: '2 days ago' }
    ];

    const list = document.getElementById('recent-activity-list');
    list.innerHTML = '';

    activities.forEach(activity => {
      const item = createActivityItem(activity);
      list.appendChild(item);
    });
  }

  function loadDummyAnalytics() {
    // Update analytics metrics
    document.getElementById('analytics-total-sales').textContent = '156';
    document.getElementById('analytics-customers').textContent = '89';
    document.getElementById('analytics-revenue').textContent = '₦45,200,000';
    document.getElementById('analytics-conversion').textContent = '94.2%';

    // Load sales activity
    const orders = [
      { id: 1, reference: 'FS001', amount: 2500000, created_at: '2024-01-15T10:30:00Z' },
      { id: 2, reference: 'FS002', amount: 1800000, created_at: '2024-01-14T14:20:00Z' }
    ];
    loadSalesActivity(orders);
  }

  function loadDummyFinance() {
    // Update finance overview
    document.getElementById('totalBalance').textContent = '₦152,500,000';
    document.getElementById('monthlyDeposits').textContent = '₦67,200,000';
    document.getElementById('pendingApprovals').textContent = '3';

    // Load dummy transactions
    const transactions = [
      { id: 1, description: 'Generator Sale - John Doe', amount: 25000000, type: 'deposit', created_at: '2024-01-15T10:30:00Z' },
      { id: 2, description: 'Mineral Export - ABC Corp', amount: 45000000, type: 'deposit', created_at: '2024-01-14T14:20:00Z' },
      { id: 3, description: 'Equipment Purchase', amount: 8500000, type: 'withdraw', created_at: '2024-01-13T09:15:00Z' },
      { id: 4, description: 'Service Revenue - XYZ Ltd', amount: 32000000, type: 'deposit', created_at: '2024-01-12T16:45:00Z' },
      { id: 5, description: 'Office Supplies', amount: 1200000, type: 'withdraw', created_at: '2024-01-11T11:30:00Z' }
    ];

    const list = document.querySelector('.transactions-list') || document.createElement('div');
    list.innerHTML = '';

    transactions.forEach(transaction => {
      const item = document.createElement('div');
      item.className = 'transaction-item';

      const amountClass = transaction.type === 'deposit' ? 'positive' : 'negative';
      const amountPrefix = transaction.type === 'deposit' ? '+' : '-';

      item.innerHTML = `
        <div class="transaction-info">
          <div class="transaction-type">${transaction.description}</div>
          <div class="transaction-desc">${new Date(transaction.created_at).toLocaleDateString()}</div>
        </div>
        <div class="transaction-amount ${amountClass}">${amountPrefix}₦${(transaction.amount / 100).toLocaleString()}</div>
      `;

      list.appendChild(item);
    });
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;

    document.getElementById('toasts').appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-in-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});
