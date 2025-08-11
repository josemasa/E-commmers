const SHEET_ID = '1Bcfwxd2RidSKvpFnyKrnzddHpjUkpbuJtA6cXVQSZBE';
const SHEET_NAME = 'Hoja1';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

const PHONE_NUMBER = '543816163841'; // Sin + ni 0

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];
let categories = [];

async function loadProducts() {
  const res = await fetch(SHEET_URL);
  const text = await res.text();
  const json = JSON.parse(text.substr(47).slice(0, -2));
  const rows = json.table.rows;

  products = rows.map(row => {
    return {
      nombre: row.c[0]?.v || '',
      precio: parseFloat(row.c[1]?.v) || 0,
      categoria: row.c[2]?.v || 'Sin categoría'
    };
  });

  categories = [...new Set(products.map(p => p.categoria))].sort();

  const categoryFilter = document.getElementById('categoryFilter');
  categoryFilter.innerHTML = `<option value="">Todas las categorías</option>` +
    categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  
  categoryFilter.addEventListener('change', () => renderProducts());

  renderProducts();
}

function renderProducts() {
  const filterValue = document.getElementById('categoryFilter').value;
  const container = document.getElementById('productList');
  container.innerHTML = '';

  const filteredProducts = products.filter(p => !filterValue || p.categoria === filterValue);

  filteredProducts.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `
      <div class="product-name">${p.nombre}</div>
      <div class="product-details">
        <span>$${p.precio.toFixed(2)}</span>
        <div class="qty-controls">
          <button onclick="changeQty('input-${i}', -1)">-</button>
          <input type="number" min="1" value="1" id="input-${i}" style="width:50px; text-align:center" />
          <button onclick="changeQty('input-${i}', 1)">+</button>
        </div>
        <button class="add-btn" onclick="addToCart('${p.nombre}', ${p.precio}, 'input-${i}')">Agregar</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function changeQty(inputId, delta) {
  const input = document.getElementById(inputId);
  let val = parseInt(input.value) || 1;
  val += delta;
  if (val < 1) val = 1;
  input.value = val;
}

function addToCart(nombre, precio, inputId) {
  const cantidad = parseInt(document.getElementById(inputId).value) || 1;
  const index = cart.findIndex(item => item.nombre === nombre);
  if (index !== -1) {
    cart[index].cantidad += cantidad;
  } else {
    cart.push({ nombre, precio, cantidad });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  alert(`Agregaste ${cantidad} x ${nombre} al carrito`);
}

function loadCart() {
  const cartList = document.getElementById('cartList');
  cartList.innerHTML = '';
  let total = 0;

  if (cart.length === 0) {
    cartList.innerHTML = '<p>Tu carrito está vacío.</p>';
    document.getElementById('cartTotal').textContent = '';
    return;
  }

  cart.forEach((item, i) => {
    total += item.precio * item.cantidad;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <span>${item.nombre} - $${item.precio.toFixed(2)} x ${item.cantidad}</span>
      <div class="cart-actions">
        <button onclick="changeCartQty(${i}, -1)">-</button>
        <button onclick="changeCartQty(${i}, 1)">+</button>
        <button onclick="removeFromCart(${i})">❌</button>
      </div>
    `;
    cartList.appendChild(div);
  });

  document.getElementById('cartTotal').textContent = `Total: $${total.toFixed(2)}`;
}

function changeCartQty(index, delta) {
  cart[index].cantidad += delta;
  if (cart[index].cantidad < 1) {
    cart.splice(index, 1);
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart();
}

function checkout() {
  if (cart.length === 0) {
    alert('El carrito está vacío.');
    return;
  }
  let message = '🛒 *Detalle del pedido:*\n';
  cart.forEach(item => {
    message += `${item.cantidad} x ${item.nombre} = $${(item.precio * item.cantidad).toFixed(2)}\n`;
  });
  const total = cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  message += `\n💰 Total: $${total.toFixed(2)}`;
  const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}
