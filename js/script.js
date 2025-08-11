/**

 * This script handles the dynamic rendering of a categorized menu,
 * item detail pop-ups, conditional AR viewing, AI assistance, and floating navigation.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const menuContainer = document.getElementById('menu-container');
    const loader = document.getElementById('loader');

    // Item Details Modal
    const detailsModal = document.getElementById('item-details-modal');
    const detailsCloseBtn = detailsModal.querySelector('.close-button');
    const detailsImg = document.getElementById('details-img');
    const detailsName = document.getElementById('details-name');
    const detailsDescription = document.getElementById('details-description');
    const detailsPrice = document.getElementById('details-price');
    const detailsIngredients = document.getElementById('details-ingredients');
    const detailsNutrition = document.getElementById('details-nutrition');
    const detailsArBtn = document.getElementById('details-ar-btn');

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
     * Renders the full categorized menu and populates the floating navigation.
     */
    const renderMenu = () => {
        menuContainer.innerHTML = '';
        floatingNavList.innerHTML = ''; // Clear old nav links

        for (const category in menuData) {
            const categoryId = category.replace(/\s+/g, '-').replace(/[()]/g, '');
            // Create category section
            const categorySection = document.createElement('section');
            categorySection.className = 'menu-category';
            categorySection.id = categoryId;

            const categoryTitle = document.createElement('h2');
            categoryTitle.textContent = category;
            categorySection.appendChild(categoryTitle);

            // Create grid for items
            const menuGrid = document.createElement('div');
            menuGrid.className = 'menu-grid';

            menuData[category].forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item';
                menuItem.innerHTML = `
                    <img src="${item.image_url}" alt="${item.name}">
                    <div class="menu-item-content">
                        <h2>${item.name}</h2>
                        <p class="price">$${item.price}</p>
                    </div>
                `;
                menuItem.addEventListener('click', () => showDetailsModal(item));
                menuGrid.appendChild(menuItem);
            });

            categorySection.appendChild(menuGrid);
            menuContainer.appendChild(categorySection);

            // Add link to floating nav
            const navLink = document.createElement('li');
            navLink.innerHTML = `<a href="#${categoryId}">${category}</a>`;
            floatingNavList.appendChild(navLink);
        }
    };

    /**
     * Shows the item details modal and populates it with data.
     * @param {object} item - The menu item object.
     */
    const showDetailsModal = (item) => {
        detailsImg.src = item.image_url;
        detailsName.textContent = item.name;
        detailsDescription.textContent = item.description;
        detailsPrice.textContent = `$${item.price}`;

        detailsIngredients.innerHTML = '';
        item.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.textContent = ingredient;
            detailsIngredients.appendChild(li);
        });

        let nutritionText = '';
        for(const [key, value] of Object.entries(item.nutritional_value)) {
            nutritionText += `<strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value} `;
        }
        detailsNutrition.textContent = nutritionText.trim();

        if (item.model_url) {
            detailsArBtn.style.display = 'block';
            currentArItem = item;
            const newArBtn = detailsArBtn.cloneNode(true);
            detailsArBtn.parentNode.replaceChild(newArBtn, detailsArBtn);
            newArBtn.addEventListener('click', showArModal);
        } else {
            detailsArBtn.style.display = 'none';
        }

        detailsModal.style.display = 'flex';
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
    const closeDetailsModal = () => detailsModal.style.display = 'none';
    const closeArModal = () => {
        arModal.style.display = 'none';
        modelViewer.src = '';
    };

    detailsCloseBtn.addEventListener('click', closeDetailsModal);
    arCloseBtn.addEventListener('click', closeArModal);

    window.addEventListener('click', (event) => {
        if (event.target === detailsModal) closeDetailsModal();
        if (event.target === arModal) closeArModal();
        if (event.target === aiModal) closeAiModal();
    });

    // --- AI Assistant Logic ---
    const aiModal = document.getElementById('ai-modal');
    const aiBtn = document.getElementById('ai-assistant-btn');
    const aiCloseBtn = aiModal.querySelector('.close-button');
    const aiForm = document.getElementById('ai-questionnaire');
    const aiResultContainer = document.getElementById('ai-result-container');
    const aiResultDiv = document.getElementById('ai-result');

    const openAiModal = () => aiModal.style.display = 'flex';
    const closeAiModal = () => aiModal.style.display = 'none';

    aiBtn.addEventListener('click', openAiModal);
    aiCloseBtn.addEventListener('click', closeAiModal);

    aiForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = {
            people: document.getElementById('ai-people').value,
            favFoods: document.getElementById('ai-fav-foods').value,
            diet: document.querySelector('input[name="ai-diet"]:checked').value,
            courses: [...document.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value),
            budget: document.querySelector('input[name="ai-budget"]:checked').value,
            restrictions: document.getElementById('ai-restrictions').value,
            spice: document.getElementById('ai-spice').value
        };

        const prompt = constructAiPrompt(formData, menuData);
        getAiSuggestion(prompt);
    });

    const constructAiPrompt = (formData, menu) => {
        let prompt = `You are a helpful AI assistant for "The AR Eatery" restaurant. Your only job is to suggest meals from our menu based on the customer's preferences. Do not answer any questions that are not about our food or restaurant. If asked about anything else, politely decline and steer the conversation back to our menu.\n\nHere is our full menu:\n${JSON.stringify(menu, null, 2)}\n\nA customer has the following preferences:\n`;
        prompt += `- Number of people: ${formData.people}\n`;
        prompt += `- Favorite foods or flavors: ${formData.favFoods || 'Not specified'}\n`;
        prompt += `- Dietary preference: ${formData.diet}\n`;
        prompt += `- Desired courses: ${formData.courses.length > 0 ? formData.courses.join(', ') : 'Not specified'}\n`;
        prompt += `- Budget: ${formData.budget}\n`;
        prompt += `- Dietary restrictions: ${formData.restrictions || 'None'}\n`;
        prompt += `- Spice level tolerance: ${formData.spice}\n\n`;
        prompt += `Based on this, please suggest a delicious and suitable meal combination from our menu. Present it in a friendly and appealing way.`;
        return prompt;
    };

    // Replace the old getAiSuggestion function with this:
    const getAiSuggestion = async (prompt) => {
        aiResultDiv.innerHTML = 'Thinking of a suggestion for you...';
        aiResultContainer.style.display = 'block';

        try {
            const response = await fetch('/api/get-suggestion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: prompt }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }

            const data = await response.json();
            aiResultDiv.innerText = data.suggestion;

        } catch (error) {
            console.error('Error fetching AI suggestion:', error);
            aiResultDiv.innerText = 'Sorry, I was unable to get a suggestion. Please try again.';
        }
    };
    // --- Floating Nav Logic ---
    floatingNavBtn.addEventListener('click', () => {
        floatingNavList.classList.toggle('show');
    });

    floatingNavList.addEventListener('click', (event) => {
        if (event.target.tagName === 'A') {
            floatingNavList.classList.remove('show');
        }
    });

    // Initi
    loadMenu();
});
