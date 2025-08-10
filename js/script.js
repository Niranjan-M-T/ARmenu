/**
 * This script handles the dynamic loading of menu items and the AR viewer functionality.
 * It waits for the DOM to be fully loaded before executing.
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM element references
    const menuContainer = document.getElementById('menu-container');
    const modal = document.getElementById('ar-modal');
    const modelViewer = document.getElementById('model-viewer-component');
    const closeButton = document.querySelector('.close-button');

    /**
     * Fetches menu data from the menu.json file and populates the menu.
     * Uses async/await for cleaner asynchronous code.
     */
    const loadMenu = async () => {
        try {
            const response = await fetch('menu.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const menuData = await response.json();
            renderMenu(menuData);
        } catch (error) {
            console.error('Error fetching menu data:', error);
            // Display a user-friendly error message
            menuContainer.innerHTML = '<p style="color: #ff6600;">Failed to load menu. Please try again later.</p>';
        }
    };

    /**
     * Renders the menu items on the page based on the fetched data.
     * @param {Array} menuData - An array of menu item objects.
     */
    const renderMenu = (menuData) => {
        // Clear any existing content
        menuContainer.innerHTML = '';

        menuData.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.classList.add('menu-item');

            menuItem.innerHTML = `
                <img src="${item.image_url}" alt="${item.name}">
                <div class="menu-item-content">
                    <h2>${item.name}</h2>
                    <p>${item.description}</p>
                    <button class="ar-button" data-model-url="${item.model_url}">View in AR</button>
                </div>
            `;

            menuContainer.appendChild(menuItem);
        });

        // Add event listeners to the newly created AR buttons
        addArButtonListeners();
    };

    /**
     * Adds click event listeners to all "View in AR" buttons.
     */
    const addArButtonListeners = () => {
        const arButtons = document.querySelectorAll('.ar-button');
        arButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modelUrl = button.getAttribute('data-model-url');
                openArModal(modelUrl);
            });
        });
    };

    /**
     * Opens the AR modal and loads the specified 3D model.
     * @param {string} modelUrl - The URL of the 3D model to load.
     */
    const openArModal = (modelUrl) => {
        modelViewer.src = modelUrl;
        modal.style.display = 'flex'; // Use flex for easy centering
    };

    /**
     * Closes the AR modal and unloads the 3D model to free up resources.
     */
    const closeArModal = () => {
        modal.style.display = 'none';
        // Setting src to empty string unloads the model, which is good for performance
        modelViewer.src = '';
    };

    // --- Event Listeners ---

    // Listener for the modal's close button
    closeButton.addEventListener('click', closeArModal);

    // Listener to close the modal by clicking outside of the modal content
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeArModal();
        }
    });

    // Initial call to load the menu when the script runs
    loadMenu();
});
