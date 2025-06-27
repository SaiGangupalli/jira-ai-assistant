// static/js/main.js
// Global variables
let currentTab = 'jira';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('Initializing Jira AI Assistant...');
    
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

    console.log('App initialized successfully');
}

// Tab functionality
function showTab(tabName) {
    console.log('Switching to tab:', tabName);
    
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
    console.log('Starting order validation...');
    
    const orderNumber = document.getElementById('orderNumber');
    const locationCode = document.getElementById('locationCode');
    const validateBtn = document.querySelector('.validate-button');
    
    if (!orderNumber || !locationCode) {
        console.error('Order number or location code input not found');
        return;
    }
    
    const orderValue = orderNumber.value.trim();
    const locationValue = locationCode.value.trim().toUpperCase();
    
    if (!orderValue || !locationValue) {
        showAlert('Please enter both order number and location code');
        return;
    }
    
    // Show loading state
    if (validateBtn) {
        validateBtn.disabled = true;
        validateBtn.innerHTML = '🔄 Validating...';
    }
    
    try {
        console.log('Sending validation request for:', orderValue, locationValue);
        
        const response = await fetch('/api/validate-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                order_number: orderValue,
                location_code: locationValue
            })
        });

        const result = await response.json();
        console.log('Validation result:', result);

        if (result.success) {
            displayValidationResults(result);
        } else {
            addMessage(`<div class="error-message">Error: ${result.error}</div>`, false);
        }
        
    } catch (error) {
        console.error('Validation error:', error);
        addMessage(`<div class="error-message">Network Error: ${error.message}</div>`, false);
    } finally {
        if (validateBtn) {
            validateBtn.disabled = false;
            validateBtn.innerHTML = '🔍 Validate Order';
        }
    }
}

async function analyzeIssueSecurity() {
    console.log('Starting security analysis...');
    
    const issueKeyInput = document.getElementById('issueKey');
    const analyzeBtn = document.querySelector('.analyze-button');
    
    if (!issueKeyInput) {
        console.error('Issue key input not found');
        return;
    }
    
    const issueKey = issueKeyInput.value.trim().toUpperCase();
    
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
        console.log('Sending security analysis request for:', issueKey);
        
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
        console.log('Security analysis result:', result);

        if (result.success) {
            displaySecurityResults(result);
        } else {
            addMessage(`<div class="error-message">Error: ${result.error}</div>`, false);
        }
        
    } catch (error) {
        console.error('Security analysis error:', error);
        addMessage(`<div class="error-message">Network Error: ${error.message}</div>`, false);
    } finally {
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '🛡️ Analyze Security Impact';
        }
    }
}

function displayValidationResults(result) {
    console.log('Displaying validation results:', result);
    
    const statusClass = result.is_valid ? 'valid' : 'invalid';
    const statusText = result.is_valid ? 'VALID' : 'INVALID';
    const statusIcon = result.is_valid ? '✅' : '❌';
    
    let fieldsHtml = '';
    if (result.mandatory_fields) {
        fieldsHtml = result.mandatory_fields.map(field => {
            const fieldClass = field.is_valid ? 'valid' : 'invalid';
            const fieldIcon = field.is_valid ? '✅' : '❌';
            const bgColor = field.is_valid ? '#e3fcef' : '#ffebe6';
            return `
                <div style="margin: 10px 0; padding: 10px; border-radius: 8px; background: ${bgColor}; display: flex; justify-content: space-between; align-items: center;">
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
                    Amount: ${result.order_data.total_amount ? formatCurrency(result.order_data.total_amount) : 'N/A'}<br>
                    Date: ${formatDate(result.order_data.order_date)}
                </div>` : ''
            }
        </div>
    `;
    
    addMessage(validationHtml, false);
}

function displaySecurityResults(result) {
    console.log('Displaying security results:', result);
    
    const riskClass = result.risk_level ? `risk-${result.risk_level.toLowerCase()}` : 'risk-medium';
    const riskColors = {
        'risk-low': '#36b37e',
        'risk-medium': '#ff8b00',
        'risk-high': '#ff5630',
        'risk-critical': '#de350b'
    };
    const riskColor = riskColors[riskClass] || '#5e6c84';
    
    const securityHtml = `
        <div class="security-result">
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
    if (!chatContainer) {
        console.error('Chat container not found');
        return null;
    }
    
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
            <div class="jira-issue">
                <div class="issue-header">
                    <span class="issue-key">${issue.key}</span>
                    <span class="issue-status status-${getStatusClass(fields.status.name)}">${fields.status.name}</span>
                </div>
                <div class="issue-title">${fields.summary}</div>
                <div class="issue-meta">
                    <span>📋 ${fields.issuetype.name}</span>
                    ${fields.assignee ? `<span>👤 ${fields.assignee.displayName}</span>` : '<span>👤 Unassigned</span>'}
                    ${fields.priority ? `<span>⚡ ${fields.priority.name}</span>` : ''}
                    <span>📅 ${formatDate(fields.created)}</span>
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

function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('progress') || statusLower.includes('development')) {
        return 'progress';
    }
    if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('resolved')) {
        return 'done';
    }
    return 'todo';
}

async function sendQuery() {
    console.log('Sending query...');
    
    const queryInput = document.getElementById('queryInput');
    const sendButton = document.getElementById('sendButton');
    
    if (!queryInput || !sendButton) {
        console.error('Query input or send button not found');
        return;
    }
    
    const query = queryInput.value.trim();
    
    if (!query) {
        console.log('Empty query, skipping');
        return;
    }

    console.log('Query:', query);

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
        console.log('Query result:', result);

        removeLoadingMessage();

        if (result.success) {
            addMessage(formatJiraResponse(result.data), false);
        } else {
            addMessage(`<div class="error-message">Error: ${result.error}</div>`, false);
        }
        
    } catch (error) {
        console.error('Query error:', error);
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
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}

// Health check function (can be called from console or added to UI)
async function checkHealth() {
    try {
        const response = await fetch('/api/health');
        const result = await response.json();
        console.log('Health check result:', result);
        return result;
    } catch (error) {
        console.error('Health check failed:', error);
        return { status: 'error', error: error.message };
    }
}

// Test connections function
async function testConnections() {
    try {
        const response = await fetch('/api/test-connections');
        const result = await response.json();
        console.log('Connection test result:', result);
        return result;
    } catch (error) {
        console.error('Connection test failed:', error);
        return { error: error.message };
    }
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showTab,
        validateOrder,
        analyzeIssueSecurity,
        sendQuery,
        formatCurrency,
        formatDate,
        checkHealth,
        testConnections
    };
}
