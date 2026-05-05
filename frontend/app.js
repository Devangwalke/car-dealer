const API = 'https://car-dealer-api-production-8eec.up.railway.app/api/cars';
let allCars = [];
let deleteId = null;
let activePage = 'dashboard';

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-item')[['dashboard','inventory','add'].indexOf(page)].classList.add('active');
  activePage = page;
  if (page === 'dashboard') loadDashboard();
  if (page === 'inventory') renderInventory();
  if (page === 'add') { clearForm(); document.getElementById('form-title').textContent = 'Add Car'; document.getElementById('form-sub').textContent = 'New listing'; }
}

async function loadCars() {
  try { const res = await fetch(API); allCars = await res.json(); }
  catch (e) { allCars = []; }
}

async function loadDashboard() {
  await loadCars();
  const total     = allCars.length;
  const available = allCars.filter(c => c.status === 'AVAILABLE').length;
  const sold      = allCars.filter(c => c.status === 'SOLD').length;
  const value     = allCars.reduce((s, c) => s + (c.price || 0), 0);
  document.getElementById('count-total').textContent     = total;
  document.getElementById('count-available').textContent = available;
  document.getElementById('count-sold').textContent      = sold;
  document.getElementById('count-value').textContent     = '₹' + formatVal(value);
  document.querySelector('.available-fill').style.width = total ? (available / total * 100) + '%' : '0%';
  document.querySelector('.sold-fill').style.width      = total ? (sold / total * 100) + '%' : '0%';
  const recent = [...allCars].reverse().slice(0, 6);
  document.getElementById('recent-list').innerHTML = recent.length ? recent.map(carCard).join('') : emptyState('No cars yet', 'Add your first car to get started.');
}

async function renderInventory() {
  await loadCars();
  applyFilter();
}

function applyFilter() {
  const status = document.getElementById('filter-status').value;
  const search = document.getElementById('filter-search').value.toLowerCase();
  let filtered = allCars;
  if (status) filtered = filtered.filter(c => c.status === status);
  if (search) filtered = filtered.filter(c => (c.brand || '').toLowerCase().includes(search) || (c.carModel || '').toLowerCase().includes(search));
  document.getElementById('inventory-list').innerHTML = filtered.length ? filtered.map(carCard).join('') : emptyState('No cars found', 'Try a different search or filter.');
}

function carCard(car) {
  const price = car.price ? '₹' + Number(car.price).toLocaleString('en-IN') : '—';
  const tags  = [car.color, car.fuelType, car.transmission].filter(Boolean);
  return `
    <div class="car-card">
      <div class="car-card-top">
        <div>
          <div class="car-brand">${car.brand || ''}</div>
          <div class="car-name">${car.carModel || ''}</div>
          <div class="car-year">${car.manufactureYear || ''}</div>
        </div>
        <span class="badge ${car.status}">${car.status}</span>
      </div>
      <div class="car-card-body">
        <div class="car-price">${price}</div>
        ${tags.length ? `<div class="car-meta">${tags.map(t => `<span class="car-tag">${t}</span>`).join('')}</div>` : ''}
        ${car.description ? `<div class="car-desc">${car.description}</div>` : ''}
        <div class="car-actions">
          <button class="btn-edit" onclick="editCar(${car.id})">✏ Edit</button>
          <button class="btn-del"  onclick="openModal(${car.id})">🗑 Delete</button>
        </div>
      </div>
    </div>`;
}

function emptyState(title, sub) {
  return `<div class="empty-state"><div class="empty-icon">🚗</div><h3>${title}</h3><p>${sub}</p></div>`;
}

async function saveCar() {
  const id  = document.getElementById('carId').value;
  const msg = document.getElementById('form-msg');
  msg.className = 'form-msg'; msg.style.display = 'none';
  const car = {
    brand: document.getElementById('brand').value.trim(),
    carModel: document.getElementById('carModel').value.trim(),
    manufactureYear: parseInt(document.getElementById('manufactureYear').value),
    price: parseFloat(document.getElementById('price').value),
    color: document.getElementById('color').value.trim(),
    fuelType: document.getElementById('fuelType').value,
    transmission: document.getElementById('transmission').value,
    status: document.getElementById('status').value,
    description: document.getElementById('description').value.trim()
  };
  if (!car.brand || !car.carModel || !car.manufactureYear || !car.price) {
    msg.textContent = '⚠ Please fill Brand, Model, Year and Price.';
    msg.className = 'form-msg error'; return;
  }
  try {
    const url = id ? `${API}/${id}` : API;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(car) });
    if (res.ok) {
      msg.textContent = id ? '✅ Car updated!' : '✅ Car added!';
      msg.className = 'form-msg success';
      clearForm();
      setTimeout(() => showPage('inventory'), 1200);
    } else { throw new Error(); }
  } catch (e) {
    msg.textContent = '❌ Error. Make sure backend is running on port 8080.';
    msg.className = 'form-msg error';
  }
}

async function editCar(id) {
  try {
    const res = await fetch(`${API}/${id}`);
    const car = await res.json();
    showPage('add');
    document.getElementById('form-title').textContent = 'Edit Car';
    document.getElementById('form-sub').textContent   = 'Update listing';
    document.getElementById('carId').value           = car.id;
    document.getElementById('brand').value           = car.brand || '';
    document.getElementById('carModel').value        = car.carModel || '';
    document.getElementById('manufactureYear').value = car.manufactureYear || '';
    document.getElementById('price').value           = car.price || '';
    document.getElementById('color').value           = car.color || '';
    document.getElementById('fuelType').value        = car.fuelType || 'Petrol';
    document.getElementById('transmission').value    = car.transmission || 'Manual';
    document.getElementById('status').value          = car.status || 'AVAILABLE';
    document.getElementById('description').value     = car.description || '';
  } catch (e) { console.error(e); }
}

function openModal(id)  { deleteId = id; document.getElementById('modal').style.display = 'flex'; }
function closeModal()   { deleteId = null; document.getElementById('modal').style.display = 'none'; }

async function confirmDelete() {
  if (!deleteId) return;
  await fetch(`${API}/${deleteId}`, { method: 'DELETE' });
  closeModal();
  await loadCars();
  if (activePage === 'dashboard') loadDashboard(); else renderInventory();
}

function clearForm() {
  ['carId','brand','carModel','manufactureYear','price','color','description'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fuelType').value     = 'Petrol';
  document.getElementById('transmission').value = 'Manual';
  document.getElementById('status').value       = 'AVAILABLE';
  const msg = document.getElementById('form-msg');
  msg.className = 'form-msg'; msg.style.display = 'none';
}

function formatVal(n) {
  if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
  if (n >= 100000)   return (n / 100000).toFixed(1) + 'L';
  return n.toLocaleString('en-IN');
}

loadDashboard();