// Enhanced HealthAI Application with Markdown Support

class HealthAI {
    constructor() {
        this.currentTheme = this.getPreferredTheme();
        this.apiConfig = {
            endpoint: 'http://127.0.0.1:5001/aiapi',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer zFk10B1Kyp7m1W9x',
                'Content-Type': 'application/json'
            }
        };
        
        this.init();
    }

    init() {
        this.setTheme(this.currentTheme);
        this.bindEvents();
        this.setupMarkdown();
    }

    getPreferredTheme() {
        // Check localStorage first, then system preference
        const saved = localStorage.getItem('healthai-theme');
        if (saved) return saved;
        
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    setTheme(theme) {
        this.currentTheme = theme;
        
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-color-scheme', 'dark');
        } else {
            document.documentElement.setAttribute('data-color-scheme', 'light');
        }
        
        // Save preference
        localStorage.setItem('healthai-theme', theme);
        
        // Update theme toggle icons
        this.updateThemeIcons();
    }

    updateThemeIcons() {
        const sunIcon = document.querySelector('.sun-icon');
        const moonIcon = document.querySelector('.moon-icon');
        
        if (this.currentTheme === 'dark') {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setupMarkdown() {
        // Configure marked.js if available
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: false,
                mangle: false
            });
        }
    }

    bindEvents() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle?.addEventListener('click', () => this.toggleTheme());

        // Assessment form
        const assessmentForm = document.getElementById('assessmentForm');
        assessmentForm?.addEventListener('submit', (e) => this.handleAssessment(e));

        // New assessment button
        const newAssessmentBtn = document.getElementById('newAssessmentBtn');
        newAssessmentBtn?.addEventListener('click', () => this.startNewAssessment());

        // Error modal events
        const closeError = document.getElementById('closeError');
        const closeErrorBtn = document.getElementById('closeErrorBtn');
        const errorModal = document.getElementById('errorModal');
        
        closeError?.addEventListener('click', () => this.hideError());
        closeErrorBtn?.addEventListener('click', () => this.hideError());
        
        errorModal?.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hideError();
            }
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('healthai-theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Auto-resize textarea
        const symptomsInput = document.getElementById('symptomsInput');
        symptomsInput?.addEventListener('input', this.autoResizeTextarea);
    }

    autoResizeTextarea(e) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
    }

    async handleAssessment(e) {
        e.preventDefault();
        
        const age = document.getElementById('ageInput').value.trim();
        const symptoms = document.getElementById('symptomsInput').value.trim();

        // Enhanced validation
        if (!this.validateInput(age, symptoms)) {
            return;
        }

        // Show loading state
        this.showLoading();
        
        try {
            const response = await this.makeAPICall(age, symptoms);
            this.displayResponse(response);
        } catch (error) {
            console.error('API Error:', error);
            this.handleAPIError(error);
        } finally {
            this.hideLoading();
        }
    }

    validateInput(age, symptoms) {
        // Age validation
        const ageNum = parseInt(age);
        if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
            this.showError('Please enter a valid age between 1 and 120 years.');
            this.focusElement('ageInput');
            return false;
        }

        // Symptoms validation
        if (!symptoms || symptoms.length < 10) {
            this.showError('Please provide more detailed symptoms (at least 10 characters). The more information you provide, the better the assessment.');
            this.focusElement('symptomsInput');
            return false;
        }

        if (symptoms.length > 2000) {
            this.showError('Please keep your symptom description under 2000 characters.');
            this.focusElement('symptomsInput');
            return false;
        }

        return true;
    }

    async makeAPICall(age, symptoms) {
        const requestBody = {
            symptoms: `Age: ${age}. ${symptoms}`
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

        try {
            const response = await fetch(this.apiConfig.endpoint, {
                method: this.apiConfig.method,
                headers: this.apiConfig.headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Extract response based on expected format
            if (data.response) {
                return data.response;
            } else if (typeof data === 'string') {
                return data;
            } else if (data.message) {
                return data.message;
            } else {
                throw new Error('Invalid response format from API');
            }
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error('Unable to connect to the AI service. Please check your connection and try again.');
            } else {
                throw error;
            }
        }
    }

    displayResponse(responseText) {
        const responseSection = document.getElementById('responseSection');
        const responseContent = document.getElementById('responseContent');
        
        if (!responseText || typeof responseText !== 'string') {
            throw new Error('Invalid response received from AI service');
        }

        // Parse markdown if marked.js is available
        let htmlContent;
        if (typeof marked !== 'undefined') {
            try {
                htmlContent = marked.parse(responseText);
            } catch (markdownError) {
                console.warn('Markdown parsing failed, using plain text:', markdownError);
                htmlContent = this.formatPlainText(responseText);
            }
        } else {
            htmlContent = this.formatPlainText(responseText);
        }

        // Set the content
        responseContent.innerHTML = htmlContent;
        
        // Show the response section with animation
        responseSection.classList.remove('hidden');
        
        // Smooth scroll to response
        setTimeout(() => {
            responseSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
        }, 150);
    }

    displaySampleResponse() {
        const sampleResponse = `# Health Assessment Results

Based on your symptoms and age, here's what our AI analysis suggests:

## **Preliminary Assessment**

Your symptoms appear to be consistent with a **common viral respiratory infection** or **seasonal illness**. The combination of symptoms you've described suggests your body is actively fighting off an infection.

## **Immediate Recommendations**

### **Self-Care Measures**
• **Rest and Recovery**: Get plenty of rest and avoid strenuous activities
• **Hydration**: Drink plenty of water, herbal teas, and warm broths
• **Symptom Management**: Consider over-the-counter medications as needed
• **Environment**: Use a humidifier or breathe steam from a hot shower
• **Nutrition**: Eat light, nutritious foods to support your immune system

### **Monitoring Guidelines**
• Track your temperature regularly throughout the day
• Note any changes in symptom severity or new symptoms
• Keep a symptom diary to discuss with healthcare providers if needed

## **When to Seek Medical Attention**

**Contact a healthcare provider immediately if you experience:**

• **Breathing difficulties** or persistent shortness of breath
• **High fever** exceeding 103°F (39.4°C) or fever lasting more than 3 days
• **Severe symptoms** such as chest pain, persistent vomiting, or severe headache
• **Worsening condition** or symptoms that persist beyond 7-10 days
• **Dehydration signs** such as dizziness, dry mouth, or reduced urination

## **Expected Recovery Timeline**

Most viral infections resolve within **5-10 days** with proper rest and care. You should start feeling better within the first few days of implementing these recommendations.

---

*This assessment is generated by AI technology and is intended for informational purposes only. It should not be considered a substitute for professional medical advice, diagnosis, or treatment.*`;

        this.displayResponse(sampleResponse);
    }

    formatPlainText(text) {
        // Fallback formatting for when markdown parser isn't available
        return text
            // Convert double asterisks to bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Convert single asterisks to italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Convert bullet points
            .replace(/^[•·-]\s/gm, '• ')
            // Convert line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            // Wrap in paragraphs
            .replace(/^(.*)$/s, '<p>$1</p>')
            // Clean up empty paragraphs
            .replace(/<p><\/p>/g, '')
            // Handle headers (lines that end with colon and are bold)
            .replace(/<p><strong>([^<]+):<\/strong><\/p>/g, '<h3>$1:</h3>');
    }

    handleAPIError(error) {
        let shouldShowSample = true;
        let errorMessage = 'Unable to connect to the AI service. Showing sample response for demonstration purposes.';
        
        if (error.message.includes('timed out')) {
            errorMessage = 'The request took too long to complete. Showing sample response for demonstration purposes.';
        } else if (error.message.includes('connect')) {
            errorMessage = 'Unable to connect to the AI service. Showing sample response for demonstration purposes.';
        } else if (error.message.includes('HTTP 4')) {
            errorMessage = 'There was an issue with your request. Showing sample response for demonstration purposes.';
        } else if (error.message.includes('HTTP 5')) {
            errorMessage = 'The AI service is temporarily unavailable. Showing sample response for demonstration purposes.';
        }
        
        // Always show sample response when API fails
        this.displaySampleResponse();
        
        // Show informational message about the sample response
        setTimeout(() => {
            this.showError(errorMessage, 'Information');
        }, 500);
    }

    showLoading() {
        const button = document.getElementById('assessBtn');
        const buttonContent = button.querySelector('.btn-content');
        const loadingSpinner = button.querySelector('.loading-spinner');
        
        buttonContent.style.opacity = '0';
        loadingSpinner.classList.remove('hidden');
        button.disabled = true;
        
        // Add loading class for additional styling
        button.classList.add('loading');
    }

    hideLoading() {
        const button = document.getElementById('assessBtn');
        const buttonContent = button.querySelector('.btn-content');
        const loadingSpinner = button.querySelector('.loading-spinner');
        
        buttonContent.style.opacity = '1';
        loadingSpinner.classList.add('hidden');
        button.disabled = false;
        
        // Remove loading class
        button.classList.remove('loading');
    }

    showError(message, title = 'Error') {
        const modal = document.getElementById('errorModal');
        const titleElement = modal.querySelector('.modal-title');
        const messageElement = document.getElementById('errorMessage');
        const iconElement = titleElement.querySelector('.modal-icon');
        
        // Update title
        titleElement.childNodes[titleElement.childNodes.length - 1].textContent = title;
        
        // Update icon based on title
        if (title === 'Information') {
            iconElement.innerHTML = `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>`;
        } else {
            iconElement.innerHTML = `<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>`;
        }
        
        // Update message
        messageElement.textContent = message;
        
        // Show modal
        modal.classList.remove('hidden');
        
        // Focus the close button for accessibility
        setTimeout(() => {
            document.getElementById('closeErrorBtn').focus();
        }, 150);
    }

    hideError() {
        const modal = document.getElementById('errorModal');
        modal.classList.add('hidden');
    }

    startNewAssessment() {
        // Clear form
        document.getElementById('assessmentForm').reset();
        
        // Hide response section
        document.getElementById('responseSection').classList.add('hidden');
        
        // Reset textarea height
        const symptomsInput = document.getElementById('symptomsInput');
        if (symptomsInput) {
            symptomsInput.style.height = 'auto';
        }
        
        // Focus on age input
        this.focusElement('ageInput');
        
        // Scroll to form
        document.querySelector('.assessment-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    focusElement(elementId) {
        setTimeout(() => {
            const element = document.getElementById(elementId);
            if (element) {
                element.focus();
                if (element.select) element.select();
            }
        }, 100);
    }
}

// Enhanced error handling for the entire application
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new HealthAI();
    } catch (error) {
        console.error('Failed to initialize HealthAI application:', error);
        
        // Fallback error display
        const fallbackError = document.createElement('div');
        fallbackError.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center;">
                <h3 style="color: #e74c3c; margin: 0 0 10px 0;">Application Error</h3>
                <p style="margin: 0; color: #666;">Failed to initialize the HealthAI application. Please refresh the page.</p>
                <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 16px; background: #3498db; 
                                                           color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Refresh Page
                </button>
            </div>
        `;
        document.body.appendChild(fallbackError);
    }
});

// Add some helpful debugging information
console.log('HealthAI application loaded successfully');
console.log('Markdown support:', typeof marked !== 'undefined' ? 'Available' : 'Not available');