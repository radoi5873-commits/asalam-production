document.addEventListener('DOMContentLoaded', () => {
    // Reset app state/localStorage if ?reset=true is present in the URL
    if (window.location.search.includes('reset=true')) {
        console.log('[AS-SALAM] Reset parameter detected. Clearing localStorage...');
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

    console.log('[AS-SALAM] Script starting...');
    try {

    /* ==========================================================================
       1. STATE MANAGEMENT
       ========================================================================== */
    let cart = [];
    let whatsappTarget = '22991485169'; // Default WhatsApp phone number

    // Load custom WhatsApp number if saved in localStorage
    const savedPhone = localStorage.getItem('assalam_wa_phone');
    if (savedPhone) {
        whatsappTarget = cleanPhoneNumber(savedPhone);
        
        // Update top bar and contact list info texts
        const phoneTexts = document.querySelectorAll('.phone-text, .contact-info-item:nth-child(1) p');
        phoneTexts.forEach(el => {
            el.textContent = savedPhone;
        });
    }

    /* ==========================================================================
       2. MOBILE MENU & NAVIGATION
       ========================================================================== */
    const burgerMenu = document.getElementById('burgerMenu');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (burgerMenu && navMenu) {
        burgerMenu.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            burgerMenu.classList.toggle('active');
            
            // Hamburger visual cross toggle
            const spans = burgerMenu.querySelectorAll('span');
            if (navMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Close menu when clicking links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    const spans = burgerMenu.querySelectorAll('span');
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            });
        });
    }

    /* ==========================================================================
       3. PRODUCTS CATALOG FILTERING
       ========================================================================== */
    const filterButtons = document.querySelectorAll('.btn-filter');
    const productCards = document.querySelectorAll('.product-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

            const currentCards = document.querySelectorAll('.product-card');
            currentCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    card.style.display = 'flex';
                    card.style.animation = 'fadeIn 0.5s ease forwards';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    /* ==========================================================================
       4. SHOPPING CART LOGIC
       ========================================================================== */
    // Cart DOM elements - proper declarations
    const cartCountEl = document.getElementById('cartCount');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartSummary = document.getElementById('cartSummary');
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryTotal = document.getElementById('summaryTotal');
    const btnSubmitOrder = document.getElementById('btnSubmitOrder');

    // Event delegation for cart additions
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-add-cart');
        if (btn) {
            e.preventDefault();
            if (btn.disabled || btn.classList.contains('disabled')) return;
            const id = parseInt(btn.getAttribute('data-id'));
            const name = btn.getAttribute('data-name');
            const price = parseInt(btn.getAttribute('data-price'));

            addItemToCart(id, name, price);
            animateCartTrigger();
        }
    });

    function addItemToCart(id, name, price) {
        const existingItem = cart.find(item => item.id === id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }

        updateCartUI();
        if (typeof showToast === 'function') {
            showToast(`${name} ${currentLang === 'fr' ? 'ajouté au panier !' : 'added to cart!'} 🛒`);
        }
    }

    function removeItemFromCart(id) {
        const item = cart.find(i => i.id === id);
        const name = item ? item.name : '';
        cart = cart.filter(item => item.id !== id);
        updateCartUI();
        if (name && typeof showToast === 'function') {
            showToast(`${name} ${currentLang === 'fr' ? 'retiré du panier.' : 'removed from cart.'}`, 'info');
        }
    }

    function updateItemQuantity(id, change) {
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                removeItemFromCart(id);
            } else {
                updateCartUI();
            }
        }
    }

    function updateCartUI() {
        // Guard: only run if cart DOM elements exist on the page
        if (!cartCountEl || !cartItemsContainer) return;

        // Calculate items total count
        const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountEl.textContent = totalItemsCount;

        // Render Cart items list
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-msg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    <p>Votre panier est vide. Sélectionnez des délices ci-dessus pour composer votre commande.</p>
                </div>
            `;
            if (cartSummary) cartSummary.style.display = 'none';
            if (btnSubmitOrder) btnSubmitOrder.disabled = true;
        } else {
            cartItemsContainer.innerHTML = '';
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                const itemEl = document.createElement('div');
                itemEl.classList.add('cart-item');
                itemEl.innerHTML = `
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">${formatPrice(item.price)} x ${item.quantity} = ${formatPrice(itemTotal)}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="btn-qty btn-minus" data-id="${item.id}">-</button>
                        <span class="qty-val">${item.quantity}</span>
                        <button class="btn-qty btn-plus" data-id="${item.id}">+</button>
                        <button class="btn-remove" data-id="${item.id}" aria-label="Retirer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    </div>
                `;
                cartItemsContainer.appendChild(itemEl);
            });

            // Bind click handlers for controls inside the cart container
            const minusBtns = cartItemsContainer.querySelectorAll('.btn-minus');
            const plusBtns = cartItemsContainer.querySelectorAll('.btn-plus');
            const removeBtns = cartItemsContainer.querySelectorAll('.btn-remove');

            minusBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    updateItemQuantity(id, -1);
                });
            });

            plusBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    updateItemQuantity(id, 1);
                });
            });

            removeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    removeItemFromCart(id);
                });
            });

            // Calculate Subtotal & Total
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            if (summarySubtotal) summarySubtotal.textContent = formatPrice(subtotal);
            if (summaryTotal) summaryTotal.textContent = formatPrice(subtotal);

            if (cartSummary) cartSummary.style.display = 'flex';
            if (btnSubmitOrder) btnSubmitOrder.disabled = false;
        }
    }

    function formatPrice(amount) {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " F CFA";
    }

    function animateCartTrigger() {
        const trigger = document.getElementById('cartTrigger');
        if (trigger) {
            trigger.style.transform = 'scale(1.2)';
            setTimeout(() => {
                trigger.style.transform = 'scale(1)';
            }, 200);
        }
    }

    /* ==========================================================================
       5. WHATSAPP CHECKOUT FORM SUBMISSION
       ========================================================================== */
    const orderForm = document.getElementById('orderForm');
    // (WhatsApp phone number is managed from Espace Pro and loaded automatically above);

    function cleanPhoneNumber(numberStr) {
        // Strip everything except numbers
        return numberStr.replace(/\D/g, '');
    }

    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (cart.length === 0) {
                alert("Votre panier est vide.");
                return;
            }

            const clientName = document.getElementById('clientName').value;
            const clientPhone = document.getElementById('clientPhone').value;
            const clientLocation = document.getElementById('clientLocation').value;
            const clientNotes = document.getElementById('clientNotes').value;

            // Generate beautifully formatted message
            let message = `*COMMANDE AS-SALAM PRODUCTION*\n\n`;
            message += `👤 *Client :* ${clientName}\n`;
            message += `📞 *Téléphone :* ${clientPhone}\n`;
            message += `📍 *Livraison :* ${clientLocation}\n`;
            if (clientNotes.trim() !== '') {
                message += `📝 *Instructions :* ${clientNotes}\n`;
            }
            message += `\n📦 *PRODUITS COMMANDÉS :*\n`;

            let subtotal = 0;
            cart.forEach((item, index) => {
                const totalItemPrice = item.price * item.quantity;
                subtotal += totalItemPrice;
                message += `${index + 1}. ${item.name}  x${item.quantity}  (${formatPrice(totalItemPrice)})\n`;
            });

            message += `\n💵 *TOTAL ESTIMÉ :* *${formatPrice(subtotal)}*\n`;
            message += `_(Frais de livraison à convenir avec le service client)_\n\n`;
            message += `Merci de valider ma commande !`;

            // Build WhatsApp Link
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappTarget}&text=${encodedMessage}`;

            // Open WhatsApp link in new window
            window.open(whatsappUrl, '_blank');

            // Save order to LocalStorage
            let ordersList = JSON.parse(localStorage.getItem('assalam_orders')) || [];
            const newOrder = {
                date: new Date().toLocaleString(),
                client: clientName,
                phone: clientPhone,
                location: clientLocation,
                items: cart.map(item => `${item.name} x${item.quantity}`).join(', '),
                total: subtotal
            };
            ordersList.unshift(newOrder);
            localStorage.setItem('assalam_orders', JSON.stringify(ordersList));


            // Optional: reset cart and form
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 }
                });
            }
            if (typeof showToast === 'function') {
                showToast(currentLang === 'fr' ? "Commande préparée ! Redirection vers WhatsApp..." : "Order prepared! Redirecting to WhatsApp...", 'success');
            }
            cart = [];
            updateCartUI();
            orderForm.reset();
        });
    }

    /* ==========================================================================
       6. RECIPES TABS
       ========================================================================== */
    const recipeTabs = document.querySelectorAll('.recipe-tab');
    const recipeContents = document.querySelectorAll('.recipe-card-content');

    recipeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            recipeTabs.forEach(t => t.classList.remove('active'));
            recipeContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetId = `recipe-${tab.getAttribute('data-recipe')}`;
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    /* ==========================================================================
       7. CONTACT FORM SUBMISSION
       ========================================================================== */
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const contactName = document.getElementById('contactName').value;
            const contactEmail = document.getElementById('contactEmail').value;
            const contactSubject = document.getElementById('contactSubject').value;
            const contactMessage = document.getElementById('contactMessage').value;

            // Simple demonstration action
            alert(`Merci ${contactName} ! Votre message concernant "${contactSubject}" a bien été enregistré. Notre équipe vous répondra par courriel à ${contactEmail} dans les plus brefs délais.`);
            contactForm.reset();
        });
    }

    /* ==========================================================================
       8. HEADER SCROLL EFFECT
       ========================================================================== */
    const mainHeader = document.querySelector('.main-header');
    if (mainHeader) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 80) {
                mainHeader.classList.add('scrolled');
            } else {
                mainHeader.classList.remove('scrolled');
            }
        });
    }

    /* ==========================================================================
       9. SCROLL SPY - Active nav link on scroll
       ========================================================================== */
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let scrollY = window.pageYOffset;
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            if (navLink) {
                if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    navLink.classList.add('active');
                }
            }
        });
    });

    /* ==========================================================================
       10. PRODUCT CARDS STAGGERED ANIMATION ON SCROLL
       ========================================================================== */
    const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const delay = Array.from(productCards).indexOf(card) * 150;
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, delay);
                cardObserver.unobserve(card);
            }
        });
    }, observerOptions);

    productCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        cardObserver.observe(card);
    });

    /* ==========================================================================
       11. TESTIMONIAL CARDS STAGGERED ANIMATION
       ========================================================================== */
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const testimonialObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const delay = Array.from(testimonialCards).indexOf(card) * 200;
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, delay);
                testimonialObserver.unobserve(card);
            }
        });
    }, { threshold: 0.2 });

    testimonialCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        testimonialObserver.observe(card);
    });

    /* ==========================================================================
       12. SMOOTH CART BUTTON ANIMATION
       ========================================================================== */
    const cartTriggerEl = document.getElementById('cartTrigger');
    if (cartTriggerEl) {
        cartTriggerEl.addEventListener('click', () => {
            const orderSection = document.getElementById('order-section');
            if (orderSection) {
                orderSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }



    /* ==========================================================================
       14. BACK TO TOP BUTTON
       ========================================================================== */
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ==========================================================================
       15. DARK MODE TOGGLE
       ========================================================================== */
    const darkToggle = document.getElementById('darkModeToggle');
    if (darkToggle) {
        const savedTheme = localStorage.getItem('assalam_theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            darkToggle.querySelector('.icon-sun').style.display = 'none';
            darkToggle.querySelector('.icon-moon').style.display = 'block';
        }
        darkToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('assalam_theme', isDark ? 'dark' : 'light');
            darkToggle.querySelector('.icon-sun').style.display = isDark ? 'none' : 'block';
            darkToggle.querySelector('.icon-moon').style.display = isDark ? 'block' : 'none';
        });
    }

    /* ==========================================================================
       16. ANIMATED STATS COUNTERS
       ========================================================================== */
    const statNumbers = document.querySelectorAll('.stat-number');
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-target'));
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;
                const counter = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        el.textContent = target.toLocaleString('fr-FR');
                        clearInterval(counter);
                    } else {
                        el.textContent = Math.floor(current).toLocaleString('fr-FR');
                    }
                }, 16);
                statsObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    statNumbers.forEach(el => statsObserver.observe(el));

    /* ==========================================================================
       17. FAQ ACCORDION
       ========================================================================== */
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                faqItems.forEach(i => i.classList.remove('active'));
                if (!isActive) item.classList.add('active');
            });
        }
    });

    /* ==========================================================================
       18. PRODUCT MODAL
       ========================================================================== */
    const modal = document.getElementById('productModal');
    const modalClose = document.getElementById('modalClose');
    const modalImg = document.getElementById('modalImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalPrice = document.getElementById('modalPrice');
    const modalCat = document.getElementById('modalCat');
    const modalAddBtn = document.getElementById('modalAddBtn');
    let currentModalProduct = null;

    // Dynamic event delegation for opening product detail modals
    const productsGridEl = document.getElementById('productsGrid');
    if (productsGridEl) {
        productsGridEl.addEventListener('click', (e) => {
            const imgWrapper = e.target.closest('.product-img-wrapper');
            if (imgWrapper) {
                const card = imgWrapper.closest('.product-card');
                if (card) {
                    const img = card.querySelector('.product-img');
                    const title = card.querySelector('.product-title');
                    const desc = card.querySelector('.product-desc');
                    const price = card.querySelector('.product-price');
                    const cat = card.querySelector('.product-cat');
                    const addBtn = card.querySelector('.btn-add-cart');

                    if (modalImg) modalImg.src = img.src;
                    if (modalTitle) modalTitle.textContent = title.textContent;
                    if (modalDesc) modalDesc.textContent = desc.textContent;
                    if (modalPrice) modalPrice.textContent = price.textContent;
                    if (modalCat) modalCat.textContent = cat.textContent;
                    
                    if (addBtn) {
                        currentModalProduct = {
                            id: parseInt(addBtn.getAttribute('data-id')),
                            name: addBtn.getAttribute('data-name'),
                            price: parseInt(addBtn.getAttribute('data-price'))
                        };
                        
                        // Disable modal add button if product is out of stock
                        if (addBtn.disabled || addBtn.classList.contains('disabled')) {
                            if (modalAddBtn) {
                                modalAddBtn.disabled = true;
                                modalAddBtn.classList.add('disabled');
                                modalAddBtn.style.opacity = '0.6';
                                modalAddBtn.style.pointerEvents = 'none';
                                const frLabel = modalAddBtn.querySelector('[data-fr]');
                                if (frLabel) frLabel.textContent = 'Rupture de stock';
                            }
                        } else {
                            if (modalAddBtn) {
                                modalAddBtn.disabled = false;
                                modalAddBtn.classList.remove('disabled');
                                modalAddBtn.style.opacity = '';
                                modalAddBtn.style.pointerEvents = '';
                                const frLabel = modalAddBtn.querySelector('[data-fr]');
                                if (frLabel) frLabel.textContent = 'Ajouter au panier';
                            }
                        }
                    }
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    if (modalAddBtn) {
        modalAddBtn.addEventListener('click', () => {
            if (currentModalProduct) {
                addItemToCart(currentModalProduct.id, currentModalProduct.name, currentModalProduct.price);
                animateCartTrigger();
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    /* ==========================================================================
       19. NEWSLETTER FORM
       ========================================================================== */
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletterEmail').value;
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { y: 0.8 }
                });
            }
            if (typeof showToast === 'function') {
                showToast(currentLang === 'fr' 
                    ? `Merci ! L'adresse ${email} a été enregistrée. ✉️` 
                    : `Thank you! ${email} has been subscribed. ✉️`, 'success');
            }
            newsletterForm.reset();
        });
    }

    /* ==========================================================================
       20. TOAST NOTIFICATIONS HELPER
       ========================================================================== */
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;
        toastContainer.appendChild(toast);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        });

        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }
    window.showToast = showToast; // Expose globally just in case

    /* ==========================================================================
       21. SCROLL PROGRESS BAR
       ========================================================================== */
    window.addEventListener('scroll', () => {
        const scrollProgress = document.getElementById('scrollProgressBar');
        if (scrollProgress) {
            const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            scrollProgress.style.width = scrolled + '%';
        }
    });

    /* ==========================================================================
       22. PROMO BANNER & COUNTDOWN
       ========================================================================== */
    const promoCountdown = document.getElementById('promoCountdown');
    const promoClose = document.getElementById('promoClose');
    const promoBanner = document.getElementById('promoBanner');

    if (promoClose && promoBanner) {
        promoClose.addEventListener('click', () => {
            promoBanner.classList.add('hidden');
            localStorage.setItem('assalam_promo_closed', 'true');
        });
        if (localStorage.getItem('assalam_promo_closed') === 'true') {
            promoBanner.classList.add('hidden');
        }
    }

    let countdownDuration = 2 * 60 * 60 * 1000 + 14 * 60 * 1000 + 32 * 1000; // 2h 14m 32s
    let promoEndTime = localStorage.getItem('assalam_promo_end');
    if (!promoEndTime) {
        promoEndTime = Date.now() + countdownDuration;
        localStorage.setItem('assalam_promo_end', promoEndTime);
    } else {
        promoEndTime = parseInt(promoEndTime);
        if (Date.now() > promoEndTime) {
            // Reset for demo purposes so it always shows a timer
            promoEndTime = Date.now() + countdownDuration;
            localStorage.setItem('assalam_promo_end', promoEndTime);
        }
    }

    function updateCountdown() {
        const now = Date.now();
        const difference = promoEndTime - now;
        if (difference <= 0) {
            if (promoCountdown) promoCountdown.textContent = "00h 00m 00s";
            return;
        }
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        if (promoCountdown) {
            promoCountdown.textContent = 
                `${hours.toString().padStart(2, '0')}h ` +
                `${minutes.toString().padStart(2, '0')}m ` +
                `${seconds.toString().padStart(2, '0')}s`;
        }
    }
    setInterval(updateCountdown, 1000);
    updateCountdown();

    /* ==========================================================================
       23. LANGUAGE SWITCHER FR/EN
       ========================================================================== */
    const langFR = document.getElementById('langFR');
    const langEN = document.getElementById('langEN');
    let currentLang = localStorage.getItem('assalam_lang') || 'fr';

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('assalam_lang', lang);

        if (lang === 'fr') {
            if (langFR) langFR.classList.add('active');
            if (langEN) langEN.classList.remove('active');
        } else {
            if (langEN) langEN.classList.add('active');
            if (langFR) langFR.classList.remove('active');
        }

        // Translate all data-fr/data-en elements safely
        document.querySelectorAll('[data-fr]').forEach(elem => {
            const text = elem.getAttribute(`data-${lang}`);
            if (text) {
                if (elem.tagName === 'INPUT' || elem.tagName === 'TEXTAREA') {
                    elem.placeholder = text;
                } else {
                    // Check if it has a span child that isn't an svg/icon
                    const childSpan = elem.querySelector('span:not(svg span)');
                    if (childSpan) {
                        childSpan.textContent = text;
                    } else {
                        // If this element has other child elements (icons, svgs etc.),
                        // only update the text node to preserve HTML children
                        const childElements = elem.querySelectorAll('*');
                        if (childElements.length > 0) {
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
                                elem.appendChild(document.createTextNode(text));
                            }
                        } else {
                            elem.textContent = text;
                        }
                    }
                }
            }
        });
    }

    if (langFR && langEN) {
        langFR.addEventListener('click', () => {
            setLanguage('fr');
            showToast('Langue changée en Français ! 🇫🇷');
        });
        langEN.addEventListener('click', () => {
            setLanguage('en');
            showToast('Language changed to English! 🇬🇧');
        });
    }
    setLanguage(currentLang);

    /* ==========================================================================
       24. TYPEWRITER EFFECT
       ========================================================================== */
    const typewriterText = document.getElementById('typewriterText');
    if (typewriterText) {
        const phrasesFr = ['Autrement', 'Sainement', 'Naturellement', 'Bio'];
        const phrasesEn = ['Differently', 'Healthily', 'Naturally', 'Organic'];
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 150;

        function type() {
            const phrases = currentLang === 'fr' ? phrasesFr : phrasesEn;
            const currentPhrase = phrases[phraseIndex];
            if (isDeleting) {
                typewriterText.textContent = currentPhrase.substring(0, charIndex - 1);
                charIndex--;
                typingSpeed = 70;
            } else {
                typewriterText.textContent = currentPhrase.substring(0, charIndex + 1);
                charIndex++;
                typingSpeed = 150;
            }

            if (!isDeleting && charIndex === currentPhrase.length) {
                typingSpeed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                typingSpeed = 500;
            }

            setTimeout(type, typingSpeed);
        }
        setTimeout(type, 1000);
    }

    /* ==========================================================================
       25. PRODUCT SEARCH
       ========================================================================== */
    const productSearch = document.getElementById('productSearch');
    if (productSearch) {
        const productsGrid = document.getElementById('productsGrid');
        const noResults = document.createElement('div');
        noResults.id = 'noResultsMessage';
        noResults.className = 'no-results-msg hidden';
        noResults.style.textAlign = 'center';
        noResults.style.padding = '40px 20px';
        noResults.style.gridColumn = '1 / -1';
        noResults.style.color = 'var(--color-muted)';
        noResults.style.fontWeight = '600';
        noResults.innerHTML = `
            <p data-fr="Aucun produit ne correspond à votre recherche." data-en="No products match your search.">Aucun produit ne correspond à votre recherche.</p>
        `;
        if (productsGrid) productsGrid.appendChild(noResults);

        productSearch.addEventListener('input', () => {
            const val = productSearch.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.product-card');
            let visibleCount = 0;

            cards.forEach(card => {
                const title = card.querySelector('.product-title').textContent.toLowerCase();
                const desc = card.querySelector('.product-desc').textContent.toLowerCase();
                const cat = card.querySelector('.product-cat').textContent.toLowerCase();
                
                if (title.includes(val) || desc.includes(val) || cat.includes(val)) {
                    card.style.display = '';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            if (visibleCount === 0) {
                noResults.classList.remove('hidden');
            } else {
                noResults.classList.add('hidden');
            }
        });
    }

    /* ==========================================================================
       26. COOKIE BANNER
       ========================================================================== */
    const cookieBanner = document.getElementById('cookieBanner');
    const cookieAccept = document.getElementById('cookieAccept');
    const cookieRefuse = document.getElementById('cookieRefuse');

    if (cookieBanner) {
        if (!localStorage.getItem('assalam_cookies_accepted') && !localStorage.getItem('assalam_cookies_refused')) {
            setTimeout(() => {
                cookieBanner.classList.remove('hidden');
            }, 2000);
        }

        if (cookieAccept) {
            cookieAccept.addEventListener('click', () => {
                localStorage.setItem('assalam_cookies_accepted', 'true');
                cookieBanner.classList.add('hidden');
                showToast(currentLang === 'fr' ? 'Cookies acceptés ! 🍪' : 'Cookies accepted! 🍪', 'success');
            });
        }

        if (cookieRefuse) {
            cookieRefuse.addEventListener('click', () => {
                localStorage.setItem('assalam_cookies_refused', 'true');
                cookieBanner.classList.add('hidden');
                showToast(currentLang === 'fr' ? 'Cookies refusés.' : 'Cookies refused.', 'info');
            });
        }
    }

    /* ==========================================================================
       27. LIGHTBOX GALLERY
       ========================================================================== */
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.querySelector('.lightbox-close');

    if (lightboxModal && lightboxImg) {
        document.querySelectorAll('.gallery-item img').forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => {
                lightboxModal.style.display = 'block';
                lightboxImg.src = img.src;
                if (lightboxCaption) {
                    const overlayText = img.parentElement.querySelector('.gallery-overlay span');
                    lightboxCaption.textContent = overlayText ? overlayText.textContent : img.alt;
                }
                document.body.style.overflow = 'hidden';
            });
        });

        if (lightboxClose) {
            lightboxClose.addEventListener('click', () => {
                lightboxModal.style.display = 'none';
                document.body.style.overflow = '';
            });
        }

        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) {
                lightboxModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }

    /* ==========================================================================
       28. PRODUCT SHARING
       ========================================================================== */
    const modalShareWa = document.getElementById('modalShareWa');
    const modalShareFb = document.getElementById('modalShareFb');
    const modalShareCopy = document.getElementById('modalShareCopy');

    if (modalShareWa) {
        modalShareWa.addEventListener('click', () => {
            if (currentModalProduct) {
                const text = `Découvrez le ${currentModalProduct.name} d'As-Salam Production ! Une merveille locale. ${window.location.href}`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
            }
        });
    }

    if (modalShareFb) {
        modalShareFb.addEventListener('click', () => {
            const url = encodeURIComponent(window.location.href);
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        });
    }

    if (modalShareCopy) {
        modalShareCopy.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                showToast(currentLang === 'fr' ? 'Lien copié dans le presse-papiers !' : 'Link copied to clipboard!', 'success');
            }).catch(() => {
                showToast('Erreur lors de la copie du lien.', 'error');
            });
        });
    }

    /* ==========================================================================
       29. PRO DASHBOARD SYNC OVERRIDES
       ========================================================================== */
    const defaultCatalog = [
        { id: 1, name: "Couscous de Maïs", price: 1500, category: "Couscous", desc: "Un couscous léger et nutritif à base de maïs local de première qualité." },
        { id: 2, name: "Bouillie Akloui de Maïs", price: 1200, category: "Bouillies", desc: "La bouillie traditionnelle béninoise, prête à cuire, riche en saveurs." },
        { id: 3, name: "Riz de Maïs", price: 1800, category: "Riz", desc: "Une alternative saine au riz classique, digeste et naturellement sans gluten." },
        { id: 4, name: "Pâte Gambari", price: 1000, category: "Farines", desc: "Farine de maïs de qualité pour la préparation de la pâte traditionnelle." },
        { id: 5, name: "Cassoulet au Maïs", price: 2000, category: "Conserves", desc: "Un plat cuisiné délicieux alliant haricots locaux et grains de maïs tendres." }
    ];

    function renderCatalog() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        const overrides = JSON.parse(localStorage.getItem('assalam_catalog_overrides')) || {};
        const customProducts = JSON.parse(localStorage.getItem('assalam_custom_products')) || [];
        
        let all = [...defaultCatalog, ...customProducts];
        
        productsGrid.innerHTML = '';
        
        all.forEach(p => {
            const override = overrides[p.id];
            const name = override ? override.name : p.name;
            const price = override ? override.price : p.price;
            const desc = override ? override.desc : p.desc;
            const category = override ? override.category : p.category;
            const outOfStock = override ? override.outOfStock : (p.outOfStock || false);
            
            // Map category to CSS class filter category
            let catFilterClass = 'prets';
            if (category === 'Farines' || category === 'Couscous' || category === 'Bouillies') {
                catFilterClass = 'grains';
            }
            
            const card = document.createElement('div');
            card.className = 'product-card animate-fade-in';
            card.setAttribute('data-category', catFilterClass);
            
            if (outOfStock) {
                card.style.opacity = '0.7';
            }

            // Create badge
            let badgeHTML = '';
            if (p.isCustom) {
                badgeHTML = `<span class="product-badge" data-fr="Nouveau" data-en="New">${currentLang === 'fr' ? 'Nouveau' : 'New'}</span>`;
            } else if (p.id === 1) {
                badgeHTML = `<span class="product-badge" data-fr="Populaire" data-en="Popular">${currentLang === 'fr' ? 'Populaire' : 'Popular'}</span>`;
            } else if (p.id === 2) {
                badgeHTML = `<span class="product-badge" data-fr="Le Matin" data-en="Breakfast">${currentLang === 'fr' ? 'Le Matin' : 'Breakfast'}</span>`;
            } else if (p.id === 3) {
                badgeHTML = `<span class="product-badge" data-fr="Nouveauté" data-en="New">${currentLang === 'fr' ? 'Nouveauté' : 'New'}</span>`;
            }

            const buttonDisabled = outOfStock ? 'disabled style="pointer-events: none; opacity: 0.6; background-color: #888;"' : '';
            const buttonText = outOfStock 
                ? (currentLang === 'fr' ? 'Rupture' : 'Out of Stock')
                : (currentLang === 'fr' ? 'Ajouter' : 'Add');

            card.innerHTML = `
                <div class="product-img-wrapper" style="position: relative;">
                    <img src="images/package.png" alt="${name} As-Salam" class="product-img">
                    ${badgeHTML}
                    ${outOfStock ? `
                        <span class="badge-out-of-stock" style="position: absolute; top: 15px; right: 15px; background-color: #e11d48; color: #ffffff; padding: 4px 10px; border-radius: 20px; font-weight: 800; font-size: 0.7rem; letter-spacing: 0.5px;">RUPTURE</span>
                    ` : ''}
                </div>
                <div class="product-info">
                    <span class="product-cat" data-fr="${category}" data-en="${category}">${category}</span>
                    <div class="product-rating">
                        <span class="stars">★★★★★</span>
                        <span class="rating-val">5.0</span>
                    </div>
                    <h3 class="product-title" data-fr="${name}" data-en="${name}">${name}</h3>
                    <p class="product-desc" data-fr="${desc}" data-en="${desc}">${desc}</p>
                    <div class="product-footer">
                        <span class="product-price">${formatPrice(price)}</span>
                        <button class="btn btn-primary btn-add-cart" data-id="${p.id}" data-name="${name}" data-price="${price}" ${buttonDisabled}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            <span data-fr="Ajouter" data-en="Add">${buttonText}</span>
                        </button>
                    </div>
                </div>
            `;
            productsGrid.appendChild(card);
        });
    }

    function applyPromoOverrides() {
        const promoBanner = document.getElementById('promoBanner');
        const promoText = document.querySelector('.promo-text');
        const showPromo = localStorage.getItem('assalam_promo_banner_show') || 'false';
        const customText = localStorage.getItem('assalam_promo_banner_text');
        const isClosed = localStorage.getItem('assalam_promo_closed') === 'true';

        if (promoBanner) {
            if (showPromo === 'true' && !isClosed) {
                promoBanner.style.display = 'block';
                if (customText && promoText) {
                    promoText.textContent = customText;
                    promoText.setAttribute('data-fr', customText);
                    promoText.setAttribute('data-en', customText);
                }
            } else {
                promoBanner.style.display = 'none';
            }
        }
    }

    /* ==========================================================================
       30. INITIALIZE SYSTEM DATA
       ========================================================================== */
    // Increment visit count
    let visits = parseInt(localStorage.getItem('assalam_visits') || 0);
    visits++;
    localStorage.setItem('assalam_visits', visits);

    // Apply active overrides
    renderCatalog();
    applyPromoOverrides();

    console.log('[AS-SALAM] Script fully loaded ✅');
    } catch(err) {
        console.error('[AS-SALAM] CRITICAL ERROR:', err.message, err.stack);
    }
});
