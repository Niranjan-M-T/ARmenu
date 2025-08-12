/**
 * This script handles the dynamic rendering of a categorized menu,
 * item detail pop-ups, conditional AR viewing, AI assistance, and floating navigation.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const menuContainer = document.getElementById('menu-container');
    const loader = document.getElementById('loader');

    // Item Details Modal
    // AR Viewer Modal
    const arModal = document.getElementById('ar-modal');
    const arCloseBtn = arModal.querySelector('.close-button');
    const modelViewer = document.getElementById('model-viewer-component');
    const arItemName = document.getElementById('ar-item-name');
    const arItemDescription = document.getElementById('ar-item-description');

    // Floating Nav
    const floatingNavBtn = document.getElementById('floating-nav-btn');
    const floatingNavList = document.getElementById('floating-nav-list');

    // --- State ---
    let menuData = {};
    let currentArItem = null;
    let typewriterInterval = null;

    /**
     * Fetches menu data and initializes the application.
     */
    const loadMenu = async () => {
        try {
            const response = await fetch('menu.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            menuData = await response.json();

            renderMenu();
            setTimeout(() => loader.classList.add('hidden'), 500);

        } catch (error) {
            console.error('Error fetching menu data:', error);
            loader.classList.add('hidden');
            menuContainer.innerHTML = '<p style="color: #ff6600;">Failed to load menu. Please try again later.</p>';
        }
    };

    /**
     * Sets up Intersection Observer to animate items on scroll.
     */
    const setupScrollAnimations = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => observer.observe(item));
    };

    /**
     * Renders the full categorized menu and populates the floating navigation.
     */
    const renderMenu = () => {
        menuContainer.innerHTML = '';
        floatingNavList.innerHTML = '';

        for (const category in menuData) {
            const categoryId = category.replace(/\s+/g, '-').replace(/[()]/g, '');
            const categorySection = document.createElement('section');
            categorySection.className = 'menu-category';
            categorySection.id = categoryId;

            const categoryTitle = document.createElement('h2');
            categoryTitle.textContent = category;
            categorySection.appendChild(categoryTitle);

            const menuGrid = document.createElement('div');
            menuGrid.className = 'menu-grid';

            menuData[category].forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item';

                // Redesigned structure for the menu item
                menuItem.innerHTML = `
                    <img src="${item.image_url}" alt="${item.name}" class="menu-item-img">
                    <div class="menu-item-content">
                        <div class="menu-item-header">
                            <h2 class="menu-item-name">${item.name}</h2>
                            <p class="menu-item-price">$${item.price}</p>
                        </div>
                        <div class="menu-item-details"></div>

                    </div>
                    <div class="menu-item-details"></div>
                `;
                menuItem.addEventListener('click', () => toggleDetails(menuItem, item));
                menuGrid.appendChild(menuItem);
            });

            categorySection.appendChild(menuGrid);
            menuContainer.appendChild(categorySection);

            const navLink = document.createElement('li');
            navLink.innerHTML = `<a href="#${categoryId}">${category}</a>`;
            floatingNavList.appendChild(navLink);
        }

        // After all items are in the DOM, set up animations
        setupScrollAnimations();
    };

    /**
     * Creates a typewriter effect for a given element.
     */
    const typewriter = (element, text, speed = 30) => {
        if (typewriterInterval) clearInterval(typewriterInterval);
        element.textContent = '';
        let i = 0;
        typewriterInterval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typewriterInterval);
                typewriterInterval = null;
            }
        }, speed);
    };

    /**
     * Toggles the expanded details view for a menu item.
     */
    const toggleDetails = (menuItem, item) => {
        const detailsContainer = menuItem.querySelector('.menu-item-details');
        const isExpanded = menuItem.classList.contains('expanded');

        // Close any other expanded items
        document.querySelectorAll('.menu-item.expanded').forEach(openItem => {
            if (openItem !== menuItem) {
                openItem.classList.remove('expanded');
                openItem.querySelector('.menu-item-details').innerHTML = '';
            }
        });

        if (isExpanded) {
            menuItem.classList.remove('expanded');
            detailsContainer.innerHTML = '';
        } else {
            // Build the details HTML
            let nutritionHTML = '';
            for (const [key, value] of Object.entries(item.nutritional_value)) {
                nutritionHTML += `<span><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}</span>`;
            }

            let ingredientsHTML = item.ingredients.map(ing => `<li>${ing}</li>`).join('');


            detailsContainer.innerHTML = `
                <p class="item-description">${item.description}</p>
                <div class="item-extra-info">
                    <div>
                        <h3>Ingredients:</h3>
                        <ul class="item-ingredients">${ingredientsHTML}</ul>
                    </div>
                    <div>
                        <h3>Nutritional Value:</h3>
                        <div class="item-nutrition">${nutritionHTML}</div>
                    </div>
                </div>
                ${item.model_url ? `<button class="ar-button">View in Your Space (AR)</button>` : ''}
            `;

            // Add event listener for the AR button if it exists
            if (item.model_url) {
                const arButton = detailsContainer.querySelector('.ar-button');
                arButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent the toggleDetails from firing again
                    currentArItem = item;
                    showArModal();
                });
            }


            menuItem.classList.add('expanded');
        }
    };

    /**
     * Shows the AR viewer modal.
     */
    const showArModal = () => {
        if (!currentArItem) return;
        detailsModal.style.display = 'none';
        modelViewer.src = currentArItem.model_url;
        arItemName.textContent = currentArItem.name;
        arItemDescription.textContent = currentArItem.description;
        arModal.style.display = 'flex';
    };

    // --- Modal Close Logic ---
    const closeArModal = () => {
        arModal.style.display = 'none';
        modelViewer.src = '';
    };

    arCloseBtn.addEventListener('click', closeArModal);

    window.addEventListener('click', (event) => {
        if (event.target === arModal) closeArModal();
        if (event.target === aiModal) closeAiModal();
    });

    // --- AI Assistant Logic (Moved to ai.js) ---
    const aiBtn = document.getElementById('ai-assistant-btn');
    aiBtn.addEventListener('click', () => {
        window.location.href = 'ai.html';
    });

    // --- Floating Nav Logic ---
    floatingNavBtn.addEventListener('click', () => {
        floatingNavList.classList.toggle('show');
    });

    floatingNavList.addEventListener('click', (event) => {
        if (event.target.tagName === 'A') {
            floatingNavList.classList.remove('show');
        }
    });

    // Initial load
    loadMenu();
});
