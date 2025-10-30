const STORAGE_KEYS = {
  pieces: 'brivax_pieces',
  sales: 'brivax_sales',
  users: 'brivax_users',
  clients: 'brivax_clients',
  products: 'brivax_products',
  activity: 'brivax_activity'
};

const REMEMBER_KEY = 'brivax_remember';
const SESSION_KEY = 'brivax_session';

const state = {
  pieces: [],
  sales: [],
  users: [],
  clients: [],
  products: [],
  activity: [],
  currentUser: null
};

const elements = {};
let deferredPrompt = null;

function init() {
  cacheElements();
  bindEvents();
  loadState();
  ensureDefaultAdmin();
  hydrateRememberedCredentials();
  restoreSession();
  updateInstallButton();
  renderAll();
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
  elements.roleBadge = document.getElementById('roleBadge');
  elements.summaryPieces = document.getElementById('summaryPieces');
  elements.summaryStock = document.getElementById('summaryStock');
  elements.summarySales = document.getElementById('summarySales');
  elements.summaryClients = document.getElementById('summaryClients');
  elements.newPiece = document.getElementById('newPiece');
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
  elements.newProduct = document.getElementById('newProduct');
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
  elements.newClient = document.getElementById('newClient');
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

  elements.newPiece.addEventListener('click', () => togglePieceForm(true));
  elements.pieceCancel.addEventListener('click', () => togglePieceForm(false));
  elements.pieceForm.addEventListener('submit', handlePieceSubmit);
  elements.piecesTable.addEventListener('click', handlePieceActions);

  elements.saleForm.addEventListener('submit', handleSaleSubmit);

  elements.newProduct.addEventListener('click', () => toggleProductForm(true));
  elements.productCancel.addEventListener('click', () => toggleProductForm(false));
  elements.productForm.addEventListener('submit', handleProductSubmit);
  elements.productsTable.addEventListener('click', handleProductActions);

  elements.newClient.addEventListener('click', () => toggleClientForm(true));
  elements.clientCancel.addEventListener('click', () => toggleClientForm(false));
  elements.clientForm.addEventListener('submit', handleClientSubmit);
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
    const stored = localStorage.getItem(STORAGE_KEYS[key]);
    if (stored) {
      try {
        state[key] = JSON.parse(stored);
      } catch (error) {
        console.warn('Erro ao ler storage', key, error);
        state[key] = Array.isArray(state[key]) ? [] : state[key];
      }
    }
  });
}

function ensureDefaultAdmin() {
  const username = 'GuedezShooter';
  const existing = state.users.find((user) => user.username === username);
  if (!existing) {
    const admin = {
      id: generateId('user'),
      username,
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
    logActivity('Configuração', 'Administrador padrão GuedezShooter criado automaticamente.', 'sistema');
  }
}

function hydrateRememberedCredentials() {
  try {
    const stored = localStorage.getItem(REMEMBER_KEY);
    if (!stored) return;
    const { username, password } = JSON.parse(stored);
    if (username && password) {
      elements.loginUser.value = username;
      elements.loginPass.value = password;
      elements.loginRemember.checked = true;
    }
  } catch (error) {
    console.warn('Erro ao ler credenciais salvas', error);
  }
}

function restoreSession() {
  const username = sessionStorage.getItem(SESSION_KEY);
  if (!username) return;
  const user = state.users.find((candidate) => candidate.username === username);
  if (user) {
    state.currentUser = user;
  }
}

function updateInstallButton() {
  if (!elements.btnInstall) return;
  const canInstall = Boolean(deferredPrompt);
  elements.btnInstall.classList.toggle('hidden', !canInstall);
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
  clearAuthMessage();
}

function showAuthMessage(text, type = 'info') {
  elements.authMessage.textContent = text;
  elements.authMessage.hidden = false;
  elements.authMessage.classList.toggle('error', type === 'error');
}

function clearAuthMessage() {
  elements.authMessage.hidden = true;
  elements.authMessage.textContent = '';
  elements.authMessage.classList.remove('error');
}

function handleRegister(event) {
  event.preventDefault();
  clearAuthMessage();

  const username = elements.registerUsername.value.trim();
  if (!/^[a-z0-9]+$/.test(username)) {
    showAuthMessage('O usuário deve conter apenas letras minúsculas e números, sem espaços.', 'error');
    return;
  }

  const password = elements.registerPassword.value;
  const confirm = elements.registerConfirm.value;
  if (password !== confirm) {
    showAuthMessage('As senhas não conferem. Verifique e tente novamente.', 'error');
    return;
  }

  const exists = state.users.some((user) => user.username === username);
  if (exists) {
    showAuthMessage('Este nome de usuário já está em uso.', 'error');
    return;
  }

  const user = {
    id: generateId('user'),
    username,
    password,
    role: 'user',
    firstName: elements.registerFirstName.value.trim(),
    lastName: elements.registerLastName.value.trim(),
    phone: elements.registerPhone.value.trim(),
    email: elements.registerEmail.value.trim(),
    createdAt: new Date().toISOString()
  };

  state.users.push(user);
  saveState('users');
  logActivity('Cadastro', `Novo usuário ${username} criado.`, 'sistema');

  if (elements.registerRemember.checked) {
    setRememberedCredentials(username, password);
  }

  showAuthMessage('Usuário criado com sucesso! Faça login para acessar o sistema.');
  switchAuthTab('login');
  elements.loginUser.value = username;
  elements.loginPass.value = password;
}

function handleLogin(event) {
  event.preventDefault();
  clearAuthMessage();
  const username = elements.loginUser.value.trim();
  const password = elements.loginPass.value;

  const user = state.users.find((candidate) => candidate.username === username && candidate.password === password);
  if (!user) {
    showAuthMessage('Usuário ou senha inválidos.', 'error');
    return;
  }

  if (elements.loginRemember.checked) {
    setRememberedCredentials(username, password);
  } else {
    clearRememberedCredentials();
  }

  enterApp(user);
}

function enterApp(user) {
  state.currentUser = user;
  sessionStorage.setItem(SESSION_KEY, user.username);
  renderAll();
}

function logout() {
  state.currentUser = null;
  sessionStorage.removeItem(SESSION_KEY);
  renderAll();
}

function setRememberedCredentials(username, password) {
  localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username, password }));
}

function clearRememberedCredentials() {
  localStorage.removeItem(REMEMBER_KEY);
}

function togglePieceForm(show) {
  if (!show) {
    elements.pieceForm.reset();
    elements.pieceId.value = '';
  }
  elements.pieceForm.hidden = !show;
  if (show) {
    elements.pieceName.focus();
  }
}

function handlePieceSubmit(event) {
  event.preventDefault();
  if (!state.currentUser) return;

  const payload = {
    name: elements.pieceName.value.trim(),
    description: elements.pieceDescription.value.trim(),
    cost: Number(elements.pieceCost.value),
    price: Number(elements.piecePrice.value),
    quantity: Number(elements.pieceQuantity.value)
  };

  if (Number.isNaN(payload.cost) || Number.isNaN(payload.price) || Number.isNaN(payload.quantity)) {
    alert('Verifique os valores informados.');
    return;
  }

  const existingId = elements.pieceId.value;
  if (existingId) {
    if (!isAdmin()) {
      alert('Somente administradores podem editar peças existentes.');
      return;
    }
    const piece = state.pieces.find((item) => item.id === existingId);
    if (!piece) return;
    Object.assign(piece, payload, {
      updatedAt: new Date().toISOString(),
      updatedBy: state.currentUser.username
    });
    logActivity('Estoque', `Peça ${piece.name} atualizada.`);
  } else {
    const piece = {
      id: generateId('piece'),
      ...payload,
      createdAt: new Date().toISOString(),
      createdBy: state.currentUser.username
    };
    state.pieces.push(piece);
    logActivity('Estoque', `Peça ${piece.name} cadastrada.`);
  }

  saveState('pieces');
  togglePieceForm(false);
  renderPieces();
  renderSalesSelect();
  updateSummary();
}

function handlePieceActions(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = button.dataset.id;
  const action = button.dataset.action;
  const piece = state.pieces.find((item) => item.id === id);
  if (!piece) return;

  if (action === 'edit') {
    if (!isAdmin()) {
      alert('Somente administradores podem editar peças existentes.');
      return;
    }
    elements.pieceId.value = piece.id;
    elements.pieceName.value = piece.name;
    elements.pieceDescription.value = piece.description || '';
    elements.pieceCost.value = piece.cost;
    elements.piecePrice.value = piece.price;
    elements.pieceQuantity.value = piece.quantity;
    togglePieceForm(true);
  }

  if (action === 'delete') {
    if (!isAdmin()) {
      alert('Somente administradores podem remover peças.');
      return;
    }
    if (confirm(`Excluir a peça ${piece.name}?`)) {
      state.pieces = state.pieces.filter((item) => item.id !== id);
      saveState('pieces');
      logActivity('Estoque', `Peça ${piece.name} removida.`);
      renderPieces();
      renderSalesSelect();
      updateSummary();
    }
  }
}

function handleSaleSubmit(event) {
  event.preventDefault();
  if (!isAdmin()) {
    alert('Somente administradores podem registrar vendas.');
    return;
  }

  const pieceId = elements.salePiece.value;
  const quantity = Number(elements.saleQuantity.value);
  const date = elements.saleDate.value;

  if (!pieceId || Number.isNaN(quantity) || quantity <= 0 || !date) {
    alert('Preencha todos os campos da venda.');
    return;
  }

  const piece = state.pieces.find((item) => item.id === pieceId);
  if (!piece) {
    alert('Peça não encontrada.');
    return;
  }

  if (quantity > piece.quantity) {
    alert('Quantidade superior ao estoque disponível.');
    return;
  }

  piece.quantity -= quantity;
  const sale = {
    id: generateId('sale'),
    pieceId,
    pieceName: piece.name,
    quantity,
    total: quantity * piece.price,
    date,
    createdBy: state.currentUser.username
  };

  state.sales.push(sale);
  logActivity('Venda', `Venda de ${quantity}x ${piece.name} registrada.`);

  saveState('pieces');
  saveState('sales');

  elements.saleForm.reset();
  renderPieces();
  renderSales();
  renderSalesSelect();
  updateSummary();
}

function toggleProductForm(show) {
  if (show && !isAdmin()) return;
  if (!show) {
    elements.productForm.reset();
    elements.productId.value = '';
  }
  elements.productForm.hidden = !show;
  if (show) {
    elements.productName.focus();
  }
}

function handleProductSubmit(event) {
  event.preventDefault();
  if (!isAdmin()) {
    alert('Somente administradores podem gerenciar produtos.');
    return;
  }

  const payload = {
    name: elements.productName.value.trim(),
    sku: elements.productSku.value.trim(),
    category: elements.productCategory.value.trim(),
    price: Number(elements.productPrice.value),
    quantity: Number(elements.productQuantity.value),
    description: elements.productDescription.value.trim()
  };

  if (!payload.name || Number.isNaN(payload.price) || Number.isNaN(payload.quantity)) {
    alert('Preencha os campos obrigatórios do produto.');
    return;
  }

  const existingId = elements.productId.value;
  if (existingId) {
    const product = state.products.find((item) => item.id === existingId);
    if (!product) return;
    Object.assign(product, payload, {
      updatedAt: new Date().toISOString(),
      updatedBy: state.currentUser.username
    });
    logActivity('Produtos', `Produto ${product.name} atualizado.`);
  } else {
    const product = {
      id: generateId('product'),
      ...payload,
      updatedAt: new Date().toISOString(),
      updatedBy: state.currentUser.username
    };
    state.products.push(product);
    logActivity('Produtos', `Produto ${product.name} cadastrado.`);
  }

  saveState('products');
  toggleProductForm(false);
  renderProducts();
}

function handleProductActions(event) {
  if (!isAdmin()) return;
  const button = event.target.closest('button[data-action]');
  if (!button) return;
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
    toggleProductForm(true);
  }

  if (action === 'delete') {
    if (!confirm(`Excluir o produto ${product.name}?`)) {
      return;
    }
    state.products = state.products.filter((item) => item.id !== id);
    saveState('products');
    logActivity('Produtos', `Produto ${product.name} removido.`);
    renderProducts();
  }
}

function toggleClientForm(show) {
  if (show && !isAdmin()) return;
  if (!show) {
    elements.clientForm.reset();
    elements.clientId.value = '';
  }
  elements.clientForm.hidden = !show;
  if (show) {
    elements.clientName.focus();
  }
}

function handleClientSubmit(event) {
  event.preventDefault();
  if (!isAdmin()) {
    alert('Somente administradores podem gerenciar clientes.');
    return;
  }

  const payload = {
    name: elements.clientName.value.trim(),
    document: elements.clientDocument.value.trim(),
    city: elements.clientCity.value.trim(),
    contact: elements.clientContact.value.trim(),
    email: elements.clientEmail.value.trim(),
    billingAddress: elements.clientBillingAddress.value.trim(),
    store: elements.clientStore.value.trim(),
    installCity: elements.clientInstallCity.value.trim(),
    installAddress: elements.clientInstallAddress.value.trim(),
    responsible: elements.clientResponsible.value.trim(),
    responsiblePhone: elements.clientResponsiblePhone.value.trim(),
    installDate: elements.clientInstallDate.value,
    technicians: elements.clientTechnicians.value.trim(),
    deliveryDate: elements.clientDeliveryDate.value,
    contractDate: elements.clientContractDate.value,
    total: elements.clientTotal.value ? Number(elements.clientTotal.value) : null,
    entry: elements.clientEntry.value ? Number(elements.clientEntry.value) : null,
    installments: elements.clientInstallments.value ? Number(elements.clientInstallments.value) : null,
    installmentDates: elements.clientInstallmentDates.value.trim(),
    maintenance: elements.clientMaintenance.value
  };

  if (!payload.name || !payload.document || !payload.contact || !payload.email || !payload.billingAddress) {
    alert('Preencha todos os campos obrigatórios do cliente.');
    return;
  }

  const existingId = elements.clientId.value;
  if (existingId) {
    const client = state.clients.find((item) => item.id === existingId);
    if (!client) return;
    Object.assign(client, payload, {
      updatedAt: new Date().toISOString(),
      updatedBy: state.currentUser.username
    });
    logActivity('Clientes', `Cliente ${client.name} atualizado.`);
  } else {
    const client = {
      id: generateId('client'),
      ...payload,
      updatedAt: new Date().toISOString(),
      updatedBy: state.currentUser.username
    };
    state.clients.push(client);
    logActivity('Clientes', `Cliente ${client.name} cadastrado.`);
  }

  saveState('clients');
  toggleClientForm(false);
  renderClients();
  updateSummary();
}

function handleClientActions(event) {
  if (!isAdmin()) return;
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = button.dataset.id;
  const action = button.dataset.action;
  const client = state.clients.find((item) => item.id === id);
  if (!client) return;

  if (action === 'edit') {
    elements.clientId.value = client.id;
    elements.clientName.value = client.name;
    elements.clientDocument.value = client.document || '';
    elements.clientCity.value = client.city || '';
    elements.clientContact.value = client.contact || '';
    elements.clientEmail.value = client.email || '';
    elements.clientBillingAddress.value = client.billingAddress || '';
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
    toggleClientForm(true);
  }

  if (action === 'delete') {
    if (!confirm(`Excluir o cliente ${client.name}?`)) {
      return;
    }
    state.clients = state.clients.filter((item) => item.id !== id);
    saveState('clients');
    logActivity('Clientes', `Cliente ${client.name} removido.`);
    renderClients();
    updateSummary();
  }
}

function renderAll() {
  updateVisibility();
  renderPieces();
  renderSales();
  renderProducts();
  renderClients();
  renderActivity();
  renderUsers();
  renderSalesSelect();
  updateSummary();
}

function updateVisibility() {
  const loggedIn = Boolean(state.currentUser);
  elements.authView.classList.toggle('hidden', loggedIn);
  elements.appView.classList.toggle('hidden', !loggedIn);
  elements.appView.setAttribute('aria-hidden', String(!loggedIn));
  elements.btnLogout.classList.toggle('hidden', !loggedIn);
  elements.currentUser.textContent = loggedIn
    ? `${state.currentUser.firstName} ${state.currentUser.lastName} (${state.currentUser.username})`
    : '';

  const isAdminUser = isAdmin();
  document.body.classList.toggle('is-admin', isAdminUser);

  if (loggedIn) {
    elements.roleBadge.textContent = isAdminUser ? 'Administrador' : 'Usuário';
  } else {
    elements.roleBadge.textContent = '';
  }
}

function renderPieces() {
  if (!elements.piecesTable) return;
  const adminActive = isAdmin();
  if (!state.pieces.length) {
    const span = adminActive ? 6 : 5;
    elements.piecesTable.innerHTML = `<tr><td colspan="${span}">Nenhuma peça cadastrada.</td></tr>`;
    return;
  }

  const rows = state.pieces
    .map((piece) => {
      const actions = adminActive
        ? `
          <td class="admin-only">
            <div class="actions">
              <button class="btn ghost small" data-action="edit" data-id="${piece.id}">Editar</button>
              <button class="btn danger small" data-action="delete" data-id="${piece.id}">Excluir</button>
            </div>
          </td>`
        : '';
      return `
        <tr>
          <td>${escapeHtml(piece.name)}</td>
          <td>${escapeHtml(piece.description || '')}</td>
          <td>${formatCurrency(piece.cost)}</td>
          <td>${formatCurrency(piece.price)}</td>
          <td>${piece.quantity}</td>
          ${actions}
        </tr>`;
    })
    .join('');

  elements.piecesTable.innerHTML = rows;
}

function renderSales() {
  if (!elements.salesTable) return;
  if (!state.sales.length) {
    elements.salesTable.innerHTML = '<tr><td colspan="5">Nenhuma venda registrada.</td></tr>';
    return;
  }

  const rows = state.sales
    .slice()
    .reverse()
    .map((sale) => `
      <tr>
        <td>${formatDate(sale.date)}</td>
        <td>${escapeHtml(sale.pieceName)}</td>
        <td>${sale.quantity}</td>
        <td>${formatCurrency(sale.total)}</td>
        <td>${escapeHtml(sale.createdBy)}</td>
      </tr>`)
    .join('');

  elements.salesTable.innerHTML = rows;
}

function renderProducts() {
  if (!elements.productsTable) return;
  if (!state.products.length) {
    elements.productsTable.innerHTML = '<tr><td colspan="7">Nenhum produto cadastrado.</td></tr>';
    return;
  }

  const rows = state.products
    .map((product) => `
      <tr>
        <td>${escapeHtml(product.name)}</td>
        <td>${escapeHtml(product.sku || '')}</td>
        <td>${escapeHtml(product.category || '')}</td>
        <td>${formatCurrency(product.price)}</td>
        <td>${product.quantity}</td>
        <td>${formatDate(product.updatedAt)}</td>
        <td>
          <div class="actions">
            <button class="btn ghost small" data-action="edit" data-id="${product.id}">Editar</button>
            <button class="btn danger small" data-action="delete" data-id="${product.id}">Excluir</button>
          </div>
        </td>
      </tr>`)
    .join('');

  elements.productsTable.innerHTML = rows;
}

function renderClients() {
  if (!elements.clientsTable) return;
  if (!state.clients.length) {
    elements.clientsTable.innerHTML = '<tr><td colspan="8">Nenhum cliente cadastrado.</td></tr>';
    return;
  }

  const rows = state.clients
    .map((client) => `
      <tr>
        <td>${escapeHtml(client.name)}</td>
        <td>${escapeHtml(client.document || '')}</td>
        <td>
          ${escapeHtml(client.contact || '')}<br>
          ${escapeHtml(client.email || '')}
        </td>
        <td>
          ${escapeHtml(client.store || '')}<br>
          ${formatDate(client.installDate)}
        </td>
        <td>${formatDate(client.contractDate)}</td>
        <td>
          Total: ${client.total != null ? formatCurrency(client.total) : '-'}<br>
          Entrada: ${client.entry != null ? formatCurrency(client.entry) : '-'}<br>
          Parcelas: ${client.installments ?? '-'}
        </td>
        <td>${formatDate(client.maintenance)}</td>
        <td>
          <div class="actions">
            <button class="btn ghost small" data-action="edit" data-id="${client.id}">Editar</button>
            <button class="btn danger small" data-action="delete" data-id="${client.id}">Excluir</button>
          </div>
        </td>
      </tr>`)
    .join('');

  elements.clientsTable.innerHTML = rows;
}

function renderActivity() {
  if (!elements.activityList) return;
  if (!state.activity.length) {
    elements.activityList.innerHTML = '<li><p class="muted">Nenhuma atividade registrada ainda.</p></li>';
    return;
  }

  const items = state.activity
    .slice(0, 40)
    .map((entry) => `
      <li>
        <time>${formatDateTime(entry.time)}</time>
        <strong>${escapeHtml(entry.action)}</strong>
        <p>${escapeHtml(entry.detail)}</p>
        <small class="muted">${escapeHtml(entry.user || 'sistema')}</small>
      </li>`)
    .join('');

  elements.activityList.innerHTML = items;
}

function renderUsers() {
  if (!elements.usersTable) return;
  if (!state.users.length) {
    elements.usersTable.innerHTML = '<tr><td colspan="3">Nenhum usuário cadastrado.</td></tr>';
    return;
  }

  const rows = state.users
    .map((user) => `
      <tr>
        <td>${escapeHtml(user.username)}</td>
        <td>${user.role === 'admin' ? 'Administrador' : 'Usuário'}</td>
        <td>${formatDateTime(user.createdAt)}</td>
      </tr>`)
    .join('');

  elements.usersTable.innerHTML = rows;
}

function renderSalesSelect() {
  if (!elements.salePiece) return;
  const options = state.pieces
    .map((piece) => `<option value="${piece.id}">${escapeHtml(piece.name)} (${piece.quantity} em estoque)</option>`)
    .join('');
  elements.salePiece.innerHTML = `<option value="">Selecione...</option>${options}`;
}

function updateSummary() {
  const totalPieces = state.pieces.length;
  const totalStock = state.pieces.reduce((acc, piece) => acc + Number(piece.quantity || 0), 0);
  const totalSales = state.sales.length;
  const totalClients = state.clients.length;
  elements.summaryPieces.textContent = totalPieces;
  elements.summaryStock.textContent = totalStock;
  elements.summarySales.textContent = totalSales;
  elements.summaryClients.textContent = totalClients;
}

function isAdmin() {
  return Boolean(state.currentUser && state.currentUser.role === 'admin');
}

function saveState(key) {
  const storageKey = STORAGE_KEYS[key];
  if (!storageKey) return;
  localStorage.setItem(storageKey, JSON.stringify(state[key]));
}

function logActivity(action, detail, userOverride) {
  const entry = {
    id: generateId('activity'),
    action,
    detail,
    user: userOverride || (state.currentUser ? state.currentUser.username : 'sistema'),
    time: new Date().toISOString()
  };
  state.activity.unshift(entry);
  state.activity = state.activity.slice(0, 80);
  saveState('activity');
  renderActivity();
}

function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
}

function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return '-';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch((error) => {
      console.warn('Falha ao registrar service worker', error);
    });
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', init);
}
