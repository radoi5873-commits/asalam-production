document.addEventListener('DOMContentLoaded', () => {
    // Reset app state/localStorage if ?reset=true is present in the URL
    if (window.location.search.includes('reset=true')) {
        console.log('[PRO] Reset parameter detected. Clearing localStorage...');
        const keysToClear = [
            'assalam_cart',
            'assalam_catalog_overrides',
            'assalam_custom_products',
            'assalam_orders',
            'assalam_wa_phone',
            'assalam_promo_banner_show',
            'assalam_promo_banner_text',
            'assalam_lang',
            'assalam_visits'
        ];
        keysToClear.forEach(key => localStorage.removeItem(key));
        sessionStorage.removeItem('assalam_pro_logged');
        
        // Clean URL and reload
        window.location.href = window.location.origin + window.location.pathname;
        return;
    }

    console.log('[PRO] Script starting...');
    try {

    /* ==========================================================================
       1. AUTHENTICATION & SESSION MANAGEMENT & DOM DECLARATIONS
       ========================================================================== */
    const proLoginBlock = document.getElementById('proLoginBlock');
    const proPanelBlock = document.getElementById('proPanelBlock');
    const proLoginForm = document.getElementById('proLoginForm');
    const proPassInput = document.getElementById('proPassInput');
    const proLogoutBtn = document.getElementById('proLogoutBtn');
    const proNavLogoutBtn = document.getElementById('proNavLogoutBtn');
    
    // Core dashboard DOM elements declared early to prevent Temporal Dead Zone (TDZ) ReferenceErrors on page load
    const catalogTableBody = document.getElementById('proCatalogTableBody');
    const proCatalogModal = document.getElementById('proCatalogModal');
    const proCatalogCloseBtn = document.getElementById('proCatalogCloseBtn');
    const proCatalogForm = document.getElementById('proCatalogForm');
    const ordersTableBody = document.getElementById('proOrdersTableBody');
    const proSettingsForm = document.getElementById('proSettingsForm');
    const proPromoForm = document.getElementById('proPromoForm');

    const defaultProducts = [
        { id: 1, name: "Couscous de Maïs", price: 1500, category: "Couscous", desc: "Un couscous léger et nutritif à base de maïs local de première qualité." },
        { id: 2, name: "Bouillie Akloui de Maïs", price: 1200, category: "Bouillies", desc: "La bouillie traditionnelle béninoise, prête à cuire, riche en saveurs." },
        { id: 3, name: "Riz de Maïs", price: 1800, category: "Riz", desc: "Une alternative saine au riz classique, digeste et naturellement sans gluten." },
        { id: 4, name: "Pâte Gambari", price: 1000, category: "Farines", desc: "Farine de maïs de qualité pour la préparation de la pâte traditionnelle." },
        { id: 5, name: "Cassoulet au Maïs", price: 2000, category: "Conserves", desc: "Un plat cuisiné délicieux alliant haricots locaux et grains de maïs tendres." }
    ];

    function checkAuth() {
        const isLogged = sessionStorage.getItem('assalam_pro_logged') === 'true';
        if (isLogged) {
            if (proLoginBlock) proLoginBlock.style.display = 'none';
            if (proPanelBlock) proPanelBlock.style.display = 'block';
            if (proNavLogoutBtn) proNavLogoutBtn.style.display = 'inline-flex';
            initDashboard();
        } else {
            if (proLoginBlock) proLoginBlock.style.display = 'block';
            if (proPanelBlock) proPanelBlock.style.display = 'none';
            if (proNavLogoutBtn) proNavLogoutBtn.style.display = 'none';
        }
    }

    // Hashing function using the browser's crypto API
    async function hashPassword(pwd) {
        const encoder = new TextEncoder();
        const data = encoder.encode(pwd);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    if (proLoginForm) {
        proLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = proPassInput.value.trim();
            const hashed = await hashPassword(password);
            
            // SHA-256 hashes of 'pro123' and 'admin123'
            const hashPro = 'cb1513ece93b4a593042a5c181ab2e123260f197a51a92b758c1697839067669';
            const hashAdmin = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
            
            if (hashed === hashPro || hashed === hashAdmin) {
                sessionStorage.setItem('assalam_pro_logged', 'true');
                showToast(currentLang === 'fr' ? 'Connexion réussie !' : 'Successfully logged in!', 'success');
                proPassInput.value = '';
                checkAuth();
            } else {
                showToast(currentLang === 'fr' ? "Code d'accès incorrect." : 'Incorrect access code.', 'error');
                proPassInput.value = '';
                proPassInput.focus();
            }
        });
    }

    const handleLogout = () => {
        sessionStorage.removeItem('assalam_pro_logged');
        showToast(currentLang === 'fr' ? 'Déconnexion effectuée.' : 'Logged out successfully.', 'info');
        checkAuth();
    };

    if (proLogoutBtn) {
        proLogoutBtn.addEventListener('click', handleLogout);
    }
    if (proNavLogoutBtn) {
        proNavLogoutBtn.addEventListener('click', handleLogout);
    }

    /* ==========================================================================
       2. TRANSLATION & LANGUAGE SYNC
       ========================================================================== */
    let currentLang = localStorage.getItem('assalam_lang') || 'fr';
    const langFR = document.getElementById('langFR');
    const langEN = document.getElementById('langEN');

    function updateLanguageUI(lang) {
        currentLang = lang;
        localStorage.setItem('assalam_lang', lang);

        if (lang === 'fr') {
            if (langFR) langFR.classList.add('active');
            if (langEN) langEN.classList.remove('active');
        } else {
            if (langFR) langFR.classList.remove('active');
            if (langEN) langEN.classList.add('active');
        }

        document.querySelectorAll('[data-fr]').forEach(elem => {
            const frText = elem.getAttribute('data-fr');
            const enText = elem.getAttribute('data-en');
            const text = lang === 'fr' ? frText : enText;
            
            if (elem.tagName === 'INPUT' || elem.tagName === 'TEXTAREA') {
                elem.setAttribute('placeholder', text);
            } else {
                // If this element has child elements (icons, spans etc.), 
                // only update the last text node to preserve HTML children
                const childElements = elem.querySelectorAll('*');
                if (childElements.length > 0 && !elem.querySelector('[data-fr]')) {
                    // Has child HTML but no nested data-fr spans — find and update the text node
                    const nodes = elem.childNodes;
                    let found = false;
                    for (let i = nodes.length - 1; i >= 0; i--) {
                        if (nodes[i].nodeType === Node.TEXT_NODE && nodes[i].textContent.trim()) {
                            nodes[i].textContent = text;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        // Append a text node if none was found
                        elem.appendChild(document.createTextNode(text));
                    }
                } else if (elem.querySelector('[data-fr]')) {
                    // Has nested data-fr elements — skip, they'll be handled individually
                } else {
                    // Simple text-only element, safe to use textContent
                    elem.textContent = text;
                }
            }
        });

        // Re-render UI components if logged in
        if (sessionStorage.getItem('assalam_pro_logged') === 'true') {
            renderCatalogTable();
            renderOrdersTable();
        }
    }

    if (langFR && langEN) {
        langFR.addEventListener('click', () => updateLanguageUI('fr'));
        langEN.addEventListener('click', () => updateLanguageUI('en'));
    }

    // Initialize Language UI
    updateLanguageUI(currentLang);

    /* ==========================================================================
       3. MOBILE BURGER MENU
       ========================================================================== */
    const burgerMenu = document.getElementById('burgerMenu');
    const navMenu = document.getElementById('navMenu');
    if (burgerMenu && navMenu) {
        burgerMenu.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            burgerMenu.classList.toggle('active');
        });
    }

    /* ==========================================================================
       4. DARK MODE SYNC
       ========================================================================== */
    const darkModeToggle = document.getElementById('darkModeToggle');
    const sunIcon = document.querySelector('.icon-sun');
    const moonIcon = document.querySelector('.icon-moon');

    function applyDarkMode(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
            if (sunIcon) sunIcon.style.display = 'block';
            if (moonIcon) moonIcon.style.display = 'none';
        } else {
            document.body.classList.remove('dark-mode');
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
        }
    }

    // Read dark mode state on load
    const savedDarkMode = localStorage.getItem('assalam_dark_mode') === 'true';
    applyDarkMode(savedDarkMode);

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            const isCurrentlyDark = document.body.classList.contains('dark-mode');
            const newDarkState = !isCurrentlyDark;
            localStorage.setItem('assalam_dark_mode', newDarkState);
            applyDarkMode(newDarkState);
        });
    }

    /* ==========================================================================
       5. DASHBOARD & DATA INITIALIZATION
       ========================================================================== */

    function initDashboard() {
        loadStats();
        renderCatalogTable();
        renderOrdersTable();
        loadSettings();
    }

    function loadStats() {
        const visits = localStorage.getItem('assalam_visits') || 0;
        const orders = JSON.parse(localStorage.getItem('assalam_orders')) || [];
        
        let totalRevenue = 0;
        orders.forEach(o => {
            const numericTotal = parseInt(o.total) || 0;
            totalRevenue += numericTotal;
        });

        const visitsElem = document.getElementById('proStatVisits');
        const ordersElem = document.getElementById('proStatOrders');
        const salesElem = document.getElementById('proStatSales');

        if (visitsElem) visitsElem.textContent = visits;
        if (ordersElem) ordersElem.textContent = orders.length;
        if (salesElem) salesElem.textContent = totalRevenue.toLocaleString() + ' F CFA';
    }

    /* ==========================================================================
       6. TAB NAVIGATION
       ========================================================================== */
    const tabs = document.querySelectorAll('.pro-tab');
    const tabContents = document.querySelectorAll('.pro-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    /* ==========================================================================
       7. CATALOG MANAGEMENT
       ========================================================================== */

    function getCatalogOverrides() {
        return JSON.parse(localStorage.getItem('assalam_catalog_overrides')) || {};
    }

    function saveCatalogOverrides(overrides) {
        localStorage.setItem('assalam_catalog_overrides', JSON.stringify(overrides));
    }

    function getCustomProducts() {
        return JSON.parse(localStorage.getItem('assalam_custom_products')) || [];
    }

    function saveCustomProducts(products) {
        localStorage.setItem('assalam_custom_products', JSON.stringify(products));
    }

    function getCompleteCatalog() {
        const custom = getCustomProducts();
        const overrides = getCatalogOverrides();
        
        let all = [...defaultProducts, ...custom];
        
        return all.map(p => {
            const override = overrides[p.id];
            return {
                id: p.id,
                name: override ? override.name : p.name,
                price: override ? override.price : p.price,
                category: override ? override.category : p.category,
                desc: override ? override.desc : p.desc,
                outOfStock: override ? override.outOfStock : (p.outOfStock || false),
                isCustom: p.isCustom || false
            };
        });
    }

    function renderCatalogTable() {
        if (!catalogTableBody) return;
        catalogTableBody.innerHTML = '';
        
        const allProducts = getCompleteCatalog();

        allProducts.forEach(p => {
            const tr = document.createElement('tr');
            
            // Stock badge status HTML
            const stockBadge = p.outOfStock
                ? `<span class="badge-stock out-stock" data-fr="Rupture" data-en="Out of stock">${currentLang === 'fr' ? 'Rupture' : 'Out of stock'}</span>`
                : `<span class="badge-stock in-stock" data-fr="Disponible" data-en="In stock">${currentLang === 'fr' ? 'Disponible' : 'In stock'}</span>`;

            tr.innerHTML = `
                <td><strong>#${p.id}</strong></td>
                <td>
                    <div style="font-weight: 700;">
                        ${p.name}
                        ${p.isCustom ? `<span style="font-size:0.65rem; background-color: var(--color-primary-light); color: var(--color-primary); padding: 2px 6px; border-radius: 10px; margin-left: 5px; font-weight:800; text-transform:uppercase;">Nouveau</span>` : ''}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--color-muted); margin-top: 3px; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.desc}</div>
                </td>
                <td><span style="background-color: var(--color-light); padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 600;">${p.category}</span></td>
                <td><span style="font-weight: 800; color: var(--color-secondary);">${p.price.toLocaleString()} F CFA</span></td>
                <td>${stockBadge}</td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn-pro-edit" onclick="openProductEdit(${p.id})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        ${p.isCustom ? `
                            <button class="btn-pro-edit" style="background-color: rgba(225, 29, 72, 0.1); color: #e11d48;" onclick="deleteCustomProduct(${p.id})">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            `;
            catalogTableBody.appendChild(tr);
        });
    }

    // Delete custom product
    window.deleteCustomProduct = function(id) {
        const confirmMsg = currentLang === 'fr' ? 'Voulez-vous vraiment supprimer ce produit ?' : 'Do you really want to delete this product?';
        if (confirm(confirmMsg)) {
            const custom = getCustomProducts();
            const filtered = custom.filter(p => p.id !== id);
            saveCustomProducts(filtered);
            
            // Clean overrides if any
            const overrides = getCatalogOverrides();
            delete overrides[id];
            saveCatalogOverrides(overrides);
            
            showToast(currentLang === 'fr' ? 'Produit supprimé.' : 'Product deleted.', 'info');
            renderCatalogTable();
        }
    };

    // Modal open handler
    window.openProductEdit = function(id) {
        const allProducts = getCompleteCatalog();
        const p = allProducts.find(prod => prod.id === id);
        if (!p) return;

        document.getElementById('proEditId').value = id;
        document.getElementById('proEditName').value = p.name;
        document.getElementById('proEditCategory').value = p.category;
        document.getElementById('proEditPrice').value = p.price;
        document.getElementById('proEditStock').value = p.outOfStock ? 'out' : 'in';
        document.getElementById('proEditDesc').value = p.desc;

        const modalTitle = document.getElementById('proModalTitle');
        const submitBtnText = document.getElementById('proSubmitBtnText');
        if (modalTitle) {
            modalTitle.textContent = currentLang === 'fr' ? 'Modifier Fiche Produit' : 'Edit Product Info';
        }
        if (submitBtnText) {
            submitBtnText.textContent = currentLang === 'fr' ? 'Mettre à jour' : 'Update';
        }

        if (proCatalogModal) proCatalogModal.classList.add('active');
    };

    const proAddProductBtn = document.getElementById('proAddProductBtn');
    if (proAddProductBtn) {
        proAddProductBtn.addEventListener('click', () => {
            document.getElementById('proEditId').value = 'new';
            document.getElementById('proEditName').value = '';
            document.getElementById('proEditCategory').value = 'Couscous';
            document.getElementById('proEditPrice').value = '';
            document.getElementById('proEditStock').value = 'in';
            document.getElementById('proEditDesc').value = '';

            const modalTitle = document.getElementById('proModalTitle');
            const submitBtnText = document.getElementById('proSubmitBtnText');
            if (modalTitle) {
                modalTitle.textContent = currentLang === 'fr' ? 'Ajouter un Nouveau Produit' : 'Add New Product';
            }
            if (submitBtnText) {
                submitBtnText.textContent = currentLang === 'fr' ? 'Ajouter le produit' : 'Add product';
            }

            if (proCatalogModal) proCatalogModal.classList.add('active');
        });
    }

    if (proCatalogCloseBtn && proCatalogModal) {
        proCatalogCloseBtn.addEventListener('click', () => {
            proCatalogModal.classList.remove('active');
        });
    }

    if (proCatalogForm) {
        proCatalogForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const idVal = document.getElementById('proEditId').value;
            const name = document.getElementById('proEditName').value.trim();
            const category = document.getElementById('proEditCategory').value;
            const price = parseInt(document.getElementById('proEditPrice').value);
            const isOutOfStock = document.getElementById('proEditStock').value === 'out';
            const desc = document.getElementById('proEditDesc').value.trim();

            if (idVal === 'new') {
                const newId = Date.now();
                const custom = getCustomProducts();
                custom.push({
                    id: newId,
                    name: name,
                    category: category,
                    price: price,
                    desc: desc,
                    outOfStock: isOutOfStock,
                    isCustom: true
                });
                saveCustomProducts(custom);
                showToast(currentLang === 'fr' ? 'Nouveau produit ajouté !' : 'New product successfully added!', 'success');
            } else {
                const id = parseInt(idVal);
                const custom = getCustomProducts();
                const customIdx = custom.findIndex(p => p.id === id);

                if (customIdx !== -1) {
                    custom[customIdx] = {
                        ...custom[customIdx],
                        name: name,
                        category: category,
                        price: price,
                        desc: desc,
                        outOfStock: isOutOfStock
                    };
                    saveCustomProducts(custom);
                } else {
                    const overrides = getCatalogOverrides();
                    overrides[id] = {
                        name: name,
                        category: category,
                        price: price,
                        outOfStock: isOutOfStock,
                        desc: desc
                    };
                    saveCatalogOverrides(overrides);
                }
                showToast(currentLang === 'fr' ? 'Fiche produit mise à jour !' : 'Product successfully updated!', 'success');
            }
            
            if (proCatalogModal) proCatalogModal.classList.remove('active');
            renderCatalogTable();
        });
    }

    /* ==========================================================================
       8. ORDERS TRACKING
       ========================================================================== */

    function renderOrdersTable() {
        if (!ordersTableBody) return;
        ordersTableBody.innerHTML = '';

        const orders = JSON.parse(localStorage.getItem('assalam_orders')) || [];

        if (orders.length === 0) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--color-muted); font-style: italic; padding: 40px 10px;">
                        ${currentLang === 'fr' ? 'Aucune commande répertoriée.' : 'No orders recorded yet.'}
                    </td>
                </tr>
            `;
            return;
        }

        orders.forEach(o => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="white-space: nowrap; font-size: 0.8rem;">${o.date}</td>
                <td><strong>${o.client}</strong></td>
                <td>
                    <div style="font-weight: 600;">${o.phone}</div>
                    <div style="font-size: 0.75rem; color: var(--color-muted);">${o.location}</div>
                </td>
                <td style="font-size: 0.82rem; font-weight: 600; color: var(--color-primary);">${o.items}</td>
                <td><span style="font-weight: 800; color: var(--color-secondary);">${parseInt(o.total).toLocaleString()} F CFA</span></td>
            `;
            ordersTableBody.appendChild(tr);
        });
    }

    /* ==========================================================================
       9. SETTINGS & CMS PROMO
       ========================================================================== */

    function loadSettings() {
        // WhatsApp Phone
        const savedPhone = localStorage.getItem('assalam_wa_phone') || '22991485169';
        const phoneInput = document.getElementById('proWaPhone');
        if (phoneInput) phoneInput.value = savedPhone;

        // Promo Banner text & status
        const savedPromoShow = localStorage.getItem('assalam_promo_banner_show') || 'false';
        const savedPromoText = localStorage.getItem('assalam_promo_banner_text') || '10% de réduction sur le Couscous de Maïs avec le code SALAM10 !';
        
        const promoShowInput = document.getElementById('proPromoShow');
        const promoTextInput = document.getElementById('proPromoText');

        if (promoShowInput) promoShowInput.value = savedPromoShow;
        if (promoTextInput) promoTextInput.value = savedPromoText;
    }

    if (proSettingsForm) {
        proSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const phone = document.getElementById('proWaPhone').value.trim();
            localStorage.setItem('assalam_wa_phone', phone);
            showToast(currentLang === 'fr' ? 'Configuration contact enregistrée !' : 'Contact configuration saved!', 'success');
        });
    }

    if (proPromoForm) {
        proPromoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const showPromo = document.getElementById('proPromoShow').value;
            const promoText = document.getElementById('proPromoText').value.trim();

            localStorage.setItem('assalam_promo_banner_show', showPromo);
            localStorage.setItem('assalam_promo_banner_text', promoText);
            
            // Clear the closed state so the banner displays again to all users when modified
            localStorage.removeItem('assalam_promo_closed');

            showToast(currentLang === 'fr' ? 'Bandeau promotionnel mis à jour !' : 'Promo banner successfully updated!', 'success');
        });
    }

    /* ==========================================================================
       10. UTILITIES (TOASTS)
       ========================================================================== */
    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Pick icon
        let icon = 'fa-check';
        if (type === 'error') icon = 'fa-circle-xmark';
        if (type === 'info') icon = 'fa-circle-info';

        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        // Slide-in animation trigger
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // Verify authentication on page load
    checkAuth();
    console.log('[PRO] Script fully loaded ✅');
    } catch(err) {
        console.error('[PRO] CRITICAL ERROR:', err.message, err.stack);
    }
});
