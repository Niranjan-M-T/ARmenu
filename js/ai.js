document.addEventListener('DOMContentLoaded', () => {
    const aiForm = document.getElementById('ai-questionnaire');
    const aiResultContainer = document.getElementById('ai-result-container');
    const aiResultDiv = document.getElementById('ai-result');
    const dietToggle = document.getElementById('ai-diet-toggle');
    const dietInput = document.getElementById('ai-diet');

    dietToggle.addEventListener('change', () => {
        if (dietToggle.checked) {
            dietInput.value = 'Non-Veg';
        } else {
            dietInput.value = 'Veg';
        }
    });


    let menuData = {};

    const loadMenuData = async () => {
        try {
            const response = await fetch('/menu.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            menuData = await response.json();
        } catch (error) {
            console.error('Error fetching menu data for AI assistant:', error);
            aiResultDiv.innerText = 'Could not load menu data. The AI assistant is currently unavailable.';
        }
    };

    aiForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (Object.keys(menuData).length === 0) {
            aiResultDiv.innerText = 'Menu data is not loaded yet. Please try again in a moment.';
            aiResultContainer.style.display = 'block';
            return;
        }

        const formData = {
            people: document.getElementById('ai-people').value,
            favFoods: document.getElementById('ai-fav-foods').value,
            diet: dietInput.value,
            courses: [...document.querySelectorAll('.checkbox-group-vertical input[type="checkbox"]:checked')].map(cb => cb.value),
            budget: document.querySelector('input[name="ai-budget"]:checked').value,
            restrictions: document.getElementById('ai-restrictions').value,
            spice: document.getElementById('ai-spice').value
        };

        getAiSuggestion(formData);
    });

    const constructAiPrompt = (formData, menu) => {
        const numberOfSuggestions = Math.min(10, Math.max(2, formData.people * 2));

        // Deep clone the menu to avoid modifying the original data
        let filteredMenu = JSON.parse(JSON.stringify(menu));

        // Conditionally remove menu sections based on selected courses
        const selectedCourses = formData.courses || [];
        if (!selectedCourses.includes('Starters')) {
            delete filteredMenu.Starters;
        }
        if (!selectedCourses.includes('Drinks')) {
            delete filteredMenu.Drinks;
        }

        let prompt = `You are a helpful AI assistant for "The AR Eatery" restaurant. Your only job is to suggest meals from our menu based on the customer's preferences. Here is our full menu:\n${JSON.stringify(filteredMenu, null, 2)}\n\nA customer has the following preferences:\n`;

        prompt += `- Number of people: ${formData.people}\n`;
        prompt += `- Favorite foods or flavors: ${formData.favFoods || 'Not specified'}\n`;
        prompt += `- Dietary preference: ${formData.diet}\n`;
        prompt += `- Desired courses: ${formData.courses.length > 0 ? formData.courses.join(', ') : 'Not specified'}\n`;
        prompt += `- Budget: ${formData.budget}\n`;
        prompt += `- Dietary restrictions: ${formData.restrictions || 'None'}\n`;
        prompt += `- Spice level tolerance: ${formData.spice}\n\n`;

        if (formData.randomSeed) {
            prompt += `Please provide a different combination this time.\n`;
        }

        prompt += `Based on this,suggest a meal combination from the menu for the exact number of people who are eating, assuming that one main-course is enough for one person, also assume that one item from the gravy section is enough for 2 people and a gravy item should be accompanied by a bread or rice item. other conditions: if you are suggesting something from the bread section it should always be accompanied by something from the gravy section.Respond with only a single, valid JSON object. The JSON object should have a single key "suggestions", which is an array of objects. Each object in the array should have two keys: "name" (the name of the suggested item) and "reason" (a brief, one-sentence reason for the suggestion). Example: {"suggestions": [{"name": "Chicken Fried Rice", "reason": "A classic non-vegetarian main course that is budget-friendly and matches a medium spice tolerance."}, {"name": "Vegetable Spring Rolls", "reason": "A light and crispy starter to begin the meal."}]}`;

        return prompt;
    };

    const getAiSuggestion = async (formData) => {
        // Clear previous "Try Again" button if it exists
        const existingBtn = aiResultContainer.querySelector('.ai-submit-btn');
        if (existingBtn) {
            existingBtn.remove();
        }

        const prompt = constructAiPrompt(formData, menuData);
        showInteractiveLoader();
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

            let suggestionText = data.suggestion;

            // Clean the suggestion text from markdown
            if (suggestionText.startsWith("```json")) {
                suggestionText = suggestionText.substring(7, suggestionText.length - 3).trim();
            }


            // Try to parse the suggestion as JSON
            try {
                const suggestionJSON = JSON.parse(suggestionText);
                const suggestions = suggestionJSON.suggestions;

                if (suggestions && suggestions.length > 0) {
                    let html = '<ul class="ai-suggestion-list">';
                    suggestions.forEach(item => {
                        html += `<li><strong>${item.name}</strong><p>${item.reason}</p></li>`;
                    });
                    html += '</ul>';
                    aiResultDiv.innerHTML = html;

                    const tryAgainBtn = document.createElement('button');
                    tryAgainBtn.textContent = 'Try Another Combination';
                    tryAgainBtn.classList.add('ai-submit-btn');
                    tryAgainBtn.style.marginTop = '20px';

                    tryAgainBtn.addEventListener('click', () => {
                        getAiSuggestion({
                            ...formData,
                            randomSeed: Math.random()
                        });
                    });

                    aiResultContainer.appendChild(tryAgainBtn);

                } else {
                    throw new Error("Invalid JSON format from AI.");
                }
            } catch (e) {
                console.error("Failed to parse AI response as JSON, displaying raw text.", e);
                // Fallback to displaying raw text if JSON parsing fails
                aiResultDiv.innerText = suggestionText;
            }


        } catch (error) {
            console.error('Error fetching AI suggestion:', error);
            aiResultDiv.innerText = 'Sorry, I was unable to get a suggestion. Please try again.';
        }
    };

    const showInteractiveLoader = () => {
        const loaderTexts = [
            "Analysing the menu...",
            "Understanding your preferences...",
            "Cooking up combinations...",
            "Checking the stock in the kitchen...",
            "Talking to the chef...",
            "Taste testing for you..."
        ];

        let textIndex = 0;
        let charIndex = 0;
        aiResultDiv.innerHTML = '<div id="loader-text" class="loader-text"></div>';
        const loaderTextElement = document.getElementById('loader-text');

        const type = () => {
            if (textIndex < loaderTexts.length) {
                if (charIndex < loaderTexts[textIndex].length) {
                    loaderTextElement.textContent += loaderTexts[textIndex].charAt(charIndex);
                    charIndex++;
                    setTimeout(type, 50);
                } else {
                    setTimeout(() => {
                        textIndex++;
                        charIndex = 0;
                        loaderTextElement.textContent = '';
                        type();
                    }, 1000); // Wait a bit before showing the next text
                }
            } else {
                // Optional: Show a final message or just stop
                loaderTextElement.textContent = "Finalizing suggestions...";
            }
        };

        type();
    };

    // Initial load of menu data
    loadMenuData();
});
