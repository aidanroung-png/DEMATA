// Sistema de seguimiento para DEMATA con seguridad

// Variables globales
let productViews = {};
let productInterests = [];
let clientId = null;
let isAdminAuthenticated = false;

// CONTRASEÑA DEL ADMINISTRADOR - CAMBIA ESTA CONTRASEÑA
const ADMIN_PASSWORD = "demata2026"; // Cambia esto por tu contraseña personal

// Inicializar el sistema
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar datos
    initStorage();
    loadStatistics();
    setupEventListeners();
    setupAdminPanel();
    verificarSesion();
    
    // Configurar año en footer
    const yearElement = document.querySelector('footer .footer-bottom p');
    if (yearElement) {
        yearElement.innerHTML = `&copy; ${new Date().getFullYear()} DEMATA. Todos los derechos reservados.`;
    }
});

// ====== SISTEMA DE ALMACENAMIENTO ======
function initStorage() {
    // Obtener o crear ID de cliente
    clientId = localStorage.getItem('demataClientId');
    if (!clientId) {
        clientId = 'cliente-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('demataClientId', clientId);
    }
    
    // Obtener o inicializar vistas de productos
    productViews = JSON.parse(localStorage.getItem('demataProductViews') || '{}');
    
    // Obtener o inicializar intereses
    productInterests = JSON.parse(localStorage.getItem('demataProductInterests') || '[]');
}

function saveData() {
    localStorage.setItem('demataProductViews', JSON.stringify(productViews));
    localStorage.setItem('demataProductInterests', JSON.stringify(productInterests));
}

// ====== FUNCIONES PARA CLIENTES ======
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
    
    // Registrar vista
    productViews[productId] = (productViews[productId] || 0) + 1;
    
    // Agregar a intereses
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
    
    // Guardar datos
    saveData();
    
    // Actualizar vista en pantalla
    updateProductViews(productId);
    
    // Mostrar modal con detalles
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
    
    // Actualizar panel de administración
    updateAdminPanel();
}

function pedirPorWhatsApp(productId) {
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (!productCard) return;
    
    const productName = productCard.dataset.productName;
    const productPrice = productCard.dataset.productPrice;
    const productTallas = productCard.dataset.productTallas;
    
    // Crear mensaje personalizado
    let mensaje = `🛍️ *PEDIDO DEMATA* 🛍️\n\n`;
    mensaje += `*Producto solicitado:*\n`;
    mensaje += `• ${productName}\n`;
    mensaje += `• Precio: $${productPrice} MXN\n`;
    mensaje += `• Tallas disponibles: ${productTallas}\n\n`;
    
    // Agregar productos vistos recientemente
    const recentInterests = productInterests
        .filter(item => item.id != productId)
        .sort((a, b) => b.views - a.views)
        .slice(0, 3);
    
    if (recentInterests.length > 0) {
        mensaje += `*También me interesan:*\n`;
        recentInterests.forEach(item => {
            mensaje += `• ${item.name} - $${item.price} MXN\n`;
        });
        mensaje += `\n`;
    }
    
    mensaje += `*Información que necesito:*\n`;
    mensaje += `• Confirmación de disponibilidad\n`;
    mensaje += `• Tiempo de entrega\n`;
    mensaje += `• Métodos de pago\n`;
    mensaje += `• Costo de envío\n\n`;
    mensaje += `¡Gracias!`;
    
    // Abrir WhatsApp
    const encodedMensaje = encodeURIComponent(mensaje);
    window.open(`https://wa.me/5577206640?text=${encodedMensaje}`, "_blank");
    
    // Registrar como pedido
    registerOrder(productId, productName, productPrice);
}

// ====== MODAL DE PRODUCTO ======
function showProductModal(product) {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    
    // Crear contenido del modal
    modalContent.innerHTML = `
        <div class="modal-image">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="modal-info">
            <h2>${product.name}</h2>
            <div class="modal-price">$${product.price} MXN</div>
            <p class="modal-desc">Descubre todos los detalles de este producto exclusivo.</p>
            
            <div class="modal-specs">
                <div class="spec-item">
                    <span class="spec-label">Tallas disponibles:</span>
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
                    <i class="fas fa-arrow-left"></i> Seguir viendo
                </button>
            </div>
        </div>
    `;
    
    // Mostrar modal
    modalOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    modalOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ====== SISTEMA DE SEGURIDAD Y PANEL DE ADMINISTRACIÓN ======
function verificarSesion() {
    const sessionExpiry = localStorage.getItem('demataAdminSession');
    if (sessionExpiry && Date.now() < parseInt(sessionExpiry)) {
        // Sesión todavía válida
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
        // Si ya está autenticado, mostrar panel directamente
        mostrarPanelAdmin();
    } else {
        // Si no está autenticado, mostrar login
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
        // Contraseña correcta
        isAdminAuthenticated = true;
        cerrarLogin();
        showAdminButton();
        mostrarPanelAdmin();
        showNotification('✅ Acceso concedido al panel de administración');
        
        // Guardar sesión por 24 horas
        const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem('demataAdminSession', sessionExpiry.toString());
    } else {
        // Contraseña incorrecta
        showNotification('❌ Contraseña incorrecta');
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
}

function setupAdminPanel() {
    const adminClose = document.getElementById('adminClose');
    const adminPanel = document.getElementById('adminPanel');
    const modalOverlay = document.getElementById('modalOverlay');
    
    if (adminClose) {
        adminClose.addEventListener('click', function() {
            adminPanel.style.display = 'none';
        });
    }
    
    // Cerrar panel al hacer clic fuera
    adminPanel.addEventListener('click', function(e) {
        if (e.target === adminPanel) {
            adminPanel.style.display = 'none';
        }
    });
    
    // Cerrar modal al hacer clic fuera
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
        
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', closeModal);
        }
    }
}

function mostrarPanelAdmin() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.style.display = 'block';
        updateAdminPanel();
    }
}

function updateAdminPanel() {
    // Actualizar estadísticas
    const totalViews = Object.values(productViews).reduce((sum, views) => sum + views, 0);
    const totalInterests = productInterests.length;
    
    // Producto más visto
    let mostViewed = '-';
    let maxViews = 0;
    productInterests.forEach(item => {
        if (item.views > maxViews) {
            maxViews = item.views;
            mostViewed = item.name;
        }
    });
    
    // Actualizar UI
    document.getElementById('totalViews').textContent = totalViews;
    document.getElementById('totalInterests').textContent = totalInterests;
    document.getElementById('mostViewed').textContent = mostViewed;
    
    // Actualizar lista de intereses
    updateInterestsList();
}

function updateInterestsList() {
    const interestsList = document.getElementById('interestsList');
    if (!interestsList) return;
    
    // Ordenar por más vistas
    const sortedInterests = [...productInterests].sort((a, b) => b.views - a.views);
    
    if (sortedInterests.length === 0) {
        interestsList.innerHTML = '<p class="no-data">No hay intereses registrados todavía.</p>';
        return;
    }
    
    interestsList.innerHTML = sortedInterests.map(item => `
        <div class="interest-item">
            <div class="interest-name">${item.name}</div>
            <div class="interest-stats">
                <span class="interest-price">$${item.price} MXN</span>
                <span class="interest-views">${item.views} vistas</span>
            </div>
        </div>
    `).join('');
}

// ====== FUNCIONES PARA EL VENDEDOR ======
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
    
    showNotification('✅ Datos exportados correctamente');
}

function enviarReporteWhatsApp() {
    if (productInterests.length === 0) {
        showNotification('ℹ️ No hay datos para enviar');
        return;
    }
    
    let reporte = `📊 *REPORTE DE INTERESES DEMATA*\n\n`;
    reporte += `*Resumen de intereses de clientes:*\n\n`;
    
    // Productos más vistos
    const topProducts = [...productInterests]
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
    
    topProducts.forEach((item, index) => {
        reporte += `${index + 1}. *${item.name}*\n`;
        reporte += `   💰 Precio: $${item.price} MXN\n`;
        reporte += `   👁️ Visto: ${item.views} veces\n\n`;
    });
    
    reporte += `*Estadísticas totales:*\n`;
    reporte += `• Productos interesados: ${productInterests.length}\n`;
    reporte += `• Vistas totales: ${Object.values(productViews).reduce((sum, views) => sum + views, 0)}\n`;
    reporte += `• Clientes únicos: ${new Set(productInterests.map(item => item.clientId)).size}\n\n`;
    reporte += `*Fecha del reporte:* ${new Date().toLocaleDateString('es-MX')}`;
    
    const encodedReporte = encodeURIComponent(reporte);
    window.open(`https://wa.me/5577206640?text=${encodedReporte}`, "_blank");
}

// ====== FUNCIONES AUXILIARES ======
function updateProductViews(productId) {
    const viewElement = document.getElementById(`views-${productId}`);
    if (viewElement) {
        viewElement.textContent = productViews[productId] || 0;
    }
}

function loadStatistics() {
    // Actualizar contadores de vistas
    Object.keys(productViews).forEach(productId => {
        updateProductViews(productId);
    });
}

function registerOrder(productId, productName, productPrice) {
    // Registrar pedido en el historial
    const orders = JSON.parse(localStorage.getItem('demataOrders') || '[]');
    orders.unshift({
        id: productId,
        name: productName,
        price: productPrice,
        timestamp: new Date().toISOString(),
        clientId: clientId
    });
    
    // Mantener solo los últimos 50 pedidos
    if (orders.length > 50) {
        orders.length = 50;
    }
    
    localStorage.setItem('demataOrders', JSON.stringify(orders));
    
    // Mostrar confirmación
    showNotification('✅ Pedido registrado correctamente');
}

function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent-color);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 3000;
        animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 500;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Agregar estilos para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .no-data {
        text-align: center;
        color: var(--gray);
        padding: 20px;
        font-style: italic;
    }
`;
document.head.appendChild(style);

// ====== CONFIGURACIÓN DE EVENTOS ======
function setupEventListeners() {
    // Filtrado de productos por categoría
    const filtroBtns = document.querySelectorAll('.filtro-btn');
    const productoCards = document.querySelectorAll('.producto-card');
    
    filtroBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover clase active de todos los botones
            filtroBtns.forEach(b => b.classList.remove('active'));
            // Agregar clase active al botón clickeado
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
    
    // Menú hamburguesa para móviles
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
    
    // Cerrar menú al hacer clic en un enlace (en móviles)
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                navLinks.style.display = 'none';
            }
        });
    });
    
    // Ajustar menú en redimensionamiento de ventana
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
    
    // Cerrar con tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            const adminPanel = document.getElementById('adminPanel');
            if (adminPanel) {
                adminPanel.style.display = 'none';
            }
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                cerrarLogin();
            }
        }
    });
    
    // Scroll suave para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Actualizar navegación activa
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
}

// ====== FUNCIONES DE DEBUG PARA EL VENDEDOR ======
// Para usar desde la consola del navegador
function mostrarDatosCompletos() {
    console.log('=== SISTEMA DE SEGUIMIENTO DEMATA ===');
    console.log('ID Cliente:', clientId);
    console.log('Vistas por producto:', productViews);
    console.log('Intereses registrados:', productInterests);
    console.log('Total vistas:', Object.values(productViews).reduce((sum, views) => sum + views, 0));
    console.log('Total intereses:', productInterests.length);
    console.log('Clientes únicos:', new Set(productInterests.map(item => item.clientId)).size);
}

function limpiarDatos() {
    if (confirm('¿Estás seguro de limpiar todos los datos de seguimiento?')) {
        localStorage.removeItem('demataProductViews');
        localStorage.removeItem('demataProductInterests');
        localStorage.removeItem('demataClientId');
        productViews = {};
        productInterests = [];
        clientId = null;
        initStorage();
        loadStatistics();
        updateAdminPanel();
        showNotification('✅ Datos limpiados correctamente');
    }
}