# create_static_files.py - Script to create static files
#!/usr/bin/env python3

import os

def create_directories():
    """Create necessary directories"""
    directories = [
        'static/css',
        'static/js',
        'templates',
        'logs',
        'config',
        'database',
        'services',
        'models',
        'utils'
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def create_static_css():
    """Create CSS file"""
    css_content = """/* static/css/style.css */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.container {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 1200px;
    height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.header {
    background: linear-gradient(135deg, #0052cc, #2684ff);
    color: white;
    padding: 25px 30px;
    text-align: center;
}

.header h1 {
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 8px;
}

.header p {
    opacity: 0.9;
    font-size: 1.1rem;
}

.status-bar {
    background: #e8f5e8;
    border-left: 4px solid #36b37e;
    padding: 15px 30px;
    color: #006644;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
}

.status-indicator {
    width: 12px;
    height: 12px;
    background: #36b37e;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.chat-container {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
    scroll-behavior: smooth;
}

.welcome-message {
    text-align: center;
    color: #5e6c84;
    margin-bottom: 30px;
}

.welcome-message h2 {
    font-size: 1.5rem;
    margin-bottom: 15px;
    color: #172b4d;
}

.feature-tabs {
    display: flex;
    justify-content: center;
    margin: 20px 0;
    gap: 10px;
    flex-wrap: wrap;
}

.tab-button {
    background: #f4f5f7;
    border: 2px solid #dfe1e6;
    padding: 12px 24px;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 600;
    font-size: 0.9rem;
}

.tab-button.active {
    background: #0052cc;
    color: white;
    border-color: #0052cc;
}

.tab-button:hover:not(.active) {
    background: #e4edff;
    border-color: #0052cc;
}

.tab-content {
    margin-top: 20px;
}

.tab-content.hidden {
    display: none;
}

.validation-form, .security-form {
    background: #f8f9ff;
    border: 2px solid #0052cc;
    border-radius: 15px;
    padding: 25px;
    margin: 20px auto;
    max-width: 500px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    font-weight: 600;
    color: #172b4d;
    margin-bottom: 5px;
}

.form-group input, .form-group textarea {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #dfe1e6;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
    font-family: inherit;
}

.form-group input:focus, .form-group textarea:focus {
    outline: none;
    border-color: #0052cc;
}

.btn, .validate-button, .analyze-button {
    background: #0052cc;
    color: white;
    border: none;
    padding: 12px 25px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
}

.btn:hover:not(:disabled), 
.validate-button:hover:not(:disabled), 
.analyze-button:hover:not(:disabled) {
    background: #003d99;
    transform: translateY(-1px);
}

.btn:disabled, 
.validate-button:disabled, 
.analyze-button:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
}

.message {
    margin-bottom: 20px;
    animation: fadeIn 0.3s ease-in;
}

.message.user {
    display: flex;
    justify-content: flex-end;
}

.message.assistant {
    display: flex;
    justify-content: flex-start;
}

.message-content {
    max-width: 70%;
    padding: 15px 20px;
    border-radius: 18px;
    font-size: 0.95rem;
    line-height: 1.5;
}

.message.user .message-content {
    background: #0052cc;
    color: white;
    border-bottom-right-radius: 6px;
}

.message.assistant .message-content {
    background: #f4f5f7;
    color: #172b4d;
    border-bottom-left-radius: 6px;
}

.input-container {
    padding: 25px 30px;
    background: white;
    border-top: 1px solid #e0e6ff;
    display: flex;
    gap: 15px;
    align-items: flex-end;
}

.input-wrapper {
    flex: 1;
    position: relative;
}

#queryInput {
    width: 100%;
    padding: 15px 20px;
    border: 2px solid #dfe1e6;
    border-radius: 25px;
    font-size: 1rem;
    resize: none;
    min-height: 50px;
    max-height: 120px;
    transition: border-color 0.2s;
    font-family: inherit;
}

#queryInput:focus {
    outline: none;
    border-color: #0052cc;
}

.send-button {
    background: #0052cc;
    color: white;
    border: none;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    font-size: 1.2rem;
}

.send-button:hover:not(:disabled) {
    background: #003d99;
    transform: scale(1.05);
}

.send-button:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
}

.validation-result {
    background: white;
    border-radius: 12px;
    padding: 25px;
    margin: 15px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.validation-result.valid {
    border-left: 4px solid #36b37e;
}

.validation-result.invalid {
    border-left: 4px solid #ff5630;
}

.validation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.validation-status {
    padding: 6px 12px;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
}

.status-valid {
    background: #e3fcef;
    color: #00875a;
}

.status-invalid {
    background: #ffebe6;
    color: #de350b;
}

.error-message {
    background: #ffebe6;
    border: 1px solid #ff8f73;
    color: #de350b;
    padding: 15px;
    border-radius: 8px;
    margin: 10px 0;
}

.loading {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #5e6c84;
    font-style: italic;
}

.loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e0e6ff;
    border-top: 2px solid #0052cc;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
    .container {
        height: 100vh;
        border-radius: 0;
    }
    
    .feature-tabs {
        flex-direction: column;
        gap: 5px;
    }
    
    .tab-button {
        font-size: 0.8rem;
        padding: 10px 20px;
    }
    
    .message-content {
        max-width: 85%;
    }
    
    .validation-form, .security-form {
        margin: 10px;
        padding: 20px;
    }
    
    .validation-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
}

@media (max-width: 480px) {
    body {
        padding: 10px;
    }
    
    .header {
        padding: 20px 15px;
    }
    
    .header h1 {
        font-size: 1.5rem;
    }
    
    .chat-container {
        padding: 20px 15px;
    }
    
    .input-container {
        padding: 20px 15px;
    }
}
"""

def create_static_js():
    """Create JavaScript file"""
    js_content = """// static/js/main.js
// Global variables
let currentTab = 'jira';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Auto-resize textarea
    const queryInput = document.getElementById('queryInput');
    if (queryInput) {
        queryInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // Send query on Enter (but allow Shift+Enter for new lines)
        queryInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendQuery();
            }
        });
    }

    // Initialize form inputs with Enter key support
    const orderNumberInput = document.getElementById('orderNumber');
    const locationCodeInput = document.getElementById('locationCode');
    const issueKeyInput = document.getElementById('issueKey');

    if (orderNumberInput && locationCodeInput) {
        [orderNumberInput, locationCodeInput].forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    validateOrder();
                }
            });
        });
    }

    if (issueKeyInput) {
        issueKeyInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                analyzeIssueSecurity();
            }
        });
    }
}

// Tab functionality
function showTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) {
        activeTab.classList.remove('hidden');
    }
    
    currentTab = tabName;
}

function useExampleQuery(element) {
    const queryText = element.querySelector('p').textContent;
    const queryInput = document.getElementById('queryInput');
    if (queryInput) {
        queryInput.value = queryText;
        sendQuery();
    }
}

async function validateOrder() {
    const orderNumber = document.getElementById('orderNumber').value.trim();
    const locationCode = document.getElementById('locationCode').value.trim().toUpperCase();
    const validateBtn = document.querySelector('.validate-button');
    
    if (!orderNumber || !locationCode) {
        showAlert('Please enter both order number and location code');
        return;
    }
    
    // Show loading state
    if (validateBtn) {
        validateBtn.disabled = true;
        validateBtn.innerHTML = '🔄 Validating...';
    }
    
    try {
        const response = await fetch('/api/validate-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                order_number: orderNumber,
                location_code: locationCode
            })
        });

        const result = await response.json();

        if (result.success) {
            displayValidationResults(result);
        } else {
            addMessage(`<div class="error-message">Error: ${result.error}</div>`, false);
        }
        
    } catch (error) {
        addMessage(`<div class="error-message">Network Error: ${error.message}</div>`, false);
    } finally {
        if (validateBtn) {
            validateBtn.disabled = false;
            validateBtn.innerHTML = '🔍 Validate Order';
        }
    }
}

async function analyzeIssueSecurity() {
    const issueKey = document.getElementById('issueKey').value.trim().toUpperCase();
    const analyzeBtn = document.querySelector('.analyze-button');
    
    if (!issueKey) {
        showAlert('Please enter an issue key');
        return;
    }
    
    // Show loading state
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '🔄 Analyzing...';
    }
    
    try {
        const response = await fetch('/api/security-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                issue_key: issueKey
            })
        });

        const result = await response.json();

        if (result.success) {
            displaySecurityResults(result);
        } else {
            addMessage(`<div class="error-message">Error: ${result.error}</div>`, false);
        }
        
    } catch (error) {
        addMessage(`<div class="error-message">Network Error: ${error.message}</div>`, false);
    } finally {
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '🛡️ Analyze Security Impact';
        }
    }
}

function displayValidationResults(result) {
    const statusClass = result.is_valid ? 'valid' : 'invalid';
    const statusText = result.is_valid ? 'VALID' : 'INVALID';
    const statusIcon = result.is_valid ? '✅' : '❌';
    
    let fieldsHtml = '';
    if (result.mandatory_fields) {
        fieldsHtml = result.mandatory_fields.map(field => {
            const fieldClass = field.is_valid ? 'valid' : 'invalid';
            const fieldIcon = field.is_valid ? '✅' : '❌';
            return `
                <div style="margin: 10px 0; padding: 10px; border-radius: 8px; background: ${field.is_valid ? '#e3fcef' : '#ffebe6'}; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600;">${field.field_name}</span>
                    <span>${fieldIcon}</span>
                </div>
            `;
        }).join('');
    }
    
    const validationHtml = `
        <div class="validation-result ${statusClass}">
            <div class="validation-header">
                <h3>${statusIcon} Order Validation: ${result.order_number}</h3>
                <span class="validation-status status-${result.is_valid ? 'valid' : 'invalid'}">
                    ${statusText}
                </span>
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>Location:</strong> ${result.location_code}
            </div>
            
            ${result.missing_fields && result.missing_fields.length > 0 ? 
                `<div style="margin-bottom: 15px; color: #de350b;">
                    <strong>Missing Fields:</strong> ${result.missing_fields.join(', ')}
                </div>` : ''
            }
            
            <div style="margin-bottom: 15px;">
                <strong>Mandatory Fields Status:</strong>
            </div>
            ${fieldsHtml}
            
            ${result.order_data ? 
                `<div style="margin-top: 20px; padding: 15px; background: #f8f9ff; border-radius: 8px;">
                    <strong>Order Details:</strong><br>
                    Customer: ${result.order_data.customer_name || 'N/A'}<br>
                    Status: ${result.order_data.order_status || 'N/A'}<br>
                    Amount: ${result.order_data.total_amount ? ' + result.order_data.total_amount : 'N/A'}<br>
                    Date: ${result.order_data.order_date || 'N/A'}
                </div>` : ''
            }
        </div>
    `;
    
    addMessage(validationHtml, false);
}

function displaySecurityResults(result) {
    const riskClass = result.risk_level ? `risk-${result.risk_level.toLowerCase()}` : 'risk-medium';
    const riskColors = {
        'risk-low': '#36b37e',
        'risk-medium': '#ff8b00',
        'risk-high': '#ff5630',
        'risk-critical': '#de350b'
    };
    const riskColor = riskColors[riskClass] || '#5e6c84';
    
    const securityHtml = `
        <div style="background: white; border-left: 4px solid #0052cc; border-radius: 12px; padding: 25px; margin: 15px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
            <h3 style="color: #0052cc; margin-bottom: 20px;">
                🛡️ Security Analysis: ${result.issue_key}
                ${result.risk_level ? 
                    `<span style="display: inline-block; padding: 4px 12px; border-radius: 15px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; margin-left: 10px; background: ${riskColor}20; color: ${riskColor};">${result.risk_level}</span>` : ''
                }
            </h3>
            
            <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; white-space: pre-line; line-height: 1.6; margin-bottom: 20px;">
                ${result.analysis}
            </div>
            
            ${result.recommendations && result.recommendations.length > 0 ?
                `<div style="background: #fff4e6; padding: 15px; border-radius: 8px;">
                    <strong>🎯 Recommendations:</strong>
                    <ul style="margin-top: 10px; padding-left: 20px;">
                        ${result.recommendations.map(rec => `<li style="margin: 5px 0;">${rec}</li>`).join('')}
                    </ul>
                </div>` : ''
            }
        </div>
    `;
    
    addMessage(securityHtml, false);
}

function addMessage(content, isUser, isLoading = false) {
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) return null;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    
    if (isLoading) {
        messageDiv.innerHTML = `
            <div class="message-content loading">
                <div class="loading-spinner"></div>
                Processing your request...
            </div>
        `;
        messageDiv.id = 'loadingMessage';
    } else {
        messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
    }
    
    // Remove welcome message if it exists
    const welcomeMessage = chatContainer.querySelector('.welcome-message');
    if (welcomeMessage && !isLoading) {
        welcomeMessage.remove();
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return messageDiv;
}

function removeLoadingMessage() {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

function formatJiraResponse(data) {
    if (!data.issues || data.issues.length === 0) {
        return '<div class="error-message">No issues found for your query.</div>';
    }

    let html = `<div style="margin-bottom: 15px;"><strong>Found ${data.total} issue(s):</strong></div>`;
    
    data.issues.slice(0, 10).forEach(issue => {
        const fields = issue.fields;
        
        html += `
            <div style="background: white; border: 1px solid #dfe1e6; border-radius: 12px; padding: 20px; margin: 10px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                    <span style="background: #0052cc; color: white; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 0.9rem;">${issue.key}</span>
                    <span style="padding: 4px 12px; border-radius: 15px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; ${getStatusStyle(fields.status.name)}">${fields.status.name}</span>
                </div>
                <div style="font-size: 1.1rem; font-weight: 600; color: #172b4d; margin-bottom: 10px;">${fields.summary}</div>
                <div style="display: flex; flex-wrap: wrap; gap: 15px; font-size: 0.9rem; color: #5e6c84;">
                    <span>📋 ${fields.issuetype.name}</span>
                    ${fields.assignee ? `<span>👤 ${fields.assignee.displayName}</span>` : '<span>👤 Unassigned</span>'}
                    ${fields.priority ? `<span>⚡ ${fields.priority.name}</span>` : ''}
                    <span>📅 ${new Date(fields.created).toLocaleDateString()}</span>
                </div>
                ${fields.description ? `<div style="margin-top: 10px; color: #5e6c84; font-size: 0.9rem;">${fields.description.substring(0, 200)}${fields.description.length > 200 ? '...' : ''}</div>` : ''}
            </div>
        `;
    });

    if (data.total > 10) {
        html += `<div style="text-align: center; color: #5e6c84; margin-top: 15px;">... and ${data.total - 10} more issues</div>`;
    }

    return html;
}

function getStatusStyle(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('progress') || statusLower.includes('development')) {
        return 'background: #fff4e6; color: #ff8b00;';
    }
    if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('resolved')) {
        return 'background: #e3fcef; color: #00875a;';
    }
    return 'background: #ddd; color: #666;';
}

async function sendQuery() {
    const queryInput = document.getElementById('queryInput');
    const sendButton = document.getElementById('sendButton');
    
    if (!queryInput || !sendButton) return;
    
    const query = queryInput.value.trim();
    
    if (!query) return;

    // Add user message
    addMessage(query, true);
    queryInput.value = '';
    queryInput.style.height = 'auto';
    
    // Show loading
    sendButton.disabled = true;
    const loadingMessage = addMessage('', false, true);

    try {
        const response = await fetch('/api/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query
            })
        });

        const result = await response.json();

        removeLoadingMessage();

        if (result.success) {
            addMessage(formatJiraResponse(result.data), false);
        } else {
            addMessage(`<div class="error-message">Error: ${result.error}</div>`, false);
        }
        
    } catch (error) {
        removeLoadingMessage();
        addMessage(`<div class="error-message">Network Error: ${error.message}</div>`, false);
    } finally {
        sendButton.disabled = false;
    }
}

function showAlert(message) {
    // Simple alert function - can be enhanced with custom modal
    alert(message);
}

// Utility functions
function formatCurrency(amount) {
    if (typeof amount === 'number') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    return amount;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return dateString;
    }
}
"""

def create_template_html():
    """Create HTML template"""
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jira AI Assistant with Oracle DB</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Jira AI Assistant</h1>
            <p>AI-powered Jira queries with Oracle DB order validation</p>
        </div>

        <div class="status-bar">
            <div class="status-indicator"></div>
            <span>✅ Connected to Jira & Oracle DB - Ready to process your queries</span>
        </div>

        <div class="main-content">
            <div class="chat-container" id="chatContainer">
                <div class="welcome-message">
                    <h2>Welcome to your Enhanced Jira AI Assistant! 👋</h2>
                    <p>Your Jira and Oracle DB connections are configured and ready. Choose your operation:</p>
                    
                    <div class="feature-tabs">
                        <button class="tab-button active" onclick="showTab('jira')">
                            📋 Jira Queries
                        </button>
                        <button class="tab-button" onclick="showTab('validation')">
                            🔍 Order Validation
                        </button>
                        <button class="tab-button" onclick="showTab('security')">
                            🛡️ Security Analysis
                        </button>
                    </div>

                    <div class="tab-content" id="jira-tab">
                        <h3>Jira Query Examples</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; margin-top: 20px;">
                            <div style="background: #f4f5f7; padding: 15px; border-radius: 12px; cursor: pointer; transition: all 0.2s; border-left: 4px solid #0052cc;" onclick="useExampleQuery(this)" onmouseover="this.style.background='#e4edff'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#f4f5f7'; this.style.transform='translateY(0)'">
                                <h4 style="color: #0052cc; margin-bottom: 5px; font-size: 0.9rem;">📋 Find Stories by Assignee</h4>
                                <p>Show me all stories assigned to John Smith</p>
                            </div>
                            <div style="background: #f4f5f7; padding: 15px; border-radius: 12px; cursor: pointer; transition: all 0.2s; border-left: 4px solid #0052cc;" onclick="useExampleQuery(this)" onmouseover="this.style.background='#e4edff'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#f4f5f7'; this.style.transform='translateY(0)'">
                                <h4 style="color: #0052cc; margin-bottom: 5px; font-size: 0.9rem;">🐛 Search by Issue Type</h4>
                                <p>Find all bugs in the DEV project</p>
                            </div>
                            <div style="background: #f4f5f7; padding: 15px; border-radius: 12px; cursor: pointer; transition: all 0.2s; border-left: 4px solid #0052cc;" onclick="useExampleQuery(this)" onmouseover="this.style.background='#e4edff'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#f4f5f7'; this.style.transform='translateY(0)'">
                                <h4 style="color: #0052cc; margin-bottom: 5px; font-size: 0.9rem;">📈 Status Filtering</h4>
                                <p>What are the open epics for this sprint?</p>
                            </div>
                            <div style="background: #f4f5f7; padding: 15px; border-radius: 12px; cursor: pointer; transition: all 0.2s; border-left: 4px solid #0052cc;" onclick="useExampleQuery(this)" onmouseover="this.style.background='#e4edff'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#f4f5f7'; this.style.transform='translateY(0)'">
                                <h4 style="color: #0052cc; margin-bottom: 5px; font-size: 0.9rem;">📅 Date Range Queries</h4>
                                <p>Show me stories created in the last week</p>
                            </div>
                        </div>
                    </div>

                    <div class="tab-content hidden" id="validation-tab">
                        <h3>Order Validation</h3>
                        <div class="validation-form">
                            <div class="form-group">
                                <label for="orderNumber">Order Number:</label>
                                <input type="text" id="orderNumber" placeholder="e.g., ORD-123456, ORDER_789" maxlength="20">
                            </div>
                            <div class="form-group">
                                <label for="locationCode">Location Code:</label>
                                <input type="text" id="locationCode" placeholder="e.g., NYC, LA, CHI" maxlength="5">
                            </div>
                            <button class="validate-button" onclick="validateOrder()">
                                🔍 Validate Order
                            </button>
                        </div>
                    </div>

                    <div class="tab-content hidden" id="security-tab">
                        <h3>Security Impact Analysis</h3>
                        <div class="security-form">
                            <div class="form-group">
                                <label for="issueKey">Issue Key:</label>
                                <input type="text" id="issueKey" placeholder="e.g., PROJ-123, DEV-456" maxlength="20">
                            </div>
                            <button class="analyze-button" onclick="analyzeIssueSecurity()">
                                🛡️ Analyze Security Impact
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="input-container">
                <div class="input-wrapper">
                    <textarea id="queryInput" placeholder="Ask me about your Jira issues, validate orders, or analyze security... Type your question here!" rows="1"></textarea>
                </div>
                <button class="send-button" onclick="sendQuery()" id="sendButton">
                    ➤
                </button>
            </div>
        </div>
    </div>

    <script src="{{ url_for('static', filename='js/main.js') }}"></script>
</body>
</html>"""

def create_init_files():
    """Create __init__.py files for Python packages"""
    init_dirs = ['config', 'database', 'services', 'models', 'utils']
    for directory in init_dirs:
        init_file = os.path.join(directory, '__init__.py')
        with open(init_file, 'w') as f:
            f.write(f'# {directory} package\n')
        print(f"✅ Created {init_file}")

def main():
    """Main function to create all static files"""
    print("🚀 Creating static files and directories...")
    
    # Create directories
    create_directories()
    
    # Create CSS file
    with open('static/css/style.css', 'w') as f:
        f.write(css_content)
    print("✅ Created static/css/style.css")
    
    # Create JavaScript file
    with open('static/js/main.js', 'w') as f:
        f.write(js_content)
    print("✅ Created static/js/main.js")
    
    # Create HTML template
    with open('templates/index.html', 'w') as f:
        f.write(html_content)
    print("✅ Created templates/index.html")
    
    # Create __init__.py files
    create_init_files()
    
    print("\n🎉 All static files created successfully!")
    print("📁 File structure:")
    print("   ├── static/")
    print("   │   ├── css/style.css")
    print("   │   └── js/main.js")
    print("   ├── templates/")
    print("   │   └── index.html")
    print("   └── Package directories with __init__.py files")
    print("\n🚀 You can now run the application with: python app.py")

if __name__ == "__main__":
    main()

# Run this script to create all static files:
# python create_static_files.py
