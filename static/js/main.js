/* static/js/main.js */
// Global variables
let currentTab = 'jira';

// Auto-resize textarea
document.getElementById('queryInput').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// Send query on Enter (but allow Shift+Enter for new lines)
document.getElementById('queryInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendQuery();
    }
});

// Tab functionality
function showTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    
    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    
    currentTab = tabName;
}

function useExampleQuery(element) {
    const queryText = element.querySelector('p').textContent;
    document.getElementById('queryInput').value = queryText;
    sendQuery();
}

async function validateOrder() {
    const orderNumber = document.getElementById('orderNumber').value.trim();
    const locationCode = document.getElementById('locationCode').value.trim().toUpperCase();
    const validateBtn = document.querySelector('.validate-button');
    
    if (!orderNumber || !locationCode) {
        alert('Please enter both order number and location code');
        return;
    }
    
    // Show loading state
    validateBtn.disabled = true;
    validateBtn.innerHTML = '🔄 Validating...';
    
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
        validateBtn.disabled = false;
        validateBtn.innerHTML = '🔍 Validate Order';
    }
}

async function analyzeIssueSecurity() {
    const issueKey = document.getElementById('issueKey').value.trim().toUpperCase();
    const analyzeBtn = document.querySelector('.analyze-button');
    
    if (!issueKey) {
        alert('Please enter an issue key');
        return;
    }
    
    // Show loading state
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '🔄 Analyzing...';
    
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
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '🛡️ Analyze Security Impact';
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
                <div class="field-validation ${fieldClass}">
                    <span class="field-name">${field.field_name}</span>
                    <span class="field-status">${fieldIcon}</span>
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
    
    const securityHtml = `
        <div class="security-result">
            <h3 style="color: #0052cc; margin-bottom: 20px;">
                🛡️ Security Analysis: ${result.issue_key}
                ${result.risk_level ? `<span class="risk-level ${riskClass}">${result.risk_level}</span>` : ''}
            </h3>
            
            <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; white-space: pre-line; line-height: 1.6; margin-bottom: 20px;">
                ${result.analysis}
            </div>
            
            ${result.recommendations && result.recommendations.length > 0 ?
                `<div style="background: #fff4e6; padding: 15px; border-radius: 8px;">
                    <strong>🎯 Recommendations:</strong>
                    <ul style="margin-top: 10px; padding-left: 20px;">
                        ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>` : ''
            }
        </div>
    `;
    
    addMessage(securityHtml, false);
}

function addMessage(content, isUser, isLoading = false) {
    const chatContainer = document.getElementById('chatContainer');
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
    if (welcomeMessage) {
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

function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('progress') || statusLower.includes('development')) return 'progress';
    if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('resolved')) return 'done';
    return 'todo';
}

async function sendQuery() {
    const queryInput = document.getElementById('queryInput');
    const sendButton = document.getElementById('sendButton');
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