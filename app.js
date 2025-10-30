const STORAGE_KEYS = {
  inventory: 'brivax_inventory',
  sales: 'brivax_sales',
  users: 'brivax_users',
  activity: 'brivax_activity',
  clients: 'brivax_clients',
  products: 'brivax_products'
};

const REMEMBER_KEY = 'brivax_remember';

const state = {
  inventory: [],
  sales: [],
  users: [],
  activity: [],
  clients: [],
  products: [],
  currentUser: null,
  editingPieceId: null,
  editingClientId: null,
  editingProductId: null
};

const elements = {};
let deferredPrompt = null;
let activeAuthView = 'register';

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function loadState() {
  state.inventory = readStorage(STORAGE_KEYS.inventory, []);
  state.sales = readStorage(STORAGE_KEYS.sales, []);
  state.users = readStorage(STORAGE_KEYS.users, []);
  state.activity = readStorage(STORAGE_KEYS.activity, []);
  state.clients = readStorage(STORAGE_KEYS.clients, []);
  state.products = readStorage(STORAGE_KEYS.products, []);
  ensureDefaultAdmin();
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn('Erro ao ler storage', key, error);
    return fallback;
  }
}

function persist(key) {
  const storageKey = STORAGE_KEYS[key];
  if (!storageKey) return;
  localStorage.setItem(storageKey, JSON.stringify(state[key]));
}

function ensureDefaultAdmin() {
  const adminUsername = 'GuedezShooter';
  const existingAdmin = state.users.find((user) => user.username === adminUsername);
  if (!existingAdmin) {
    const timestamp = new Date().toISOString();
    state.users.push({
      id: generateId('user'),
      username: adminUsername,
      password: 'Guedes/007',
      role: 'admin',
      firstName: 'Administrador',
      lastName: 'Brivax',
      phone: '',
      email: 'admin@brivax.com',
      createdAt: timestamp
    });
    logActivity('Configuração', 'Administrador padrão "GuedezShooter" criado automaticamente.');
    persist('users');
  } else {
    let updated = false;
    if (existingAdmin.password !== 'Guedes/007') {
      existingAdmin.password = 'Guedes/007';
      updated = true;
    }
    if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin';
      updated = true;
    }
    if (updated) {
      logActivity('Configuração', 'Credenciais do administrador "GuedezShooter" foram restauradas.');
      persist('users');
    }
  }
}

function initElements() {
  elements.authCard = $('#authCard');
  elements.appShell = $('#appShell');
  elements.authFeedback = $('#authFeedback');
  elements.loginForm = $('#loginForm');
  elements.loginUser = $('#loginUser');
  elements.loginPass = $('#loginPass');
  elements.registerForm = $('#registerForm');
  elements.registerUsername = $('#registerUsername');
  elements.registerRemember = $('#registerRemember');
  elements.logoutBtn = $('#btnLogout');
  elements.roleBadge = $('#roleBadge');
  elements.feedback = $('#feedback');
  elements.pieceForm = $('#pieceForm');
  elements.pieceSubmit = $('#pieceSubmit');
  elements.cancelEdit = $('#cancelEdit');
  elements.inventoryTable = $('#inventoryTable tbody');
  elements.inventoryCount = $('#inventoryCount');
  elements.productForm = $('#productForm');
  elements.productSubmit = $('#productSubmit');
  elements.cancelProductEdit = $('#cancelProductEdit');
  elements.productsTable = $('#productsTable tbody');
  elements.saleForm = $('#saleForm');
  elements.salePiece = $('#salePiece');
  elements.salesTable = $('#salesTable tbody');
  elements.activityList = $('#activityList');
  elements.userForm = $('#userForm');
  elements.usersTable = $('#usersTable tbody');
  elements.clientForm = $('#clientForm');
  elements.clientSubmit = $('#clientSubmit');
  elements.cancelClientEdit = $('#cancelClientEdit');
  elements.clientsTable = $('#clientsTable tbody');
  elements.installBtn = $('#btnInstall');
  elements.authTabs = $all('[data-auth-tab]');
  elements.authPanels = $all('[data-auth-panel]');
}

function bindEvents() {
  elements.loginForm?.addEventListener('submit', handleLogin);
  elements.registerForm?.addEventListener('submit', handleRegistration);
  if (elements.registerUsername) {
    elements.registerUsername.addEventListener('input', enforceUsernameFormatting);
  }
  if (elements.authTabs?.length) {
    elements.authTabs.forEach((tab) => {
      tab.addEventListener('click', () => showAuthView(tab.dataset.authTab));
    });
  }
  elements.logoutBtn.addEventListener('click', handleLogout);
  elements.pieceForm.addEventListener('submit', handlePieceSubmit);
  elements.cancelEdit.addEventListener('click', resetPieceForm);
  elements.productForm?.addEventListener('submit', handleProductSubmit);
  elements.cancelProductEdit?.addEventListener('click', resetProductForm);
  if (elements.saleForm) {
    elements.saleForm.addEventListener('submit', handleSaleSubmit);
  }
  if (elements.userForm) {
    elements.userForm.addEventListener('submit', handleUserCreate);
  }
  if (elements.clientForm) {
    elements.clientForm.addEventListener('submit', handleClientSubmit);
  }
  elements.cancelClientEdit?.addEventListener('click', resetClientForm);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    elements.installBtn?.classList.remove('hidden');
  });

  elements.installBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    elements.installBtn.classList.add('hidden');
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    elements.installBtn?.classList.add('hidden');
  });
}

function handleLogin(event) {
  event.preventDefault();
  const username = elements.loginUser.value.trim();
  const password = elements.loginPass.value;

  if (!username || !password) {
    return showFeedback('Informe usuário e senha.', 'error');
  }

  const user = state.users.find(
    (item) => item.username.toLowerCase() === username.toLowerCase() && item.password === password
  );

  if (!user) {
    showFeedback('Credenciais inválidas. Tente novamente.', 'error');
    return;
  }

  state.currentUser = user;
  elements.loginForm.reset();
  showFeedback(`Bem-vindo, ${user.username}!`, 'success');
  setTimeout(() => showFeedback('', ''), 2200);
  renderShell();
  logActivity('Login', `${user.username} iniciou sessão.`);
}

function handleRegistration(event) {
  event.preventDefault();

  const firstName = $('#registerFirstName')?.value.trim();
  const lastName = $('#registerLastName')?.value.trim();
  const phone = $('#registerPhone')?.value.trim();
  const email = $('#registerEmail')?.value.trim();
  const password = $('#registerPass')?.value || '';
  const confirmPassword = $('#registerConfirm')?.value || '';
  const remember = Boolean(elements.registerRemember?.checked);

  let usernameInput = elements.registerUsername?.value.trim() || '';
  const username = sanitizeUsername(usernameInput);
  if (elements.registerUsername && username !== usernameInput) {
    elements.registerUsername.value = username;
  }

  if (!firstName || !lastName) {
    return showFeedback('Informe nome e sobrenome.', 'error');
  }

  if (!phone) {
    return showFeedback('Informe um telefone para contato.', 'error');
  }

  const numericPhone = phone.replace(/\D/g, '');
  if (numericPhone.length < 8) {
    return showFeedback('Informe um telefone válido.', 'error');
  }

  if (!email) {
    return showFeedback('Informe um e-mail válido.', 'error');
  }

  if (!username) {
    return showFeedback('Informe um nome de usuário com letras minúsculas e sem espaços.', 'error');
  }

  if (!/^[a-z0-9]+$/.test(username)) {
    return showFeedback('Use apenas letras minúsculas e números no nome de usuário.', 'error');
  }

  if (state.users.some((user) => user.username?.toLowerCase() === username.toLowerCase())) {
    return showFeedback('Já existe um usuário com esse nome.', 'error');
  }

  if (password.length < 6) {
    return showFeedback('A senha deve conter pelo menos 6 caracteres.', 'error');
  }

  if (password !== confirmPassword) {
    return showFeedback('As senhas informadas não conferem.', 'error');
  }

  const newUser = {
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

  state.users.push(newUser);
  persist('users');

  logActivity('Cadastro', `Usuário "${username}" criado pelo próprio acesso.`);

  if (remember) {
    saveRememberedCredentials(username, password);
  } else {
    clearRememberedCredentials();
  }

  elements.registerForm?.reset();
  state.currentUser = newUser;
  renderShell();
  showFeedback('Cadastro concluído! Você já está conectado.', 'success');
}

function handleLogout() {
  if (!state.currentUser) return;
  logActivity('Logout', `${state.currentUser.username} encerrou sessão.`);
  state.currentUser = null;
  state.editingPieceId = null;
  state.editingClientId = null;
  state.editingProductId = null;
  resetClientForm();
  resetProductForm();
  activeAuthView = 'login';
  renderShell();
}

function handlePieceSubmit(event) {
  event.preventDefault();
  if (!state.currentUser) return;

  const pieceName = $('#pieceName').value.trim();
  const description = $('#pieceDesc').value.trim();
  const cost = Number($('#pieceCost').value);
  const price = Number($('#piecePrice').value);
  const quantity = Number($('#pieceQty').value);

  if (!pieceName) {
    return showFeedback('Informe o nome da peça.', 'error');
  }
  if ([cost, price, quantity].some((value) => Number.isNaN(value) || value < 0)) {
    return showFeedback('Valores inválidos. Verifique os campos numéricos.', 'error');
  }
  if (!Number.isInteger(quantity)) {
    return showFeedback('A quantidade deve ser um número inteiro.', 'error');
  }
  if (price < cost) {
    return showFeedback('O preço de venda deve ser maior ou igual ao custo.', 'error');
  }

  if (state.editingPieceId) {
    if (state.currentUser.role !== 'admin') {
      return showFeedback('Somente administradores podem editar peças.', 'error');
    }
    const piece = state.inventory.find((item) => item.id === state.editingPieceId);
    if (!piece) {
      resetPieceForm();
      return showFeedback('Peça não encontrada para edição.', 'error');
    }
    const previous = { ...piece };
    piece.name = pieceName;
    piece.description = description;
    piece.cost = cost;
    piece.price = price;
    piece.quantity = quantity;
    piece.updatedAt = new Date().toISOString();
    persist('inventory');
    logActivity(
      'Peça atualizada',
      `${state.currentUser.username} atualizou "${piece.name}" (estoque ${previous.quantity} → ${piece.quantity}).`
    );
    showFeedback('Peça atualizada com sucesso.', 'success');
  } else {
    const newPiece = {
      id: generateId('piece'),
      name: pieceName,
      description,
      cost,
      price,
      quantity,
      createdAt: new Date().toISOString(),
      createdBy: state.currentUser.username
    };
    state.inventory.push(newPiece);
    persist('inventory');
    logActivity(
      'Peça criada',
      `${state.currentUser.username} cadastrou "${newPiece.name}" com ${newPiece.quantity} unidades.`
    );
    showFeedback('Peça cadastrada com sucesso!', 'success');
  }

  resetPieceForm();
  renderInventory();
  renderSaleOptions();
}

function handleSaleSubmit(event) {
  event.preventDefault();
  if (!state.currentUser || state.currentUser.role !== 'admin') {
    return showFeedback('Somente administradores registram vendas.', 'error');
  }

  const pieceId = elements.salePiece.value;
  const quantity = Number($('#saleQty').value);
  const date = $('#saleDate').value || new Date().toISOString().slice(0, 10);

  const piece = state.inventory.find((item) => item.id === pieceId);
  if (!piece) {
    return showFeedback('Selecione uma peça válida.', 'error');
  }
  if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
    return showFeedback('Informe uma quantidade inteira válida para vender.', 'error');
  }
  if (piece.quantity < quantity) {
    return showFeedback('Estoque insuficiente para completar a venda.', 'error');
  }

  piece.quantity -= quantity;
  piece.updatedAt = new Date().toISOString();

  const sale = {
    id: generateId('sale'),
    pieceId,
    quantity,
    date,
    recordedBy: state.currentUser.username,
    value: quantity * piece.price
  };

  state.sales.push(sale);
  persist('inventory');
  persist('sales');

  logActivity(
    'Venda registrada',
    `${state.currentUser.username} vinculou venda de ${quantity}x "${piece.name}" (estoque atual: ${piece.quantity}).`
  );

  elements.saleForm.reset();
  const saleDateInput = $('#saleDate');
  if (saleDateInput) {
    saleDateInput.value = new Date().toISOString().slice(0, 10);
  }
  showFeedback('Venda registrada com sucesso.', 'success');
  renderInventory();
  renderSales();
  renderSaleOptions();
}

function handleUserCreate(event) {
  event.preventDefault();
  if (!state.currentUser || state.currentUser.role !== 'admin') {
    return showFeedback('Somente administradores podem criar usuários.', 'error');
  }

  const username = $('#newUser').value.trim();
  const password = $('#newPass').value;
  const role = $('#newRole').value;

  if (!username || !password) {
    return showFeedback('Informe usuário e senha válidos.', 'error');
  }

  if (state.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
    return showFeedback('Já existe um usuário com esse nome.', 'error');
  }

  const newUser = {
    id: generateId('user'),
    username,
    password,
    role,
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    createdAt: new Date().toISOString()
  };

  state.users.push(newUser);
  persist('users');

  logActivity('Usuário criado', `${state.currentUser.username} criou o usuário "${username}" (${role}).`);

  elements.userForm.reset();
  showFeedback('Usuário criado com sucesso.', 'success');
  renderUsers();
}

function handleClientSubmit(event) {
  event.preventDefault();
  if (!state.currentUser || state.currentUser.role !== 'admin') {
    return showFeedback('Somente administradores podem gerenciar clientes.', 'error');
  }

  const totalValueRaw = $('#clientTotalValue').value;
  const entryValueRaw = $('#clientEntryValue').value;
  const installmentsRaw = $('#clientInstallments').value;

  const totalValue = totalValueRaw ? Number(totalValueRaw) : null;
  const entryValue = entryValueRaw ? Number(entryValueRaw) : null;
  const installments = installmentsRaw ? Number(installmentsRaw) : 0;

  if ((totalValueRaw && Number.isNaN(totalValue)) || (entryValueRaw && Number.isNaN(entryValue))) {
    return showFeedback('Informe valores financeiros válidos.', 'error');
  }

  if (Number.isNaN(installments)) {
    return showFeedback('Informe um número válido de parcelas.', 'error');
  }

  const client = {
    id: state.editingClientId || generateId('client'),
    clientName: $('#clientName').value.trim(),
    clientDocument: $('#clientDocument').value.trim(),
    clientCity: $('#clientCity').value.trim(),
    clientContact: $('#clientContact').value.trim(),
    clientEmail: $('#clientEmail').value.trim(),
    clientBillingAddress: $('#clientBillingAddress').value.trim(),
    storeName: $('#clientStoreName').value.trim(),
    installationCity: $('#clientInstallationCity').value.trim(),
    installationAddress: $('#clientInstallationAddress').value.trim(),
    responsibleName: $('#clientResponsibleName').value.trim(),
    responsibleContact: $('#clientResponsibleContact').value.trim(),
    installationDate: $('#clientInstallationDate').value,
    technicians: $('#clientTechnicians').value.trim(),
    deliveryDate: $('#clientDeliveryDate').value,
    contractDate: $('#clientContractDate').value,
    totalValue,
    entryValue,
    installments,
    installmentDates: $('#clientInstallmentDates').value.trim(),
    maintenanceDate: $('#clientMaintenanceDate').value
  };

  const requiredFields = [
    ['clientName', 'Informe o nome do cliente.'],
    ['clientDocument', 'Informe o CPF ou CNPJ.'],
    ['clientContact', 'Informe um contato do cliente.'],
    ['clientEmail', 'Informe o e-mail do cliente.'],
    ['clientBillingAddress', 'Informe o endereço de cobrança.'],
    ['storeName', 'Informe o nome da loja ou franquia.'],
    ['installationCity', 'Informe a cidade de instalação.'],
    ['installationAddress', 'Informe o endereço de instalação.'],
    ['responsibleName', 'Informe o responsável pela instalação.'],
    ['responsibleContact', 'Informe o contato do responsável.']
  ];

  for (const [field, message] of requiredFields) {
    if (!client[field]) {
      return showFeedback(message, 'error');
    }
  }

  if ((typeof client.totalValue === 'number' && client.totalValue < 0) || (typeof client.entryValue === 'number' && client.entryValue < 0)) {
    return showFeedback('Valores financeiros não podem ser negativos.', 'error');
  }

  if (!Number.isInteger(client.installments) || client.installments < 0) {
    return showFeedback('Informe um número válido de parcelas.', 'error');
  }

  if (state.editingClientId) {
    const existing = state.clients.find((item) => item.id === state.editingClientId);
    if (!existing) {
      resetClientForm();
      return showFeedback('Cliente não encontrado para edição.', 'error');
    }
    const previousName = existing.clientName;
    Object.assign(existing, client, { updatedAt: new Date().toISOString() });
    persist('clients');
    logActivity('Cliente atualizado', `${state.currentUser.username} atualizou "${previousName}".`);
    showFeedback('Dados do cliente atualizados.', 'success');
  } else {
    const newClient = {
      ...client,
      createdAt: new Date().toISOString(),
      createdBy: state.currentUser.username
    };
    state.clients.push(newClient);
    persist('clients');
    logActivity('Cliente cadastrado', `${state.currentUser.username} cadastrou o cliente "${newClient.clientName}".`);
    showFeedback('Cliente cadastrado com sucesso.', 'success');
  }

  resetClientForm();
  renderClients();
}

function renderShell() {
  const loggedIn = Boolean(state.currentUser);
  elements.authCard.classList.toggle('hidden', loggedIn);
  elements.appShell.classList.toggle('hidden', !loggedIn);
  elements.logoutBtn.classList.toggle('hidden', !loggedIn);

  if (!loggedIn) {
    elements.roleBadge.textContent = '';
    resetPieceForm();
    resetProductForm();
    showFeedback('', '');
    showAuthView(activeAuthView);
    applyRememberedCredentials();
    return;
  }

  const roleLabel = state.currentUser.role === 'admin' ? 'Administrador' : 'Usuário';
  elements.roleBadge.textContent = `Perfil: ${roleLabel}`;

  if (elements.authFeedback) {
    elements.authFeedback.classList.remove('success', 'error', 'info', 'show');
    elements.authFeedback.textContent = '';
  }

  applyAdminVisibility();
  renderProducts();
  renderInventory();
  renderSaleOptions();
  renderSales();
  renderActivity();
  renderUsers();
  renderClients();
}

function renderInventory() {
  if (!elements.inventoryTable) return;
  const rows = state.inventory
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((piece) => buildInventoryRow(piece))
    .join('');
  elements.inventoryTable.innerHTML = rows || '<tr><td colspan="6">Nenhuma peça cadastrada.</td></tr>';
  const totalItems = state.inventory.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  elements.inventoryCount.textContent = `${formatPlural(state.inventory.length, 'peça', 'peças')} · ${formatPlural(totalItems, 'unidade', 'unidades')}`;
  attachRowEvents();
  applyAdminVisibility();
}

function buildInventoryRow(piece) {
  const format = formatCurrency(piece.price);
  const cost = formatCurrency(piece.cost);
  const actions = state.currentUser?.role === 'admin'
    ? `<div class="table-actions"><button class="btn ghost" data-action="edit" data-id="${piece.id}">Editar</button></div>`
    : '';

  return `
    <tr>
      <td data-label="Peça">${escapeHtml(piece.name)}</td>
      <td data-label="Descrição">${escapeHtml(piece.description || '—')}</td>
      <td data-label="Custo">${cost}</td>
      <td data-label="Venda">${format}</td>
      <td data-label="Estoque">${piece.quantity}</td>
      <td class="admin-only" data-label="Ações">${actions}</td>
    </tr>
  `;
}

function attachRowEvents() {
  $all('button[data-action="edit"]').forEach((button) => {
    button.onclick = () => startEditPiece(button.dataset.id);
  });
}

function startEditPiece(pieceId) {
  const piece = state.inventory.find((item) => item.id === pieceId);
  if (!piece) return;
  state.editingPieceId = pieceId;
  $('#pieceId').value = pieceId;
  $('#pieceName').value = piece.name;
  $('#pieceDesc').value = piece.description || '';
  $('#pieceCost').value = piece.cost;
  $('#piecePrice').value = piece.price;
  $('#pieceQty').value = piece.quantity;
  elements.pieceSubmit.textContent = 'Atualizar peça';
  elements.cancelEdit.classList.remove('hidden');
  showFeedback(`Editando ${piece.name}.`, 'info');
}

function resetPieceForm() {
  state.editingPieceId = null;
  elements.pieceForm.reset();
  $('#pieceId').value = '';
  elements.pieceSubmit.textContent = 'Salvar peça';
  elements.cancelEdit.classList.add('hidden');
}

function handleProductSubmit(event) {
  event.preventDefault();
  if (!state.currentUser || state.currentUser.role !== 'admin') {
    return showFeedback('Somente administradores podem gerenciar produtos.', 'error');
  }

  const nameInput = $('#productName');
  const skuInput = $('#productSku');
  const categoryInput = $('#productCategory');
  const descriptionInput = $('#productDescription');
  const costInput = $('#productCost');
  const priceInput = $('#productPrice');
  const quantityInput = $('#productQty');

  const name = nameInput?.value.trim() || '';
  const sku = skuInput?.value.trim() || '';
  const category = categoryInput?.value.trim() || '';
  const description = descriptionInput?.value.trim() || '';
  const cost = Number(costInput?.value || 0);
  const price = Number(priceInput?.value);
  const quantity = Number(quantityInput?.value || 0);

  if (!name) {
    return showFeedback('Informe o nome do produto.', 'error');
  }
  if (Number.isNaN(price) || price < 0) {
    return showFeedback('Informe um preço de venda válido.', 'error');
  }
  if (Number.isNaN(cost) || cost < 0) {
    return showFeedback('O custo não pode ser negativo.', 'error');
  }
  if (Number.isNaN(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
    return showFeedback('A quantidade deve ser um número inteiro positivo.', 'error');
  }

  if (sku) {
    const duplicate = state.products.some(
      (item) => item.sku?.toLowerCase() === sku.toLowerCase() && item.id !== state.editingProductId
    );
    if (duplicate) {
      return showFeedback('Já existe um produto com esse código/SKU.', 'error');
    }
  }

  if (state.editingProductId) {
    const product = state.products.find((item) => item.id === state.editingProductId);
    if (!product) {
      resetProductForm();
      return showFeedback('Produto não encontrado para edição.', 'error');
    }
    product.name = name;
    product.sku = sku;
    product.category = category;
    product.description = description;
    product.cost = cost;
    product.price = price;
    product.quantity = quantity;
    product.updatedAt = new Date().toISOString();
    persist('products');
    logActivity('Produto atualizado', `${state.currentUser.username} atualizou "${product.name}".`);
    showFeedback('Produto atualizado com sucesso.', 'success');
  } else {
    const newProduct = {
      id: generateId('product'),
      name,
      sku,
      category,
      description,
      cost,
      price,
      quantity,
      createdAt: new Date().toISOString(),
      createdBy: state.currentUser.username
    };
    state.products.push(newProduct);
    persist('products');
    logActivity('Produto cadastrado', `${state.currentUser.username} registrou o produto "${newProduct.name}".`);
    showFeedback('Produto cadastrado com sucesso.', 'success');
  }

  resetProductForm();
  renderProducts();
}

function startEditProduct(productId) {
  if (state.currentUser?.role !== 'admin') return;
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  state.editingProductId = productId;
  const idField = $('#productId');
  const nameField = $('#productName');
  const skuField = $('#productSku');
  const categoryField = $('#productCategory');
  const descriptionField = $('#productDescription');
  const costField = $('#productCost');
  const priceField = $('#productPrice');
  const qtyField = $('#productQty');

  if (idField) idField.value = productId;
  if (nameField) nameField.value = product.name;
  if (skuField) skuField.value = product.sku || '';
  if (categoryField) categoryField.value = product.category || '';
  if (descriptionField) descriptionField.value = product.description || '';
  if (costField) costField.value = typeof product.cost === 'number' ? product.cost : '';
  if (priceField) priceField.value = product.price;
  if (qtyField) qtyField.value = product.quantity;
  if (elements.productSubmit) {
    elements.productSubmit.textContent = 'Atualizar produto';
  }
  elements.cancelProductEdit?.classList.remove('hidden');
  showFeedback(`Editando ${product.name}.`, 'info');
}

function resetProductForm() {
  state.editingProductId = null;
  if (elements.productForm) {
    elements.productForm.reset();
  }
  const idField = $('#productId');
  if (idField) idField.value = '';
  if (elements.productSubmit) {
    elements.productSubmit.textContent = 'Salvar produto';
  }
  elements.cancelProductEdit?.classList.add('hidden');
}

function handleProductDelete(productId) {
  if (state.currentUser?.role !== 'admin') {
    return showFeedback('Somente administradores podem remover produtos.', 'error');
  }
  const product = state.products.find((item) => item.id === productId);
  if (!product) {
    return showFeedback('Produto não encontrado.', 'error');
  }
  if (!window.confirm(`Remover o produto "${product.name}"?`)) {
    return;
  }
  state.products = state.products.filter((item) => item.id !== productId);
  persist('products');
  if (state.editingProductId === productId) {
    resetProductForm();
  }
  logActivity('Produto removido', `${state.currentUser.username} removeu o produto "${product.name}".`);
  showFeedback('Produto removido.', 'success');
  renderProducts();
}

function renderProducts() {
  if (!elements.productsTable) return;
  const rows = state.products
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((product) => buildProductRow(product))
    .join('');
  elements.productsTable.innerHTML = rows || '<tr><td colspan="7">Nenhum produto cadastrado.</td></tr>';
  attachProductRowEvents();
  applyAdminVisibility();
}

function buildProductRow(product) {
  const updatedAt = product.updatedAt || product.createdAt;
  const actions = state.currentUser?.role === 'admin'
    ? `
      <div class="table-actions">
        <button class="btn ghost" data-product-action="edit" data-id="${product.id}">Editar</button>
        <button class="btn danger ghost" data-product-action="delete" data-id="${product.id}">Excluir</button>
      </div>
    `
    : '';

  return `
    <tr>
      <td data-label="Produto">${escapeHtml(product.name)}</td>
      <td data-label="Código">${escapeHtml(product.sku || '—')}</td>
      <td data-label="Categoria">${escapeHtml(product.category || '—')}</td>
      <td data-label="Preço">${formatCurrency(product.price)}</td>
      <td data-label="Estoque">${product.quantity}</td>
      <td data-label="Atualizado">${escapeHtml(formatDateTime(updatedAt))}</td>
      <td class="admin-only" data-label="Ações">${actions}</td>
    </tr>
  `;
}

function attachProductRowEvents() {
  $all('button[data-product-action]').forEach((button) => {
    const { productAction: action, id } = button.dataset;
    if (action === 'edit') {
      button.onclick = () => startEditProduct(id);
    } else if (action === 'delete') {
      button.onclick = () => handleProductDelete(id);
    }
  });
}

function renderSaleOptions() {
  if (!elements.salePiece) return;
  const previous = elements.salePiece.value;
  const options = state.inventory
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((piece) => `<option value="${piece.id}">${escapeHtml(piece.name)} (${piece.quantity} un.)</option>`)
    .join('');
  elements.salePiece.innerHTML = `<option value=""${previous ? '' : ' selected'}>Selecione...</option>${options}`;
  if (previous && state.inventory.some((item) => item.id === previous)) {
    elements.salePiece.value = previous;
  } else {
    elements.salePiece.selectedIndex = 0;
  }
  const saleDateInput = $('#saleDate');
  if (saleDateInput) {
    saleDateInput.value = new Date().toISOString().slice(0, 10);
  }
  applyAdminVisibility();
}

function renderSales() {
  if (!elements.salesTable) return;
  const rows = state.sales
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((sale) => {
      const piece = state.inventory.find((item) => item.id === sale.pieceId);
      const pieceName = piece ? piece.name : 'Peça removida';
      return `
        <tr>
          <td data-label="Data">${formatDate(sale.date)}</td>
          <td data-label="Peça">${escapeHtml(pieceName)}</td>
          <td data-label="Quantidade">${sale.quantity}</td>
          <td data-label="Total">${formatCurrency(sale.value)}</td>
          <td data-label="Registrado por">${escapeHtml(sale.recordedBy)}</td>
        </tr>
      `;
    })
    .join('');
  elements.salesTable.innerHTML = rows || '<tr><td colspan="5">Nenhuma venda registrada.</td></tr>';
  applyAdminVisibility();
}

function renderActivity() {
  if (!elements.activityList) return;
  const items = state.activity
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map((entry) => `
      <li>
        <time>${formatDateTime(entry.timestamp)}</time>
        <strong>${escapeHtml(entry.action)}</strong>
        <p>${escapeHtml(entry.detail)}</p>
      </li>
    `)
    .join('');
  elements.activityList.innerHTML = items || '<li><p>Nenhuma atividade registrada ainda.</p></li>';
}

function renderUsers() {
  if (!elements.usersTable) return;
  if (!state.currentUser || state.currentUser.role !== 'admin') {
    elements.usersTable.innerHTML = '';
    return;
  }
  const rows = state.users
    .map((user) => `
      <tr>
        <td data-label="Usuário">${escapeHtml(user.username)}</td>
        <td data-label="Perfil">${user.role === 'admin' ? 'Administrador' : 'Usuário'}</td>
        <td data-label="Criado em">${formatDateTime(user.createdAt)}</td>
      </tr>
    `)
    .join('');
  elements.usersTable.innerHTML = rows;
}

function renderClients() {
  if (!elements.clientsTable) return;
  if (!state.currentUser || state.currentUser.role !== 'admin') {
    elements.clientsTable.innerHTML = '';
    return;
  }

  const rows = state.clients
    .slice()
    .sort((a, b) => a.clientName.localeCompare(b.clientName, 'pt-BR'))
    .map((client) => buildClientRow(client))
    .join('');

  elements.clientsTable.innerHTML = rows || '<tr><td colspan="10">Nenhum cliente cadastrado.</td></tr>';
  attachClientRowEvents();
  applyAdminVisibility();
}

function buildClientRow(client) {
  const total = typeof client.totalValue === 'number' ? formatCurrency(client.totalValue) : null;
  const entry = typeof client.entryValue === 'number' ? `Entrada ${formatCurrency(client.entryValue)}` : null;
  const installments = client.installments ? `${client.installments}x` : null;

  const financialSummary = [total, entry, installments]
    .filter(Boolean)
    .join(' · ');

  const actions =
    state.currentUser?.role === 'admin'
      ? `<div class="table-actions"><button class="btn ghost" data-client-action="edit" data-id="${client.id}">Editar</button></div>`
      : '';

  return `
    <tr>
      <td data-label="Cliente">${escapeHtml(client.clientName)}</td>
      <td data-label="Documento">${escapeHtml(client.clientDocument || '—')}</td>
      <td data-label="Cidade">${escapeHtml(client.clientCity || '—')}</td>
      <td data-label="Contato">${escapeHtml(client.clientContact || '—')}</td>
      <td data-label="Loja/Franquia">${escapeHtml(client.storeName || '—')}</td>
      <td data-label="Instalação">${escapeHtml(client.installationCity || '—')} · ${formatDate(client.installationDate)}</td>
      <td data-label="Contrato">${formatDate(client.contractDate)}</td>
      <td data-label="Financeiro">${financialSummary || '—'}</td>
      <td data-label="Manutenção">${formatDate(client.maintenanceDate)}</td>
      <td class="admin-only" data-label="Ações">${actions}</td>
    </tr>
  `;
}

function attachClientRowEvents() {
  $all('button[data-client-action="edit"]').forEach((button) => {
    button.onclick = () => startEditClient(button.dataset.id);
  });
}

function startEditClient(clientId) {
  const client = state.clients.find((item) => item.id === clientId);
  if (!client) return;
  state.editingClientId = clientId;
  $('#clientId').value = clientId;
  $('#clientName').value = client.clientName || '';
  $('#clientDocument').value = client.clientDocument || '';
  $('#clientCity').value = client.clientCity || '';
  $('#clientContact').value = client.clientContact || '';
  $('#clientEmail').value = client.clientEmail || '';
  $('#clientBillingAddress').value = client.clientBillingAddress || '';
  $('#clientStoreName').value = client.storeName || '';
  $('#clientInstallationCity').value = client.installationCity || '';
  $('#clientInstallationAddress').value = client.installationAddress || '';
  $('#clientResponsibleName').value = client.responsibleName || '';
  $('#clientResponsibleContact').value = client.responsibleContact || '';
  $('#clientInstallationDate').value = client.installationDate || '';
  $('#clientTechnicians').value = client.technicians || '';
  $('#clientDeliveryDate').value = client.deliveryDate || '';
  $('#clientContractDate').value = client.contractDate || '';
  $('#clientTotalValue').value = client.totalValue ?? '';
  $('#clientEntryValue').value = client.entryValue ?? '';
  $('#clientInstallments').value = client.installments ?? '';
  $('#clientInstallmentDates').value = client.installmentDates || '';
  $('#clientMaintenanceDate').value = client.maintenanceDate || '';
  elements.clientSubmit.textContent = 'Atualizar cliente';
  elements.cancelClientEdit?.classList.remove('hidden');
  showFeedback(`Editando cadastro de ${client.clientName}.`, 'info');
}

function resetClientForm() {
  state.editingClientId = null;
  elements.clientForm?.reset();
  $('#clientId').value = '';
  if (elements.clientSubmit) {
    elements.clientSubmit.textContent = 'Salvar cliente';
  }
  elements.cancelClientEdit?.classList.add('hidden');
}

function enforceUsernameFormatting(event) {
  const target = event.target;
  if (!target) return;
  const sanitized = sanitizeUsername(target.value);
  if (sanitized !== target.value) {
    target.value = sanitized;
  }
}

function showAuthView(view) {
  if (!view) return;
  activeAuthView = view;
  const tabs = elements.authTabs || [];
  const panels = elements.authPanels || [];

  tabs.forEach((tab) => {
    const isActive = tab.dataset.authTab === view;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  panels.forEach((panel) => {
    const isActive = panel.dataset.authPanel === view;
    panel.classList.toggle('hidden', !isActive);
    panel.setAttribute('aria-hidden', String(!isActive));
  });
}

function applyRememberedCredentials() {
  if (state.currentUser) return;
  const remembered = readRememberedCredentials();
  if (!remembered) return;

  if (elements.loginUser) {
    elements.loginUser.value = remembered.username || '';
  }
  if (elements.loginPass) {
    elements.loginPass.value = remembered.password || '';
  }
  showAuthView('login');
}

function readRememberedCredentials() {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Erro ao ler credenciais salvas', error);
    return null;
  }
}

function saveRememberedCredentials(username, password) {
  try {
    localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username, password }));
  } catch (error) {
    console.warn('Erro ao salvar credenciais', error);
  }
}

function clearRememberedCredentials() {
  localStorage.removeItem(REMEMBER_KEY);
}

function logActivity(action, detail) {
  const entry = {
    id: generateId('activity'),
    action,
    detail,
    timestamp: new Date().toISOString()
  };
  state.activity.push(entry);
  persist('activity');
}

function showFeedback(message, type) {
  const targets = [elements.feedback, elements.authFeedback].filter(Boolean);
  targets.forEach((target) => {
    target.classList.remove('success', 'error', 'info', 'show');
    target.textContent = '';
  });

  if (!message) return;

  const target = state.currentUser ? elements.feedback : elements.authFeedback;
  if (!target) return;
  if (type) target.classList.add(type);
  target.textContent = message;
  target.classList.add('show');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function formatDate(date) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('pt-BR');
}

function formatDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('pt-BR', { hour12: false });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPlural(count, singular, plural) {
  const abs = Math.abs(Number(count) || 0);
  const label = abs === 1 ? singular : plural;
  return `${abs} ${label}`;
}

function sanitizeUsername(value) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function generateId(prefix) {
  if (crypto?.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
}

function attachStorageListeners() {
  window.addEventListener('storage', () => {
    loadState();
    renderShell();
  });
}

function applyAdminVisibility() {
  const isAdmin = state.currentUser?.role === 'admin';
  $all('.admin-only').forEach((node) => {
    node.classList.toggle('hidden', !isAdmin);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initElements();
  loadState();
  bindEvents();
  attachStorageListeners();
  renderShell();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch((error) => {
      console.warn('Falha ao registrar service worker', error);
    });
  }
});
