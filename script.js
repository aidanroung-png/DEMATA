// Sistema de seguimiento para DEMATA

let productViews = {};
let productInterests = [];
let clientId = null;
let isAdminAuthenticated = false;
const ADMIN_PASSWORD = "demata2026";

document.addEventListener('DOMContentLoaded', function() {
    initStorage();
    loadStatistics();
    setupEventListeners();
    setupAdminPanel();
    verificarSesion();
});

function initStorage() {
    clientId = localStorage.getItem('demataClientId');
    if (!clientId) {
        clientId = 'cliente-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('demataClientId', clientId);
    }
    
    productViews = JSON.parse(localStorage.getItem('demataProductViews') || '{}');
    productInterests = JSON.parse(localStorage.getItem('demataProductInterests') || '[]');
}

function saveData() {
    localStorage.setItem('demataProductViews', JSON.stringify(productViews));
    localStorage.setItem('demataProductInterests', JSON.stringify(productInterests));
}

function verDetallesProducto(productId) {
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (!productCard) return;
    
    const productName = productCard.dataset.productName;
    const productPrice = productCard.dataset.productPrice;
    const productTallas = productCard.dataset.productTallas;
    const productColores = productCard.dataset.productColores;
    const productMaterial = productCard.dataset.productMaterial;
    const productCaracteristicas = productCard.dataset.productCaracteristicas;
    const productImage = productCard.querySelector('img').src;
    
    productViews[productId] = (productViews[productId] || 0) + 1;
    
    const existingInterest = productInterests.find(item => item.id == productId);
    if (existingInterest) {
        existingInterest.views++;
        existingInterest.lastSeen = new Date().toISOString();
    } else {
        productInterests.push({
            id: productId,
            name: productName,
            price: productPrice,
            views: 1,
            lastSeen: new Date().toISOString(),
            clientId: clientId
        });
    }
    
    saveData();
    updateProductViews(productId);
    
    showProductModal({
        id: productId,
        name: productName,
        price: productPrice,
        tallas: productTallas,
        colores: productColores,
        material: productMaterial,
        caracteristicas: productCaracteristicas,
        image: productImage
    });
    
    updateAdminPanel();
}

function showProductModal(product) {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = `
        <div class="modal-image">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="modal-info">
            <h2>${product.name}</h2>
            <div class="modal-price">$${product.price} MXN</div>
            
            <div class="modal-specs">
                <div class="spec-item">
                    <span class="spec-label">Tallas:</span>
                    <span class="spec-value">${product.tallas}</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Colores:</span>
                    <span class="spec-value">${product.colores}</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Material:</span>
                    <span class="spec-value">${product.material}</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Características:</span>
                    <span class="spec-value">${product.caracteristicas}</span>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="modal-whatsapp" onclick="pedirPorWhatsApp(${product.id})">
                    <i class="fab fa-whatsapp"></i> Pedir por WhatsApp
                </button>
                <button class="modal-back" onclick="closeModal()">
                    Seguir viendo
                </button>
            </div>
        </div>
    `;
    
    modalOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    modalOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function pedirPorWhatsApp(productId) {
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (!productCard) return;
    
    const productName = productCard.dataset.productName;
    const productPrice = productCard.dataset.productPrice;
    const productTallas = productCard.dataset.productTallas;
    
    let mensaje = `🛍️ *PEDIDO DEMATA* 🛍️\n\n`;
    mensaje += `*Producto solicitado:*\n`;
    mensaje += `• ${productName}\n`;
    mensaje += `• Precio: $${productPrice} MXN\n`;
    mensaje += `• Tallas: ${productTallas}\n\n`;
    mensaje += `*Información:*\n`;
    mensaje += `• Confirmación de disponibilidad\n`;
    mensaje += `• Tiempo de entrega\n`;
    mensaje += `• Costo de envío\n\n`;
    mensaje += `¡Gracias!`;
    
    const encodedMensaje = encodeURIComponent(mensaje);
    window.open(`https://wa.me/5523008727?text=${encodedMensaje}`, "_blank");
}

function updateProductViews(productId) {
    const viewElement = document.getElementById(`views-${productId}`);
    if (viewElement) {
        viewElement.textContent = productViews[productId] || 0;
    }
}

function loadStatistics() {
    Object.keys(productViews).forEach(productId => {
        updateProductViews(productId);
    });
}

function setupEventListeners() {
    const filtroBtns = document.querySelectorAll('.filtro-btn');
    const productoCards = document.querySelectorAll('.producto-card');
    
    filtroBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filtroBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            
            productoCards.forEach(card => {
                const categoria = card.getAttribute('data-categoria');
                if (filter === 'all' || categoria.includes(filter)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.width = '100%';
            navLinks.style.backgroundColor = 'white';
            navLinks.style.padding = '20px';
            navLinks.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
            navLinks.style.gap = '15px';
            navLinks.style.zIndex = '1000';
        });
    }
    
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                navLinks.style.display = 'none';
            }
        });
    });
    
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navLinks.style.display = 'flex';
            navLinks.style.flexDirection = 'row';
            navLinks.style.position = 'static';
            navLinks.style.width = 'auto';
            navLinks.style.backgroundColor = 'transparent';
            navLinks.style.padding = '0';
            navLinks.style.boxShadow = 'none';
        } else {
            navLinks.style.display = 'none';
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
}

function verificarSesion() {
    const sessionExpiry = localStorage.getItem('demataAdminSession');
    if (sessionExpiry && Date.now() < parseInt(sessionExpiry)) {
        isAdminAuthenticated = true;
        showAdminButton();
    }
}

function showAdminButton() {
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.style.display = 'flex';
    }
}

function accederPanelAdmin() {
    if (isAdminAuthenticated) {
        mostrarPanelAdmin();
    } else {
        mostrarLogin();
    }
}

function mostrarLogin() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'block';
        document.getElementById('adminPassword').focus();
    }
}

function cerrarLogin() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'none';
        document.getElementById('adminPassword').value = '';
    }
}

function verificarPassword() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        isAdminAuthenticated = true;
        cerrarLogin();
        showAdminButton();
        mostrarPanelAdmin();
        showNotification('✅ Acceso concedido');
        
        const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem('demataAdminSession', sessionExpiry.toString());
    } else {
        showNotification('❌ Contraseña incorrecta');
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
}

function setupAdminPanel() {
    const adminClose = document.getElementById('adminClose');
    const adminPanel = document.getElementById('adminPanel');
    
    if (adminClose) {
        adminClose.addEventListener('click', function() {
            adminPanel.style.display = 'none';
        });
    }
    
    adminPanel.addEventListener('click', function(e) {
        if (e.target === adminPanel) {
            adminPanel.style.display = 'none';
        }
    });
}

function mostrarPanelAdmin() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.style.display = 'block';
        updateAdminPanel();
    }
}

function updateAdminPanel() {
    const totalViews = Object.values(productViews).reduce((sum, views) => sum + views, 0);
    const totalInterests = productInterests.length;
    
    let mostViewed = '-';
    let maxViews = 0;
    productInterests.forEach(item => {
        if (item.views > maxViews) {
            maxViews = item.views;
            mostViewed = item.name;
        }
    });
    
    document.getElementById('totalViews').textContent = totalViews;
    document.getElementById('totalInterests').textContent = totalInterests;
    document.getElementById('mostViewed').textContent = mostViewed;
    
    updateInterestsList();
}

function updateInterestsList() {
    const interestsList = document.getElementById('interestsList');
    if (!interestsList) return;
    
    const sortedInterests = [...productInterests].sort((a, b) => b.views - a.views);
    
    if (sortedInterests.length === 0) {
        interestsList.innerHTML = '<p class="no-data">No hay intereses registrados.</p>';
        return;
    }
    
    interestsList.innerHTML = sortedInterests.map(item => `
        <div class="interest-item">
            <div class="interest-name">${item.name}</div>
            <div class="interest-stats">
                <span class="interest-price">$${item.price} MXN</span>
                <span class="interest-views">${item.views}</span>
            </div>
        </div>
    `).join('');
}

function exportarIntereses() {
    const data = {
        fecha: new Date().toISOString(),
        totalVistas: Object.values(productViews).reduce((sum, views) => sum + views, 0),
        intereses: productInterests,
        clientesUnicos: new Set(productInterests.map(item => item.clientId)).size
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `intereses-demata-${new Date().toISOString().split('T')[0]}.json`);
    link.click();
    
    showNotification('✅ Datos exportados');
}

function enviarReporteWhatsApp() {
    if (productInterests.length === 0) {
        showNotification('ℹ️ No hay datos');
        return;
    }
    
    let reporte = `📊 *REPORTE DEMATA*\n\n`;
    
    const topProducts = [...productInterests]
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
    
    topProducts.forEach((item, index) => {
        reporte += `${index + 1}. *${item.name}*\n`;
        reporte += `   Precio: $${item.price} MXN\n`;
        reporte += `   Visto: ${item.views} veces\n\n`;
    });
    
    reporte += `Total vistas: ${Object.values(productViews).reduce((sum, views) => sum + views, 0)}\n`;
    
    const encodedReporte = encodeURIComponent(reporte);
    window.open(`https://wa.me/5523008727?text=${encodedReporte}`, "_blank");
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary);
        color: white;
        padding: 15px 25px;
        z-index: 3000;
        transition: 0.3s;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}