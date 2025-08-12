document.addEventListener('DOMContentLoaded', () => {
    const aiForm = document.getElementById('ai-questionnaire');
    const aiResultContainer = document.getElementById('ai-result-container');
    const aiResultDiv = document.getElementById('ai-result');

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
        let prompt = `You are a helpful AI assistant for "The AR Eatery" restaurant. Your only job is to suggest meals from our menu based on the customer's preferences. Here is our full menu:\n${JSON.stringify(menu, null, 2)}\n\nA customer has the following preferences:\n`;
        prompt += `- Number of people: ${formData.people}\n`;
        prompt += `- Favorite foods or flavors: ${formData.favFoods || 'Not specified'}\n`;
        prompt += `- Dietary preference: ${formData.diet}\n`;
        prompt += `- Desired courses: ${formData.courses.length > 0 ? formData.courses.join(', ') : 'Not specified'}\n`;
        prompt += `- Budget: ${formData.budget}\n`;
        prompt += `- Dietary restrictions: ${formData.restrictions || 'None'}\n`;
        prompt += `- Spice level tolerance: ${formData.spice}\n\n`;
        prompt += `Based on this, suggest a meal combination from the menu. Respond with only a single, valid JSON object. The JSON object should have a single key "suggestions", which is an array of objects. Each object in the array should have two keys: "name" (the name of the suggested item) and "reason" (a brief, one-sentence reason for the suggestion). Example: {"suggestions": [{"name": "Chicken Fried Rice", "reason": "A classic non-vegetarian main course that is budget-friendly and matches a medium spice tolerance."}]}`;
        return prompt;
    };

    const getAiSuggestion = async (prompt) => {
        aiResultDiv.innerHTML = '<div class="spinner"></div>'; // Show a spinner
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
            const suggestionText = data.suggestion;

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

    // Initial load of menu data
    loadMenuData();
});
