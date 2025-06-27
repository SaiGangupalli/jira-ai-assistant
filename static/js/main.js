// static/js/main.js - Complete version with table format for order data
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

// Format field names from snake_case to Title Case
function formatFieldName(fieldName) {
    if (!fieldName) return '';
    
    return fieldName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Add this function to get field statistics
function getFieldStatistics(mandatoryFields) {
    const stats = {
        total: mandatoryFields.length,
        mandatory: mandatoryFields.filter(f => f.is_mandatory).length,
        optional: mandatoryFields.filter(f => !f.is_mandatory).length,
        valid: mandatoryFields.filter(f => f.is_valid).length,
        invalid: mandatoryFields.filter(f => !f.is_valid).length,
        filled: mandatoryFields.filter(f => f.field_value !== null && f.field_value !== undefined && f.field_value !== '').length,
        empty: mandatoryFields.filter(f => f.field_value === null || f.field_value === undefined || f.field_value === '').length
    };
    
    stats.completionRate = stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 100;
    
    return stats;
}

async function debugOrderValidationDetailed() {
    console.log('Testing detailed order validation...');
    try {
        const result = await fetch('/api/validate-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_number: 'ORD-001',
                location_code: 'NYC'
            })
        });
        const data = await result.json();
        
        console.log('=== VALIDATION RESULTS ===');
        console.log('Success:', data.success);
        console.log('Valid:', data.is_valid);
        console.log('Missing fields:', data.missing_fields);
        
        if (data.validation_summary) {
            console.log('=== SUMMARY ===');
            console.log('Total fields:', data.validation_summary.total_fields);
            console.log('Mandatory fields:', data.validation_summary.mandatory_fields);
            console.log('Completion:', data.validation_summary.completion_percentage + '%');
        }
        
        if (data.mandatory_fields) {
            console.log('=== FIELD DETAILS ===');
            data.mandatory_fields.forEach(field => {
                console.log(`${field.field_name}: ${field.is_valid ? '✅' : '❌'} (${field.is_mandatory ? 'Mandatory' : 'Optional'}) = ${field.field_value}`);
            });
        }
        
        return data;
    } catch (error) {
        console.error('Debug validation failed:', error);
        return { error: error.message };
    }
}

// Format order data as HTML table
function formatOrderDataAsTable(orderData) {
    if (!orderData || typeof orderData !== 'object') {
        return '<p>No order data available</p>';
    }
    
    // Fields to exclude from display
    const excludeFields = ['password', 'token', 'internal_id', 'hash'];
    
    // Get all fields and filter/sort them
    const fields = Object.keys(orderData)
        .filter(field => !excludeFields.includes(field.toLowerCase()))
        .filter(field => {
            const value = orderData[field];
            return value !== null && value !== undefined && value !== '';
        })
        .sort();
    
    if (fields.length === 0) {
        return '<p>No order data available</p>';
    }
    
    // Field labels mapping
    const fieldLabels = {
        'order_id': 'Order ID',
        'order_number': 'Order Number',
        'customer_id': 'Customer ID',
        'customer_name': 'Customer Name',
        'customer_email': 'Customer Email',
        'customer_phone': 'Customer Phone',
        'order_date': 'Order Date',
        'delivery_address': 'Delivery Address',
        'order_status': 'Order Status',
        'total_amount': 'Total Amount',
        'location_code': 'Location Code',
        'created_date': 'Created Date',
        'updated_date': 'Updated Date'
    };
    
    let tableHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9rem;">
            <thead>
                <tr style="background: linear-gradient(135deg, #0052cc, #2684ff); color: white;">
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600;">Field</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600;">Value</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    fields.forEach((field, index) => {
        const label = fieldLabels[field] || formatFieldName(field);
        let value = orderData[field];
        
        // Apply special formatting based on field type
        if (field.toLowerCase().includes('amount') || field.toLowerCase().includes('price')) {
            value = formatCurrency(value);
        } else if (field.toLowerCase().includes('date')) {
            value = formatDate(value);
        } else if (field.toLowerCase().includes('email') && value) {
            // Keep email as is (already masked by backend if needed)
            value = value;
        } else if (field.toLowerCase().includes('phone') && value) {
            // Keep phone as is (already masked by backend if needed)
            value = value;
        }
        
        // Alternate row colors
        const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
        
        tableHtml += `
            <tr style="background: ${bgColor};">
                <td style="border: 1px solid #e0e6ff; padding: 10px; font-weight: 600; color: #172b4d; vertical-align: top;">${label}</td>
                <td style="border: 1px solid #e0e6ff; padding: 10px; color: #5e6c84; word-break: break-word;">${value}</td>
            </tr>
        `;
    });
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    return tableHtml;
}

function displayValidationResults(result) {
    console.log('Displaying validation results:', result);
    
    const statusClass = result.is_valid ? 'valid' : 'invalid';
    const statusText = result.is_valid ? 'VALID' : 'INVALID';
    const statusIcon = result.is_valid ? '✅' : '❌';
    
    // Create mandatory fields validation table
    let fieldsHtml = '';
    if (result.mandatory_fields) {
        fieldsHtml = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9rem;">
                <thead>
                    <tr style="background: linear-gradient(135deg, #ff8b00, #ffb366); color: white;">
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Field Name</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Type</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Status</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Value</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        result.mandatory_fields.forEach((field, index) => {
            const fieldIcon = field.is_valid ? '✅' : '❌';
            const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
            const statusColor = field.is_valid ? '#00875a' : '#de350b';
            const fieldType = field.is_mandatory ? 'Mandatory' : 'Optional';
            const typeColor = field.is_mandatory ? '#ff8b00' : '#5e6c84';
            
            // Format the field value for display
            let displayValue = 'Empty';
            if (field.field_value !== null && field.field_value !== undefined && field.field_value !== '') {
                displayValue = field.field_value;
                
                // Apply formatting based on field name
                if (field.field_name.toLowerCase().includes('amount') || field.field_name.toLowerCase().includes('price')) {
                    displayValue = formatCurrency(displayValue);
                } else if (field.field_name.toLowerCase().includes('date')) {
                    displayValue = formatDate(displayValue);
                } else if (typeof displayValue === 'string' && displayValue.length > 50) {
                    displayValue = displayValue.substring(0, 50) + '...';
                }
            }
            
            fieldsHtml += `
                <tr style="background: ${bgColor};">
                    <td style="border: 1px solid #e0e6ff; padding: 10px; font-weight: 600;">${formatFieldName(field.field_name)}</td>
                    <td style="border: 1px solid #e0e6ff; padding: 10px; text-align: center;">
                        <span style="background: ${typeColor}20; color: ${typeColor}; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">
                            ${fieldType}
                        </span>
                    </td>
                    <td style="border: 1px solid #e0e6ff; padding: 10px; text-align: center; color: ${statusColor}; font-size: 1.2rem;">
                        ${fieldIcon}
                    </td>
                    <td style="border: 1px solid #e0e6ff; padding: 10px; word-break: break-word; color: ${field.field_value ? '#172b4d' : '#de350b'};">
                        ${displayValue}
                    </td>
                </tr>
            `;
        });
        
        fieldsHtml += `
                </tbody>
            </table>
        `;
    }
    
    // Create validation summary
    let summaryHtml = '';
    if (result.validation_summary) {
        const summary = result.validation_summary;
        summaryHtml = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0;">
                <div style="background: #e3fcef; border: 1px solid #36b37e; border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #00875a;">${summary.total_fields}</div>
                    <div style="font-size: 0.9rem; color: #006644;">Total Fields</div>
                </div>
                <div style="background: #fff4e6; border: 1px solid #ff8b00; border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #ff8b00;">${summary.mandatory_fields}</div>
                    <div style="font-size: 0.9rem; color: #cc6f00;">Mandatory</div>
                </div>
                <div style="background: #e4edff; border: 1px solid #0052cc; border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #0052cc;">${summary.optional_fields}</div>
                    <div style="font-size: 0.9rem; color: #003d99;">Optional</div>
                </div>
                <div style="background: ${summary.completion_percentage === 100 ? '#e3fcef' : '#ffebe6'}; border: 1px solid ${summary.completion_percentage === 100 ? '#36b37e' : '#ff5630'}; border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: ${summary.completion_percentage === 100 ? '#00875a' : '#de350b'};">${summary.completion_percentage}%</div>
                    <div style="font-size: 0.9rem; color: ${summary.completion_percentage === 100 ? '#006644' : '#bf2600'};">Complete</div>
                </div>
            </div>
        `;
    }
    
    // Generate dynamic order data table
    const orderDataHtml = result.order_data ? formatOrderDataAsTable(result.order_data) : '';
    
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
            
            ${summaryHtml}
            
            ${result.missing_fields && result.missing_fields.length > 0 ? 
                `<div style="margin-bottom: 15px; padding: 15px; background: #ffebe6; border-radius: 8px; border-left: 4px solid #ff5630;">
                    <strong style="color: #de350b;">⚠️ Missing Required Fields (${result.missing_fields.length}):</strong><br>
                    <div style="margin-top: 10px; color: #de350b;">
                        ${result.missing_fields.map(field => `<span style="background: #ff563020; padding: 4px 8px; border-radius: 12px; margin: 2px; display: inline-block;">${formatFieldName(field)}</span>`).join('')}
                    </div>
                </div>` : 
                `<div style="margin-bottom: 15px; padding: 15px; background: #e3fcef; border-radius: 8px; border-left: 4px solid #36b37e;">
                    <strong style="color: #00875a;">✅ All Required Fields Complete!</strong>
                </div>`
            }
            
            <div style="margin-bottom: 15px;">
                <strong>📋 Field Validation Details:</strong>
            </div>
            ${fieldsHtml}
            
            ${orderDataHtml ? 
                `<div style="margin-top: 20px; padding: 15px; background: #f8f9ff; border-radius: 8px; border: 1px solid #e0e6ff;">
                    <strong style="color: #0052cc; font-size: 1.1rem;">📊 Complete Order Data:</strong>
                    ${orderDataHtml}
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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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

// Debug function to test order validation
async function debugOrderValidation() {
    console.log('Testing order validation...');
    try {
        const result = await fetch('/api/validate-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_number: 'ORD-001',
                location_code: 'NYC'
            })
        });
        const data = await result.json();
        console.log('Debug validation result:', data);
        return data;
    } catch (error) {
        console.error('Debug validation failed:', error);
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
        formatFieldName,
        formatOrderDataAsTable,
        checkHealth,
        testConnections,
        debugOrderValidation
    };
}
