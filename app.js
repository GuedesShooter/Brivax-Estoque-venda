const STORAGE_KEYS = {
  users: 'brivax_users',
  pieces: 'brivax_pieces',
  sales: 'brivax_sales',
  products: 'brivax_products',
  clients: 'brivax_clients',
  activity: 'brivax_activity'
};

const REMEMBER_KEY = 'brivax_remember';
const SESSION_KEY = 'brivax_session';

const state = {
  users: [],
  pieces: [],
  sales: [],
  products: [],
  clients: [],
  activity: [],
  currentUser: null,
  currentPanel: 'dashboard'
};

const elements = {};
let deferredPrompt = null;

const PANEL_IDS = {
  dashboard: 'panel-dashboard',
  inventory: 'panel-inventory',
  sales: 'panel-sales',
  products: 'panel-products',
  clients: 'panel-clients',
  activity: 'panel-activity',
  users: 'panel-users'
};

const ADMIN_ONLY_PANELS = new Set(['sales', 'products', 'clients', 'activity', 'users']);

document.addEventListener('DOMContentLoaded', init);

function init() {
  cacheElements();
  bindEvents();
  loadState();
  ensureDefaultAdmin();
  hydrateRememberedCredentials();
  restoreSession();
  updateInstallButton();
  renderApp();
}

function cacheElements() {
  elements.authView = document.getElementById('authView');
  elements.appView = document.getElementById('appView');
  elements.tabs = Array.from(document.querySelectorAll('.tab'));
  elements.panels = Array.from(document.querySelectorAll('.tab-panel'));
  elements.authMessage = document.getElementById('authMessage');
  elements.registerForm = document.getElementById('registerForm');
  elements.registerFirstName = document.getElementById('registerFirstName');
  elements.registerLastName = document.getElementById('registerLastName');
  elements.registerPhone = document.getElementById('registerPhone');
  elements.registerEmail = document.getElementById('registerEmail');
  elements.registerUsername = document.getElementById('registerUsername');
  elements.registerPassword = document.getElementById('registerPassword');
  elements.registerConfirm = document.getElementById('registerConfirm');
  elements.registerRemember = document.getElementById('registerRemember');
  elements.loginForm = document.getElementById('loginForm');
  elements.loginUser = document.getElementById('loginUser');
  elements.loginPass = document.getElementById('loginPass');
  elements.loginRemember = document.getElementById('loginRemember');
  elements.btnLogout = document.getElementById('btnLogout');
  elements.btnInstall = document.getElementById('btnInstall');
  elements.currentUser = document.getElementById('currentUser');
  elements.appNav = document.getElementById('appNav');
  elements.navButtons = Array.from(document.querySelectorAll('#appNav .nav-btn'));
  elements.roleBadge = document.getElementById('roleBadge');
  elements.summaryPieces = document.getElementById('summaryPieces');
  elements.summaryStock = document.getElementById('summaryStock');
  elements.summarySales = document.getElementById('summarySales');
  elements.summaryClients = document.getElementById('summaryClients');
  elements.pieceForm = document.getElementById('pieceForm');
  elements.pieceId = document.getElementById('pieceId');
  elements.pieceName = document.getElementById('pieceName');
  elements.pieceDescription = document.getElementById('pieceDescription');
  elements.pieceCost = document.getElementById('pieceCost');
  elements.piecePrice = document.getElementById('piecePrice');
  elements.pieceQuantity = document.getElementById('pieceQuantity');
  elements.pieceSubmit = document.getElementById('pieceSubmit');
  elements.pieceCancel = document.getElementById('pieceCancel');
  elements.piecesTable = document.querySelector('#piecesTable tbody');
  elements.saleForm = document.getElementById('saleForm');
  elements.salePiece = document.getElementById('salePiece');
  elements.saleQuantity = document.getElementById('saleQuantity');
  elements.saleDate = document.getElementById('saleDate');
  elements.salesTable = document.querySelector('#salesTable tbody');
  elements.productForm = document.getElementById('productForm');
  elements.productId = document.getElementById('productId');
  elements.productName = document.getElementById('productName');
  elements.productSku = document.getElementById('productSku');
  elements.productCategory = document.getElementById('productCategory');
  elements.productPrice = document.getElementById('productPrice');
  elements.productQuantity = document.getElementById('productQuantity');
  elements.productDescription = document.getElementById('productDescription');
  elements.productSubmit = document.getElementById('productSubmit');
  elements.productCancel = document.getElementById('productCancel');
  elements.productsTable = document.querySelector('#productsTable tbody');
  elements.clientForm = document.getElementById('clientForm');
  elements.clientId = document.getElementById('clientId');
  elements.clientName = document.getElementById('clientName');
  elements.clientDocument = document.getElementById('clientDocument');
  elements.clientCity = document.getElementById('clientCity');
  elements.clientContact = document.getElementById('clientContact');
  elements.clientEmail = document.getElementById('clientEmail');
  elements.clientBillingAddress = document.getElementById('clientBillingAddress');
  elements.clientStore = document.getElementById('clientStore');
  elements.clientInstallCity = document.getElementById('clientInstallCity');
  elements.clientInstallAddress = document.getElementById('clientInstallAddress');
  elements.clientResponsible = document.getElementById('clientResponsible');
  elements.clientResponsiblePhone = document.getElementById('clientResponsiblePhone');
  elements.clientInstallDate = document.getElementById('clientInstallDate');
  elements.clientTechnicians = document.getElementById('clientTechnicians');
  elements.clientDeliveryDate = document.getElementById('clientDeliveryDate');
  elements.clientContractDate = document.getElementById('clientContractDate');
  elements.clientTotal = document.getElementById('clientTotal');
  elements.clientEntry = document.getElementById('clientEntry');
  elements.clientInstallments = document.getElementById('clientInstallments');
  elements.clientInstallmentDates = document.getElementById('clientInstallmentDates');
  elements.clientMaintenance = document.getElementById('clientMaintenance');
  elements.clientSubmit = document.getElementById('clientSubmit');
  elements.clientCancel = document.getElementById('clientCancel');
  elements.clientsTable = document.querySelector('#clientsTable tbody');
  elements.activityList = document.getElementById('activityList');
  elements.usersTable = document.querySelector('#usersTable tbody');
}

function bindEvents() {
  elements.tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchAuthTab(tab.dataset.target));
  });

  elements.registerForm.addEventListener('submit', handleRegister);
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.btnLogout.addEventListener('click', logout);

  elements.navButtons.forEach((button) => {
    button.addEventListener('click', () => setActivePanel(button.dataset.panel));
  });

  elements.pieceForm.addEventListener('submit', handlePieceSubmit);
  elements.pieceCancel.addEventListener('click', resetPieceForm);
  elements.piecesTable.addEventListener('click', handlePieceActions);

  elements.saleForm.addEventListener('submit', handleSaleSubmit);

  elements.productForm.addEventListener('submit', handleProductSubmit);
  elements.productCancel.addEventListener('click', resetProductForm);
  elements.productsTable.addEventListener('click', handleProductActions);

  elements.clientForm.addEventListener('submit', handleClientSubmit);
  elements.clientCancel.addEventListener('click', resetClientForm);
  elements.clientsTable.addEventListener('click', handleClientActions);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    updateInstallButton();
  });

  elements.btnInstall.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    updateInstallButton();
  });
}

function loadState() {
  Object.keys(STORAGE_KEYS).forEach((key) => {
    try {
      const value = localStorage.getItem(STORAGE_KEYS[key]);
      state[key] = value ? JSON.parse(value) : Array.isArray(state[key]) ? [] : null;
    } catch (error) {
      console.error('Erro ao carregar storage', key, error);
      state[key] = Array.isArray(state[key]) ? [] : null;
    }
  });
}

function ensureDefaultAdmin() {
  if (state.users.some((user) => user.username === 'GuedezShooter')) return;

  const admin = {
    id: generateId('user'),
    username: 'GuedezShooter',
    password: 'Guedes/007',
    role: 'admin',
    firstName: 'Administrador',
    lastName: 'Brivax',
    phone: '',
    email: 'admin@brivax.com',
    createdAt: new Date().toISOString()
  };

  state.users.push(admin);
  saveState('users');
  logActivity('Configuração', 'Administrador padrão criado automaticamente.', 'sistema');
}

function hydrateRememberedCredentials() {
  try {
    const stored = localStorage.getItem(REMEMBER_KEY);
    if (!stored) return;
    const data = JSON.parse(stored);
    if (data.username) {
      elements.loginUser.value = data.username;
      elements.loginRemember.checked = true;
    }
    if (data.password) {
      elements.loginPass.value = data.password;
    }
  } catch (error) {
    console.warn('Não foi possível carregar credenciais salvas', error);
  }
}

function restoreSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return;
    const data = JSON.parse(stored);
    const user = state.users.find((item) => item.id === data.userId);
    if (user) {
      state.currentUser = user;
      state.currentPanel = data.panel || 'dashboard';
    }
  } catch (error) {
    console.warn('Sessão inválida', error);
  }
}

function switchAuthTab(target) {
  elements.tabs.forEach((tab) => {
    const isActive = tab.dataset.target === target;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  elements.panels.forEach((panel) => {
    const isActive = panel.dataset.panel === target;
    panel.classList.toggle('hidden', !isActive);
    panel.setAttribute('aria-hidden', String(!isActive));
  });

  hideAuthMessage();
}

function handleRegister(event) {
  event.preventDefault();
  const firstName = elements.registerFirstName.value.trim();
  const lastName = elements.registerLastName.value.trim();
  const phone = elements.registerPhone.value.trim();
  const email = elements.registerEmail.value.trim();
  const username = elements.registerUsername.value.trim();
  const password = elements.registerPassword.value;
  const confirm = elements.registerConfirm.value;
  const remember = elements.registerRemember.checked;

  if (!/^[a-z0-9]+$/.test(username)) {
    showAuthMessage('O nome de usuário deve conter apenas letras minúsculas e números.', 'error');
    return;
  }

  if (password !== confirm) {
    showAuthMessage('As senhas não conferem.', 'error');
    return;
  }

  if (state.users.some((user) => user.username === username)) {
    showAuthMessage('Este nome de usuário já está em uso.', 'error');
    return;
  }

  const user = {
    id: generateId('user'),
    username,
    password,
    role: 'user',
    firstName,
    lastName,
    phone,
    email,
    createdAt: new Date().toISOString()
  };

  state.users.push(user);
  saveState('users');
  logActivity('Novo usuário', `${firstName} ${lastName} criou uma conta.`, username);

  rememberCredentials(username, password, remember);
  elements.registerForm.reset();
  elements.registerRemember.checked = remember;

  loginUser(user);
  showAuthMessage('Conta criada com sucesso. Bem-vindo!', 'success');
}

function handleLogin(event) {
  event.preventDefault();
  const username = elements.loginUser.value.trim();
  const password = elements.loginPass.value;
  const remember = elements.loginRemember.checked;

  const user = state.users.find((item) => item.username === username && item.password === password);
  if (!user) {
    showAuthMessage('Credenciais inválidas. Verifique usuário e senha.', 'error');
    return;
  }

  rememberCredentials(username, password, remember);
  loginUser(user);
  hideAuthMessage();
}

function loginUser(user) {
  state.currentUser = user;
  state.currentPanel = 'dashboard';
  saveSession();
  renderApp();
}

function logout() {
  state.currentUser = null;
  state.currentPanel = 'dashboard';
  localStorage.removeItem(SESSION_KEY);
  renderApp();
}

function showAuthMessage(message, variant = 'info') {
  elements.authMessage.textContent = message;
  elements.authMessage.classList.remove('hidden');
  elements.authMessage.classList.remove('success', 'error');
  if (variant !== 'info') {
    elements.authMessage.classList.add(variant);
  }
}

function hideAuthMessage() {
  elements.authMessage.textContent = '';
  elements.authMessage.classList.add('hidden');
  elements.authMessage.classList.remove('success', 'error');
}

function rememberCredentials(username, password, remember) {
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username, password }));
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }
}

function renderApp() {
  const isLogged = Boolean(state.currentUser);
  elements.authView.classList.toggle('hidden', isLogged);
  elements.authView.setAttribute('aria-hidden', String(isLogged));
  elements.appView.classList.toggle('hidden', !isLogged);
  elements.appView.setAttribute('aria-hidden', String(!isLogged));
  elements.btnLogout.hidden = !isLogged;
  elements.currentUser.hidden = !isLogged;
  elements.btnInstall.hidden = !deferredPrompt;

  if (!isLogged) {
    elements.currentUser.textContent = '';
    setActivePanel('dashboard');
    return;
  }

  elements.currentUser.textContent = `${state.currentUser.firstName} ${state.currentUser.lastName}`.trim() || state.currentUser.username;
  applyAdminVisibility();
  setActivePanel(state.currentPanel);
  renderSummary();
  renderPieces();
  renderSales();
  renderProducts();
  renderClients();
  renderActivity();
  renderUsers();
  updateSaleOptions();
}

function applyAdminVisibility() {
  const isAdmin = state.currentUser?.role === 'admin';
  document.querySelectorAll('.admin-only').forEach((element) => {
    if (isAdmin) {
      element.classList.remove('hidden');
    } else {
      element.classList.add('hidden');
    }
  });

  if (!isAdmin && ADMIN_ONLY_PANELS.has(state.currentPanel)) {
    state.currentPanel = 'dashboard';
  }
}

function setActivePanel(panelName) {
  const isAdmin = state.currentUser?.role === 'admin';
  if (!isAdmin && ADMIN_ONLY_PANELS.has(panelName)) {
    return;
  }

  state.currentPanel = panelName;
  saveSession();

  elements.navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.panel === panelName);
    const hiddenByRole = button.classList.contains('admin-only') && !isAdmin;
    button.classList.toggle('hidden', hiddenByRole);
  });

  Object.entries(PANEL_IDS).forEach(([key, id]) => {
    const panel = document.getElementById(id);
    if (!panel) return;
    const isActive = key === panelName;
    panel.classList.toggle('active', isActive);
  });
}

function handlePieceSubmit(event) {
  event.preventDefault();
  const name = elements.pieceName.value.trim();
  const description = elements.pieceDescription.value.trim();
  const cost = Number(elements.pieceCost.value);
  const price = Number(elements.piecePrice.value);
  const quantity = Number(elements.pieceQuantity.value);
  const existingId = elements.pieceId.value;
  const isAdmin = state.currentUser?.role === 'admin';

  if (!Number.isFinite(cost) || cost < 0) {
    alert('Informe um custo válido.');
    return;
  }

  if (!Number.isFinite(price) || price < 0) {
    alert('Informe um preço de venda válido.');
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    alert('A quantidade deve ser um número inteiro positivo.');
    return;
  }

  if (existingId) {
    if (!isAdmin) {
      alert('Somente administradores podem editar peças existentes.');
      return;
    }
    const piece = state.pieces.find((item) => item.id === existingId);
    if (!piece) return;
    piece.name = name;
    piece.description = description;
    piece.cost = cost;
    piece.price = price;
    piece.quantity = quantity;
    piece.updatedAt = new Date().toISOString();
    saveState('pieces');
    logActivity('Peça atualizada', `${name} atualizada pelo administrador.`, state.currentUser.username);
  } else {
    const piece = {
      id: generateId('piece'),
      name,
      description,
      cost,
      price,
      quantity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: state.currentUser.username
    };
    state.pieces.push(piece);
    saveState('pieces');
    logActivity('Nova peça', `${name} adicionada ao estoque.`, state.currentUser.username);
  }

  resetPieceForm();
  renderPieces();
  renderSummary();
  updateSaleOptions();
}

function handlePieceActions(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const id = button.dataset.id;
  const action = button.dataset.action;
  const piece = state.pieces.find((item) => item.id === id);
  if (!piece) return;

  if (action === 'edit') {
    if (state.currentUser?.role !== 'admin') return;
    elements.pieceId.value = piece.id;
    elements.pieceName.value = piece.name;
    elements.pieceDescription.value = piece.description || '';
    elements.pieceCost.value = piece.cost;
    elements.piecePrice.value = piece.price;
    elements.pieceQuantity.value = piece.quantity;
    elements.pieceName.focus();
  }

  if (action === 'delete') {
    if (state.currentUser?.role !== 'admin') return;
    if (!confirm('Deseja remover esta peça do estoque?')) return;
    state.pieces = state.pieces.filter((item) => item.id !== id);
    saveState('pieces');
    logActivity('Peça removida', `${piece.name} removida do estoque.`, state.currentUser.username);
    resetPieceForm();
    renderPieces();
    renderSummary();
    updateSaleOptions();
  }
}

function resetPieceForm() {
  elements.pieceForm.reset();
  elements.pieceId.value = '';
}

function renderPieces() {
  const isAdmin = state.currentUser?.role === 'admin';
  elements.piecesTable.innerHTML = '';

  state.pieces
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((piece) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <strong>${piece.name}</strong><br>
          <small>${piece.description || '—'}</small>
        </td>
        <td>
          <small>Custo:</small> ${formatCurrency(piece.cost)}<br>
          <small>Venda:</small> ${formatCurrency(piece.price)}
        </td>
        <td>${piece.quantity}</td>
        <td>${formatDate(piece.updatedAt || piece.createdAt)}</td>
        <td class="actions ${isAdmin ? '' : 'hidden'}">
          <button data-action="edit" data-id="${piece.id}">Editar</button>
          <button data-action="delete" data-id="${piece.id}" class="danger">Excluir</button>
        </td>
      `;
      elements.piecesTable.appendChild(row);
    });
}

function handleSaleSubmit(event) {
  event.preventDefault();
  if (state.currentUser?.role !== 'admin') {
    alert('Somente administradores podem registrar vendas.');
    return;
  }

  const pieceId = elements.salePiece.value;
  const quantity = Number(elements.saleQuantity.value);
  const date = elements.saleDate.value;
  const piece = state.pieces.find((item) => item.id === pieceId);

  if (!piece) {
    alert('Selecione uma peça válida.');
    return;
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    alert('Informe uma quantidade válida.');
    return;
  }

  if (piece.quantity < quantity) {
    alert('Estoque insuficiente para registrar a venda.');
    return;
  }

  piece.quantity -= quantity;
  piece.updatedAt = new Date().toISOString();

  const sale = {
    id: generateId('sale'),
    pieceId,
    quantity,
    date,
    total: quantity * piece.price,
    createdAt: new Date().toISOString(),
    createdBy: state.currentUser.username
  };

  state.sales.push(sale);
  saveState('pieces');
  saveState('sales');
  logActivity('Venda registrada', `${quantity}x ${piece.name} vendidos.`, state.currentUser.username);

  elements.saleForm.reset();
  renderPieces();
  renderSales();
  renderSummary();
}

function renderSales() {
  elements.salesTable.innerHTML = '';
  state.sales
    .slice()
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
    .forEach((sale) => {
      const piece = state.pieces.find((item) => item.id === sale.pieceId);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${sale.date ? formatDate(sale.date) : '—'}</td>
        <td>${piece ? piece.name : 'Peça removida'}</td>
        <td>${sale.quantity}</td>
        <td>${formatCurrency(sale.total)}</td>
        <td>${sale.createdBy}</td>
      `;
      elements.salesTable.appendChild(row);
    });
}

function handleProductSubmit(event) {
  event.preventDefault();
  if (state.currentUser?.role !== 'admin') {
    alert('Somente administradores podem cadastrar produtos.');
    return;
  }

  const product = collectProductFromForm();
  if (!product) return;

  if (product.id) {
    const index = state.products.findIndex((item) => item.id === product.id);
    if (index >= 0) {
      state.products[index] = { ...state.products[index], ...product, updatedAt: new Date().toISOString() };
      logActivity('Produto atualizado', `${product.name} atualizado.`, state.currentUser.username);
    }
  } else {
    product.id = generateId('product');
    product.createdAt = new Date().toISOString();
    product.updatedAt = new Date().toISOString();
    state.products.push(product);
    logActivity('Produto cadastrado', `${product.name} adicionado ao catálogo.`, state.currentUser.username);
  }

  saveState('products');
  resetProductForm();
  renderProducts();
}

function collectProductFromForm() {
  const id = elements.productId.value || null;
  const name = elements.productName.value.trim();
  const sku = elements.productSku.value.trim();
  const category = elements.productCategory.value.trim();
  const price = Number(elements.productPrice.value);
  const quantity = Number(elements.productQuantity.value);
  const description = elements.productDescription.value.trim();

  if (!name) {
    alert('Informe o nome do produto.');
    return null;
  }

  if (!Number.isFinite(price) || price < 0) {
    alert('Informe um preço válido.');
    return null;
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    alert('Informe a quantidade com números inteiros.');
    return null;
  }

  return { id, name, sku, category, price, quantity, description };
}

function handleProductActions(event) {
  const button = event.target.closest('button');
  if (!button || state.currentUser?.role !== 'admin') return;
  const id = button.dataset.id;
  const action = button.dataset.action;
  const product = state.products.find((item) => item.id === id);
  if (!product) return;

  if (action === 'edit') {
    elements.productId.value = product.id;
    elements.productName.value = product.name;
    elements.productSku.value = product.sku || '';
    elements.productCategory.value = product.category || '';
    elements.productPrice.value = product.price;
    elements.productQuantity.value = product.quantity;
    elements.productDescription.value = product.description || '';
    elements.productName.focus();
  }

  if (action === 'delete') {
    if (!confirm('Remover este produto do catálogo?')) return;
    state.products = state.products.filter((item) => item.id !== id);
    saveState('products');
    logActivity('Produto removido', `${product.name} removido do catálogo.`, state.currentUser.username);
    resetProductForm();
    renderProducts();
  }
}

function resetProductForm() {
  elements.productForm.reset();
  elements.productId.value = '';
}

function renderProducts() {
  elements.productsTable.innerHTML = '';
  state.products
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((product) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${product.name}</strong><br><small>${product.description || '—'}</small></td>
        <td>${product.sku || '—'}</td>
        <td>${product.category || '—'}</td>
        <td>${formatCurrency(product.price)}</td>
        <td>${product.quantity}</td>
        <td>${formatDate(product.updatedAt || product.createdAt)}</td>
        <td class="actions">
          <button data-action="edit" data-id="${product.id}">Editar</button>
          <button data-action="delete" data-id="${product.id}" class="danger">Excluir</button>
        </td>
      `;
      elements.productsTable.appendChild(row);
    });
}

function handleClientSubmit(event) {
  event.preventDefault();
  if (state.currentUser?.role !== 'admin') {
    alert('Somente administradores podem gerenciar clientes.');
    return;
  }

  const client = collectClientFromForm();
  if (!client) return;

  if (client.id) {
    const index = state.clients.findIndex((item) => item.id === client.id);
    if (index >= 0) {
      state.clients[index] = { ...state.clients[index], ...client, updatedAt: new Date().toISOString() };
      logActivity('Cliente atualizado', `${client.name} atualizado.`, state.currentUser.username);
    }
  } else {
    client.id = generateId('client');
    client.createdAt = new Date().toISOString();
    client.updatedAt = new Date().toISOString();
    state.clients.push(client);
    logActivity('Cliente cadastrado', `${client.name} incluído.`, state.currentUser.username);
  }

  saveState('clients');
  resetClientForm();
  renderClients();
  renderSummary();
}

function collectClientFromForm() {
  const id = elements.clientId.value || null;
  const name = elements.clientName.value.trim();
  const document = elements.clientDocument.value.trim();
  const city = elements.clientCity.value.trim();
  const contact = elements.clientContact.value.trim();
  const email = elements.clientEmail.value.trim();
  const billing = elements.clientBillingAddress.value.trim();
  const store = elements.clientStore.value.trim();
  const installCity = elements.clientInstallCity.value.trim();
  const installAddress = elements.clientInstallAddress.value.trim();
  const responsible = elements.clientResponsible.value.trim();
  const responsiblePhone = elements.clientResponsiblePhone.value.trim();
  const installDate = elements.clientInstallDate.value;
  const technicians = elements.clientTechnicians.value.trim();
  const deliveryDate = elements.clientDeliveryDate.value;
  const contractDate = elements.clientContractDate.value;
  const total = parseFloat(elements.clientTotal.value || '0');
  const entry = parseFloat(elements.clientEntry.value || '0');
  const installments = parseInt(elements.clientInstallments.value || '0', 10);
  const installmentDates = elements.clientInstallmentDates.value.trim();
  const maintenance = elements.clientMaintenance.value;

  if (!name || !document || !contact || !email || !billing) {
    alert('Preencha os campos obrigatórios do cliente.');
    return null;
  }

  return {
    id,
    name,
    document,
    city,
    contact,
    email,
    billing,
    store,
    installCity,
    installAddress,
    responsible,
    responsiblePhone,
    installDate,
    technicians,
    deliveryDate,
    contractDate,
    total,
    entry,
    installments,
    installmentDates,
    maintenance
  };
}

function handleClientActions(event) {
  const button = event.target.closest('button');
  if (!button || state.currentUser?.role !== 'admin') return;
  const id = button.dataset.id;
  const action = button.dataset.action;
  const client = state.clients.find((item) => item.id === id);
  if (!client) return;

  if (action === 'edit') {
    elements.clientId.value = client.id;
    elements.clientName.value = client.name;
    elements.clientDocument.value = client.document;
    elements.clientCity.value = client.city || '';
    elements.clientContact.value = client.contact || '';
    elements.clientEmail.value = client.email || '';
    elements.clientBillingAddress.value = client.billing || '';
    elements.clientStore.value = client.store || '';
    elements.clientInstallCity.value = client.installCity || '';
    elements.clientInstallAddress.value = client.installAddress || '';
    elements.clientResponsible.value = client.responsible || '';
    elements.clientResponsiblePhone.value = client.responsiblePhone || '';
    elements.clientInstallDate.value = client.installDate || '';
    elements.clientTechnicians.value = client.technicians || '';
    elements.clientDeliveryDate.value = client.deliveryDate || '';
    elements.clientContractDate.value = client.contractDate || '';
    elements.clientTotal.value = client.total ?? '';
    elements.clientEntry.value = client.entry ?? '';
    elements.clientInstallments.value = client.installments ?? '';
    elements.clientInstallmentDates.value = client.installmentDates || '';
    elements.clientMaintenance.value = client.maintenance || '';
  }

  if (action === 'delete') {
    if (!confirm('Remover este cliente do cadastro?')) return;
    state.clients = state.clients.filter((item) => item.id !== id);
    saveState('clients');
    logActivity('Cliente removido', `${client.name} removido.`, state.currentUser.username);
    resetClientForm();
    renderClients();
    renderSummary();
  }
}

function resetClientForm() {
  elements.clientForm.reset();
  elements.clientId.value = '';
}

function renderClients() {
  elements.clientsTable.innerHTML = '';
  state.clients
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((client) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${client.name}</strong><br><small>${client.document}</small></td>
        <td>${client.contact}<br><small>${client.email}</small></td>
        <td>${client.installCity || '—'}<br><small>${client.installAddress || '—'}</small></td>
        <td>${client.contractDate ? formatDate(client.contractDate) : '—'}</td>
        <td>${formatCurrency(client.total || 0)}<br><small>Entrada: ${formatCurrency(client.entry || 0)}</small></td>
        <td>${client.maintenance ? formatDate(client.maintenance) : '—'}</td>
        <td class="actions">
          <button data-action="edit" data-id="${client.id}">Editar</button>
          <button data-action="delete" data-id="${client.id}" class="danger">Excluir</button>
        </td>
      `;
      elements.clientsTable.appendChild(row);
    });
}

function renderActivity() {
  elements.activityList.innerHTML = '';
  state.activity
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${item.action}</strong>
        <span>${formatDateTime(item.timestamp)} • ${item.user}</span>
        <p>${item.description}</p>
      `;
      elements.activityList.appendChild(li);
    });
}

function renderUsers() {
  elements.usersTable.innerHTML = '';
  state.users
    .slice()
    .sort((a, b) => a.username.localeCompare(b.username))
    .forEach((user) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.username}</td>
        <td>${`${user.firstName || ''} ${user.lastName || ''}`.trim() || '—'}</td>
        <td>${user.role === 'admin' ? 'Administrador' : 'Usuário'}</td>
        <td>${formatDateTime(user.createdAt)}</td>
      `;
      elements.usersTable.appendChild(row);
    });
}

function renderSummary() {
  const totalPieces = state.pieces.length;
  const totalStock = state.pieces.reduce((acc, piece) => acc + Number(piece.quantity || 0), 0);
  const totalSales = state.sales.length;
  const totalClients = state.clients.length;

  elements.summaryPieces.textContent = totalPieces;
  elements.summaryStock.textContent = totalStock;
  elements.summarySales.textContent = totalSales;
  elements.summaryClients.textContent = totalClients;

  const roleLabel = state.currentUser?.role === 'admin' ? 'Administrador Brivax' : 'Usuário Brivax';
  elements.roleBadge.textContent = roleLabel;
}

function updateSaleOptions() {
  elements.salePiece.innerHTML = '<option value="">Selecione</option>';
  state.pieces
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((piece) => {
      const option = document.createElement('option');
      option.value = piece.id;
      option.textContent = `${piece.name} (Estoque: ${piece.quantity})`;
      elements.salePiece.appendChild(option);
    });
}

function logActivity(action, description, user) {
  const entry = {
    id: generateId('activity'),
    action,
    description,
    user,
    timestamp: new Date().toISOString()
  };
  state.activity.push(entry);
  saveState('activity');
  if (state.currentUser) {
    renderActivity();
  }
}

function saveState(key) {
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(state[key]));
}

function saveSession() {
  if (!state.currentUser) return;
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ userId: state.currentUser.id, panel: state.currentPanel })
  );
}

function updateInstallButton() {
  if (!elements.btnInstall) return;
  elements.btnInstall.hidden = !deferredPrompt;
}

function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch((error) => {
    console.warn('Falha ao registrar service worker', error);
  });
}
