/**
 * This script handles the dynamic loading of menu items, AR viewer functionality,
 * and swipe navigation within the AR modal.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const loader = document.getElementById('loader');
    const menuContainer = document.getElementById('menu-container');
    const modal = document.getElementById('ar-modal');
    const modelViewer = document.getElementById('model-viewer-component');
    const closeButton = document.querySelector('.close-button');
    const arItemName = document.getElementById('ar-item-name');
    const arItemDescription = document.getElementById('ar-item-description');

    // --- State Variables ---
    let menuData = [];
    let currentModelIndex = 0;
    let touchStartX = 0;
    let touchEndX = 0;

    /**
     * Preloads the first 3D model to improve initial load experience.
     * @param {string} modelUrl - The URL of the model to preload.
     */
    const preloadFirstModel = async (modelUrl) => {
        try {
            await fetch(modelUrl);
        } catch (error) {
            console.error('Failed to preload the first model:', error);
        }
    };

    /**
     * Fetches menu data, preloads the first model, and then populates the menu.
     */
    const loadMenu = async () => {
        try {
            const response = await fetch('menu.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            menuData = data; // Store menu data globally

            if (menuData.length > 0) {
                await preloadFirstModel(menuData[0].model_url);
            }

            loader.classList.add('hidden');
            renderMenu();
        } catch (error) {
            console.error('Error fetching menu data:', error);
            loader.classList.add('hidden');
            menuContainer.innerHTML = '<p style="color: #ff6600;">Failed to load menu. Please try again later.</p>';
        }
    };

    /**
     * Renders the menu items on the page.
     */
    const renderMenu = () => {
        menuContainer.innerHTML = '';
        menuData.forEach((item, index) => {
            const menuItem = document.createElement('div');
            menuItem.classList.add('menu-item');
            menuItem.innerHTML = `
                <img src="${item.image_url}" alt="${item.name}">
                <div class="menu-item-content">
                    <h2>${item.name}</h2>
                    <p>${item.description}</p>
                    <button class="ar-button" data-index="${index}">View in AR</button>
                </div>
            `;
            menuContainer.appendChild(menuItem);
        });
        addArButtonListeners();
    };

    /**
     * Adds click event listeners to all "View in AR" buttons.
     */
    const addArButtonListeners = () => {
        document.querySelectorAll('.ar-button').forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.getAttribute('data-index'), 10);
                openArModal(index);
            });
        });
    };

    /**
     * Opens the AR modal and loads the 3D model for the given index.
     * @param {number} index - The index of the menu item to display.
     */
    const openArModal = (index) => {
        currentModelIndex = index;
        updateModalContent();
        modal.style.display = 'flex';
    };

    /**
     * Updates the modal content (model, name, description) based on the current index.
     */
    const updateModalContent = () => {
        const item = menuData[currentModelIndex];
        modelViewer.src = item.model_url;
        arItemName.textContent = item.name;
        arItemDescription.textContent = item.description;
    };

    /**
     * Closes the AR modal and unloads the 3D model.
     */
    const closeArModal = () => {
        modal.style.display = 'none';
        modelViewer.src = '';
    };

    // --- Swipe Navigation Logic ---
    const handleSwipe = () => {
        const swipeThreshold = 50; // Minimum distance for a swipe in pixels
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swiped left (next item)
            // The modulo operator (%) ensures the index wraps around to 0 after the last item.
            currentModelIndex = (currentModelIndex + 1) % menuData.length;
            updateModalContent();
        }
        if (touchEndX > touchStartX + swipeThreshold) {
            // Swiped right (previous item)
            // Adding menuData.length before the modulo handles negative numbers correctly.
            currentModelIndex = (currentModelIndex - 1 + menuData.length) % menuData.length;
            updateModalContent();
        }
    };

    // --- Event Listeners ---
    closeButton.addEventListener('click', closeArModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) closeArModal();
    });

    // Error handling for model loading
    modelViewer.addEventListener('error', (event) => {
        console.error('Model Viewer Error:', event.detail);
        // Alerting the user can help with mobile debugging
        alert(`There was an error loading the 3D model: ${event.detail}`);
    });

    modelViewer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    modelViewer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    // Initial call to load the menu
    loadMenu();
});
