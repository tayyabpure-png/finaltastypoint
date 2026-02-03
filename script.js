// script.js

// 1. GLOBAL STATE
let cart = JSON.parse(localStorage.getItem('tastyCart')) || [];
const DELIVERY_FEE = 50; // Rs

// 2. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    
    // Check which page we are on
    if (document.body.classList.contains('cart-page')) {
        renderCartPage();
    }
});

// 3. CORE FUNCTIONS

function updateCartBadge() {
    const countElement = document.getElementById('cart-count');
    if (countElement) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        countElement.innerText = totalItems;
        // Hide badge if 0, show if > 0
        countElement.style.display = totalItems === 0 ? 'none' : 'block';
    }
}

function saveCart() {
    localStorage.setItem('tastyCart', JSON.stringify(cart));
    updateCartBadge();
}

// 4. ADD TO CART LOGIC (With Variants)
function addToCart(id, baseName, basePrice) {
    let finalName = baseName;
    let finalPrice = basePrice;
    
    // Check for Customizations (Dropdowns) based on ID
    // ID 1 = Zinger, ID 2 = Shami, ID 3 = Shawarma
    const selectId = `opt-${id}`;
    const selectElement = document.getElementById(selectId);

    if (selectElement) {
        const variant = selectElement.value;
        
        // Logic for Zinger
        if (id === 1 && variant === 'meal') {
            finalName = "Zinger Burger (Meal)";
            finalPrice = basePrice + 150;
        }
        
        // Logic for Shami
        if (id === 2 && variant === 'double') {
            finalName = "Anda Shami (Double Egg)";
            finalPrice = basePrice + 40;
        }

        // Logic for Shawarma
        if (id === 3) {
            // Price doesn't change, just the name
            const flavor = variant === 'spicy' ? 'Spicy' : 'Mild';
            finalName = `Shawarma (${flavor})`;
        }
    }

    // Add to array
    const existingItem = cart.find(item => item.name === finalName);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id, // Keep original ID for reference
            name: finalName,
            price: finalPrice,
            quantity: 1
        });
    }

    saveCart();
    showToast(`${finalName} added!`);
}

// Wrapper for the UI Animation (Called from HTML)
function addToCartUI(btnElement, id, name, price) {
    // 1. Logic
    addToCart(id, name, price);

    // 2. Visuals
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="fas fa-check"></i> Added!';
    btnElement.classList.add('added'); // You can style this class if you want
    btnElement.style.backgroundColor = "#25D366"; // Green success
    
    setTimeout(() => {
        btnElement.innerHTML = originalText;
        btnElement.classList.remove('added');
        btnElement.style.backgroundColor = ""; // Revert to CSS default
    }, 2000);
}

// 5. RENDER CART PAGE
function renderCartPage() {
    const container = document.getElementById('cart-items-container');
    const emptyState = document.getElementById('empty-state');
    const cartContent = document.getElementById('cart-content');
    
    // Safety check
    if (!container) return;

    // Toggle Empty State
    if (cart.length === 0) {
        emptyState.style.display = 'block';
        cartContent.style.display = 'none';
        return;
    } else {
        emptyState.style.display = 'none';
        cartContent.style.display = 'block';
    }

    // Render Items
    container.innerHTML = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        container.innerHTML += `
            <div class="cart-item">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <small>Price: ${item.price} Rs</small>
                </div>
                <div class="item-actions">
                    <span style="font-size:0.9rem; color:#666;">x ${item.quantity}</span>
                    <strong>${itemTotal} Rs</strong>
                    <button class="remove-btn" onclick="removeItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    updateTotals(subtotal);
}

function updateTotals(subtotal) {
    const orderType = document.getElementById('order-type').value;
    const deliveryPrice = (orderType === 'delivery') ? DELIVERY_FEE : 0;
    const total = subtotal + deliveryPrice;

    document.getElementById('subtotal-price').innerText = `${subtotal} Rs`;
    document.getElementById('delivery-price').innerText = `${deliveryPrice} Rs`;
    document.getElementById('total-price').innerText = `${total} Rs`;
}

// 6. ACTIONS

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    renderCartPage(); // Re-render to update UI
}

function toggleAddress() {
    const addressGroup = document.getElementById('address-group');
    const orderType = document.getElementById('order-type').value;
    
    if (orderType === 'delivery') {
        addressGroup.style.display = 'block';
        document.getElementById('customer-address').setAttribute('required', 'true');
    } else {
        addressGroup.style.display = 'none';
        document.getElementById('customer-address').removeAttribute('required');
    }
    
    // Recalculate totals because delivery fee might change
    renderCartPage(); 
}

function checkout() {
    const name = document.getElementById('customer-name').value.trim();
    const orderType = document.getElementById('order-type').value;
    const address = document.getElementById('customer-address').value.trim();
    
    // Validation
    if (!name) {
        alert("Please enter your name.");
        return;
    }
    if (orderType === 'delivery' && !address) {
        alert("Please enter your delivery address.");
        return;
    }

    // Prepare WhatsApp Message
    let message = `*NEW ORDER - TASTY POINT* 🍔\n`;
    message += `----------------------------\n`;
    message += `👤 *Name:* ${name}\n`;
    message += `🚚 *Order Type:* ${orderType.toUpperCase()}\n`;
    if (orderType === 'delivery') message += `📍 *Address:* ${address}\n`;
    
    message += `\n*🛒 ITEMS:*\n`;
    let subtotal = 0;
    cart.forEach(item => {
        message += `▫️ ${item.quantity} x ${item.name} = ${item.price * item.quantity} Rs\n`;
        subtotal += item.price * item.quantity;
    });

    const deliveryCost = (orderType === 'delivery') ? DELIVERY_FEE : 0;
    const grandTotal = subtotal + deliveryCost;

    message += `----------------------------\n`;
    message += `💰 *Subtotal:* ${subtotal} Rs\n`;
    if(deliveryCost > 0) message += `🛵 *Delivery:* ${deliveryCost} Rs\n`;
    message += `🔥 *TOTAL BILL: ${grandTotal} Rs*\n`;

    // Send
    const phoneNumber = "923160050548"; 
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// 7. UTILS
function showToast(message) {
    const toast = document.getElementById("toast");
    if(!toast) return;
    
    toast.innerText = message;
    toast.className = "show";
    setTimeout(function(){ toast.className = toast.className.replace("show", ""); }, 3000);
}
