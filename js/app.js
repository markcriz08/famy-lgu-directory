// Global Application State
let state = {
  isAdmin: false,
  adminCredentials: { username: "admin", password: "admin123" },
  activeTab: 'dashboard',
  contacts: [
    {
      id: 1,
      name: "Famy PNP Station",
      contact: "09170000000",
      other_contact: "049-500-0000",
      address: "Poblacion, Famy, Laguna",
      organization: "PNP",
      designation: "Headquarters",
      fb_link: "https://facebook.com",
      category: "PNP",
      is_ice: true,
      status: "active"
    },
    {
      id: 2,
      name: "Juan Dela Cruz",
      contact: "09181234567",
      other_contact: "N/A",
      address: "Brgy. Batuhan, Famy, Laguna",
      organization: "MDRRMO",
      designation: "Rescue Personnel",
      fb_link: "https://facebook.com",
      category: "MDRRMO",
      is_ice: true,
      status: "active"
    }
  ]
};

// Switch Active Category / Module Tab
function switchTab(tab) {
  state.activeTab = tab;
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => 
    b.getAttribute('onclick').includes(`'${tab}'`)
  );
  if (activeBtn) activeBtn.classList.add('active');

  if (tab === 'settings') {
    document.getElementById('contactGrid').style.display = 'none';
    document.getElementById('settingsPanel').style.display = 'block';
  } else {
    document.getElementById('contactGrid').style.display = 'grid';
    document.getElementById('settingsPanel').style.display = 'none';
    renderContacts();
  }
}

// Render Contact Cards Grid
function renderContacts() {
  const container = document.getElementById('contactGrid');
  container.innerHTML = '';

  let filtered = state.contacts;

  if (state.activeTab === 'dashboard') {
    const iceCategories = ['PNP', 'MDRRMO', 'OMM', 'BFP', 'RHU'];
    filtered = state.contacts.filter(c => c.is_ice || iceCategories.includes(c.category));
  } else {
    filtered = state.contacts.filter(c => c.category === state.activeTab);
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">No contacts found under this category.</div>`;
    return;
  }

  filtered.forEach(person => {
    const card = document.createElement('div');
    card.className = `contact-card ${person.is_ice ? 'ice-card' : ''}`;
    
    card.innerHTML = `
      <div>
        <div class="card-header">
          <h3 class="card-title">${person.name}</h3>
          <span class="category-badge ${person.is_ice ? 'badge-ice' : ''}">${person.category}</span>
        </div>
        <div class="card-details">
          <p><strong>Org/Dept:</strong> ${person.organization}</p>
          <p><strong>Designation:</strong> ${person.designation}</p>
          <p><strong>Primary Contact:</strong> <a href="tel:${person.contact}">${person.contact}</a></p>
          <p><strong>Other Contact:</strong> ${person.other_contact || 'N/A'}</p>
          <p><strong>Address:</strong> ${person.address}</p>
          <p><strong>FB Profile:</strong> ${person.fb_link ? `<a href="${person.fb_link}" target="_blank" class="fb-link">View Profile</a>` : 'N/A'}</p>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-success" onclick="sendSMSAlert('${person.contact}', '${person.name}')">📲 Text Alert</button>
        ${state.isAdmin ? `
          <button class="btn btn-primary" onclick="editContact(${person.id})">Edit</button>
          <button class="btn btn-danger" onclick="deleteContact(${person.id})">Delete</button>
          ${person.category === 'MDRRMO' ? `<button class="btn btn-warning" onclick="resignPersonnel(${person.id})">Resign</button>` : ''}
        ` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

// Live SMS Dispatch via Backend Server (TextBee)
async function sendSMSAlert(phone, name) {
  const message = prompt(`Enter Emergency Text Alert for ${name} (${phone}):`);
  if (!message) return;

  try {
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message })
    });

    const data = await response.json();

    if (data.success) {
      alert(`✅ Emergency SMS successfully sent to ${name} (${phone}) via Android Gateway!`);
    } else {
      alert(`❌ Failed to send SMS: ${data.error}`);
    }
  } catch (err) {
    alert('❌ Could not connect to the backend server. Make sure server.js is running.');
  }
}

// Resign Action: Auto-Transfer MDRRMO Personnel to ACDV (Volunteers)
function resignPersonnel(id) {
  if (!state.isAdmin) return;
  const contact = state.contacts.find(c => c.id === id);
  if (contact && confirm(`Process resignation for ${contact.name}? They will automatically be transferred to ACDV (Volunteers).`)) {
    contact.category = 'ACDV';
    contact.organization = 'ACDV Volunteers';
    contact.designation = 'Volunteer';
    contact.status = 'resigned';
    alert(`${contact.name} has been transferred to ACDV (Volunteers).`);
    renderContacts();
  }
}

function deleteContact(id) {
  if (!state.isAdmin) return;
  if (confirm('Are you sure you want to delete this contact record?')) {
    state.contacts = state.contacts.filter(c => c.id !== id);
    renderContacts();
  }
}

function openContactModal() {
  document.getElementById('contactForm').reset();
  document.getElementById('editContactId').value = '';
  document.getElementById('modalTitle').textContent = 'Add New Contact';
  document.getElementById('contactModal').style.display = 'flex';
}

function editContact(id) {
  const c = state.contacts.find(item => item.id === id);
  if (!c) return;

  document.getElementById('editContactId').value = c.id;
  document.getElementById('cName').value = c.name;
  document.getElementById('cContact').value = c.contact;
  document.getElementById('cOtherContact').value = c.other_contact;
  document.getElementById('cAddress').value = c.address;
  document.getElementById('cCategory').value = c.category;
  document.getElementById('cOrganization').value = c.organization;
  document.getElementById('cDesignation').value = c.designation;
  document.getElementById('cFbLink').value = c.fb_link;
  document.getElementById('cIsIce').checked = c.is_ice;

  document.getElementById('modalTitle').textContent = 'Edit Contact';
  document.getElementById('contactModal').style.display = 'flex';
}

function saveContact(e) {
  e.preventDefault();
  const id = document.getElementById('editContactId').value;
  const contactObj = {
    id: id ? parseInt(id) : Date.now(),
    name: document.getElementById('cName').value,
    contact: document.getElementById('cContact').value,
    other_contact: document.getElementById('cOtherContact').value,
    address: document.getElementById('cAddress').value,
    category: document.getElementById('cCategory').value,
    organization: document.getElementById('cOrganization').value,
    designation: document.getElementById('cDesignation').value,
    fb_link: document.getElementById('cFbLink').value,
    is_ice: document.getElementById('cIsIce').checked
  };

  if (id) {
    const index = state.contacts.findIndex(c => c.id === parseInt(id));
    state.contacts[index] = contactObj;
  } else {
    state.contacts.push(contactObj);
  }

  closeContactModal();
  renderContacts();
}

function closeContactModal() {
  document.getElementById('contactModal').style.display = 'none';
}

function openLoginModal() {
  document.getElementById('loginModal').style.display = 'flex';
}

function closeLoginModal() {
  document.getElementById('loginModal').style.display = 'none';
}

function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById('loginUser').value;
  const p = document.getElementById('loginPass').value;

  if (u === state.adminCredentials.username && p === state.adminCredentials.password) {
    state.isAdmin = true;
    document.getElementById('adminControls').style.display = 'flex';
    document.getElementById('settingsTab').style.display = 'inline-block';
    document.getElementById('adminAuthBtn').style.display = 'none';
    closeLoginModal();
    renderContacts();
  } else {
    alert('Invalid admin credentials.');
  }
}

function adminLogout() {
  state.isAdmin = false;
  document.getElementById('adminControls').style.display = 'none';
  document.getElementById('settingsTab').style.display = 'none';
  document.getElementById('adminAuthBtn').style.display = 'inline-flex';
  switchTab('dashboard');
}

function handleUserUpdate(e) {
  e.preventDefault();
  const curr = document.getElementById('currPass').value;
  const newU = document.getElementById('newUsername').value;
  const newP = document.getElementById('newPass').value;

  if (curr === state.adminCredentials.password) {
    state.adminCredentials.username = newU;
    state.adminCredentials.password = newP;
    alert('Admin credentials updated successfully!');
    document.getElementById('adminUserForm').reset();
  } else {
    alert('Incorrect current password.');
  }
}

// Initial Page Render
renderContacts();