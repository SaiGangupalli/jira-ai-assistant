// static/js/main.js - Complete version with table format for order data
// Global variables
let currentTab = 'jira';
let currentLogType = null;

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

// Tab functionality with input field visibility control
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
    
    // Control input container visibility based on tab
    const inputContainer = document.querySelector('.input-container');
    if (inputContainer) {
        if (tabName === 'validation' || tabName === 'security') {
            // Hide input field for Order Validation and Security Analysis
            inputContainer.style.display = 'none';
            console.log('Input field hidden for tab:', tabName);
        } else {
            // Show input field for Jira Queries and other tabs
            inputContainer.style.display = 'flex';
            console.log('Input field shown for tab:', tabName);
        }
    }
    
    currentTab = tabName;
}

function useExampleQuery(element) {
    const queryText = element.querySelector('p').textContent;
    const queryInput = document.getElementById('queryInput');
    if (queryInput) {
        queryInput.value = queryText;
        
        // Switch to jira tab if not already there
        if (currentTab !== 'jira') {
            showTab('jira');
        }
        
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

function addBackButton(context, extraInfo = '') {
    let buttonText = '';
    let icon = '';
    
    switch(context) {
        case 'validation':
            buttonText = 'Back to Order Validation';
            icon = '🔍';
            break;
        case 'security':
            buttonText = 'Back to Security Analysis';
            icon = '🛡️';
            break;
        case 'logs':
            buttonText = 'Back to Log Analysis';
            icon = '📊';
            break;
        case 'jira':
            buttonText = 'Back to Home';
            icon = '🏠';
            break;
        default:
            buttonText = 'Back';
            icon = '←';
    }
    
    if (extraInfo) {
        buttonText += ` ${extraInfo}`;
    }
    
    return `
        <div style="margin-bottom: 20px;">
            <button onclick="goBackToForm('${context}')" 
                    style="background: #333333; color: #ffffff; border: 1px solid #555; padding: 10px 20px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; transition: all 0.2s;"
                    onmouseover="this.style.background='#444444'; this.style.transform='translateY(-1px)'"
                    onmouseout="this.style.background='#333333'; this.style.transform='translateY(0)'">
                <span>${icon}</span>
                <span>${buttonText}</span>
            </button>
        </div>
    `;
}

function goBackToForm(context) {
    // Clear the chat container and restore the welcome message
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        // Create the welcome message content
        const welcomeContent = `
            <div class="welcome-message">
                <h2>Welcome to your Enhanced Jira AI Assistant! 👋</h2>
                <p>Your Jira, Oracle DB, and Elasticsearch connections are configured and ready. Choose your operation:</p>
                
                <div class="feature-tabs">
                    <button class="tab-button ${context === 'jira' ? 'active' : ''}" onclick="showTab('jira')">
                        📋 Jira Queries
                    </button>
                    <button class="tab-button ${context === 'validation' ? 'active' : ''}" onclick="showTab('validation')">
                        🔍 Order Validation
                    </button>
                    <button class="tab-button ${context === 'security' ? 'active' : ''}" onclick="showTab('security')">
                        🛡️ Security Analysis
                    </button>
                    <button class="tab-button ${context === 'logs' ? 'active' : ''}" onclick="showTab('logs')">
                        📊 Log Analysis
                    </button>
                </div>

                <div class="tab-content ${context === 'jira' ? '' : 'hidden'}" id="jira-tab">
                    <h3>Jira Query Examples</h3>
                    <div class="example-queries">
                        <div class="example-query" onclick="useExampleQuery(this)">
                            <h4>📋 Find Stories by Assignee</h4>
                            <p>Show me all stories assigned to John Smith</p>
                        </div>
                        <div class="example-query" onclick="useExampleQuery(this)">
                            <h4>🐛 Search by Issue Type</h4>
                            <p>Find all bugs in the DEV project</p>
                        </div>
                        <div class="example-query" onclick="useExampleQuery(this)">
                            <h4>📈 Status Filtering</h4>
                            <p>What are the open epics for this sprint?</p>
                        </div>
                        <div class="example-query" onclick="useExampleQuery(this)">
                            <h4>📅 Date Range Queries</h4>
                            <p>Show me stories created in the last week</p>
                        </div>
                    </div>
                </div>

                <div class="tab-content ${context === 'validation' ? '' : 'hidden'}" id="validation-tab">
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

                <div class="tab-content ${context === 'security' ? '' : 'hidden'}" id="security-tab">
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

                <div class="tab-content ${context === 'logs' ? '' : 'hidden'}" id="logs-tab">
                    <h3>Log Analysis Options</h3>
                    <div class="log-analysis-options">
                        <div class="log-option" onclick="showLogForm('3d-secure')">
                            <div class="log-option-icon">🔐</div>
                            <h4>3D Secure</h4>
                            <p>Analyze 3D Secure authentication logs and transactions</p>
                        </div>
                        <div class="log-option" onclick="showLogForm('enforce-xml6')">
                            <div class="log-option-icon">📋</div>
                            <h4>Enforce XML6</h4>
                            <p>Review XML6 enforcement logs and compliance data</p>
                        </div>
                        <div class="log-option" onclick="showLogForm('full-auth')">
                            <div class="log-option-icon">🔑</div>
                            <h4>Full Auth</h4>
                            <p>Examine full authentication flow logs and results</p>
                        </div>
                        <div class="log-option" onclick="showLogForm('payment-gateway')">
                            <div class="log-option-icon">💳</div>
                            <h4>Payment Gateway</h4>
                            <p>Analyze payment gateway transaction logs</p>
                        </div>
                        <div class="log-option" onclick="showLogForm('fraud-detection')">
                            <div class="log-option-icon">🚨</div>
                            <h4>Fraud Detection</h4>
                            <p>Review fraud detection system logs and alerts</p>
                        </div>
                        <div class="log-option" onclick="showLogForm('api-gateway')">
                            <div class="log-option-icon">🌐</div>
                            <h4>API Gateway</h4>
                            <p>Monitor API gateway access and performance logs</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        chatContainer.innerHTML = welcomeContent;
        
        // Make sure the correct tab is shown and input visibility is set
        showTab(context);
        
        // Clear form inputs and query input based on context
        if (context === 'validation') {
            const orderNumber = document.getElementById('orderNumber');
            const locationCode = document.getElementById('locationCode');
            if (orderNumber) orderNumber.value = '';
            if (locationCode) locationCode.value = '';
        } else if (context === 'security') {
            const issueKey = document.getElementById('issueKey');
            if (issueKey) issueKey.value = '';
        } else if (context === 'jira') {
            const queryInput = document.getElementById('queryInput');
            if (queryInput) {
                queryInput.value = '';
                queryInput.style.height = 'auto';
            }
        }
        // Note: 'logs' context doesn't need form clearing since it shows option selection
        
        // Update current tab
        currentTab = context;
    }
}

// Update the addBottomActionButton function to handle logs context:
function addBottomActionButton(context, resultInfo = '') {
    let buttonText = '';
    let icon = '';
    let action = '';
    
    switch(context) {
        case 'validation':
            buttonText = 'Validate Another Order';
            icon = '🔍';
            action = `goBackToForm('validation')`;
            break;
        case 'security':
            buttonText = 'Analyze Another Issue';
            icon = '🛡️';
            action = `goBackToForm('security')`;
            break;
        case 'logs':
            buttonText = 'Search More Logs';
            icon = '📊';
            action = `goBackToForm('logs')`;
            break;
        case 'jira':
            buttonText = 'Ask Another Question';
            icon = '💬';
            action = `goBackToForm('jira')`;
            break;
        default:
            buttonText = 'Continue';
            icon = '→';
            action = `goBackToForm('jira')`;
    }
    
    return `
        <div style="margin-top: 25px; text-align: center; border-top: 1px solid #444; padding-top: 20px;">
            <button onclick="${action}" 
                    style="background: #000000; color: #ffffff; border: 1px solid #333; padding: 12px 24px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 600; transition: all 0.2s; margin-right: 10px;"
                    onmouseover="this.style.background='#333333'; this.style.transform='translateY(-2px)'"
                    onmouseout="this.style.background='#000000'; this.style.transform='translateY(0)'">
                <span>${icon}</span>
                <span>${buttonText}</span>
            </button>
            
            ${context !== 'jira' ? `
                <button onclick="goBackToForm('jira')" 
                        style="background: #333333; color: #ffffff; border: 1px solid #555; padding: 12px 24px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 600; transition: all 0.2s;"
                        onmouseover="this.style.background='#444444'; this.style.transform='translateY(-2px)'"
                        onmouseout="this.style.background='#333333'; this.style.transform='translateY(0)'">
                    <span>🏠</span>
                    <span>Back to Home</span>
                </button>
            ` : ''}
        </div>
    `;
}

// Updated displayValidationResults with back button
function displayValidationResults(result) {
    console.log('Displaying validation results:', result);
    
    const statusClass = result.is_valid ? 'valid' : 'invalid';
    const statusText = result.is_valid ? 'VALID' : 'INVALID';
    const statusIcon = result.is_valid ? '✅' : '❌';
    
    // Create comprehensive mandatory fields validation table with ALL data
    let fieldsHtml = '';
    if (result.mandatory_fields) {
        fieldsHtml = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.9rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">
                <thead>
                    <tr style="background: linear-gradient(135deg, #333333, #555555); color: white;">
                        <th style="border: 1px solid #555; padding: 12px; text-align: left; font-weight: 600; width: 25%;">Field Name</th>
                        <th style="border: 1px solid #555; padding: 12px; text-align: center; font-weight: 600; width: 10%;">Type</th>
                        <th style="border: 1px solid #555; padding: 12px; text-align: center; font-weight: 600; width: 8%;">Status</th>
                        <th style="border: 1px solid #555; padding: 12px; text-align: left; font-weight: 600; width: 57%;">Value</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        result.mandatory_fields.forEach((field, index) => {
            const fieldIcon = field.is_valid ? '✅' : '❌';
            const bgColor = index % 2 === 0 ? '#2d2d30' : '#1a1a1a';
            const statusColor = field.is_valid ? '#00ff88' : '#ff4444';
            const fieldType = field.is_mandatory ? 'Required' : 'Optional';
            const typeColor = field.is_mandatory ? '#ffaa00' : '#888888';
            
            // Format the field value for display with enhanced formatting
            let displayValue = '';
            let valueStyle = '';
            
            if (field.field_value === null || field.field_value === undefined || field.field_value === '') {
                displayValue = '<em style="color: #ff4444; font-style: italic;">Empty / Not Set</em>';
                valueStyle = 'color: #ff4444;';
            } else {
                let rawValue = field.field_value;
                
                // Apply special formatting based on field name/type
                if (field.field_name.toLowerCase().includes('amount') || field.field_name.toLowerCase().includes('price')) {
                    displayValue = formatCurrency(rawValue);
                    valueStyle = 'color: #00ff88; font-weight: 600;';
                } else if (field.field_name.toLowerCase().includes('date')) {
                    displayValue = formatDate(rawValue);
                    valueStyle = 'color: #88ccff; font-weight: 500;';
                } else if (field.field_name.toLowerCase().includes('email')) {
                    displayValue = rawValue;
                    valueStyle = 'color: #ffaa88; font-family: monospace;';
                } else if (field.field_name.toLowerCase().includes('phone')) {
                    displayValue = rawValue;
                    valueStyle = 'color: #ffaa88; font-family: monospace;';
                } else if (field.field_name.toLowerCase().includes('id')) {
                    displayValue = rawValue;
                    valueStyle = 'color: #cccccc; font-family: monospace; font-weight: 600;';
                } else if (field.field_name.toLowerCase().includes('status')) {
                    displayValue = `<span style="background: #333; padding: 4px 8px; border-radius: 12px; color: #00ff88; font-weight: 600; text-transform: uppercase;">${rawValue}</span>`;
                    valueStyle = '';
                } else if (field.field_name.toLowerCase().includes('address')) {
                    displayValue = rawValue;
                    valueStyle = 'color: #cccccc; line-height: 1.4;';
                } else if (field.field_name.toLowerCase().includes('code')) {
                    displayValue = `<span style="background: #1a1a1a; padding: 4px 8px; border-radius: 6px; color: #ffaa00; font-family: monospace; font-weight: 600;">${rawValue}</span>`;
                    valueStyle = '';
                } else {
                    // Default formatting for other fields
                    displayValue = rawValue;
                    valueStyle = 'color: #ffffff;';
                    
                    // Truncate very long text values
                    if (typeof displayValue === 'string' && displayValue.length > 100) {
                        displayValue = displayValue.substring(0, 100) + '<span style="color: #888;">... <em>(truncated)</em></span>';
                    }
                }
            }
            
            fieldsHtml += `
                <tr style="background: ${bgColor}; transition: background-color 0.2s;" onmouseover="this.style.background='#333333'" onmouseout="this.style.background='${bgColor}'">
                    <td style="border: 1px solid #444; padding: 12px; font-weight: 600; color: #ffffff; vertical-align: top;">
                        ${formatFieldName(field.field_name)}
                        ${field.field_name !== formatFieldName(field.field_name) ? 
                            `<br><small style="color: #888; font-weight: normal; font-family: monospace;">${field.field_name}</small>` : ''
                        }
                    </td>
                    <td style="border: 1px solid #444; padding: 12px; text-align: center; vertical-align: middle;">
                        <span style="background: ${typeColor}20; color: ${typeColor}; padding: 6px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; white-space: nowrap;">
                            ${fieldType}
                        </span>
                    </td>
                    <td style="border: 1px solid #444; padding: 12px; text-align: center; color: ${statusColor}; font-size: 1.3rem; vertical-align: middle;">
                        ${fieldIcon}
                    </td>
                    <td style="border: 1px solid #444; padding: 12px; word-break: break-word; vertical-align: top; ${valueStyle}">
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
    
    // Create enhanced validation summary with more details
    let summaryHtml = '';
    if (result.validation_summary) {
        const summary = result.validation_summary;
        const completionColor = summary.completion_percentage === 100 ? '#00ff88' : 
                               summary.completion_percentage >= 80 ? '#ffaa00' : '#ff4444';
        
        summaryHtml = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin: 20px 0;">
                <div style="background: linear-gradient(135deg, #1a1a1a, #2d2d30); border: 1px solid #444; border-radius: 12px; padding: 15px; text-align: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">
                    <div style="font-size: 1.8rem; font-weight: bold; color: #ffffff;">${summary.total_fields}</div>
                    <div style="font-size: 0.9rem; color: #cccccc; margin-top: 4px;">Total Fields</div>
                </div>
                <div style="background: linear-gradient(135deg, #332200, #554400); border: 1px solid #ffaa00; border-radius: 12px; padding: 15px; text-align: center; box-shadow: 0 2px 8px rgba(255, 170, 0, 0.2);">
                    <div style="font-size: 1.8rem; font-weight: bold; color: #ffaa00;">${summary.mandatory_fields}</div>
                    <div style="font-size: 0.9rem; color: #cc8800; margin-top: 4px;">Required</div>
                </div>
                <div style="background: linear-gradient(135deg, #1a1a2d, #2d2d40); border: 1px solid #888; border-radius: 12px; padding: 15px; text-align: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">
                    <div style="font-size: 1.8rem; font-weight: bold; color: #888888;">${summary.optional_fields}</div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 4px;">Optional</div>
                </div>
                <div style="background: linear-gradient(135deg, ${completionColor}15, ${completionColor}25); border: 1px solid ${completionColor}; border-radius: 12px; padding: 15px; text-align: center; box-shadow: 0 2px 8px rgba(${completionColor === '#00ff88' ? '0, 255, 136' : completionColor === '#ffaa00' ? '255, 170, 0' : '255, 68, 68'}, 0.2);">
                    <div style="font-size: 1.8rem; font-weight: bold; color: ${completionColor};">${summary.completion_percentage}%</div>
                    <div style="font-size: 0.9rem; color: ${completionColor}; margin-top: 4px;">Complete</div>
                </div>
                <div style="background: linear-gradient(135deg, #001a00, #002d00); border: 1px solid #00ff88; border-radius: 12px; padding: 15px; text-align: center; box-shadow: 0 2px 8px rgba(0, 255, 136, 0.2);">
                    <div style="font-size: 1.8rem; font-weight: bold; color: #00ff88;">${summary.filled_mandatory_fields}</div>
                    <div style="font-size: 0.9rem; color: #00cc66; margin-top: 4px;">Filled</div>
                </div>
                <div style="background: linear-gradient(135deg, #2d0000, #330000); border: 1px solid #ff4444; border-radius: 12px; padding: 15px; text-align: center; box-shadow: 0 2px 8px rgba(255, 68, 68, 0.2);">
                    <div style="font-size: 1.8rem; font-weight: bold; color: #ff4444;">${summary.missing_mandatory_fields}</div>
                    <div style="font-size: 0.9rem; color: #cc3333; margin-top: 4px;">Missing</div>
                </div>
            </div>
        `;
    }
    
    // Enhanced missing fields display
    let missingFieldsHtml = '';
    if (result.missing_fields && result.missing_fields.length > 0) {
        missingFieldsHtml = `
            <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #2d0000, #330000); border-radius: 12px; border-left: 4px solid #ff4444; box-shadow: 0 2px 8px rgba(255, 68, 68, 0.2);">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <span style="font-size: 1.5rem; margin-right: 10px;">⚠️</span>
                    <strong style="color: #ff4444; font-size: 1.1rem;">Missing Required Fields (${result.missing_fields.length})</strong>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${result.missing_fields.map(field => 
                        `<span style="background: #ff444420; border: 1px solid #ff4444; color: #ff6666; padding: 8px 12px; border-radius: 20px; font-size: 0.9rem; font-weight: 500; display: inline-flex; align-items: center;">
                            <span style="margin-right: 6px;">❌</span>
                            ${formatFieldName(field)}
                        </span>`
                    ).join('')}
                </div>
            </div>
        `;
    } else {
        missingFieldsHtml = `
            <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #001a00, #002d00); border-radius: 12px; border-left: 4px solid #00ff88; box-shadow: 0 2px 8px rgba(0, 255, 136, 0.2);">
                <div style="display: flex; align-items: center;">
                    <span style="font-size: 1.5rem; margin-right: 10px;">✅</span>
                    <strong style="color: #00ff88; font-size: 1.1rem;">All Required Fields Complete!</strong>
                </div>
                <p style="color: #00cc66; margin-top: 8px; margin-bottom: 0;">Every mandatory field has been filled with valid data.</p>
            </div>
        `;
    }
    
    const validationHtml = `
        ${addBackButton('validation')}
        
        <div class="validation-result ${statusClass}">
            <div class="validation-header">
                <h3 style="display: flex; align-items: center; gap: 10px;">
                    ${statusIcon} 
                    <span>Order Validation: ${result.order_number}</span>
                </h3>
                <span class="validation-status status-${result.is_valid ? 'valid' : 'invalid'}">
                    ${statusText}
                </span>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #444;">
                <strong style="color: #ffffff;">📍 Location:</strong> 
                <span style="color: #ffaa00; font-weight: 600; margin-left: 8px;">${result.location_code}</span>
            </div>
            
            ${summaryHtml}
            
            ${missingFieldsHtml}
            
            <div style="margin-bottom: 15px;">
                <h4 style="color: #ffffff; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                    <span>📋</span>
                    <span>Complete Field Validation & Data</span>
                </h4>
                <p style="color: #cccccc; font-size: 0.9rem; margin-bottom: 15px;">
                    All order fields with their validation status and current values:
                </p>
            </div>
            ${fieldsHtml}
        </div>
        
        ${addBottomActionButton('validation')}
    `;
    
    addMessage(validationHtml, false);
}

// Updated displaySecurityResults with back button
function displaySecurityResults(result) {
    console.log('Displaying security results:', result);
    
    const riskClass = result.risk_level ? `risk-${result.risk_level.toLowerCase()}` : 'risk-medium';
    const riskColors = {
        'risk-low': '#00ff88',
        'risk-medium': '#ffaa00',
        'risk-high': '#ff4444',
        'risk-critical': '#ff0000'
    };
    const riskColor = riskColors[riskClass] || '#888888';
    
    const securityHtml = `
        ${addBackButton('security')}
        
        <div class="security-result">
            <h3 style="color: #ffffff; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <span>🛡️</span>
                <span>Security Analysis: ${result.issue_key}</span>
                ${result.risk_level ? 
                    `<span style="display: inline-block; padding: 6px 12px; border-radius: 15px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; margin-left: 10px; background: ${riskColor}20; color: ${riskColor}; border: 1px solid ${riskColor};">${result.risk_level}</span>` : ''
                }
            </h3>
            
            <div style="background: #1a1a1a; border: 1px solid #444; padding: 20px; border-radius: 12px; white-space: pre-line; line-height: 1.6; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">
                ${result.analysis}
            </div>
            
            ${result.recommendations && result.recommendations.length > 0 ?
                `<div style="background: linear-gradient(135deg, #332200, #554400); border: 1px solid #ffaa00; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(255, 170, 0, 0.2);">
                    <strong style="color: #ffaa00; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; font-size: 1.1rem;">
                        <span>🎯</span>
                        <span>Recommendations:</span>
                    </strong>
                    <ul style="margin: 0; padding-left: 20px; color: #ffffff;">
                        ${result.recommendations.map(rec => `<li style="margin: 8px 0; line-height: 1.4;">${rec}</li>`).join('')}
                    </ul>
                </div>` : ''
            }
        </div>
        
        ${addBottomActionButton('security')}
    `;
    
    addMessage(securityHtml, false);
}

// Enhanced field name formatting
function formatFieldName(fieldName) {
    if (!fieldName) return '';
    
    // Handle special cases
    const specialNames = {
        'order_id': 'Order ID',
        'customer_id': 'Customer ID',
        'order_number': 'Order Number',
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
    
    if (specialNames[fieldName.toLowerCase()]) {
        return specialNames[fieldName.toLowerCase()];
    }
    
    return fieldName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
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

// Updated formatJiraResponse with back button
function formatJiraResponse(data) {
    if (!data.issues || data.issues.length === 0) {
        return `
            ${addBackButton('jira')}
            <div class="error-message">No issues found for your query.</div>
            ${addBottomActionButton('jira')}
        `;
    }

    let html = `
        ${addBackButton('jira')}
        
        <div style="margin-bottom: 20px; padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #444;">
            <strong style="color: #00ff88; font-size: 1.1rem;">🎯 Search Results: Found ${data.total} issue(s)</strong>
            ${data.total > 10 ? `<p style="color: #cccccc; margin-top: 8px; margin-bottom: 0;">Showing first 10 results</p>` : ''}
        </div>
    `;
    
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
                ${fields.description ? `<div style="margin-top: 10px; color: #cccccc; font-size: 0.9rem; line-height: 1.4;">${fields.description.substring(0, 200)}${fields.description.length > 200 ? '...' : ''}</div>` : ''}
            </div>
        `;
    });

    if (data.total > 10) {
        html += `
            <div style="text-align: center; margin: 20px 0; padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #444;">
                <span style="color: #ffaa00; font-weight: 600;">... and ${data.total - 10} more issues</span>
                <p style="color: #cccccc; margin-top: 8px; margin-bottom: 0; font-size: 0.9rem;">Refine your search query to see more specific results</p>
            </div>
        `;
    }
    
    // Add bottom action buttons
    html += addBottomActionButton('jira', `Found ${data.total} issues`);

    return html;
}

function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('progress') || statusLower.includes('development') || statusLower.includes('review')) {
        return 'progress';
    }
    if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('resolved') || statusLower.includes('complete')) {
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

    // Check if this is a security/fraud analysis command
    if (isSecurityAnalysisCommand(query)) {
        console.log('Detected security analysis command');
        await processSecurityAnalysisInJiraTab(query);
        return;
    }

    // Continue with regular Jira query processing
    await processRegularJiraQuery(query);
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

// Helper function to add message without back button (for internal use)
function addMessageSimple(content, isUser, isLoading = false) {
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
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return messageDiv;
}

// Show log analysis form for specific log type
function showLogForm(logType) {
    console.log('Showing log form for:', logType);
    currentLogType = logType;
    
    // Log type configurations
    const logConfigs = {
        '3d-secure': {
            title: '3D Secure Log Analysis',
            icon: '🔐',
            description: 'Analyze 3D Secure authentication logs and transactions',
            sessionLabel: 'Session ID',
            sessionPlaceholder: 'e.g., 3ds_sess_12345abcde',
            additionalFields: [
                { name: 'transaction_id', label: 'Transaction ID', placeholder: 'txn_123456789', required: false },
                { name: 'merchant_id', label: 'Merchant ID', placeholder: 'MERCH_001', required: false }
            ]
        },
        'enforce-xml6': {
            title: 'Enforce XML6 Log Analysis',
            icon: '📋',
            description: 'Review XML6 enforcement logs and compliance data',
            sessionLabel: 'Session ID',
            sessionPlaceholder: 'e.g., xml6_sess_abcde12345',
            additionalFields: [
                { name: 'xml_version', label: 'XML Version', placeholder: '6.0', required: false },
                { name: 'validation_status', label: 'Validation Status', placeholder: 'VALID', required: false }
            ]
        },
        'full-auth': {
            title: 'Full Authentication Log Analysis',
            icon: '🔑',
            description: 'Examine full authentication flow logs and results',
            sessionLabel: 'Session ID',
            sessionPlaceholder: 'e.g., auth_sess_xyz789',
            additionalFields: [
                { name: 'user_id', label: 'User ID', placeholder: 'user_12345', required: false },
                { name: 'auth_method', label: 'Auth Method', placeholder: 'PASSWORD', required: false }
            ]
        },
        'payment-gateway': {
            title: 'Payment Gateway Log Analysis',
            icon: '💳',
            description: 'Analyze payment gateway transaction logs',
            sessionLabel: 'Session ID',
            sessionPlaceholder: 'e.g., pay_sess_abc123',
            additionalFields: [
                { name: 'payment_id', label: 'Payment ID', placeholder: 'pay_123456789', required: false },
                { name: 'gateway', label: 'Gateway', placeholder: 'STRIPE', required: false }
            ]
        },
        'fraud-detection': {
            title: 'Fraud Detection Log Analysis',
            icon: '🚨',
            description: 'Review fraud detection system logs and alerts',
            sessionLabel: 'Session ID',
            sessionPlaceholder: 'e.g., fraud_sess_def456',
            additionalFields: [
                { name: 'risk_score', label: 'Risk Score', placeholder: '75', required: false },
                { name: 'decision', label: 'Decision', placeholder: 'APPROVE', required: false }
            ]
        },
        'api-gateway': {
            title: 'API Gateway Log Analysis',
            icon: '🌐',
            description: 'Monitor API gateway access and performance logs',
            sessionLabel: 'Session ID',
            sessionPlaceholder: 'e.g., api_sess_ghi789',
            additionalFields: [
                { name: 'api_endpoint', label: 'API Endpoint', placeholder: '/api/v1/payments', required: false },
                { name: 'http_method', label: 'HTTP Method', placeholder: 'POST', required: false }
            ]
        }
    };
    
    const config = logConfigs[logType];
    if (!config) {
        showAlert('Unknown log type selected');
        return;
    }
    
    // Build additional fields HTML
    let additionalFieldsHtml = '';
    config.additionalFields.forEach(field => {
        additionalFieldsHtml += `
            <div class="log-form-group">
                <label for="${field.name}">${field.label}:</label>
                <input type="text" 
                       id="${field.name}" 
                       placeholder="${field.placeholder}"
                       ${field.required ? 'required' : ''}>
            </div>
        `;
    });
    
    const logFormHtml = `
        ${addBackButton('logs')}
        
        <div class="log-form">
            <h3>
                <span>${config.icon}</span>
                <span>${config.title}</span>
            </h3>
            
            <p style="color: #cccccc; margin-bottom: 25px; line-height: 1.4;">
                ${config.description}
            </p>
            
            <div class="log-form-group">
                <label for="sessionId">${config.sessionLabel}:</label>
                <input type="text" 
                       id="sessionId" 
                       placeholder="${config.sessionPlaceholder}"
                       required>
            </div>
            
            ${additionalFieldsHtml}
            
            <div class="log-form-row">
                <div class="log-form-group">
                    <label for="timeRange">Time Range:</label>
                    <select id="timeRange">
                        <option value="1h">Last 1 Hour</option>
                        <option value="6h">Last 6 Hours</option>
                        <option value="24h" selected>Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                </div>
                
                <div class="log-form-group">
                    <label for="logLevel">Log Level:</label>
                    <select id="logLevel">
                        <option value="all">All Levels</option>
                        <option value="error">Error</option>
                        <option value="warn">Warning</option>
                        <option value="info" selected>Info</option>
                        <option value="debug">Debug</option>
                    </select>
                </div>
            </div>
            
            <div class="log-form-group">
                <label for="maxResults">Max Results:</label>
                <select id="maxResults">
                    <option value="50">50 Results</option>
                    <option value="100" selected>100 Results</option>
                    <option value="250">250 Results</option>
                    <option value="500">500 Results</option>
                </select>
            </div>
            
            <button class="log-search-button" onclick="searchLogs('${logType}')">
                <span>${config.icon}</span>
                <span>Search Logs</span>
            </button>
        </div>
    `;
    
    addMessage(logFormHtml, false);
}

// Search logs function
async function searchLogs(logType) {
    console.log('Searching logs for:', logType);
    
    const sessionId = document.getElementById('sessionId');
    const timeRange = document.getElementById('timeRange');
    const logLevel = document.getElementById('logLevel');
    const maxResults = document.getElementById('maxResults');
    const searchBtn = document.querySelector('.log-search-button');
    
    if (!sessionId || !sessionId.value.trim()) {
        showAlert('Please enter a Session ID');
        return;
    }
    
    // Get additional form fields
    const filters = {
        session_id: sessionId.value.trim(),
        time_range: timeRange ? timeRange.value : '24h',
        log_level: logLevel ? logLevel.value : 'all',
        max_results: maxResults ? parseInt(maxResults.value) : 100
    };
    
    // Add log-type specific filters
    const logConfigs = {
        '3d-secure': ['transaction_id', 'merchant_id'],
        'enforce-xml6': ['xml_version', 'validation_status'],
        'full-auth': ['user_id', 'auth_method'],
        'payment-gateway': ['payment_id', 'gateway'],
        'fraud-detection': ['risk_score', 'decision'],
        'api-gateway': ['api_endpoint', 'http_method']
    };
    
    const additionalFields = logConfigs[logType] || [];
    additionalFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field && field.value.trim()) {
            filters[fieldName] = field.value.trim();
        }
    });
    
    // Show loading state
    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<span>🔄</span><span>Searching...</span>';
    }
    
    try {
        console.log('Sending log search request:', { log_type: logType, filters });
        
        const response = await fetch('/api/search-logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                log_type: logType,
                ...filters
            })
        });

        const result = await response.json();
        console.log('Log search result:', result);

        if (result.success) {
            displayLogResults(result);
        } else {
            addMessage(`<div class="error-message">Error: ${result.error}</div>`, false);
        }
        
    } catch (error) {
        console.error('Log search error:', error);
        addMessage(`<div class="error-message">Network Error: ${error.message}</div>`, false);
    } finally {
        if (searchBtn) {
            searchBtn.disabled = false;
            const config = getLogConfig(logType);
            searchBtn.innerHTML = `<span>${config.icon}</span><span>Search Logs</span>`;
        }
    }
}

function displayLogResults(result) {
    console.log('Displaying log results:', result);
    
    const logConfig = getLogConfig(result.log_type);
    
    // Create comprehensive log results display
    let logResultsHtml = `
        ${addBackButton('logs')}
        
        <div class="log-results">
            <div class="log-results-header">
                <h3>
                    <span>${logConfig.icon}</span>
                    <span>${logConfig.display_name} Results</span>
                </h3>
                <div class="log-results-count">${result.total_hits} logs found</div>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #444;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; font-size: 0.9rem;">
                    <div><strong style="color: #00ff88;">Session ID:</strong> <span style="color: #ffffff; font-family: monospace;">${result.session_id}</span></div>
                    <div><strong style="color: #ffaa00;">Time Range:</strong> <span style="color: #ffffff;">${formatTimeRange(result.filters_applied.time_range)}</span></div>
                    <div><strong style="color: #88ccff;">Log Level:</strong> <span style="color: #ffffff;">${result.filters_applied.log_level || 'All'}</span></div>
                    <div><strong style="color: #ff88cc;">Search Time:</strong> <span style="color: #ffffff;">${result.search_time_ms}ms</span></div>
                </div>
            </div>
    `;
    
    if (result.total_hits === 0) {
        logResultsHtml += `
            <div style="text-align: center; padding: 40px; background: #1a1a1a; border-radius: 12px; border: 1px solid #444;">
                <div style="font-size: 3rem; margin-bottom: 15px;">🔍</div>
                <h3 style="color: #ffffff; margin-bottom: 10px;">No Logs Found</h3>
                <p style="color: #cccccc; margin-bottom: 20px;">No logs were found matching your search criteria.</p>
                <div style="color: #888888; font-size: 0.9rem;">
                    <p>Try adjusting your search parameters:</p>
                    <ul style="text-align: left; display: inline-block; margin-top: 10px;">
                        <li>Extend the time range</li>
                        <li>Change the log level filter</li>
                        <li>Verify the session ID format</li>
                        <li>Remove optional filters</li>
                    </ul>
                </div>
            </div>
        `;
    } else {
        // Display log entries
        logResultsHtml += '<div class="log-entries">';
        
        result.results.forEach((logEntry, index) => {
            logResultsHtml += formatLogEntry(logEntry, result.log_type, index);
        });
        
        logResultsHtml += '</div>';
        
        // Add pagination info if needed
        if (result.total_hits > result.results.length) {
            logResultsHtml += `
                <div style="text-align: center; margin: 20px 0; padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #444;">
                    <span style="color: #ffaa00; font-weight: 600;">
                        Showing ${result.results.length} of ${result.total_hits} total logs
                    </span>
                    <p style="color: #cccccc; margin-top: 8px; margin-bottom: 0; font-size: 0.9rem;">
                        Increase max results or refine search criteria to see more
                    </p>
                </div>
            `;
        }
    }
    
    logResultsHtml += `
        </div>
        ${addBottomActionButton('logs', `Found ${result.total_hits} logs`)}
    `;
    
    addMessage(logResultsHtml, false);
}

function formatLogEntry(logEntry, logType, index) {
    const levelClass = logEntry.level ? logEntry.level.toLowerCase() : 'info';
    const timestamp = formatLogTimestamp(logEntry.timestamp);
    
    let specificFieldsHtml = '';
    
    // Add log-type specific fields
    switch(logType) {
        case '3d-secure':
            specificFieldsHtml = format3DSecureFields(logEntry);
            break;
        case 'full-auth':
            specificFieldsHtml = formatFullAuthFields(logEntry);
            break;
        case 'payment-gateway':
            specificFieldsHtml = formatPaymentGatewayFields(logEntry);
            break;
        case 'fraud-detection':
            specificFieldsHtml = formatFraudDetectionFields(logEntry);
            break;
        case 'api-gateway':
            specificFieldsHtml = formatApiGatewayFields(logEntry);
            break;
        case 'enforce-xml6':
            specificFieldsHtml = formatEnforceXmlFields(logEntry);
            break;
    }
    
    const hasRawData = logEntry.raw_data && Object.keys(logEntry.raw_data).length > 0;
    
    return `
        <div class="log-entry" id="log-entry-${index}">
            <div class="log-entry-header">
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <div class="log-timestamp">${timestamp}</div>
                    <div class="log-level ${levelClass}">${logEntry.level || 'INFO'}</div>
                    ${logEntry.component ? `<div class="log-component" style="background: #333; color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem;">${logEntry.component}</div>` : ''}
                </div>
                ${logEntry.session_id ? `<div class="log-session-id">${logEntry.session_id}</div>` : ''}
            </div>
            
            ${logEntry.message ? `
                <div class="log-message">${escapeHtml(logEntry.message)}</div>
            ` : ''}
            
            ${specificFieldsHtml}
            
            ${hasRawData ? `
                <div style="margin-top: 15px;">
                    <button class="log-expand-toggle" onclick="toggleLogDetails('${index}')">
                        <span id="toggle-text-${index}">Show Raw Data</span>
                    </button>
                    <div class="log-details" id="log-details-${index}" style="display: none;">
                        <div class="log-json">${JSON.stringify(logEntry.raw_data, null, 2)}</div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Log-type specific field formatters
function format3DSecureFields(logEntry) {
    let fieldsHtml = '';
    
    if (logEntry.transaction_id || logEntry.card_number || logEntry.auth_status || logEntry.response_code || logEntry.merchant_id) {
        fieldsHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 10px 0; padding: 15px; background: #2d2d30; border-radius: 8px;">';
        
        if (logEntry.transaction_id) {
            fieldsHtml += `<div><strong style="color: #88ccff;">Transaction:</strong> <span style="color: #fff; font-family: monospace;">${logEntry.transaction_id}</span></div>`;
        }
        if (logEntry.card_number) {
            fieldsHtml += `<div><strong style="color: #ffaa88;">Card:</strong> <span style="color: #fff; font-family: monospace;">${logEntry.card_number}</span></div>`;
        }
        if (logEntry.auth_status) {
            const statusColor = logEntry.auth_status === 'SUCCESS' ? '#00ff88' : '#ff4444';
            fieldsHtml += `<div><strong style="color: #ffaa00;">Auth Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${logEntry.auth_status}</span></div>`;
        }
        if (logEntry.response_code) {
            fieldsHtml += `<div><strong style="color: #ff88cc;">Response:</strong> <span style="color: #fff;">${logEntry.response_code}</span></div>`;
        }
        if (logEntry.merchant_id) {
            fieldsHtml += `<div><strong style="color: #ccff88;">Merchant:</strong> <span style="color: #fff; font-family: monospace;">${logEntry.merchant_id}</span></div>`;
        }
        
        fieldsHtml += '</div>';
    }
    
    return fieldsHtml;
}

function formatFullAuthFields(logEntry) {
    let fieldsHtml = '';
    
    if (logEntry.auth_method || logEntry.user_id || logEntry.auth_result || logEntry.failure_reason || logEntry.ip_address) {
        fieldsHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 10px 0; padding: 15px; background: #2d2d30; border-radius: 8px;">';
        
        if (logEntry.user_id) {
            fieldsHtml += `<div><strong style="color: #88ccff;">User ID:</strong> <span style="color: #fff; font-family: monospace;">${logEntry.user_id}</span></div>`;
        }
        if (logEntry.auth_method) {
            fieldsHtml += `<div><strong style="color: #ffaa88;">Method:</strong> <span style="color: #fff;">${logEntry.auth_method}</span></div>`;
        }
        if (logEntry.auth_result) {
            const resultColor = logEntry.auth_result === 'SUCCESS' ? '#00ff88' : '#ff4444';
            fieldsHtml += `<div><strong style="color: #ffaa00;">Result:</strong> <span style="color: ${resultColor}; font-weight: 600;">${logEntry.auth_result}</span></div>`;
        }
        if (logEntry.failure_reason) {
            fieldsHtml += `<div><strong style="color: #ff4444;">Failure:</strong> <span style="color: #ff6666;">${logEntry.failure_reason}</span></div>`;
        }
        if (logEntry.ip_address) {
            fieldsHtml += `<div><strong style="color: #ccff88;">IP:</strong> <span style="color: #fff; font-family: monospace;">${logEntry.ip_address}</span></div>`;
        }
        
        fieldsHtml += '</div>';
    }
    
    return fieldsHtml;
}

function formatPaymentGatewayFields(logEntry) {
    let fieldsHtml = '';
    
    if (logEntry.payment_id || logEntry.amount || logEntry.currency || logEntry.gateway_response || logEntry.processing_time) {
        fieldsHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 10px 0; padding: 15px; background: #2d2d30; border-radius: 8px;">';
        
        if (logEntry.payment_id) {
            fieldsHtml += `<div><strong style="color: #88ccff;">Payment ID:</strong> <span style="color: #fff; font-family: monospace;">${logEntry.payment_id}</span></div>`;
        }
        if (logEntry.amount && logEntry.currency) {
            fieldsHtml += `<div><strong style="color: #00ff88;">Amount:</strong> <span style="color: #00ff88; font-weight: 600;">${logEntry.amount} ${logEntry.currency}</span></div>`;
        }
        if (logEntry.gateway_response) {
            const responseColor = logEntry.gateway_response === 'APPROVED' ? '#00ff88' : '#ff4444';
            fieldsHtml += `<div><strong style="color: #ffaa00;">Gateway:</strong> <span style="color: ${responseColor}; font-weight: 600;">${logEntry.gateway_response}</span></div>`;
        }
        if (logEntry.processing_time) {
            fieldsHtml += `<div><strong style="color: #ff88cc;">Processing:</strong> <span style="color: #fff;">${logEntry.processing_time}ms</span></div>`;
        }
        
        fieldsHtml += '</div>';
    }
    
    return fieldsHtml;
}

function formatFraudDetectionFields(logEntry) {
    let fieldsHtml = '';
    
    if (logEntry.risk_score || logEntry.decision || logEntry.fraud_indicators || logEntry.rules_triggered) {
        fieldsHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 10px 0; padding: 15px; background: #2d2d30; border-radius: 8px;">';
        
        if (logEntry.risk_score !== undefined) {
            const riskColor = logEntry.risk_score >= 75 ? '#ff4444' : logEntry.risk_score >= 50 ? '#ffaa00' : '#00ff88';
            fieldsHtml += `<div><strong style="color: #ff88cc;">Risk Score:</strong> <span style="color: ${riskColor}; font-weight: 600;">${logEntry.risk_score}/100</span></div>`;
        }
        if (logEntry.decision) {
            const decisionColor = logEntry.decision === 'APPROVE' ? '#00ff88' : '#ff4444';
            fieldsHtml += `<div><strong style="color: #ffaa00;">Decision:</strong> <span style="color: ${decisionColor}; font-weight: 600;">${logEntry.decision}</span></div>`;
        }
        if (logEntry.fraud_indicators && logEntry.fraud_indicators.length > 0) {
            fieldsHtml += `<div><strong style="color: #ff4444;">Indicators:</strong> <span style="color: #ff6666;">${logEntry.fraud_indicators.join(', ')}</span></div>`;
        }
        if (logEntry.rules_triggered && logEntry.rules_triggered.length > 0) {
            fieldsHtml += `<div><strong style="color: #88ccff;">Rules:</strong> <span style="color: #fff;">${logEntry.rules_triggered.join(', ')}</span></div>`;
        }
        
        fieldsHtml += '</div>';
    }
    
    return fieldsHtml;
}

function formatApiGatewayFields(logEntry) {
    let fieldsHtml = '';
    
    if (logEntry.api_endpoint || logEntry.http_method || logEntry.response_time || logEntry.status_code || logEntry.request_size) {
        fieldsHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 10px 0; padding: 15px; background: #2d2d30; border-radius: 8px;">';
        
        if (logEntry.http_method && logEntry.api_endpoint) {
            const methodColor = getHttpMethodColor(logEntry.http_method);
            fieldsHtml += `<div><strong style="color: #88ccff;">Endpoint:</strong> <span style="color: ${methodColor}; font-weight: 600;">${logEntry.http_method}</span> <span style="color: #fff; font-family: monospace;">${logEntry.api_endpoint}</span></div>`;
        }
        if (logEntry.status_code) {
            const statusColor = getHttpStatusColor(logEntry.status_code);
            fieldsHtml += `<div><strong style="color: #ffaa00;">Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${logEntry.status_code}</span></div>`;
        }
        if (logEntry.response_time) {
            const timeColor = logEntry.response_time > 1000 ? '#ff4444' : logEntry.response_time > 500 ? '#ffaa00' : '#00ff88';
            fieldsHtml += `<div><strong style="color: #ff88cc;">Response Time:</strong> <span style="color: ${timeColor}; font-weight: 600;">${logEntry.response_time}ms</span></div>`;
        }
        if (logEntry.request_size) {
            fieldsHtml += `<div><strong style="color: #ccff88;">Request Size:</strong> <span style="color: #fff;">${formatBytes(logEntry.request_size)}</span></div>`;
        }
        
        fieldsHtml += '</div>';
    }
    
    return fieldsHtml;
}

function formatEnforceXmlFields(logEntry) {
    // Placeholder for XML6 specific fields - customize based on your XML6 log structure
    return '';
}

// Utility functions
function formatLogTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    try {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch {
        return timestamp;
    }
}

function formatTimeRange(range) {
    const ranges = {
        '1h': 'Last 1 Hour',
        '6h': 'Last 6 Hours',
        '24h': 'Last 24 Hours',
        '7d': 'Last 7 Days',
        '30d': 'Last 30 Days'
    };
    return ranges[range] || range;
}

function getHttpMethodColor(method) {
    const colors = {
        'GET': '#00ff88',
        'POST': '#ffaa00',
        'PUT': '#88ccff',
        'DELETE': '#ff4444',
        'PATCH': '#ff88cc'
    };
    return colors[method] || '#cccccc';
}

function getHttpStatusColor(status) {
    const statusNum = parseInt(status);
    if (statusNum >= 200 && statusNum < 300) return '#00ff88'; // Success
    if (statusNum >= 300 && statusNum < 400) return '#ffaa00'; // Redirect
    if (statusNum >= 400 && statusNum < 500) return '#ff4444'; // Client Error
    if (statusNum >= 500) return '#ff0000'; // Server Error
    return '#cccccc';
}

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function toggleLogDetails(index) {
    const detailsDiv = document.getElementById(`log-details-${index}`);
    const toggleText = document.getElementById(`toggle-text-${index}`);
    
    if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = 'block';
        toggleText.textContent = 'Hide Raw Data';
    } else {
        detailsDiv.style.display = 'none';
        toggleText.textContent = 'Show Raw Data';
    }
}

function getLogConfig(logType) {
    const configs = {
        '3d-secure': { icon: '🔐', display_name: '3D Secure Authentication' },
        'enforce-xml6': { icon: '📋', display_name: 'Enforce XML6' },
        'full-auth': { icon: '🔑', display_name: 'Full Authentication' },
        'payment-gateway': { icon: '💳', display_name: 'Payment Gateway' },
        'fraud-detection': { icon: '🚨', display_name: 'Fraud Detection' },
        'api-gateway': { icon: '🌐', display_name: 'API Gateway' }
    };
    return configs[logType] || { icon: '📊', display_name: 'Log Analysis' };
}

function escapeHtml(text) {
    if (!text || text === null || text === undefined) {
        return '';
    }
    
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// Add log analysis back button to the goBackToForm function
function goBackToLogAnalysis() {
    // Clear the chat container and show log analysis options
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        const logAnalysisContent = `
            <div class="welcome-message">
                <h2>📊 Log Analysis Options</h2>
                <p>Choose the type of logs you want to analyze:</p>
                
                <div class="log-analysis-options">
                    <div class="log-option" onclick="showLogForm('3d-secure')">
                        <div class="log-option-icon">🔐</div>
                        <h4>3D Secure</h4>
                        <p>Analyze 3D Secure authentication logs and transactions</p>
                    </div>
                    <div class="log-option" onclick="showLogForm('enforce-xml6')">
                        <div class="log-option-icon">📋</div>
                        <h4>Enforce XML6</h4>
                        <p>Review XML6 enforcement logs and compliance data</p>
                    </div>
                    <div class="log-option" onclick="showLogForm('full-auth')">
                        <div class="log-option-icon">🔑</div>
                        <h4>Full Auth</h4>
                        <p>Examine full authentication flow logs and results</p>
                    </div>
                    <div class="log-option" onclick="showLogForm('payment-gateway')">
                        <div class="log-option-icon">💳</div>
                        <h4>Payment Gateway</h4>
                        <p>Analyze payment gateway transaction logs</p>
                    </div>
                    <div class="log-option" onclick="showLogForm('fraud-detection')">
                        <div class="log-option-icon">🚨</div>
                        <h4>Fraud Detection</h4>
                        <p>Review fraud detection system logs and alerts</p>
                    </div>
                    <div class="log-option" onclick="showLogForm('api-gateway')">
                        <div class="log-option-icon">🌐</div>
                        <h4>API Gateway</h4>
                        <p>Monitor API gateway access and performance logs</p>
                    </div>
                </div>
            </div>
        `;
        
        chatContainer.innerHTML = logAnalysisContent;
        
        // Update the tab and input visibility
        showTab('logs');
    }
}

// Updated JavaScript functions to display logs in tabular format
// Replace the existing displayLogResults and formatLogEntry functions in main.js

function displayLogResults(result) {
    console.log('Displaying log results in tabular format:', result);
    
    const logConfig = getLogConfig(result.log_type);
    
    // Create comprehensive log results display with table format
    let logResultsHtml = `
        ${addBackButton('logs')}
        
        <div class="log-results">
            <div class="log-results-header">
                <h3>
                    <span>${logConfig.icon}</span>
                    <span>${logConfig.display_name} Results</span>
                </h3>
                <div class="log-results-count">${result.total_hits} logs found</div>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #444;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; font-size: 0.9rem;">
                    <div><strong style="color: #00ff88;">Session ID:</strong> <span style="color: #ffffff; font-family: monospace;">${result.session_id}</span></div>
                    <div><strong style="color: #ffaa00;">Time Range:</strong> <span style="color: #ffffff;">${formatTimeRange(result.filters_applied.time_range)}</span></div>
                    <div><strong style="color: #88ccff;">Log Level:</strong> <span style="color: #ffffff;">${result.filters_applied.log_level || 'All'}</span></div>
                    <div><strong style="color: #ff88cc;">Search Time:</strong> <span style="color: #ffffff;">${result.search_time_ms}ms</span></div>
                </div>
            </div>
    `;
    
    if (result.total_hits === 0) {
        logResultsHtml += `
            <div style="text-align: center; padding: 40px; background: #1a1a1a; border-radius: 12px; border: 1px solid #444;">
                <div style="font-size: 3rem; margin-bottom: 15px;">🔍</div>
                <h3 style="color: #ffffff; margin-bottom: 10px;">No Logs Found</h3>
                <p style="color: #cccccc; margin-bottom: 20px;">No logs were found matching your search criteria.</p>
                <div style="color: #888888; font-size: 0.9rem;">
                    <p>Try adjusting your search parameters:</p>
                    <ul style="text-align: left; display: inline-block; margin-top: 10px;">
                        <li>Extend the time range</li>
                        <li>Change the log level filter</li>
                        <li>Verify the session ID format</li>
                        <li>Remove optional filters</li>
                    </ul>
                </div>
            </div>
        `;
    } else {
        // Display logs in table format
        logResultsHtml += createLogTable(result.results, result.log_type);
        
        // Add pagination info if needed
        if (result.total_hits > result.results.length) {
            logResultsHtml += `
                <div style="text-align: center; margin: 20px 0; padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #444;">
                    <span style="color: #ffaa00; font-weight: 600;">
                        Showing ${result.results.length} of ${result.total_hits} total logs
                    </span>
                    <p style="color: #cccccc; margin-top: 8px; margin-bottom: 0; font-size: 0.9rem;">
                        Increase max results or refine search criteria to see more
                    </p>
                </div>
            `;
        }
    }
    
    logResultsHtml += `
        </div>
        ${addBottomActionButton('logs', `Found ${result.total_hits} logs`)}
    `;
    
    addMessage(logResultsHtml, false);
    
    // Add search/filter functionality after the table is rendered
    if (result.total_hits > 0) {
        setTimeout(() => {
            addTableSearchFilter();
        }, 100);
    }
}

function createLogTable(logEntries, logType) {
    if (!logEntries || logEntries.length === 0) {
        return '<p style="color: #cccccc;">No log entries to display.</p>';
    }
    
    // Define columns based on log type
    const tableConfig = getTableConfig(logType);
    
    let tableHtml = `
        <div class="log-table-container" style="overflow-x: auto; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; background: #1a1a1a; border: 1px solid #444; border-radius: 8px; overflow: hidden; min-width: 800px;">
                <thead>
                    <tr style="background: linear-gradient(135deg, #333333, #555555);">
                        ${tableConfig.columns.map((col, index) => 
                            `<th class="log-sortable-header ${col.mobileHide ? 'mobile-hide' : ''}" 
                                onclick="sortLogTable(${index})" 
                                style="border: 1px solid #555; padding: 12px; text-align: left; font-weight: 600; color: #ffffff; white-space: nowrap; cursor: pointer; user-select: none; position: relative; padding-right: 25px;"
                                title="Click to sort by ${col.header}">
                                ${col.header}
                                <span style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 0.8rem; opacity: 0.6;">↕️</span>
                            </th>`
                        ).join('')}
                        <th style="border: 1px solid #555; padding: 12px; text-align: center; font-weight: 600; color: #ffffff; width: 80px;">Actions</th>
                    </tr>
                </thead>
                <tbody id="log-table-body">
    `;
    
    logEntries.forEach((logEntry, index) => {
        const bgColor = index % 2 === 0 ? '#2d2d30' : '#1a1a1a';
        const levelClass = logEntry.level ? `log-level-${logEntry.level.toLowerCase()}` : '';
        
        tableHtml += `
            <tr class="${levelClass}" style="background: ${bgColor}; transition: background-color 0.2s;" 
                onmouseover="this.style.background='#333333'" 
                onmouseout="this.style.background='${bgColor}'"
                data-log-index="${index}">
        `;
        
        // Add data cells based on column configuration
        tableConfig.columns.forEach((col, colIndex) => {
            const cellValue = formatCellValue(logEntry, col.field, col.type);
            const cellStyle = getCellStyle(col.type, logEntry[col.field]);
            
            tableHtml += `
                <td class="${col.mobileHide ? 'mobile-hide' : ''}" 
                    style="border: 1px solid #444; padding: 10px; vertical-align: top; ${cellStyle} max-width: ${col.maxWidth || '200px'}; word-break: break-word;"
                    data-sort-value="${getSortValue(logEntry[col.field], col.type)}">
                    ${cellValue}
                </td>
            `;
        });
        
        // Add actions cell
        tableHtml += `
            <td style="border: 1px solid #444; padding: 10px; text-align: center; vertical-align: middle;">
                <button class="log-action-btn" onclick="toggleLogDetails('${index}')" 
                        style="background: #333; color: #fff; border: 1px solid #555; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; display: inline-flex; align-items: center; gap: 4px;"
                        onmouseover="this.style.background='#444'" 
                        onmouseout="this.style.background='#333'"
                        title="View detailed log data">
                    <span id="toggle-icon-${index}">👁️</span>
                    <span class="mobile-hide">Details</span>
                </button>
            </td>
        `;
        
        tableHtml += '</tr>';
        
        // Add hidden detail row with enhanced styling
        tableHtml += `
            <tr id="log-details-row-${index}" style="display: none; background: #1a1a1a;">
                <td colspan="${tableConfig.columns.length + 1}" style="border: 1px solid #444; padding: 0;">
                    <div class="log-detail-section" style="padding: 15px; background: linear-gradient(135deg, #1a1a1a, #2d2d30); border-top: 2px solid #333;">
                        <div class="log-detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 15px;">
                            <div class="log-detail-item" style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 6px; border: 1px solid #333;">
                                <strong style="color: #ffaa00; display: block; margin-bottom: 8px; font-size: 0.9rem;">📝 Full Message:</strong>
                                <div style="color: #ffffff; padding: 10px; background: #2d2d30; border-radius: 6px; font-family: monospace; white-space: pre-wrap; max-height: 150px; overflow-y: auto; font-size: 0.85rem; line-height: 1.4; border: 1px solid #444;">
${escapeHtml(logEntry.message || 'No message available')}
                                </div>
                            </div>
                            <div class="log-detail-item" style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 6px; border: 1px solid #333;">
                                <strong style="color: #ffaa00; display: block; margin-bottom: 8px; font-size: 0.9rem;">ℹ️ Log Details:</strong>
                                <div style="color: #cccccc; font-size: 0.85rem; line-height: 1.5;">
                                    <div style="margin-bottom: 6px;"><strong style="color: #88ccff;">Entry ID:</strong> <span style="font-family: monospace;">${logEntry.id || 'N/A'}</span></div>
                                    <div style="margin-bottom: 6px;"><strong style="color: #88ccff;">Component:</strong> ${logEntry.component || 'N/A'}</div>
                                    <div style="margin-bottom: 6px;"><strong style="color: #88ccff;">Session ID:</strong> <span style="font-family: monospace;">${logEntry.session_id || 'N/A'}</span></div>
                                    <div><strong style="color: #88ccff;">Full Timestamp:</strong> ${formatFullTimestamp(logEntry.timestamp)}</div>
                                </div>
                            </div>
                        </div>
                        ${createLogTypeSpecificDetails(logEntry, logType)}
                        ${logEntry.raw_data ? `
                            <div style="margin-top: 15px;">
                                <strong style="color: #ffaa00; display: block; margin-bottom: 8px; font-size: 0.9rem;">🔍 Raw Log Data:</strong>
                                <div class="log-raw-data" style="background: #2d2d30; border: 1px solid #444; border-radius: 6px; padding: 12px; font-family: 'Courier New', monospace; font-size: 0.8rem; color: #cccccc; white-space: pre-wrap; max-height: 300px; overflow-y: auto; line-height: 1.4;">
${JSON.stringify(logEntry.raw_data, null, 2)}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableHtml += `
                </tbody>
            </table>
        </div>
        
        <div class="log-table-info" style="display: flex; justify-content: space-between; align-items: center; margin: 15px 0; padding: 10px 15px; background: #1a1a1a; border-radius: 6px; border: 1px solid #444; font-size: 0.9rem;">
            <div class="log-count" style="color: #00ff88; font-weight: 600;">
                📊 Displaying ${logEntries.length} log entries
            </div>
            <div class="log-timing" style="color: #888888;">
                💡 Click column headers to sort • Click 👁️ to view details
            </div>
        </div>
    `;
    
    return tableHtml;
}

// Add sorting functionality
let currentSortColumn = -1;
let currentSortDirection = 'asc';

function sortLogTable(columnIndex) {
    const tableBody = document.getElementById('log-table-body');
    if (!tableBody) return;
    
    const rows = Array.from(tableBody.querySelectorAll('tr:not([id*="log-details-row"])'));
    
    // Toggle sort direction if same column clicked
    if (currentSortColumn === columnIndex) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortDirection = 'asc';
        currentSortColumn = columnIndex;
    }
    
    // Update header indicators
    document.querySelectorAll('.log-sortable-header').forEach((header, index) => {
        header.classList.remove('sorted-asc', 'sorted-desc');
        const indicator = header.querySelector('span');
        if (indicator) {
            if (index === columnIndex) {
                indicator.textContent = currentSortDirection === 'asc' ? '↑' : '↓';
                indicator.style.opacity = '1';
                indicator.style.color = '#00ff88';
                header.classList.add(`sorted-${currentSortDirection}`);
            } else {
                indicator.textContent = '↕️';
                indicator.style.opacity = '0.6';
                indicator.style.color = '';
            }
        }
    });
    
    // Sort rows
    rows.sort((a, b) => {
        const aCells = a.querySelectorAll('td');
        const bCells = b.querySelectorAll('td');
        
        if (columnIndex >= aCells.length || columnIndex >= bCells.length) return 0;
        
        const aValue = aCells[columnIndex].getAttribute('data-sort-value') || aCells[columnIndex].textContent.trim();
        const bValue = bCells[columnIndex].getAttribute('data-sort-value') || bCells[columnIndex].textContent.trim();
        
        // Try numeric comparison first
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return currentSortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison
        const comparison = aValue.localeCompare(bValue);
        return currentSortDirection === 'asc' ? comparison : -comparison;
    });
    
    // Reorder rows in DOM and update their detail rows
    const detailRows = [];
    rows.forEach((row, index) => {
        const logIndex = row.getAttribute('data-log-index');
        const detailRow = document.getElementById(`log-details-row-${logIndex}`);
        if (detailRow) {
            detailRows.push({ row, detailRow, originalIndex: logIndex });
        }
    });
    
    // Clear and repopulate table body
    tableBody.innerHTML = '';
    
    detailRows.forEach(({ row, detailRow }) => {
        // Update row colors for new positions
        const newIndex = Array.from(tableBody.children).length / 2;
        const bgColor = newIndex % 2 === 0 ? '#2d2d30' : '#1a1a1a';
        row.style.background = bgColor;
        row.setAttribute('onmouseout', `this.style.background='${bgColor}'`);
        
        tableBody.appendChild(row);
        tableBody.appendChild(detailRow);
    });
}

function getSortValue(value, type) {
    if (value === null || value === undefined || value === '') {
        return '';
    }
    
    switch (type) {
        case 'timestamp':
            return new Date(value).getTime() || 0;
        case 'level':
            const levelOrder = { 'error': 4, 'warn': 3, 'info': 2, 'debug': 1 };
            return levelOrder[value.toLowerCase()] || 0;
        case 'risk_score':
        case 'duration':
        case 'http_status':
            return parseFloat(value) || 0;
        default:
            return value.toString().toLowerCase();
    }
}

function getTableConfig(logType) {
    const baseColumns = [
        { field: 'timestamp', header: 'Timestamp', type: 'timestamp', maxWidth: '140px', mobileHide: false },
        { field: 'level', header: 'Level', type: 'level', maxWidth: '80px', mobileHide: false },
        { field: 'message', header: 'Message', type: 'message', maxWidth: '300px', mobileHide: false }
    ];
    
    const logTypeColumns = {
        '3d-secure': [
            ...baseColumns,
            { field: 'transaction_id', header: 'Transaction ID', type: 'code', maxWidth: '150px', mobileHide: true },
            { field: 'auth_status', header: 'Auth Status', type: 'status', maxWidth: '100px', mobileHide: false },
            { field: 'card_number', header: 'Card', type: 'masked', maxWidth: '120px', mobileHide: true },
            { field: 'merchant_id', header: 'Merchant', type: 'code', maxWidth: '100px', mobileHide: true }
        ],
        'full-auth': [
            ...baseColumns,
            { field: 'user_id', header: 'User ID', type: 'code', maxWidth: '120px', mobileHide: true },
            { field: 'auth_method', header: 'Auth Method', type: 'text', maxWidth: '100px', mobileHide: true },
            { field: 'auth_result', header: 'Result', type: 'status', maxWidth: '100px', mobileHide: false },
            { field: 'ip_address', header: 'IP Address', type: 'ip', maxWidth: '120px', mobileHide: true }
        ],
        'payment-gateway': [
            ...baseColumns,
            { field: 'payment_id', header: 'Payment ID', type: 'code', maxWidth: '150px', mobileHide: true },
            { field: 'amount', header: 'Amount', type: 'currency', maxWidth: '100px', mobileHide: false },
            { field: 'currency', header: 'Currency', type: 'text', maxWidth: '80px', mobileHide: true },
            { field: 'gateway_response', header: 'Gateway Response', type: 'status', maxWidth: '120px', mobileHide: false }
        ],
        'fraud-detection': [
            ...baseColumns,
            { field: 'risk_score', header: 'Risk Score', type: 'risk_score', maxWidth: '100px', mobileHide: false },
            { field: 'decision', header: 'Decision', type: 'status', maxWidth: '100px', mobileHide: false },
            { field: 'fraud_indicators', header: 'Indicators', type: 'array', maxWidth: '150px', mobileHide: true }
        ],
        'api-gateway': [
            ...baseColumns,
            { field: 'http_method', header: 'Method', type: 'http_method', maxWidth: '80px', mobileHide: false },
            { field: 'api_endpoint', header: 'Endpoint', type: 'url', maxWidth: '200px', mobileHide: true },
            { field: 'status_code', header: 'Status', type: 'http_status', maxWidth: '80px', mobileHide: false },
            { field: 'response_time', header: 'Response Time', type: 'duration', maxWidth: '100px', mobileHide: true }
        ],
        'enforce-xml6': [
            ...baseColumns,
            { field: 'xml_version', header: 'XML Version', type: 'text', maxWidth: '100px', mobileHide: true },
            { field: 'validation_status', header: 'Validation', type: 'status', maxWidth: '100px', mobileHide: false }
        ]
    };
    
    return {
        columns: logTypeColumns[logType] || baseColumns
    };
}

// Add export functionality for log tables
function exportLogTable(format = 'csv') {
    const table = document.querySelector('.log-results table');
    if (!table) {
        showAlert('No log table found to export');
        return;
    }
    
    const headers = Array.from(table.querySelectorAll('thead th:not(:last-child)')).map(th => th.textContent.trim());
    const rows = Array.from(table.querySelectorAll('tbody tr:not([id*="log-details-row"])'));
    
    if (format === 'csv') {
        exportToCSV(headers, rows);
    } else if (format === 'json') {
        exportToJSON(headers, rows);
    }
}

function exportToCSV(headers, rows) {
    let csvContent = headers.join(',') + '\n';
    
    rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td:not(:last-child)'));
        const rowData = cells.map(cell => {
            // Clean cell content and escape quotes
            let content = cell.textContent.trim().replace(/"/g, '""');
            // Remove emoji and special characters for CSV
            content = content.replace(/[^\w\s\-.,;:]/g, '');
            return `"${content}"`;
        });
        csvContent += rowData.join(',') + '\n';
    });
    
    downloadFile(csvContent, 'log_export.csv', 'text/csv');
}

function exportToJSON(headers, rows) {
    const data = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td:not(:last-child)'));
        const rowObj = {};
        headers.forEach((header, index) => {
            if (cells[index]) {
                rowObj[header] = cells[index].textContent.trim();
            }
        });
        return rowObj;
    });
    
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, 'log_export.json', 'application/json');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Add search/filter functionality for tables
function addTableSearchFilter() {
    const logResults = document.querySelector('.log-results');
    if (!logResults) return;
    
    const searchHtml = `
        <div style="margin: 15px 0; padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #444;">
            <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center;">
                <div>
                    <input type="text" id="table-search" placeholder="Search logs..." 
                           style="width: 100%; padding: 8px 12px; border: 1px solid #555; border-radius: 6px; background: #2d2d30; color: #fff; font-size: 0.9rem;"
                           oninput="filterLogTable(this.value)">
                </div>
                <div>
                    <select id="level-filter" onchange="filterLogTable()" 
                            style="padding: 8px 12px; border: 1px solid #555; border-radius: 6px; background: #2d2d30; color: #fff; font-size: 0.9rem;">
                        <option value="">All Levels</option>
                        <option value="error">Error</option>
                        <option value="warn">Warning</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug</option>
                    </select>
                </div>
                <div>
                    <button onclick="exportLogTable('csv')" 
                            style="background: #333; color: #fff; border: 1px solid #555; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; margin-right: 5px;"
                            title="Export as CSV">
                        📊 CSV
                    </button>
                    <button onclick="exportLogTable('json')" 
                            style="background: #333; color: #fff; border: 1px solid #555; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.9rem;"
                            title="Export as JSON">
                        📄 JSON
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const tableContainer = logResults.querySelector('.log-table-container');
    if (tableContainer) {
        tableContainer.insertAdjacentHTML('beforebegin', searchHtml);
    }
}

function filterLogTable(searchTerm) {
    const table = document.querySelector('.log-results table');
    const levelFilter = document.getElementById('level-filter');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr:not([id*="log-details-row"])');
    const detailRows = table.querySelectorAll('tbody tr[id*="log-details-row"]');
    
    const searchLower = searchTerm ? searchTerm.toLowerCase() : '';
    const levelFilterValue = levelFilter ? levelFilter.value.toLowerCase() : '';
    
    let visibleCount = 0;
    
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        const rowText = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
        const levelCell = cells[1]; // Assuming level is the second column
        const rowLevel = levelCell ? levelCell.textContent.toLowerCase().trim() : '';
        
        const matchesSearch = !searchLower || rowText.includes(searchLower);
        const matchesLevel = !levelFilterValue || rowLevel.includes(levelFilterValue);
        
        const shouldShow = matchesSearch && matchesLevel;
        
        if (shouldShow) {
            row.style.display = '';
            visibleCount++;
            // Update row background color based on new position
            const bgColor = (visibleCount - 1) % 2 === 0 ? '#2d2d30' : '#1a1a1a';
            row.style.background = bgColor;
            row.setAttribute('onmouseout', `this.style.background='${bgColor}'`);
        } else {
            row.style.display = 'none';
            // Hide corresponding detail row if it's open
            const logIndex = row.getAttribute('data-log-index');
            const detailRow = document.getElementById(`log-details-row-${logIndex}`);
            if (detailRow) {
                detailRow.style.display = 'none';
            }
        }
    });
    
    // Update table info
    const tableInfo = document.querySelector('.log-table-info .log-count');
    if (tableInfo) {
        const totalRows = rows.length;
        if (visibleCount === totalRows) {
            tableInfo.innerHTML = `📊 Displaying ${totalRows} log entries`;
        } else {
            tableInfo.innerHTML = `📊 Displaying ${visibleCount} of ${totalRows} log entries (filtered)`;
        }
    }
}
            ...baseColumns,
            { field: 'risk_score', header: 'Risk Score', type: 'risk_score', maxWidth: '100px', mobileHide: false },
            { field: 'decision', header: 'Decision', type: 'status', maxWidth: '100px', mobileHide: false },
            { field: 'fraud_indicators', header: 'Indicators', type: 'array', maxWidth: '150px', mobileHide: true }
        ],
        'api-gateway': [
            ...baseColumns,
            { field: 'http_method', header: 'Method', type: 'http_method', maxWidth: '80px', mobileHide: false },
            { field: 'api_endpoint', header: 'Endpoint', type: 'url', maxWidth: '200px', mobileHide: true },
            { field: 'status_code', header: 'Status', type: 'http_status', maxWidth: '80px', mobileHide: false },
            { field: 'response_time', header: 'Response Time', type: 'duration', maxWidth: '100px', mobileHide: true }
        ],
        'enforce-xml6': [
            ...baseColumns,
            { field: 'xml_version', header: 'XML Version', type: 'text', maxWidth: '100px', mobileHide: true },
            { field: 'validation_status', header: 'Validation', type: 'status', maxWidth: '100px', mobileHide: false }
        ]
    };
    
    return {
        columns: logTypeColumns[logType] || baseColumns
    };
}
            ...baseColumns,
            { field: 'risk_score', header: 'Risk Score', type: 'risk_score', maxWidth: '100px' },
            { field: 'decision', header: 'Decision', type: 'status', maxWidth: '100px' },
            { field: 'fraud_indicators', header: 'Indicators', type: 'array', maxWidth: '150px' }
        ],
        'api-gateway': [
            ...baseColumns,
            { field: 'http_method', header: 'Method', type: 'http_method', maxWidth: '80px' },
            { field: 'api_endpoint', header: 'Endpoint', type: 'url', maxWidth: '200px' },
            { field: 'status_code', header: 'Status', type: 'http_status', maxWidth: '80px' },
            { field: 'response_time', header: 'Response Time', type: 'duration', maxWidth: '100px' }
        ],
        'enforce-xml6': [
            ...baseColumns,
            { field: 'xml_version', header: 'XML Version', type: 'text', maxWidth: '100px' },
            { field: 'validation_status', header: 'Validation', type: 'status', maxWidth: '100px' }
        ]
    };
    
    return {
        columns: logTypeColumns[logType] || baseColumns
    };
}

function formatCellValue(logEntry, field, type) {
    const value = logEntry[field];
    
    if (value === null || value === undefined || value === '') {
        return '<span style="color: #666; font-style: italic;">-</span>';
    }
    
    switch (type) {
        case 'timestamp':
            return formatLogTimestamp(value);
            
        case 'level':
            const levelClass = value.toLowerCase();
            const levelColors = {
                'error': '#ff4444',
                'warn': '#ffaa00',
                'info': '#0066cc',
                'debug': '#888888'
            };
            const levelColor = levelColors[levelClass] || '#cccccc';
            return `<span style="background: ${levelColor}20; color: ${levelColor}; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; border: 1px solid ${levelColor};">${value}</span>`;
            
        case 'message':
            const truncatedMessage = value.length > 100 ? value.substring(0, 100) + '...' : value;
            return `<span style="color: #ffffff;" title="${escapeHtml(value)}">${escapeHtml(truncatedMessage)}</span>`;
            
        case 'status':
            const statusColor = getStatusColor(value);
            return `<span style="background: ${statusColor}20; color: ${statusColor}; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; border: 1px solid ${statusColor};">${value}</span>`;
            
        case 'code':
            return `<span style="font-family: monospace; color: #88ccff; background: #1a1a2d; padding: 4px 6px; border-radius: 4px;">${value}</span>`;
            
        case 'masked':
            return `<span style="font-family: monospace; color: #ffaa88;">${value}</span>`;
            
        case 'currency':
            return `<span style="color: #00ff88; font-weight: 600;">${value}</span>`;
            
        case 'risk_score':
            const riskColor = value >= 75 ? '#ff4444' : value >= 50 ? '#ffaa00' : '#00ff88';
            return `<span style="color: ${riskColor}; font-weight: 600;">${value}/100</span>`;
            
        case 'http_method':
            const methodColor = getHttpMethodColor(value);
            return `<span style="background: ${methodColor}20; color: ${methodColor}; padding: 4px 8px; border-radius: 6px; font-weight: 600;">${value}</span>`;
            
        case 'http_status':
            const statusColor2 = getHttpStatusColor(value);
            return `<span style="color: ${statusColor2}; font-weight: 600;">${value}</span>`;
            
        case 'duration':
            const timeColor = value > 1000 ? '#ff4444' : value > 500 ? '#ffaa00' : '#00ff88';
            return `<span style="color: ${timeColor}; font-weight: 600;">${value}ms</span>`;
            
        case 'array':
            if (Array.isArray(value)) {
                const displayValue = value.length > 3 ? `${value.slice(0, 3).join(', ')}... (+${value.length - 3})` : value.join(', ');
                return `<span style="color: #ffffff;" title="${value.join(', ')}">${displayValue}</span>`;
            }
            return `<span style="color: #ffffff;">${value}</span>`;
            
        case 'url':
            const truncatedUrl = value.length > 50 ? value.substring(0, 50) + '...' : value;
            return `<span style="font-family: monospace; color: #88ccff;" title="${value}">${truncatedUrl}</span>`;
            
        case 'ip':
            return `<span style="font-family: monospace; color: #ccff88;">${value}</span>`;
            
        default:
            return `<span style="color: #ffffff;">${escapeHtml(String(value))}</span>`;
    }
}

function getCellStyle(type, value) {
    switch (type) {
        case 'timestamp':
            return 'font-family: monospace; color: #00ff88;';
        case 'message':
            return 'line-height: 1.4;';
        case 'code':
        case 'masked':
        case 'ip':
        case 'url':
            return '';
        default:
            return '';
    }
}

function getStatusColor(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('success') || statusLower.includes('approved') || statusLower.includes('valid')) {
        return '#00ff88';
    }
    if (statusLower.includes('error') || statusLower.includes('failed') || statusLower.includes('denied')) {
        return '#ff4444';
    }
    if (statusLower.includes('warning') || statusLower.includes('pending')) {
        return '#ffaa00';
    }
    return '#888888';
}

function createLogTypeSpecificDetails(logEntry, logType) {
    let detailsHtml = '<div style="margin-top: 15px;"><strong style="color: #ffaa00;">Additional Details:</strong><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 10px; font-size: 0.9rem;">';
    
    switch (logType) {
        case '3d-secure':
            if (logEntry.response_code) detailsHtml += `<div><strong>Response Code:</strong> <span style="color: #fff;">${logEntry.response_code}</span></div>`;
            break;
        case 'full-auth':
            if (logEntry.failure_reason) detailsHtml += `<div><strong>Failure Reason:</strong> <span style="color: #ff6666;">${logEntry.failure_reason}</span></div>`;
            if (logEntry.user_agent) detailsHtml += `<div><strong>User Agent:</strong> <span style="color: #ccc; font-family: monospace; font-size: 0.8rem;">${logEntry.user_agent}</span></div>`;
            break;
        case 'payment-gateway':
            if (logEntry.processing_time) detailsHtml += `<div><strong>Processing Time:</strong> <span style="color: #fff;">${logEntry.processing_time}ms</span></div>`;
            break;
        case 'fraud-detection':
            if (logEntry.rules_triggered && logEntry.rules_triggered.length > 0) {
                detailsHtml += `<div><strong>Rules Triggered:</strong> <span style="color: #ffaa00;">${logEntry.rules_triggered.join(', ')}</span></div>`;
            }
            break;
        case 'api-gateway':
            if (logEntry.request_size) detailsHtml += `<div><strong>Request Size:</strong> <span style="color: #fff;">${formatBytes(logEntry.request_size)}</span></div>`;
            if (logEntry.response_size) detailsHtml += `<div><strong>Response Size:</strong> <span style="color: #fff;">${formatBytes(logEntry.response_size)}</span></div>`;
            break;
    }
    
    detailsHtml += '</div></div>';
    return detailsHtml;
}

function toggleLogDetails(index) {
    const detailsRow = document.getElementById(`log-details-row-${index}`);
    const toggleIcon = document.getElementById(`toggle-icon-${index}`);
    
    if (detailsRow.style.display === 'none') {
        detailsRow.style.display = 'table-row';
        toggleIcon.textContent = '🔽';
    } else {
        detailsRow.style.display = 'none';
        toggleIcon.textContent = '👁️';
    }
}

function formatFullTimestamp(timestamp) {
    if (!timestamp || timestamp === null || timestamp === undefined) {
        return 'Unknown';
    }
    
    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
    } catch (error) {
        console.warn('Error formatting full timestamp:', timestamp, error);
        return String(timestamp) || 'Unknown';
    }
}


function displaySessionPreview(result, container) {
    const hasData = result.has_data;
    const totalLogs = result.total_logs || 0;
    const apiCallCandidates = result.api_call_candidates || 0;
    const aiAnalysisReady = result.ai_analysis_ready || false;
    
    let previewHtml = '';
    
    if (!hasData) {
        previewHtml = `
            <div style="color: #ffaa00; padding: 15px; background: #332200; border-radius: 6px; border: 1px solid #ffaa00;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span>⚠️</span>
                    <strong>No Data Found</strong>
                </div>
                <p style="margin: 0; font-size: 0.9rem;">No logs found for session ID "${result.session_id}". This could mean:</p>
                <ul style="margin: 8px 0 0 20px; font-size: 0.8rem;">
                    <li>Session ID doesn't exist or is incorrect</li>
                    <li>Logs are outside the search time range</li>
                    <li>Data hasn't been indexed yet</li>
                </ul>
            </div>
        `;
    } else {
        const orderType = result.order_classification;
        const customerType = result.customer_type;
        
        previewHtml = `
            <div style="color: #00ff88; padding: 15px; background: #1a2d1a; border-radius: 6px; border: 1px solid #00ff88;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
                    <span>✅</span>
                    <strong>Session Data Found - AI Analysis Ready</strong>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 15px;">
                    <div style="background: #2d2d30; padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #00ff88;">${totalLogs}</div>
                        <div style="font-size: 0.8rem; color: #ccc;">Total Logs</div>
                    </div>
                    <div style="background: #2d2d30; padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #ffaa00;">${apiCallCandidates}</div>
                        <div style="font-size: 0.8rem; color: #ccc;">API Calls for AI</div>
                    </div>
                    <div style="background: #2d2d30; padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: #88ccff;">${orderType.type || 'Unknown'}</div>
                        <div style="font-size: 0.8rem; color: #ccc;">Order Type</div>
                    </div>
                    <div style="background: #2d2d30; padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: #ffaa88;">${customerType.type || 'Unknown'}</div>
                        <div style="font-size: 0.8rem; color: #ccc;">Customer Type</div>
                    </div>
                </div>
                
                <!-- AI Analysis Status -->
                <div style="background: ${aiAnalysisReady ? '#1a2d1a' : '#2d2d1a'}; border: 1px solid ${aiAnalysisReady ? '#00ff88' : '#ffaa00'}; border-radius: 6px; padding: 12px; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span style="font-size: 1.2rem;">${aiAnalysisReady ? '🤖' : '⚠️'}</span>
                        <strong style="color: ${aiAnalysisReady ? '#00ff88' : '#ffaa00'};">
                            AI Analysis: ${aiAnalysisReady ? 'Ready' : 'Limited Data'}
                        </strong>
                    </div>
                    <div style="font-size: 0.8rem; color: #ccc;">
                        ${aiAnalysisReady ? 
                            `${apiCallCandidates} API calls identified for AI-powered analysis. Expected analysis time: ~${result.estimated_analysis_time || 60} seconds.` :
                            `Only ${apiCallCandidates} API calls found. AI analysis will be limited but still available.`
                        }
                    </div>
                    ${aiAnalysisReady ? `
                        <div style="margin-top: 8px; font-size: 0.7rem; color: #888;">
                            AI will analyze: Request purpose, Response patterns, Error detection, Risk indicators, Business impact
                        </div>
                    ` : ''}
                </div>
                
                <div style="font-size: 0.9rem;">
                    <strong>Log Distribution:</strong>
                    <div style="margin-top: 8px; display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
                        ${Object.entries(result.log_counts).map(([type, count]) => 
                            count > 0 ? `<span style="background: #333; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;"><strong>${type.replace('_', ' ')}:</strong> ${count}</span>` : ''
                        ).filter(item => item).join('')}
                    </div>
                </div>
                
                ${orderType.confidence ? `<div style="margin-top: 10px; font-size: 0.8rem; color: #ccc;">Order classification confidence: ${Math.round(orderType.confidence * 100)}%</div>` : ''}
            </div>
        `;
    }
    
    container.innerHTML = previewHtml;
}

// Add debugging function to help troubleshoot AI analysis issues
function debugFraudAnalysis() {
    if (window.currentFraudAnalysis) {
        console.log('=== FRAUD ANALYSIS DEBUG INFO ===');
        console.log('Full Analysis Object:', window.currentFraudAnalysis);
        console.log('Monitoring Analysis:', window.currentFraudAnalysis.monitoring_analysis);
        console.log('API Call Analysis:', window.currentFraudAnalysis.monitoring_analysis?.api_call_analysis);
        console.log('AI Insights:', window.currentFraudAnalysis.monitoring_analysis?.ai_insights);
        console.log('Summary Stats:', window.currentFraudAnalysis.monitoring_analysis?.summary_statistics);
        console.log('=== END DEBUG INFO ===');
        
        return window.currentFraudAnalysis;
    } else {
        console.log('No fraud analysis data available. Run an analysis first.');
        return null;
    }
}

// Add to global scope for debugging
window.debugFraudAnalysis = debugFraudAnalysis;

// Update the analyzeFraudSession function to include better error handling and debugging
async function analyzeFraudSession(fraudType) {
    console.log('Starting fraud analysis for type:', fraudType);
    
    const sessionIdInput = document.getElementById('fraudSessionId');
    const analyzeBtn = document.querySelector('.fraud-analyze-button');
    
    if (!sessionIdInput || !sessionIdInput.value.trim()) {
        showAlert('Please enter a Session ID');
        return;
    }
    
    const sessionId = sessionIdInput.value.trim();
    
    // Show loading state
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<span>🔄</span><span>AI Analysis in Progress...</span>';
    }
    
    // Add loading message about AI analysis
    const loadingMessage = addMessage(`
        <div style="text-align: center; padding: 20px; background: #1a2d1a; border-radius: 8px; border: 1px solid #00ff88;">
            <div style="font-size: 2rem; margin-bottom: 10px;">🤖</div>
            <h4 style="color: #00ff88; margin-bottom: 10px;">AI-Powered Fraud Analysis in Progress</h4>
            <p style="color: #cccccc; margin-bottom: 15px;">Analyzing session logs with Gen AI...</p>
            <div style="background: #2d2d30; padding: 10px; border-radius: 6px; font-size: 0.8rem; color: #888;">
                <div>• Gathering logs from all sources</div>
                <div>• Classifying order and customer type</div>
                <div>• AI analyzing each API call</div>
                <div>• Generating insights and recommendations</div>
            </div>
            <div style="margin-top: 15px;">
                <div class="loading-spinner" style="margin: 0 auto;"></div>
            </div>
        </div>
    `, false);
    
    try {
        console.log('Sending fraud analysis request:', { session_id: sessionId, fraud_type: fraudType });
        
        const response = await fetch('/api/fraud-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                fraud_type: fraudType
            })
        });

        const result = await response.json();
        console.log('Fraud analysis result:', result);
        
        // Remove loading message
        if (loadingMessage) {
            loadingMessage.remove();
        }

        if (result.success) {
            // Add debug info to result
            console.log('AI Analysis successful. API calls analyzed:', result.analysis?.monitoring_analysis?.api_call_analysis?.length || 0);
            displayFraudResults(result);
        } else {
            addMessage(`
                <div class="error-message">
                    <h4>❌ Fraud Analysis Failed</h4>
                    <p><strong>Error:</strong> ${result.error}</p>
                    ${result.details ? `<p><strong>Details:</strong> ${result.details}</p>` : ''}
                    <div style="margin-top: 15px; padding: 10px; background: #2d2d30; border-radius: 6px; font-size: 0.8rem;">
                        <strong>Troubleshooting Tips:</strong>
                        <ul style="margin: 8px 0 0 20px;">
                            <li>Verify the session ID exists in your logs</li>
                            <li>Check that OpenAI API key is configured</li>
                            <li>Ensure Elasticsearch is accessible</li>
                            <li>Try with a different session ID</li>
                        </ul>
                    </div>
                </div>
            `, false);
        }
        
    } catch (error) {
        console.error('Fraud analysis error:', error);
        
        // Remove loading message
        if (loadingMessage) {
            loadingMessage.remove();
        }
        
        addMessage(`
            <div class="error-message">
                <h4>❌ Network Error</h4>
                <p><strong>Error:</strong> ${error.message}</p>
                <div style="margin-top: 15px; padding: 10px; background: #2d2d30; border-radius: 6px; font-size: 0.8rem;">
                    <strong>Common Issues:</strong>
                    <ul style="margin: 8px 0 0 20px;">
                        <li>Server connection timeout</li>
                        <li>OpenAI API rate limits</li>
                        <li>Large session data taking longer to process</li>
                    </ul>
                </div>
            </div>
        `, false);
    } finally {
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            const config = getFraudConfig(fraudType);
            analyzeBtn.innerHTML = `<span>${config.icon}</span><span>Analyze ${config.title.replace(' Analysis', '')}</span>`;
        }
    }
}function createFraudMonitoringSection(monitoringAnalysis) {
    const apiCallAnalysis = monitoringAnalysis.api_call_analysis || [];
    const aiInsights = monitoringAnalysis.ai_insights || {};
    const summaryStats = monitoringAnalysis.summary_statistics || {};
    
    let monitoringHtml = `
        <div class="fraud-section">
            <h4>🔍 AI-Powered API Call Analysis</h4>
            
            <!-- Summary Statistics -->
            <div class="fraud-grid" style="margin-bottom: 20px;">
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: #88ccff;">${summaryStats.total_api_calls || 0}</div>
                    <div class="fraud-metric-label">Total API Calls</div>
                </div>
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: #00ff88;">${summaryStats.successful_calls || 0}</div>
                    <div class="fraud-metric-label">Successful</div>
                </div>
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: #ff4444;">${summaryStats.failed_calls || 0}</div>
                    <div class="fraud-metric-label">Failed</div>
                </div>
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: ${summaryStats.success_rate >= 0.8 ? '#00ff88' : summaryStats.success_rate >= 0.6 ? '#ffaa00' : '#ff4444'};">
                        ${Math.round((summaryStats.success_rate || 0) * 100)}%
                    </div>
                    <div class="fraud-metric-label">Success Rate</div>
                </div>
            </div>
            
            <!-- AI Insights Summary -->
            ${createAIInsightsSummary(aiInsights)}
            
            <!-- API Calls Table -->
            ${createAPICallsTable(apiCallAnalysis)}
        </div>
    `;
    
    return monitoringHtml;
}

function createAIInsightsSummary(aiInsights) {
    if (!aiInsights || Object.keys(aiInsights).length === 0) {
        return `
            <div style="background: #2d2d30; border: 1px solid #444; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <strong style="color: #888;">AI Insights not available</strong>
            </div>
        `;
    }
    
    const sessionScore = aiInsights.session_score || 50;
    const scoreColor = getScoreColor(sessionScore);
    
    return `
        <div style="background: linear-gradient(135deg, #1a2d1a, #2d3a2d); border: 1px solid #00ff88; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h5 style="color: #00ff88; margin: 0; display: flex; align-items: center; gap: 8px;">
                    🤖 AI Insights Summary
                </h5>
                <div style="background: ${scoreColor}20; color: ${scoreColor}; padding: 6px 12px; border-radius: 15px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; margin-left: 10px; border: 1px solid ${scoreColor};">
                    Session Score: ${sessionScore}/100
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                    <strong style="color: #ffffff; display: block; margin-bottom: 8px;">📊 Overall Health:</strong>
                    <div style="color: #cccccc; font-size: 0.9rem;">${aiInsights.overall_session_health || 'Not assessed'}</div>
                </div>
                <div>
                    <strong style="color: #ffffff; display: block; margin-bottom: 8px;">🎯 Risk Assessment:</strong>
                    <div style="color: #cccccc; font-size: 0.9rem;">${aiInsights.fraud_risk_assessment || 'Not assessed'}</div>
                </div>
            </div>
            
            ${aiInsights.key_findings && aiInsights.key_findings.length > 0 ? `
                <div style="margin-bottom: 15px;">
                    <strong style="color: #ffffff; display: block; margin-bottom: 8px;">🔍 Key Findings:</strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${aiInsights.key_findings.map(finding => 
                            `<span style="background: #333; color: #fff; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; border: 1px solid #555;">${finding || ''}</span>`
                        ).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                ${aiInsights.critical_issues && aiInsights.critical_issues.length > 0 ? `
                    <div>
                        <strong style="color: #ff4444; display: block; margin-bottom: 8px;">⚠️ Critical Issues:</strong>
                        <div style="font-size: 0.8rem;">
                            ${aiInsights.critical_issues.map(issue => 
                                `<div style="color: #ff6666; margin: 4px 0;">• ${issue || ''}</div>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${aiInsights.positive_indicators && aiInsights.positive_indicators.length > 0 ? `
                    <div>
                        <strong style="color: #00ff88; display: block; margin-bottom: 8px;">✅ Positive Indicators:</strong>
                        <div style="font-size: 0.8rem;">
                            ${aiInsights.positive_indicators.map(indicator => 
                                `<div style="color: #66ff88; margin: 4px 0;">• ${indicator || ''}</div>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function createAPICallsTable(apiCallAnalysis) {
    if (!apiCallAnalysis || apiCallAnalysis.length === 0) {
        return `
            <div style="text-align: center; padding: 40px; background: #2d2d30; border-radius: 8px; border: 1px solid #444;">
                <div style="font-size: 2rem; margin-bottom: 15px;">📊</div>
                <h4 style="color: #ffffff; margin-bottom: 10px;">No API Calls Analyzed</h4>
                <p style="color: #cccccc;">No API call data was found in the session logs for AI analysis.</p>
            </div>
        `;
    }
    
    return `
        <div style="margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h5 style="color: #ffffff; margin: 0;">📋 Detailed API Call Analysis</h5>
                <div style="display: flex; gap: 10px;">
                    <button onclick="exportAPIAnalysis('csv')" 
                            style="background: #333; color: #fff; border: 1px solid #555; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;"
                            title="Export as CSV">
                        📊 CSV
                    </button>
                    <button onclick="filterAPITable('failed')" 
                            style="background: #333; color: #fff; border: 1px solid #555; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;"
                            title="Show only failed calls">
                        ❌ Failed Only
                    </button>
                    <button onclick="filterAPITable('all')" 
                            style="background: #333; color: #fff; border: 1px solid #555; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;"
                            title="Show all calls">
                        📋 Show All
                    </button>
                </div>
            </div>
            
            <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #444;">
                <table id="api-analysis-table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem; background: #1a1a1a;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #333333, #555555);">
                            <th style="border: 1px solid #555; padding: 10px; text-align: left; color: #fff; font-weight: 600; min-width: 100px;">Timestamp</th>
                            <th style="border: 1px solid #555; padding: 10px; text-align: left; color: #fff; font-weight: 600; min-width: 150px;">API Endpoint</th>
                            <th style="border: 1px solid #555; padding: 10px; text-align: center; color: #fff; font-weight: 600; width: 80px;">Method</th>
                            <th style="border: 1px solid #555; padding: 10px; text-align: center; color: #fff; font-weight: 600; width: 80px;">Status</th>
                            <th style="border: 1px solid #555; padding: 10px; text-align: left; color: #fff; font-weight: 600; min-width: 200px;">Purpose</th>
                            <th style="border: 1px solid #555; padding: 10px; text-align: left; color: #fff; font-weight: 600; min-width: 200px;">AI Analysis</th>
                            <th style="border: 1px solid #555; padding: 10px; text-align: left; color: #fff; font-weight: 600; min-width: 150px;">Risk Indicators</th>
                            <th style="border: 1px solid #555; padding: 10px; text-align: center; color: #fff; font-weight: 600; width: 80px;">Score</th>
                            <th style="border: 1px solid #555; padding: 10px; text-align: center; color: #fff; font-weight: 600; width: 60px;">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${apiCallAnalysis.map((analysis, index) => createAPICallRow(analysis, index)).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function createAPICallRow(analysis, index) {
    // Null safety for all properties
    const isSuccessful = analysis.is_successful !== false; // Default to true if undefined
    const statusColor = isSuccessful ? '#00ff88' : '#ff4444';
    const statusText = isSuccessful ? 'Success' : 'Failed';
    const statusIcon = isSuccessful ? '✅' : '❌';
    const rowClass = isSuccessful ? 'api-success' : 'api-failed';
    const bgColor = index % 2 === 0 ? '#2d2d30' : '#1a1a1a';
    
    const confidenceScore = Math.round((analysis.confidence_score || 0) * 100);
    const scoreColor = confidenceScore >= 80 ? '#00ff88' : confidenceScore >= 60 ? '#ffaa00' : '#ff4444';
    
    // Safe property extraction with defaults
    const endpoint = analysis.api_endpoint || 'Unknown';
    const method = analysis.http_method || 'N/A';
    const timestamp = analysis.timestamp || new Date().toISOString();
    const component = analysis.component || '';
    const purpose = analysis.request_purpose || 'Purpose not identified';
    const responseAnalysis = analysis.response_analysis || 'No analysis available';
    const riskIndicators = analysis.risk_indicators || [];
    const statusCode = analysis.status_code || null;
    const errorDetails = analysis.error_details || null;
    const processingTime = analysis.processing_time_ms || null;
    const fraudRelevance = analysis.fraud_relevance || '';
    
    return `
        <tr class="${rowClass}" style="background: ${bgColor}; transition: background-color 0.2s;" 
            onmouseover="this.style.background='#333333'" 
            onmouseout="this.style.background='${bgColor}'">
            
            <td style="border: 1px solid #444; padding: 8px; color: #00ff88; font-family: monospace; font-size: 0.8rem;">
                ${formatAPITimestamp(timestamp)}
            </td>
            
            <td style="border: 1px solid #444; padding: 8px; color: #88ccff; font-family: monospace; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                <div title="${escapeHtml(endpoint)}">${truncateText(endpoint, 25)}</div>
                ${component ? `<small style="color: #888; font-size: 0.7rem;">${escapeHtml(component)}</small>` : ''}
            </td>
            
            <td style="border: 1px solid #444; padding: 8px; text-align: center;">
                <span style="background: ${getHttpMethodColor(method)}20; color: ${getHttpMethodColor(method)}; padding: 3px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">
                    ${escapeHtml(method)}
                </span>
            </td>
            
            <td style="border: 1px solid #444; padding: 8px; text-align: center;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                    <span style="color: ${statusColor}; font-size: 1rem;">${statusIcon}</span>
                    <span style="color: ${statusColor}; font-size: 0.7rem; font-weight: 600;">${statusText}</span>
                    ${statusCode ? `<span style="color: #888; font-size: 0.6rem;">${statusCode}</span>` : ''}
                </div>
            </td>
            
            <td style="border: 1px solid #444; padding: 8px; color: #ffffff; max-width: 250px;">
                <div style="font-size: 0.8rem; line-height: 1.3;">
                    ${truncateText(purpose, 40)}
                </div>
                ${fraudRelevance ? `
                    <div style="margin-top: 4px; font-size: 0.7rem; color: #ffaa88; font-style: italic;">
                        ${truncateText(fraudRelevance, 50)}
                    </div>
                ` : ''}
            </td>
            
            <td style="border: 1px solid #444; padding: 8px; color: #cccccc; max-width: 250px;">
                <div style="font-size: 0.8rem; line-height: 1.3;">
                    ${truncateText(responseAnalysis, 60)}
                </div>
                ${errorDetails ? `
                    <div style="margin-top: 4px; padding: 4px; background: #2d1a1a; border-radius: 4px; border-left: 2px solid #ff4444;">
                        <span style="font-size: 0.7rem; color: #ff6666;">Error: ${truncateText(errorDetails, 50)}</span>
                    </div>
                ` : ''}
                ${processingTime ? `
                    <div style="margin-top: 4px; font-size: 0.7rem; color: #888;">
                        ⏱️ ${processingTime}ms
                    </div>
                ` : ''}
            </td>
            
            <td style="border: 1px solid #444; padding: 8px; color: #ffffff;">
                ${riskIndicators.length > 0 ? `
                    <div style="display: flex; flex-wrap: wrap; gap: 2px;">
                        ${riskIndicators.slice(0, 3).map(indicator => 
                            `<span style="background: #ff444420; color: #ff6666; padding: 2px 4px; border-radius: 6px; font-size: 0.6rem; border: 1px solid #ff4444;" title="${escapeHtml(indicator)}">
                                ${truncateText(indicator, 10)}
                            </span>`
                        ).join('')}
                        ${riskIndicators.length > 3 ? `<span style="color: #888; font-size: 0.6rem;">+${riskIndicators.length - 3}</span>` : ''}
                    </div>
                ` : `
                    <span style="color: #00ff88; font-size: 0.7rem; font-style: italic;">No risks detected</span>
                `}
            </td>
            
            <td style="border: 1px solid #444; padding: 8px; text-align: center;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                    <span style="color: ${scoreColor}; font-weight: 600; font-size: 0.9rem;">${confidenceScore}%</span>
                    <div style="width: 30px; height: 4px; background: #333; border-radius: 2px; overflow: hidden;">
                        <div style="width: ${confidenceScore}%; height: 100%; background: ${scoreColor}; transition: width 0.3s;"></div>
                    </div>
                </div>
            </td>
            
            <td style="border: 1px solid #444; padding: 8px; text-align: center;">
                <button onclick="showAPICallDetails(${index})" 
                        style="background: #333; color: #fff; border: 1px solid #555; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem; transition: all 0.2s;"
                        onmouseover="this.style.background='#444'" 
                        onmouseout="this.style.background='#333'"
                        title="View detailed analysis">
                    👁️
                </button>
            </td>
        </tr>
        
        <!-- Hidden detail row -->
        <tr id="api-details-${index}" style="display: none; background: #1a1a1a;">
            <td colspan="9" style="border: 1px solid #444; padding: 0;">
                <div style="padding: 15px; background: linear-gradient(135deg, #1a1a1a, #2d2d30); border-top: 2px solid #333;">
                    ${createAPICallDetailView(analysis)}
                </div>
            </td>
        </tr>
    `;
}

function createAPICallDetailView(analysis) {
    return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <h6 style="color: #ffaa00; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                    📊 Request Details
                </h6>
                <div style="background: #2d2d30; padding: 12px; border-radius: 6px; font-size: 0.8rem;">
                    <div style="margin-bottom: 8px;"><strong style="color: #88ccff;">Endpoint:</strong> <span style="color: #fff; font-family: monospace;">${analysis.api_endpoint || 'Unknown'}</span></div>
                    <div style="margin-bottom: 8px;"><strong style="color: #88ccff;">Method:</strong> <span style="color: #fff;">${analysis.http_method || 'N/A'}</span></div>
                    <div style="margin-bottom: 8px;"><strong style="color: #88ccff;">Source:</strong> <span style="color: #fff;">${analysis.source_type || 'Unknown'}</span></div>
                    <div style="margin-bottom: 8px;"><strong style="color: #88ccff;">Component:</strong> <span style="color: #fff;">${analysis.component || 'N/A'}</span></div>
                    <div style="margin-bottom: 8px;"><strong style="color: #88ccff;">Log Level:</strong> <span style="color: ${getLogLevelColor(analysis.log_level)}">${analysis.log_level || 'INFO'}</span></div>
                    ${analysis.processing_time_ms ? `<div style="margin-bottom: 8px;"><strong style="color: #88ccff;">Processing Time:</strong> <span style="color: #fff;">${analysis.processing_time_ms}ms</span></div>` : ''}
                    ${analysis.status_code ? `<div><strong style="color: #88ccff;">Status Code:</strong> <span style="color: ${getHttpStatusColor(analysis.status_code)}">${analysis.status_code}</span></div>` : ''}
                </div>
            </div>
            
            <div>
                <h6 style="color: #ffaa00; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                    🤖 AI Analysis
                </h6>
                <div style="background: #2d2d30; padding: 12px; border-radius: 6px; font-size: 0.8rem;">
                    <div style="margin-bottom: 10px;">
                        <strong style="color: #00ff88;">Purpose:</strong>
                        <div style="color: #fff; margin-top: 4px; line-height: 1.4;">${analysis.request_purpose || 'Not identified'}</div>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong style="color: #00ff88;">Analysis:</strong>
                        <div style="color: #fff; margin-top: 4px; line-height: 1.4;">${analysis.response_analysis || 'No analysis available'}</div>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong style="color: #00ff88;">Business Impact:</strong>
                        <div style="color: #fff; margin-top: 4px; line-height: 1.4;">${analysis.business_impact || 'Not assessed'}</div>
                    </div>
                    <div>
                        <strong style="color: #00ff88;">Confidence:</strong>
                        <div style="margin-top: 4px;">
                            <span style="color: ${getConfidenceColor(analysis.confidence_score)}; font-weight: 600;">${Math.round((analysis.confidence_score || 0) * 100)}%</span>
                            <span style="color: #888; font-size: 0.7rem; margin-left: 8px;">(AI Confidence Level)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        ${analysis.risk_indicators && analysis.risk_indicators.length > 0 ? `
            <div style="margin-top: 15px;">
                <h6 style="color: #ff4444; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                    ⚠️ Risk Indicators
                </h6>
                <div style="background: #2d1a1a; padding: 12px; border-radius: 6px; border-left: 4px solid #ff4444;">
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${analysis.risk_indicators.map(indicator => 
                            `<span style="background: #ff444420; color: #ff6666; padding: 6px 10px; border-radius: 12px; font-size: 0.8rem; border: 1px solid #ff4444;">
                                ⚠️ ${indicator}
                            </span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        ` : ''}
        
        ${analysis.recommendations ? `
            <div style="margin-top: 15px;">
                <h6 style="color: #00ff88; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                    💡 Recommendations
                </h6>
                <div style="background: #1a2d1a; padding: 12px; border-radius: 6px; border-left: 4px solid #00ff88;">
                    <div style="color: #fff; font-size: 0.8rem; line-height: 1.4;">
                        ${analysis.recommendations}
                    </div>
                </div>
            </div>
        ` : ''}
        
        ${analysis.original_message ? `
            <div style="margin-top: 15px;">
                <h6 style="color: #888; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                    📝 Original Log Message
                </h6>
                <div style="background: #1a1a2d; padding: 12px; border-radius: 6px; border-left: 4px solid #888;">
                    <div style="color: #ccc; font-size: 0.8rem; font-family: monospace; line-height: 1.4; word-break: break-word;">
                        ${analysis.original_message}
                    </div>
                </div>
            </div>
        ` : ''}
    `;
}

// Helper functions for the API analysis table
function showAPICallDetails(index) {
    const detailsRow = document.getElementById(`api-details-${index}`);
    const allDetailRows = document.querySelectorAll('[id^="api-details-"]');
    
    // Hide all other detail rows
    allDetailRows.forEach(row => {
        if (row.id !== `api-details-${index}`) {
            row.style.display = 'none';
        }
    });
    
    // Toggle the clicked row
    if (detailsRow.style.display === 'none') {
        detailsRow.style.display = 'table-row';
    } else {
        detailsRow.style.display = 'none';
    }
}

function filterAPITable(filterType) {
    const table = document.getElementById('api-analysis-table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr:not([id^="api-details-"])');
    
    rows.forEach(row => {
        if (filterType === 'all') {
            row.style.display = '';
        } else if (filterType === 'failed') {
            const hasFailedClass = row.classList.contains('api-failed');
            row.style.display = hasFailedClass ? '' : 'none';
        }
    });
    
    // Hide all detail rows when filtering
    const detailRows = table.querySelectorAll('[id^="api-details-"]');
    detailRows.forEach(row => {
        row.style.display = 'none';
    });
}

function exportAPIAnalysis(format) {
    const table = document.getElementById('api-analysis-table');
    if (!table) {
        showAlert('No API analysis table found to export');
        return;
    }
    
    const headers = ['Timestamp', 'API Endpoint', 'Method', 'Status', 'Purpose', 'AI Analysis', 'Risk Indicators', 'Confidence Score'];
    const rows = Array.from(table.querySelectorAll('tbody tr:not([id^="api-details-"]):not([style*="display: none"])'));
    
    if (format === 'csv') {
        let csvContent = headers.join(',') + '\n';
        
        rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td:not(:last-child)'));
            const rowData = cells.map(cell => {
                let content = cell.textContent.trim().replace(/"/g, '""');
                content = content.replace(/[^\w\s\-.,;:()]/g, '');
                return `"${content}"`;
            });
            csvContent += rowData.join(',') + '\n';
        });
        
        downloadFile(csvContent, 'api_analysis_export.csv', 'text/csv');
    }
}

function getScoreColor(score) {
    if (score >= 80) return '#00ff88';
    if (score >= 60) return '#ffaa00';
    if (score >= 40) return '#ff8800';
    return '#ff4444';
}

function getConfidenceColor(confidence) {
    const score = (confidence || 0) * 100;
    return getScoreColor(score);
}

function getLogLevelColor(level) {
    const levelLower = (level || '').toLowerCase();
    switch (levelLower) {
        case 'error': return '#ff4444';
        case 'warn': case 'warning': return '#ffaa00';
        case 'info': return '#00ff88';
        case 'debug': return '#888888';
        default: return '#cccccc';
    }
}

function formatAPITimestamp(timestamp) {
    if (!timestamp || timestamp === null || timestamp === undefined) {
        return 'Unknown';
    }
    
    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch (error) {
        console.warn('Error formatting timestamp:', timestamp, error);
        return String(timestamp).substring(0, 16) || 'Unknown';
    }
}

function truncateText(text, maxLength) {
    if (!text || text === null || text === undefined) {
        return '';
    }
    
    const textStr = String(text);
    if (textStr.length <= maxLength) {
        return textStr;
    }
    return textStr.substring(0, maxLength) + '...';
}

async function testFraudAnalysisDisplay() {
    console.log('Testing fraud analysis display with mock data...');
    
    try {
        // Get test data from backend
        const response = await fetch('/api/test-fraud-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: 'test_session_123'
            })
        });

        const result = await response.json();
        console.log('Test endpoint result:', result);

        if (result.success && result.test_results.mock_analysis) {
            // Display the mock analysis to test the UI
            console.log('Displaying mock fraud analysis...');
            displayFraudResults(result.test_results.mock_analysis);
        } else {
            console.log('Test results:', result.test_results);
            addMessage(`
                <div style="background: #2d2d30; border: 1px solid #ffaa00; border-radius: 8px; padding: 20px;">
                    <h4 style="color: #ffaa00;">🔧 Fraud Analysis Debug Results</h4>
                    <div style="font-family: monospace; font-size: 0.8rem; color: #ccc; background: #1a1a1a; padding: 15px; border-radius: 6px; margin-top: 10px; white-space: pre-wrap;">
${JSON.stringify(result.test_results, null, 2)}
                    </div>
                    <div style="margin-top: 15px; padding: 10px; background: #332200; border-radius: 6px; border-left: 4px solid #ffaa00;">
                        <strong style="color: #ffaa00;">Next Steps:</strong>
                        <ul style="margin: 8px 0 0 20px; color: #cccccc; font-size: 0.9rem;">
                            <li>Check OpenAI API key configuration</li>
                            <li>Verify Elasticsearch connection</li>
                            <li>Test with a real session ID that has API logs</li>
                        </ul>
                    </div>
                </div>
            `, false);
        }
        
    } catch (error) {
        console.error('Test fraud analysis error:', error);
        addMessage(`
            <div class="error-message">
                <h4>❌ Test Failed</h4>
                <p><strong>Error:</strong> ${error.message}</p>
                <p>Unable to connect to the test endpoint. Check that the server is running and the test endpoint is added.</p>
            </div>
        `, false);
    }
}

// Update the showFraudForm function to include a test button
function showFraudForm(fraudType) {
    console.log('Showing fraud form for:', fraudType);
    currentFraudType = fraudType;
    
    // Fraud type configurations
    const fraudConfigs = {
        'digital_fraud': {
            title: 'Digital Fraud Analysis',
            icon: '🤖',
            description: 'Analyze automated/bot-driven fraudulent activities and device fingerprinting patterns',
            focus: ['Device fingerprinting', 'Automated behavior detection', 'Bot identification', 'Digital payment fraud']
        },
        'assisted_fraud': {
            title: 'Assisted Fraud Analysis',
            icon: '👥',
            description: 'Analyze human-assisted fraudulent activities and social engineering patterns',
            focus: ['Social engineering', 'Customer service fraud', 'Human behavior patterns', 'Account takeover']
        },
        'transaction_fraud': {
            title: 'Transaction Fraud Analysis',
            icon: '💳',
            description: 'Analyze suspicious transaction patterns and payment anomalies',
            focus: ['Payment fraud', 'Transaction velocity', 'Amount anomalies', 'Cross-border fraud']
        },
        'identity_fraud': {
            title: 'Identity Fraud Analysis',
            icon: '🆔',
            description: 'Analyze identity theft, impersonation and synthetic identity fraud',
            focus: ['Identity verification', 'Document fraud', 'Synthetic identity', 'Account creation fraud']
        }
    };
    
    const config = fraudConfigs[fraudType];
    if (!config) {
        showAlert('Unknown fraud type selected');
        return;
    }
    
    // Build focus areas HTML
    let focusAreasHtml = '';
    config.focus.forEach(area => {
        focusAreasHtml += `<span style="display: inline-block; background: #333; color: #fff; padding: 4px 8px; border-radius: 12px; margin: 2px 4px; font-size: 0.8rem;">${area}</span>`;
    });
    
    const fraudFormHtml = `
        ${addBackButton('fraud')}
        
        <div class="fraud-form">
            <h3>
                <span>${config.icon}</span>
                <span>${config.title}</span>
            </h3>
            
            <p style="color: #cccccc; margin-bottom: 20px; line-height: 1.4;">
                ${config.description}
            </p>
            
            <div style="margin-bottom: 25px; padding: 15px; background: #2d2d30; border-radius: 8px; border-left: 4px solid #ff4444;">
                <strong style="color: #ff4444; display: block; margin-bottom: 8px;">🎯 Focus Areas:</strong>
                <div>${focusAreasHtml}</div>
            </div>
            
            <div class="fraud-form-group">
                <label for="fraudSessionId">Session ID:</label>
                <input type="text" 
                       id="fraudSessionId" 
                       placeholder="Enter session ID to analyze (e.g., sess_abc123456)"
                       required>
                <small style="color: #888; font-size: 0.8rem; margin-top: 5px; display: block;">
                    💡 The session ID will be used to gather logs from all monitoring systems
                </small>
            </div>
            
            <div class="fraud-form-group">
                <label for="previewSession">Quick Preview:</label>
                <button type="button" class="fraud-preview-button" onclick="previewFraudSession()" 
                        style="background: #333; color: #fff; border: 1px solid #555; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; margin-bottom: 10px; margin-right: 10px;">
                    🔍 Preview Session Data
                </button>
                <button type="button" onclick="testFraudAnalysisDisplay()" 
                        style="background: #006600; color: #fff; border: 1px solid #00aa00; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; margin-bottom: 10px;">
                    🧪 Test AI Display
                </button>
                <div id="sessionPreview" style="display: none; margin-top: 10px;"></div>
            </div>
            
            <button class="fraud-analyze-button" onclick="analyzeFraudSession('${fraudType}')">
                <span>${config.icon}</span>
                <span>Analyze ${config.title.replace(' Analysis', '')}</span>
            </button>
        </div>
    `;
    
    addMessage(fraudFormHtml, false);
}

// Function to manually test AI analysis display with hardcoded data
function testAIDisplayWithHardcodedData() {
    console.log('Testing AI display with hardcoded data...');
    
    const mockResult = {
        success: true,
        session_id: 'test_session_123',
        fraud_type: 'digital_fraud',
        analysis: {
            monitoring_analysis: {
                api_call_analysis: [
                    {
                        api_endpoint: '/api/fraud/check',
                        http_method: 'POST',
                        request_purpose: 'Fraud risk assessment for transaction',
                        response_analysis: 'API call completed successfully with risk score calculated',
                        is_successful: true,
                        error_details: null,
                        fraud_relevance: 'Primary fraud detection mechanism',
                        risk_indicators: ['high_velocity_transaction', 'new_device'],
                        business_impact: 'Critical for transaction approval decision',
                        recommendations: 'Continue monitoring velocity patterns',
                        processing_time_ms: 250,
                        status_code: 200,
                        confidence_score: 0.85,
                        timestamp: '2025-01-03T10:30:00Z',
                        log_level: 'INFO',
                        source_type: 'api_gateway',
                        session_id: 'test_session_123',
                        original_message: 'Fraud check completed for session',
                        component: 'fraud-service',
                        raw_log_id: 'log_123'
                    },
                    {
                        api_endpoint: '/api/payment/process',
                        http_method: 'POST',
                        request_purpose: 'Process payment transaction',
                        response_analysis: 'Payment processing failed due to insufficient funds',
                        is_successful: false,
                        error_details: 'Insufficient funds in account',
                        fraud_relevance: 'Payment failure could indicate account compromise',
                        risk_indicators: ['payment_failure', 'insufficient_funds'],
                        business_impact: 'Transaction rejected, revenue loss',
                        recommendations: 'Verify account status and fraud indicators',
                        processing_time_ms: 150,
                        status_code: 402,
                        confidence_score: 0.92,
                        timestamp: '2025-01-03T10:30:05Z',
                        log_level: 'ERROR',
                        source_type: 'payment_gateway',
                        session_id: 'test_session_123',
                        original_message: 'Payment processing failed',
                        component: 'payment-service',
                        raw_log_id: 'log_124'
                    }
                ],
                ai_insights: {
                    overall_session_health: 'Session shows mixed results with successful fraud detection but payment processing issues',
                    key_findings: ['Fraud detection working properly', 'Payment processing failed', 'High risk indicators present'],
                    fraud_risk_assessment: 'Medium risk due to payment failures and velocity patterns',
                    critical_issues: ['Payment processing failure', 'Insufficient funds error'],
                    positive_indicators: ['Fraud detection system active', 'Risk scoring operational'],
                    recommended_actions: [
                        'Review account balance verification process',
                        'Implement enhanced fraud monitoring for failed payments',
                        'Consider payment retry mechanisms'
                    ],
                    session_score: 65,
                    confidence_level: 'high'
                },
                summary_statistics: {
                    total_api_calls: 2,
                    successful_calls: 1,
                    failed_calls: 1,
                    success_rate: 0.5,
                    unique_endpoints: 2,
                    error_types: {'business_logic_errors': 1}
                }
            },
            order_classification: {
                type: 'purchase',
                confidence: 0.85,
                amount: 150.00,
                currency: 'USD'
            },
            customer_type: {
                type: 'existing_customer',
                confidence: 0.75,
                customer_id: 'cust_123456'
            },
            risk_assessment: {
                level: 'MEDIUM',
                score: 65,
                color: '#ffaa00',
                factors: ['Payment processing failure', 'High velocity transaction patterns']
            },
            recommendations: [
                'Review payment processing workflow',
                'Enhance account balance verification',
                'Monitor transaction velocity patterns'
            ],
            statistics: {
                total_logs_analyzed: 15,
                fraud_calls_triggered: 2,
                fraud_call_success_rate: 0.5,
                risk_scores_recorded: 1,
                decisions_made: 2
            },
            timeline: [
                {
                    timestamp: '2025-01-03T10:30:00Z',
                    event: 'Fraud Detection: risk_calculator',
                    status: 'Success',
                    details: 'Risk score calculated successfully'
                },
                {
                    timestamp: '2025-01-03T10:30:05Z',
                    event: 'Payment Processing: process_payment',
                    status: 'Failed',
                    details: 'Payment processing failed due to insufficient funds'
                }
            ]
        }
    };
    
    console.log('Displaying hardcoded mock data:', mockResult);
    displayFraudResults(mockResult);
}

// Add global function for easy testing
window.testAIDisplayWithHardcodedData = testAIDisplayWithHardcodedData;
window.testFraudAnalysisDisplay = testFraudAnalysisDisplay;

// Show fraud analysis form for specific fraud type
function showFraudForm(fraudType) {
    console.log('Showing fraud form for:', fraudType);
    currentFraudType = fraudType;
    
    // Fraud type configurations
    const fraudConfigs = {
        'digital_fraud': {
            title: 'Digital Fraud Analysis',
            icon: '🤖',
            description: 'Analyze automated/bot-driven fraudulent activities and device fingerprinting patterns',
            focus: ['Device fingerprinting', 'Automated behavior detection', 'Bot identification', 'Digital payment fraud']
        },
        'assisted_fraud': {
            title: 'Assisted Fraud Analysis',
            icon: '👥',
            description: 'Analyze human-assisted fraudulent activities and social engineering patterns',
            focus: ['Social engineering', 'Customer service fraud', 'Human behavior patterns', 'Account takeover']
        },
        'transaction_fraud': {
            title: 'Transaction Fraud Analysis',
            icon: '💳',
            description: 'Analyze suspicious transaction patterns and payment anomalies',
            focus: ['Payment fraud', 'Transaction velocity', 'Amount anomalies', 'Cross-border fraud']
        },
        'identity_fraud': {
            title: 'Identity Fraud Analysis',
            icon: '🆔',
            description: 'Analyze identity theft, impersonation and synthetic identity fraud',
            focus: ['Identity verification', 'Document fraud', 'Synthetic identity', 'Account creation fraud']
        }
    };
    
    const config = fraudConfigs[fraudType];
    if (!config) {
        showAlert('Unknown fraud type selected');
        return;
    }
    
    // Build focus areas HTML
    let focusAreasHtml = '';
    config.focus.forEach(area => {
        focusAreasHtml += `<span style="display: inline-block; background: #333; color: #fff; padding: 4px 8px; border-radius: 12px; margin: 2px 4px; font-size: 0.8rem;">${area}</span>`;
    });
    
    const fraudFormHtml = `
        ${addBackButton('fraud')}
        
        <div class="fraud-form">
            <h3>
                <span>${config.icon}</span>
                <span>${config.title}</span>
            </h3>
            
            <p style="color: #cccccc; margin-bottom: 20px; line-height: 1.4;">
                ${config.description}
            </p>
            
            <div style="margin-bottom: 25px; padding: 15px; background: #2d2d30; border-radius: 8px; border-left: 4px solid #ff4444;">
                <strong style="color: #ff4444; display: block; margin-bottom: 8px;">🎯 Focus Areas:</strong>
                <div>${focusAreasHtml}</div>
            </div>
            
            <div class="fraud-form-group">
                <label for="fraudSessionId">Session ID:</label>
                <input type="text" 
                       id="fraudSessionId" 
                       placeholder="Enter session ID to analyze (e.g., sess_abc123456)"
                       required>
                <small style="color: #888; font-size: 0.8rem; margin-top: 5px; display: block;">
                    💡 The session ID will be used to gather logs from all monitoring systems
                </small>
            </div>
            
            <div class="fraud-form-group">
                <label for="previewSession">Quick Preview:</label>
                <button type="button" class="fraud-preview-button" onclick="previewFraudSession()" 
                        style="background: #333; color: #fff; border: 1px solid #555; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; margin-bottom: 10px;">
                    🔍 Preview Session Data
                </button>
                <div id="sessionPreview" style="display: none; margin-top: 10px;"></div>
            </div>
            
            <button class="fraud-analyze-button" onclick="analyzeFraudSession('${fraudType}')">
                <span>${config.icon}</span>
                <span>Analyze ${config.title.replace(' Analysis', '')}</span>
            </button>
        </div>
    `;
    
    addMessage(fraudFormHtml, false);
}

// Preview session data before full analysis
async function previewFraudSession() {
    const sessionIdInput = document.getElementById('fraudSessionId');
    const previewDiv = document.getElementById('sessionPreview');
    const previewBtn = document.querySelector('.fraud-preview-button');
    
    if (!sessionIdInput || !sessionIdInput.value.trim()) {
        showAlert('Please enter a Session ID');
        return;
    }
    
    const sessionId = sessionIdInput.value.trim();
    
    // Show loading state
    if (previewBtn) {
        previewBtn.disabled = true;
        previewBtn.innerHTML = '🔄 Loading...';
    }
    
    try {
        console.log('Previewing session data for:', sessionId);
        
        const response = await fetch('/api/fraud-session-preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId
            })
        });

        const result = await response.json();
        console.log('Session preview result:', result);

        if (result.success) {
            displaySessionPreview(result, previewDiv);
        } else {
            previewDiv.innerHTML = `<div style="color: #ff4444; padding: 10px; background: #2d1a1a; border-radius: 6px; border: 1px solid #ff4444;">❌ ${result.error}</div>`;
        }
        
        previewDiv.style.display = 'block';
        
    } catch (error) {
        console.error('Session preview error:', error);
        previewDiv.innerHTML = `<div style="color: #ff4444; padding: 10px; background: #2d1a1a; border-radius: 6px; border: 1px solid #ff4444;">❌ Network Error: ${error.message}</div>`;
        previewDiv.style.display = 'block';
    } finally {
        if (previewBtn) {
            previewBtn.disabled = false;
            previewBtn.innerHTML = '🔍 Preview Session Data';
        }
    }
}

function displaySessionPreview(result, container) {
    const hasData = result.has_data;
    const totalLogs = result.total_logs || 0;
    
    let previewHtml = '';
    
    if (!hasData) {
        previewHtml = `
            <div style="color: #ffaa00; padding: 15px; background: #332200; border-radius: 6px; border: 1px solid #ffaa00;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span>⚠️</span>
                    <strong>No Data Found</strong>
                </div>
                <p style="margin: 0; font-size: 0.9rem;">No logs found for session ID "${result.session_id}". This could mean:</p>
                <ul style="margin: 8px 0 0 20px; font-size: 0.8rem;">
                    <li>Session ID doesn't exist or is incorrect</li>
                    <li>Logs are outside the search time range</li>
                    <li>Data hasn't been indexed yet</li>
                </ul>
            </div>
        `;
    } else {
        const orderType = result.order_classification;
        const customerType = result.customer_type;
        
        previewHtml = `
            <div style="color: #00ff88; padding: 15px; background: #1a2d1a; border-radius: 6px; border: 1px solid #00ff88;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
                    <span>✅</span>
                    <strong>Session Data Found</strong>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px;">
                    <div style="background: #2d2d30; padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #00ff88;">${totalLogs}</div>
                        <div style="font-size: 0.8rem; color: #ccc;">Total Logs</div>
                    </div>
                    <div style="background: #2d2d30; padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: #88ccff;">${orderType.type || 'Unknown'}</div>
                        <div style="font-size: 0.8rem; color: #ccc;">Order Type</div>
                    </div>
                    <div style="background: #2d2d30; padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: #ffaa88;">${customerType.type || 'Unknown'}</div>
                        <div style="font-size: 0.8rem; color: #ccc;">Customer Type</div>
                    </div>
                </div>
                
                <div style="font-size: 0.9rem;">
                    <strong>Log Distribution:</strong>
                    <div style="margin-top: 8px; display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
                        ${Object.entries(result.log_counts).map(([type, count]) => 
                            count > 0 ? `<span style="background: #333; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;"><strong>${type.replace('_', ' ')}:</strong> ${count}</span>` : ''
                        ).filter(item => item).join('')}
                    </div>
                </div>
                
                ${orderType.confidence ? `<div style="margin-top: 10px; font-size: 0.8rem; color: #ccc;">Order classification confidence: ${Math.round(orderType.confidence * 100)}%</div>` : ''}
            </div>
        `;
    }
    
    container.innerHTML = previewHtml;
}

// Main fraud analysis function
async function analyzeFraudSession(fraudType) {
    console.log('Starting fraud analysis for type:', fraudType);
    
    const sessionIdInput = document.getElementById('fraudSessionId');
    const analyzeBtn = document.querySelector('.fraud-analyze-button');
    
    if (!sessionIdInput || !sessionIdInput.value.trim()) {
        showAlert('Please enter a Session ID');
        return;
    }
    
    const sessionId = sessionIdInput.value.trim();
    
    // Show loading state
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<span>🔄</span><span>AI Analysis in Progress...</span>';
    }
    
    // Add loading message about AI analysis
    const loadingMessage = addMessage(`
        <div style="text-align: center; padding: 20px; background: #1a2d1a; border-radius: 8px; border: 1px solid #00ff88;">
            <div style="font-size: 2rem; margin-bottom: 10px;">🤖</div>
            <h4 style="color: #00ff88; margin-bottom: 10px;">AI-Powered Fraud Analysis in Progress</h4>
            <p style="color: #cccccc; margin-bottom: 15px;">Analyzing session logs with Gen AI...</p>
            <div style="background: #2d2d30; padding: 10px; border-radius: 6px; font-size: 0.8rem; color: #888;">
                <div>• Gathering logs from all sources</div>
                <div>• Classifying order and customer type</div>
                <div>• AI analyzing each API call</div>
                <div>• Generating insights and recommendations</div>
            </div>
            <div style="margin-top: 15px;">
                <div class="loading-spinner" style="margin: 0 auto;"></div>
            </div>
        </div>
    `, false);
    
    try {
        console.log('Sending fraud analysis request:', { session_id: sessionId, fraud_type: fraudType });
        
        const response = await fetch('/api/fraud-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                fraud_type: fraudType
            })
        });

        const result = await response.json();
        console.log('Fraud analysis result:', result);
        
        // Remove loading message
        if (loadingMessage) {
            loadingMessage.remove();
        }

        if (result.success) {
            // Add debug info to result
            console.log('AI Analysis successful. API calls analyzed:', result.analysis?.monitoring_analysis?.api_call_analysis?.length || 0);
            displayFraudResults(result);
        } else {
            addMessage(`
                <div class="error-message">
                    <h4>❌ Fraud Analysis Failed</h4>
                    <p><strong>Error:</strong> ${result.error || 'Unknown error'}</p>
                    ${result.details ? `<p><strong>Details:</strong> ${result.details}</p>` : ''}
                    <div style="margin-top: 15px; padding: 10px; background: #2d2d30; border-radius: 6px; font-size: 0.8rem;">
                        <strong>Troubleshooting Tips:</strong>
                        <ul style="margin: 8px 0 0 20px;">
                            <li>Verify the session ID exists in your logs</li>
                            <li>Check that OpenAI API key is configured</li>
                            <li>Ensure Elasticsearch is accessible</li>
                            <li>Try with a different session ID</li>
                        </ul>
                    </div>
                    ${addBottomActionButton('fraud')}
                </div>
            `, false);
        }
        
    } catch (error) {
        console.error('Fraud analysis error:', error);
        
        // Remove loading message
        if (loadingMessage) {
            loadingMessage.remove();
        }
        
        addMessage(`
            <div class="error-message">
                <h4>❌ Network Error</h4>
                <p><strong>Error:</strong> ${error.message || 'Network request failed'}</p>
                <div style="margin-top: 15px; padding: 10px; background: #2d2d30; border-radius: 6px; font-size: 0.8rem;">
                    <strong>Common Issues:</strong>
                    <ul style="margin: 8px 0 0 20px;">
                        <li>Server connection timeout</li>
                        <li>OpenAI API rate limits</li>
                        <li>Large session data taking longer to process</li>
                        <li>JavaScript parsing error in response</li>
                    </ul>
                </div>
                ${addBottomActionButton('fraud')}
            </div>
        `, false);
    } finally {
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            const config = getFraudConfig(fraudType);
            analyzeBtn.innerHTML = `<span>${config.icon}</span><span>Analyze ${config.title.replace(' Analysis', '')}</span>`;
        }
    }
}

function displayFraudResults(result) {
    console.log('Displaying fraud results:', result);
    
    try {
        // Validate result structure
        if (!result || !result.analysis) {
            throw new Error('Invalid fraud analysis result structure');
        }
        
        const analysis = result.analysis;
        const fraudConfig = getFraudConfig(result.fraud_type);
        const riskLevel = analysis.risk_assessment || { level: 'UNKNOWN', score: 0, color: '#888888', factors: [] };
        
        // Store the result globally for debugging
        window.currentFraudAnalysis = result;
        
        const fraudResultsHtml = `
            ${addBackButton('fraud')}
            
            <div class="fraud-results">
                <div class="fraud-results-header">
                    <h3>
                        <span>${fraudConfig.icon}</span>
                        <span>${fraudConfig.title}: ${result.session_id || 'Unknown Session'}</span>
                    </h3>
                    <div class="fraud-risk-badge fraud-risk-${riskLevel.level.toLowerCase()}">
                        ${riskLevel.level} RISK (${Math.round(riskLevel.score || 0)}/100)
                    </div>
                </div>
                
                ${createFraudOverviewSection(analysis)}
                ${createFraudOrderSection(analysis.order_classification, analysis.customer_type)}
                ${createFraudMonitoringSection(analysis.monitoring_analysis)}
                ${createFraudRiskSection(analysis.risk_assessment)}
                ${createFraudRecommendationsSection(analysis.recommendations)}
                ${createFraudTimelineSection(analysis.timeline)}
                ${createFraudStatisticsSection(analysis.statistics)}
            </div>
            
            ${addBottomActionButton('fraud', `Risk Level: ${riskLevel.level}`)}
        `;
        
        addMessage(fraudResultsHtml, false);
        
    } catch (error) {
        console.error('Error displaying fraud results:', error);
        addMessage(`
            <div class="error-message">
                <h4>❌ Display Error</h4>
                <p><strong>Error:</strong> ${error.message}</p>
                <div style="margin-top: 15px; padding: 10px; background: #2d2d30; border-radius: 6px; font-size: 0.8rem;">
                    <strong>Debug Info:</strong>
                    <pre style="color: #ccc; margin-top: 5px;">${JSON.stringify(result, null, 2).substring(0, 500)}...</pre>
                </div>
                ${addBottomActionButton('fraud')}
            </div>
        `, false);
    }
}

function createFraudOverviewSection(analysis) {
    return `
        <div class="fraud-section">
            <h4>📊 Analysis Overview</h4>
            <div class="fraud-grid">
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: #00ff88;">${analysis.statistics.total_logs_analyzed}</div>
                    <div class="fraud-metric-label">Total Logs Analyzed</div>
                </div>
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: #ffaa00;">${analysis.statistics.fraud_calls_triggered}</div>
                    <div class="fraud-metric-label">Fraud Calls Triggered</div>
                </div>
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: ${analysis.statistics.fraud_call_success_rate >= 0.8 ? '#00ff88' : analysis.statistics.fraud_call_success_rate >= 0.6 ? '#ffaa00' : '#ff4444'};">
                        ${Math.round(analysis.statistics.fraud_call_success_rate * 100)}%
                    </div>
                    <div class="fraud-metric-label">Success Rate</div>
                </div>
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: #88ccff;">${analysis.statistics.decisions_made}</div>
                    <div class="fraud-metric-label">Decisions Made</div>
                </div>
            </div>
        </div>
    `;
}

function createFraudOrderSection(orderClassification, customerType) {
    return `
        <div class="fraud-section">
            <h4>🛒 Order & Customer Analysis</h4>
            <div class="fraud-grid">
                <div style="background: #2d2d30; border: 1px solid #444; border-radius: 6px; padding: 15px;">
                    <strong style="color: #88ccff;">Order Classification</strong>
                    <div style="margin-top: 8px;">
                        <div style="font-size: 1.2rem; color: #fff; margin-bottom: 5px;">${orderClassification.type || 'Unknown'}</div>
                        <div style="font-size: 0.8rem; color: #ccc;">Confidence: ${Math.round((orderClassification.confidence || 0) * 100)}%</div>
                        ${orderClassification.amount ? `<div style="font-size: 0.9rem; color: #00ff88; margin-top: 5px;">Amount: ${orderClassification.amount} ${orderClassification.currency || ''}</div>` : ''}
                        ${orderClassification.indicators && orderClassification.indicators.length > 0 ? `
                            <div style="margin-top: 8px;">
                                ${orderClassification.indicators.map(indicator => 
                                    `<span style="background: #333; color: #fff; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; margin: 2px;">${indicator}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div style="background: #2d2d30; border: 1px solid #444; border-radius: 6px; padding: 15px;">
                    <strong style="color: #ffaa88;">Customer Type</strong>
                    <div style="margin-top: 8px;">
                        <div style="font-size: 1.2rem; color: #fff; margin-bottom: 5px;">${customerType.type ? customerType.type.replace('_', ' ').toUpperCase() : 'Unknown'}</div>
                        <div style="font-size: 0.8rem; color: #ccc;">Confidence: ${Math.round((customerType.confidence || 0) * 100)}%</div>
                        ${customerType.customer_id ? `<div style="font-size: 0.9rem; color: #88ccff; margin-top: 5px; font-family: monospace;">ID: ${customerType.customer_id}</div>` : ''}
                        ${customerType.indicators && customerType.indicators.length > 0 ? `
                            <div style="margin-top: 8px;">
                                ${customerType.indicators.map(indicator => 
                                    `<span style="background: #333; color: #fff; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; margin: 2px;">${indicator}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createFraudMonitoringSection(monitoringAnalysis) {
    if (!monitoringAnalysis) {
        return `
            <div class="fraud-section">
                <h4>🔍 Fraud Monitoring Analysis</h4>
                <div style="text-align: center; padding: 20px; background: #2d2d30; border-radius: 8px; color: #888;">
                    No monitoring analysis data available
                </div>
            </div>
        `;
    }
    
    const apiCallAnalysis = monitoringAnalysis.api_call_analysis || [];
    const aiInsights = monitoringAnalysis.ai_insights || {};
    const summaryStats = monitoringAnalysis.summary_statistics || {};
    
    let monitoringHtml = `
        <div class="fraud-section">
            <h4>🔍 AI-Powered API Call Analysis</h4>
            
            <!-- Summary Statistics -->
            <div class="fraud-grid" style="margin-bottom: 20px;">
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: #88ccff;">${summaryStats.total_api_calls || 0}</div>
                    <div class="fraud-metric-label">Total API Calls</div>
                </div>
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: #00ff88;">${summaryStats.successful_calls || 0}</div>
                    <div class="fraud-metric-label">Successful</div>
                </div>
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: #ff4444;">${summaryStats.failed_calls || 0}</div>
                    <div class="fraud-metric-label">Failed</div>
                </div>
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: ${(summaryStats.success_rate || 0) >= 0.8 ? '#00ff88' : (summaryStats.success_rate || 0) >= 0.6 ? '#ffaa00' : '#ff4444'};">
                        ${Math.round((summaryStats.success_rate || 0) * 100)}%
                    </div>
                    <div class="fraud-metric-label">Success Rate</div>
                </div>
            </div>
            
            <!-- AI Insights Summary -->
            ${createAIInsightsSummary(aiInsights)}
            
            <!-- API Calls Table -->
            ${createAPICallsTable(apiCallAnalysis)}
        </div>
    `;
    
    return monitoringHtml;
}

function createFraudRiskSection(riskAssessment) {
    return `
        <div class="fraud-section">
            <h4>⚠️ Risk Assessment</h4>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 20px; align-items: start;">
                <div style="text-align: center;">
                    <div style="width: 120px; height: 120px; border-radius: 50%; border: 8px solid ${riskAssessment.color}; display: flex; align-items: center; justify-content: center; background: rgba(${riskAssessment.color.slice(1).match(/.{2}/g).map(h => parseInt(h, 16)).join(', ')}, 0.1);">
                        <div>
                            <div style="font-size: 1.8rem; font-weight: bold; color: ${riskAssessment.color};">${Math.round(riskAssessment.score)}</div>
                            <div style="font-size: 0.8rem; color: ${riskAssessment.color};">RISK SCORE</div>
                        </div>
                    </div>
                    <div style="margin-top: 10px; font-weight: 600; color: ${riskAssessment.color};">${riskAssessment.level} RISK</div>
                </div>
                <div>
                    <strong style="color: #ffffff;">Risk Factors:</strong>
                    <div style="margin-top: 10px;">
                        ${riskAssessment.factors && riskAssessment.factors.length > 0 ? 
                            riskAssessment.factors.map(factor => 
                                `<div style="margin: 8px 0; padding: 8px 12px; background: #2d2d30; border-radius: 6px; border-left: 3px solid ${riskAssessment.color}; font-size: 0.9rem; color: #fff;">
                                    🔸 ${factor}
                                </div>`
                            ).join('') :
                            '<div style="color: #00ff88; font-style: italic;">No significant risk factors identified</div>'
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createFraudRecommendationsSection(recommendations) {
    return `
        <div class="fraud-section">
            <h4>💡 Recommendations</h4>
            <div style="background: #1a2d1a; border: 1px solid #00ff88; border-radius: 8px; padding: 15px;">
                ${recommendations && recommendations.length > 0 ? 
                    recommendations.map((recommendation, index) => 
                        `<div style="margin: 10px 0; display: flex; align-items: flex-start; gap: 10px;">
                            <span style="color: #00ff88; font-weight: bold; min-width: 20px;">${index + 1}.</span>
                            <span style="color: #ffffff; line-height: 1.4;">${recommendation}</span>
                        </div>`
                    ).join('') :
                    '<div style="color: #888; font-style: italic;">No specific recommendations generated</div>'
                }
            </div>
        </div>
    `;
}

function createFraudTimelineSection(timeline) {
    return `
        <div class="fraud-section">
            <h4>⏰ Fraud Monitoring Timeline</h4>
            <div class="fraud-timeline">
                ${timeline && timeline.length > 0 ? 
                    timeline.map(event => 
                        `<div class="fraud-timeline-item">
                            <div class="fraud-timeline-time">${formatTimelineTime(event.timestamp)}</div>
                            <div class="fraud-timeline-event">
                                <div style="font-weight: 600; margin-bottom: 2px;">${event.event}</div>
                                <div style="font-size: 0.8rem; color: #ccc;">${event.details}</div>
                            </div>
                            <div class="fraud-timeline-status ${event.status.toLowerCase()}">${event.status}</div>
                        </div>`
                    ).join('') :
                    '<div style="text-align: center; color: #888; padding: 20px;">No timeline events recorded</div>'
                }
            </div>
        </div>
    `;
}

function createFraudStatisticsSection(statistics) {
    return `
        <div class="fraud-section">
            <h4>📈 Analysis Statistics</h4>
            <div class="fraud-grid">
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: #88ccff;">${statistics.total_logs_analyzed}</div>
                    <div class="fraud-metric-label">Total Logs</div>
                </div>
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: #ffaa00;">${statistics.fraud_calls_triggered}</div>
                    <div class="fraud-metric-label">Fraud Calls</div>
                </div>
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: #ff88cc;">${statistics.risk_scores_recorded}</div>
                    <div class="fraud-metric-label">Risk Scores</div>
                </div>
                <div class="fraud-metric">
                    <div class="fraud-metric-value" style="color: #ccff88;">${statistics.decisions_made}</div>
                    <div class="fraud-metric-label">Decisions</div>
                </div>
            </div>
        </div>
    `;
}

// Helper functions
function getFraudConfig(fraudType) {
    const configs = {
        'digital_fraud': { icon: '🤖', title: 'Digital Fraud Analysis' },
        'assisted_fraud': { icon: '👥', title: 'Assisted Fraud Analysis' },
        'transaction_fraud': { icon: '💳', title: 'Transaction Fraud Analysis' },
        'identity_fraud': { icon: '🆔', title: 'Identity Fraud Analysis' }
    };
    return configs[fraudType] || { icon: '🚨', title: 'Fraud Analysis' };
}

function formatTimelineTime(timestamp) {
    if (!timestamp) return 'Unknown';
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch {
        return timestamp.substring(0, 8);
    }
}

// Update the goBackToForm function to handle fraud context
function goBackToFraudAnalysis() {
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        const fraudAnalysisContent = `
            <div class="welcome-message">
                <h2>🚨 Fraud Analysis Options</h2>
                <p>Choose the type of fraud analysis you want to perform:</p>
                
                <div class="fraud-analysis-options">
                    <div class="fraud-option" onclick="showFraudForm('digital_fraud')">
                        <div class="fraud-option-icon">🤖</div>
                        <h4>Digital Fraud</h4>
                        <p>Analyze automated/bot-driven fraudulent activities and device fingerprinting</p>
                    </div>
                    <div class="fraud-option" onclick="showFraudForm('assisted_fraud')">
                        <div class="fraud-option-icon">👥</div>
                        <h4>Assisted Fraud</h4>
                        <p>Analyze human-assisted fraudulent activities and social engineering</p>
                    </div>
                    <div class="fraud-option" onclick="showFraudForm('transaction_fraud')">
                        <div class="fraud-option-icon">💳</div>
                        <h4>Transaction Fraud</h4>
                        <p>Analyze suspicious transaction patterns and payment anomalies</p>
                    </div>
                    <div class="fraud-option" onclick="showFraudForm('identity_fraud')">
                        <div class="fraud-option-icon">🆔</div>
                        <h4>Identity Fraud</h4>
                        <p>Analyze identity theft, impersonation and synthetic identity fraud</p>
                    </div>
                </div>
            </div>
        `;
        
        chatContainer.innerHTML = fraudAnalysisContent;
        showTab('fraud');
    }
}



// Complete Jenkins JavaScript Functions for static/js/main.js
// Add these functions to your existing main.js file

// Global variables for Jenkins
let currentJenkinsJob = null;
let jenkinsJobStatus = null;

// Show Jenkins job form for specific job type
function showJenkinsJobForm(jobType) {
    console.log('Showing Jenkins job form for:', jobType);
    currentJenkinsJob = jobType;
    
    // Job type configurations
    const jobConfigs = {
        'fraud_story_prediction': {
            title: 'Fraud Story Prediction Job',
            icon: '🤖',
            description: 'AI-powered fraud story prediction based on enterprise release data with automated email notifications',
            parameters: [
                {
                    name: 'enterprise_release',
                    label: 'Enterprise Release',
                    type: 'text',
                    placeholder: 'e.g., 2024.1.0, v1.2.3, Release-Q4-2024',
                    required: true,
                    helpText: 'Specify the enterprise release version for fraud story prediction analysis'
                },
                {
                    name: 'email_id',
                    label: 'Email ID',
                    type: 'email',
                    placeholder: 'your.email@company.com',
                    required: true,
                    helpText: 'Email address where the prediction results and report will be sent'
                }
            ],
            estimatedTime: '5-10 minutes',
            outputFormat: 'Email report with CSV attachment'
        }
    };
    
    const config = jobConfigs[jobType];
    if (!config) {
        showAlert('Unknown Jenkins job type selected');
        return;
    }
    
    // Build parameters form HTML
    let parametersHtml = '';
    config.parameters.forEach(param => {
        parametersHtml += `
            <div class="jenkins-form-group">
                <label for="${param.name}">${param.label}:</label>
                <input type="${param.type}" 
                       id="${param.name}" 
                       placeholder="${param.placeholder}"
                       ${param.required ? 'required' : ''}>
                ${param.helpText ? `<small style="color: #888; font-size: 0.8rem; margin-top: 5px; display: block;">${param.helpText}</small>` : ''}
            </div>
        `;
    });
    
    const jenkinsFormHtml = `
        ${addBackButton('jenkins')}
        
        <div class="jenkins-form">
            <h3>
                <span>${config.icon}</span>
                <span>${config.title}</span>
            </h3>
            
            <p style="color: #cccccc; margin-bottom: 25px; line-height: 1.4;">
                ${config.description}
            </p>
            
            <div style="margin-bottom: 25px; padding: 15px; background: #2d2d30; border-radius: 8px; border-left: 4px solid #00ff88;">
                <strong style="color: #00ff88; display: block; margin-bottom: 8px;">📊 Job Information:</strong>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; font-size: 0.9rem;">
                    <div><strong>Estimated Time:</strong> ${config.estimatedTime}</div>
                    <div><strong>Output:</strong> ${config.outputFormat}</div>
                    <div><strong>Notification:</strong> Email delivery</div>
                </div>
            </div>
            
            ${parametersHtml}
            
            <div class="jenkins-form-group">
                <button type="button" class="jenkins-preview-button" onclick="previewJenkinsJob()" 
                        style="background: #333; color: #fff; border: 1px solid #555; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; margin-bottom: 10px; margin-right: 10px;">
                    🔍 Preview Job Configuration
                </button>
                <button type="button" onclick="testJenkinsConnection()" 
                        style="background: #006600; color: #fff; border: 1px solid #00aa00; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; margin-bottom: 10px;">
                    🔧 Test Jenkins Connection
                </button>
                <div id="jenkinsPreview" style="display: none; margin-top: 10px;"></div>
            </div>
            
            <button class="jenkins-run-button" onclick="triggerJenkinsJob('${jobType}')">
                <span>${config.icon}</span>
                <span>Run ${config.title.replace(' Job', '')}</span>
            </button>
        </div>
    `;
    
    addMessage(jenkinsFormHtml, false);
}

// Preview Jenkins job configuration
async function previewJenkinsJob() {
    const previewBtn = document.querySelector('.jenkins-preview-button');
    const previewDiv = document.getElementById('jenkinsPreview');
    
    if (!currentJenkinsJob) {
        showAlert('No job selected');
        return;
    }
    
    // Show loading state
    if (previewBtn) {
        previewBtn.disabled = true;
        previewBtn.innerHTML = '🔄 Loading...';
    }
    
    try {
        console.log('Getting Jenkins job info for:', currentJenkinsJob);
        
        const response = await fetch(`/api/jenkins-job-info/${currentJenkinsJob}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();
        console.log('Jenkins job info result:', result);

        if (result.success) {
            displayJenkinsJobPreview(result, previewDiv);
        } else {
            previewDiv.innerHTML = `<div style="color: #ff4444; padding: 10px; background: #2d1a1a; border-radius: 6px; border: 1px solid #ff4444;">❌ ${result.error}</div>`;
        }
        
        previewDiv.style.display = 'block';
        
    } catch (error) {
        console.error('Jenkins job preview error:', error);
        previewDiv.innerHTML = `<div style="color: #ff4444; padding: 10px; background: #2d1a1a; border-radius: 6px; border: 1px solid #ff4444;">❌ Network Error: ${error.message}</div>`;
        previewDiv.style.display = 'block';
    } finally {
        if (previewBtn) {
            previewBtn.disabled = false;
            previewBtn.innerHTML = '🔍 Preview Job Configuration';
        }
    }
}

// Display Jenkins job preview information
function displayJenkinsJobPreview(result, container) {
    const jenkinsInfo = result.jenkins_info || {};
    const lastBuildInfo = result.last_build_info;
    
    let previewHtml = `
        <div style="color: #00ff88; padding: 15px; background: #1a2d1a; border-radius: 6px; border: 1px solid #00ff88;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
                <span>✅</span>
                <strong>Jenkins Job Information</strong>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px;">
                <div style="background: #2d2d30; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 1.2rem; font-weight: bold; color: #00ff88;">${jenkinsInfo.buildable ? 'Ready' : 'Not Ready'}</div>
                    <div style="font-size: 0.8rem; color: #ccc;">Job Status</div>
                </div>
                <div style="background: #2d2d30; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 1.2rem; font-weight: bold; color: #88ccff;">#${jenkinsInfo.nextBuildNumber || 'N/A'}</div>
                    <div style="font-size: 0.8rem; color: #ccc;">Next Build</div>
                </div>
                <div style="background: #2d2d30; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 1.2rem; font-weight: bold; color: #ffaa88;">${jenkinsInfo.lastBuild || 'None'}</div>
                    <div style="font-size: 0.8rem; color: #ccc;">Last Build</div>
                </div>
            </div>
            
            <div style="font-size: 0.9rem;">
                <strong>Job Details:</strong>
                <div style="margin-top: 8px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                    <span style="background: #333; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">
                        <strong>Display Name:</strong> ${result.display_name || 'N/A'}
                    </span>
                    <span style="background: #333; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">
                        <strong>Parameters:</strong> ${result.parameters ? result.parameters.length : 0}
                    </span>
                    <span style="background: #333; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">
                        <strong>Last Success:</strong> #${jenkinsInfo.lastSuccessfulBuild || 'None'}
                    </span>
                </div>
            </div>
            
            ${lastBuildInfo ? `
                <div style="margin-top: 15px; padding: 10px; background: #333; border-radius: 6px;">
                    <strong style="color: #ffaa00;">Last Build Information:</strong>
                    <div style="margin-top: 8px; font-size: 0.8rem; color: #ccc;">
                        <div><strong>Build #${lastBuildInfo.number}:</strong> ${lastBuildInfo.result || 'Unknown'}</div>
                        <div><strong>Duration:</strong> ${formatDuration(lastBuildInfo.duration)}</div>
                        <div><strong>Timestamp:</strong> ${formatBuildTimestamp(lastBuildInfo.timestamp)}</div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    container.innerHTML = previewHtml;
}

// Test Jenkins connection
async function testJenkinsConnection() {
    console.log('Testing Jenkins connection...');
    
    try {
        const response = await fetch('/api/jenkins-health', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();
        console.log('Jenkins connection test result:', result);

        if (result.success) {
            addMessage(`
                <div style="color: #00ff88; padding: 15px; background: #1a2d1a; border-radius: 6px; border: 1px solid #00ff88;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                        <span>✅</span>
                        <strong>Jenkins Connection Successful!</strong>
                    </div>
                    <div style="font-size: 0.9rem;">
                        <div><strong>Jenkins Version:</strong> ${result.jenkins_version}</div>
                        <div><strong>Node:</strong> ${result.node_name}</div>
                        <div><strong>Executors:</strong> ${result.num_executors}</div>
                        <div><strong>Mode:</strong> ${result.mode}</div>
                    </div>
                </div>
            `, false);
        } else {
            addMessage(`
                <div style="color: #ff4444; padding: 15px; background: #2d1a1a; border-radius: 6px; border: 1px solid #ff4444;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                        <span>❌</span>
                        <strong>Jenkins Connection Failed</strong>
                    </div>
                    <div style="font-size: 0.9rem; color: #ff6666;">
                        <strong>Error:</strong> ${result.error}
                    </div>
                    <div style="margin-top: 10px; padding: 10px; background: #333; border-radius: 6px; font-size: 0.8rem;">
                        <strong>Troubleshooting Tips:</strong>
                        <ul style="margin: 5px 0 0 20px;">
                            <li>Check Jenkins URL configuration</li>
                            <li>Verify username and API token</li>
                            <li>Ensure Jenkins is accessible from this server</li>
                            <li>Check network connectivity and firewall settings</li>
                        </ul>
                    </div>
                </div>
            `, false);
        }
        
    } catch (error) {
        console.error('Jenkins connection test error:', error);
        addMessage(`
            <div style="color: #ff4444; padding: 15px; background: #2d1a1a; border-radius: 6px; border: 1px solid #ff4444;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <span>❌</span>
                    <strong>Connection Test Failed</strong>
                </div>
                <div style="font-size: 0.9rem; color: #ff6666;">
                    <strong>Network Error:</strong> ${error.message}
                </div>
            </div>
        `, false);
    }
}

// Trigger Jenkins job
async function triggerJenkinsJob(jobType) {
    console.log('Triggering Jenkins job:', jobType);
    
    const runBtn = document.querySelector('.jenkins-run-button');
    
    // Collect parameters from form
    const parameters = {};
    const parameterInputs = document.querySelectorAll('.jenkins-form input[required]');
    
    // Validate required parameters
    let missingParams = [];
    parameterInputs.forEach(input => {
        const value = input.value.trim();
        if (!value) {
            missingParams.push(input.previousElementSibling.textContent.replace(':', ''));
        } else {
            parameters[input.id] = value;
        }
    });
    
    if (missingParams.length > 0) {
        showAlert(`Please fill in all required fields: ${missingParams.join(', ')}`);
        return;
    }
    
    // Validate email format
    if (parameters.email_id && !isValidEmail(parameters.email_id)) {
        showAlert('Please enter a valid email address');
        return;
    }
    
    // Show loading state
    if (runBtn) {
        runBtn.disabled = true;
        runBtn.innerHTML = '<span>🔄</span><span>Starting Job...</span>';
    }
    
    // Add loading message
    const loadingMessage = addMessage(`
        <div style="text-align: center; padding: 20px; background: #1a2d1a; border-radius: 8px; border: 1px solid #00ff88;">
            <div style="font-size: 2rem; margin-bottom: 10px;">🔧</div>
            <h4 style="color: #00ff88; margin-bottom: 10px;">Jenkins Job Execution Started</h4>
            <p style="color: #cccccc; margin-bottom: 15px;">Triggering job with validated parameters...</p>
            <div style="background: #2d2d30; padding: 10px; border-radius: 6px; font-size: 0.8rem; color: #888;">
                <div>• Validating job parameters</div>
                <div>• Connecting to Jenkins server</div>
                <div>• Triggering job execution</div>
                <div>• Setting up email notifications</div>
            </div>
            <div style="margin-top: 15px;">
                <div class="jenkins-loading-spinner" style="margin: 0 auto;"></div>
            </div>
        </div>
    `, false);
    
    try {
        console.log('Sending Jenkins job trigger request:', { job_type: jobType, parameters });
        
        const response = await fetch('/api/jenkins-trigger-job', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                job_type: jobType,
                parameters: parameters
            })
        });

        const result = await response.json();
        console.log('Jenkins job trigger result:', result);
        
        // Remove loading message
        if (loadingMessage) {
            loadingMessage.remove();
        }

        if (result.success) {
            displayJenkinsJobResults(result);
        } else {
            addMessage(`
                <div class="error-message">
                    <h4>❌ Jenkins Job Failed to Start</h4>
                    <p><strong>Error:</strong> ${result.error}</p>
                    ${result.validation_errors ? `
                        <div style="margin-top: 10px;">
                            <strong>Validation Errors:</strong>
                            <ul style="margin: 5px 0 0 20px;">
                                ${result.validation_errors.map(error => `<li>${error}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${result.validation_warnings ? `
                        <div style="margin-top: 10px;">
                            <strong>Warnings:</strong>
                            <ul style="margin: 5px 0 0 20px; color: #ffaa00;">
                                ${result.validation_warnings.map(warning => `<li>${warning}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <div style="margin-top: 15px; padding: 10px; background: #2d2d30; border-radius: 6px; font-size: 0.8rem;">
                        <strong>Common Issues:</strong>
                        <ul style="margin: 8px 0 0 20px;">
                            <li>Jenkins job configuration missing or incorrect</li>
                            <li>Insufficient permissions to trigger job</li>
                            <li>Jenkins server temporarily unavailable</li>
                            <li>Parameter validation failures</li>
                        </ul>
                    </div>
                    ${addBottomActionButton('jenkins')}
                </div>
            `, false);
        }
        
    } catch (error) {
        console.error('Jenkins job trigger error:', error);
        
        // Remove loading message
        if (loadingMessage) {
            loadingMessage.remove();
        }
        
        addMessage(`
            <div class="error-message">
                <h4>❌ Network Error</h4>
                <p><strong>Error:</strong> ${error.message}</p>
                <div style="margin-top: 15px; padding: 10px; background: #2d2d30; border-radius: 6px; font-size: 0.8rem;">
                    <strong>Possible Causes:</strong>
                    <ul style="margin: 8px 0 0 20px;">
                        <li>Network connectivity issues</li>
                        <li>Jenkins server timeout</li>
                        <li>Server configuration problems</li>
                        <li>API endpoint not accessible</li>
                    </ul>
                </div>
                ${addBottomActionButton('jenkins')}
            </div>
        `, false);
    } finally {
        if (runBtn) {
            runBtn.disabled = false;
            runBtn.innerHTML = `<span>🤖</span><span>Run Fraud Story Prediction</span>`;
        }
    }
}

// Display Jenkins job results
function displayJenkinsJobResults(result) {
    console.log('Displaying Jenkins job results:', result);
    
    try {
        const jenkinsResultsHtml = `
            ${addBackButton('jenkins')}
            
            <div class="jenkins-results">
                <div class="jenkins-results-header">
                    <h3>
                        <span>🔧</span>
                        <span>Jenkins Job: ${result.display_name}</span>
                    </h3>
                    <div class="jenkins-status-badge jenkins-status-${result.status}">
                        ${result.status.toUpperCase()}
                    </div>
                </div>
                
                ${createJenkinsJobOverview(result)}
                ${createJenkinsParametersSection(result.parameters)}
                ${createJenkinsProgressSection(result)}
                ${createJenkinsEmailNotificationSection(result)}
                ${createJenkinsNextStepsSection(result)}
            </div>
            
            ${addBottomActionButton('jenkins', `Job ${result.status}`)}
        `;
        
        addMessage(jenkinsResultsHtml, false);
        
        // Start monitoring job status if needed
        if (result.status === 'triggered') {
            // Could implement status polling here if needed
            console.log('Job triggered successfully, monitoring can be implemented if needed');
        }
        
    } catch (error) {
        console.error('Error displaying Jenkins results:', error);
        addMessage(`
            <div class="error-message">
                <h4>❌ Display Error</h4>
                <p><strong>Error:</strong> ${error.message}</p>
                <div style="margin-top: 15px; padding: 10px; background: #2d2d30; border-radius: 6px; font-size: 0.8rem;">
                    <strong>Debug Info:</strong>
                    <pre style="color: #ccc; margin-top: 5px;">${JSON.stringify(result, null, 2).substring(0, 500)}...</pre>
                </div>
                ${addBottomActionButton('jenkins')}
            </div>
        `, false);
    }
}

// Create Jenkins job overview section
function createJenkinsJobOverview(result) {
    return `
        <div class="jenkins-section">
            <h4>📊 Job Execution Overview</h4>
            <div class="jenkins-grid">
                <div class="jenkins-metric">
                    <div class="jenkins-metric-value" style="color: #00ff88;">${result.job_name}</div>
                    <div class="jenkins-metric-label">Job Name</div>
                </div>
                <div class="jenkins-metric">
                    <div class="jenkins-metric-value" style="color: #ffaa00;">${result.estimated_runtime}</div>
                    <div class="jenkins-metric-label">Estimated Runtime</div>
                </div>
                <div class="jenkins-metric">
                    <div class="jenkins-metric-value" style="color: #88ccff;">${formatJobTimestamp(result.triggered_at)}</div>
                    <div class="jenkins-metric-label">Started At</div>
                </div>
                <div class="jenkins-metric">
                    <div class="jenkins-metric-value" style="color: #ff88cc;">Active</div>
                    <div class="jenkins-metric-label">Status</div>
                </div>
            </div>
        </div>
    `;
}

// Create Jenkins parameters section
function createJenkinsParametersSection(parameters) {
    if (!parameters || Object.keys(parameters).length === 0) {
        return `
            <div class="jenkins-section">
                <h4>⚙️ Job Parameters</h4>
                <div style="text-align: center; color: #888; padding: 20px;">
                    No parameters configured for this job
                </div>
            </div>
        `;
    }
    
    // Filter out internal parameters for display
    const displayParams = Object.entries(parameters).filter(([key, value]) => 
        !key.startsWith('triggered_') && key !== 'triggered_by'
    );
    
    return `
        <div class="jenkins-section">
            <h4>⚙️ Job Parameters</h4>
            <div class="jenkins-parameters">
                ${displayParams.map(([key, value]) => `
                    <div class="jenkins-parameter-item">
                        <span class="jenkins-parameter-name">${formatParameterName(key)}</span>
                        <span class="jenkins-parameter-value">${maskSensitiveValue(key, value)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Create Jenkins progress section
function createJenkinsProgressSection(result) {
    return `
        <div class="jenkins-section">
            <h4>⏱️ Execution Progress</h4>
            <div class="jenkins-progress">
                <div style="color: #00ff88; font-weight: 600; margin-bottom: 10px;">
                    Job execution in progress...
                </div>
                <div class="jenkins-progress-bar">
                    <div class="jenkins-progress-fill" style="width: 25%;"></div>
                </div>
                <div style="font-size: 0.8rem; color: #ccc; margin-top: 10px;">
                    Job has been queued and will begin execution shortly. Progress updates will be available in Jenkins console.
                </div>
                ${result.queue_location ? `
                    <div style="margin-top: 10px; font-size: 0.8rem;">
                        <strong style="color: #88ccff;">Queue Location:</strong> 
                        <span style="font-family: monospace; color: #ccc;">${result.queue_location}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Create Jenkins email notification section
function createJenkinsEmailNotificationSection(result) {
    const emailAddress = result.parameters?.email_id || 'specified email address';
    
    return `
        <div class="jenkins-section">
            <h4>📧 Email Notification Setup</h4>
            <div class="jenkins-email-notification">
                <h5>
                    <span>📬</span>
                    <span>Results will be delivered to: ${emailAddress}</span>
                </h5>
                <div style="font-size: 0.9rem; color: #cccccc; line-height: 1.4;">
                    <p style="margin: 8px 0;">The fraud story prediction report will include:</p>
                    <ul style="margin: 8px 0 8px 20px;">
                        <li>Comprehensive fraud analysis results</li>
                        <li>Prediction confidence scores and metrics</li>
                        <li>Detailed CSV data export with findings</li>
                        <li>Executive summary and recommendations</li>
                        <li>Trend analysis and risk indicators</li>
                    </ul>
                </div>
                <div style="background: #333; padding: 8px 12px; border-radius: 6px; margin-top: 10px; font-size: 0.8rem; color: #00ff88;">
                    <strong>Note:</strong> Email delivery typically occurs within 2-3 minutes of job completion
                </div>
            </div>
        </div>
    `;
}

// Create Jenkins next steps section
function createJenkinsNextStepsSection(result) {
    return `
        <div class="jenkins-section">
            <h4>🎯 Next Steps</h4>
            <div style="background: #2d2d30; border-radius: 8px; padding: 15px;">
                ${result.next_steps && result.next_steps.length > 0 ? `
                    <ol style="margin: 0; padding-left: 20px; color: #ffffff;">
                        ${result.next_steps.map(step => `
                            <li style="margin: 8px 0; line-height: 1.4;">${step}</li>
                        `).join('')}
                    </ol>
                ` : `
                    <div style="color: #cccccc;">
                        <p>Job execution details:</p>
                        <ul style="margin: 8px 0 0 20px;">
                            <li>Monitor progress in Jenkins console</li>
                            <li>Wait for email notification upon completion</li>
                            <li>Review results and take appropriate actions</li>
                        </ul>
                    </div>
                `}
                
                <div style="margin-top: 15px; padding: 10px; background: #1a2d1a; border-radius: 6px; border-left: 4px solid #00ff88;">
                    <strong style="color: #00ff88;">Pro Tip:</strong>
                    <span style="color: #cccccc; font-size: 0.9rem;">
                        You can continue using the application while the job runs in the background. 
                        The email notification will confirm completion and provide all results.
                    </span>
                </div>
            </div>
        </div>
    `;
}

// Helper functions for Jenkins

function formatParameterName(paramName) {
    return paramName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function maskSensitiveValue(key, value) {
    // Don't mask email addresses, but could mask other sensitive data if needed
    if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
        return '*'.repeat(8);
    }
    return value;
}

function formatDuration(durationMs) {
    if (!durationMs || durationMs === 0) return 'N/A';
    
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    } else {
        return `${remainingSeconds}s`;
    }
}

function formatBuildTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    
    try {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'Invalid date';
    }
}

function formatJobTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch {
        return 'Invalid time';
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Update the goBackToForm function to handle Jenkins context
function goBackToJenkinsJobs() {
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        const jenkinsJobsContent = `
            <div class="welcome-message">
                <h2>🔧 Jenkins Job Management</h2>
                <p>Choose the Jenkins job you want to execute:</p>
                
                <div class="jenkins-jobs-options">
                    <div class="jenkins-job-option" onclick="showJenkinsJobForm('fraud_story_prediction')">
                        <div class="jenkins-job-icon">🤖</div>
                        <h4>Fraud Story Prediction</h4>
                        <p>AI-powered fraud story prediction based on enterprise release data with automated email notifications</p>
                        <div style="margin-top: 10px; font-size: 0.7rem; color: #888;">
                            <strong>Parameters:</strong> Enterprise Release, Email ID
                        </div>
                        <div style="margin-top: 5px; font-size: 0.7rem; color: #888;">
                            <strong>Runtime:</strong> 5-10 minutes • <strong>Output:</strong> Email report
                        </div>
                    </div>
                    
                    <!-- Placeholder for future Jenkins jobs -->
                    <div class="jenkins-job-option disabled" style="opacity: 0.5; cursor: not-allowed;" title="Coming Soon">
                        <div class="jenkins-job-icon">📊</div>
                        <h4>Performance Analysis</h4>
                        <p>Automated performance testing and analysis with detailed reporting</p>
                        <div style="margin-top: 10px; font-size: 0.7rem; color: #888;">
                            <strong>Status:</strong> Coming Soon
                        </div>
                    </div>
                    
                    <div class="jenkins-job-option disabled" style="opacity: 0.5; cursor: not-allowed;" title="Coming Soon">
                        <div class="jenkins-job-icon">🔄</div>
                        <h4>Deployment Pipeline</h4>
                        <p>Automated deployment with rollback capabilities and monitoring</p>
                        <div style="margin-top: 10px; font-size: 0.7rem; color: #888;">
                            <strong>Status:</strong> Coming Soon
                        </div>
                    </div>
                </div>
                
                <!-- Jenkins Connection Status -->
                <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #1a2d1a, #2d3a2d); border: 1px solid #00ff88; border-radius: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <span style="font-size: 1.5rem;">🔧</span>
                        <h4 style="color: #00ff88; margin: 0;">Jenkins Integration</h4>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 0.8rem;">
                        <div style="padding: 8px; background: rgba(0,255,136,0.1); border-radius: 6px;">
                            <strong style="color: #00ff88;">🎯 Automated Execution</strong><br>
                            <span style="color: #ccc;">Parameterized job triggering with validation</span>
                        </div>
                        <div style="padding: 8px; background: rgba(0,255,136,0.1); border-radius: 6px;">
                            <strong style="color: #00ff88;">📧 Email Notifications</strong><br>
                            <span style="color: #ccc;">Results delivered directly to your inbox</span>
                        </div>
                        <div style="padding: 8px; background: rgba(0,255,136,0.1); border-radius: 6px;">
                            <strong style="color: #00ff88;">⏱️ Real-time Status</strong><br>
                            <span style="color: #ccc;">Live job monitoring and progress tracking</span>
                        </div>
                        <div style="padding: 8px; background: rgba(0,255,136,0.1); border-radius: 6px;">
                            <strong style="color: #00ff88;">🔒 Secure Access</strong><br>
                            <span style="color: #ccc;">Token-based authentication and authorization</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        chatContainer.innerHTML = jenkinsJobsContent;
        showTab('jenkins');
    }
}

// Update the main goBackToForm function to handle Jenkins context
// Find the existing goBackToForm function and update it to include Jenkins case:

// Update the existing goBackToForm function to include jenkins case
/*
function goBackToForm(context) {
    // Clear the chat container and restore the welcome message
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        // Create the welcome message content based on context
        let welcomeContent = '';
        
        switch(context) {
            case 'jenkins':
                goBackToJenkinsJobs();
                return;
            case 'fraud':
                goBackToFraudAnalysis();
                return;
            case 'logs':
                goBackToLogAnalysis();
                return;
            // ... other cases for validation, security, jira
            default:
                // Default welcome content
                break;
        }
        
        // Continue with existing logic for other contexts...
    }
}
*/

// Jenkins debugging functions
async function debugJenkinsConnection() {
    console.log('=== JENKINS DEBUG START ===');
    
    try {
        const healthResponse = await fetch('/api/jenkins-health');
        const healthResult = await healthResponse.json();
        console.log('Jenkins Health Check:', healthResult);
        
        const jobsResponse = await fetch('/api/jenkins-jobs');
        const jobsResult = await jobsResponse.json();
        console.log('Available Jobs:', jobsResult);
        
        if (currentJenkinsJob) {
            const jobInfoResponse = await fetch(`/api/jenkins-job-info/${currentJenkinsJob}`);
            const jobInfoResult = await jobInfoResponse.json();
            console.log('Current Job Info:', jobInfoResult);
        }
        
        console.log('=== JENKINS DEBUG END ===');
        return {
            health: healthResult,
            jobs: jobsResult,
            currentJobInfo: currentJenkinsJob ? jobInfoResult : null
        };
        
    } catch (error) {
        console.error('Jenkins debug failed:', error);
        return { error: error.message };
    }
}

// Global function for easy testing
window.debugJenkinsConnection = debugJenkinsConnection;

// Test Jenkins job trigger with mock data
async function testJenkinsJobTrigger() {
    console.log('Testing Jenkins job trigger with mock data...');
    
    try {
        const result = await fetch('/api/jenkins-trigger-job', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                job_type: 'fraud_story_prediction',
                parameters: {
                    enterprise_release: 'test-release-1.0.0',
                    email_id: 'test@company.com'
                }
            })
        });
        
        const data = await result.json();
        console.log('Test trigger result:', data);
        return data;
        
    } catch (error) {
        console.error('Test trigger failed:', error);
        return { error: error.message };
    }
}

// Global function for testing
window.testJenkinsJobTrigger = testJenkinsJobTrigger;

// Add Jenkins-specific console helpers
console.log('🔧 Jenkins Debug Tools Available:');
console.log('- debugJenkinsConnection() - Test Jenkins connectivity and get job info');
console.log('- testJenkinsJobTrigger() - Test job trigger with mock data');
console.log('- currentJenkinsJob - Current selected job type');

// Add real-time job status monitoring (optional feature)
let jobMonitoringInterval = null;

function startJobMonitoring(jobType, buildNumber) {
    console.log(`Starting job monitoring for ${jobType} build ${buildNumber}`);
    
    // Clear any existing monitoring
    if (jobMonitoringInterval) {
        clearInterval(jobMonitoringInterval);
    }
    
    jobMonitoringInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/jenkins-build-status/${jobType}/${buildNumber}`);
            const result = await response.json();
            
            if (result.success) {
                console.log('Job status update:', result);
                
                // Update UI if job is complete
                if (result.status === 'completed') {
                    console.log('Job completed:', result.result);
                    clearInterval(jobMonitoringInterval);
                    jobMonitoringInterval = null;
                    
                    // Could show completion notification here
                    if (result.result === 'SUCCESS') {
                        console.log('✅ Job completed successfully');
                    } else {
                        console.log('❌ Job failed:', result.result);
                    }
                }
            }
        } catch (error) {
            console.error('Job monitoring error:', error);
        }
    }, 10000); // Check every 10 seconds
}

function stopJobMonitoring() {
    if (jobMonitoringInterval) {
        clearInterval(jobMonitoringInterval);
        jobMonitoringInterval = null;
        console.log('Job monitoring stopped');
    }
}

// Cleanup monitoring on page unload
window.addEventListener('beforeunload', stopJobMonitoring);

// Jenkins job status polling function (can be called manually)
async function checkJenkinsJobStatus(jobType, buildNumber) {
    try {
        const response = await fetch(`/api/jenkins-build-status/${jobType}/${buildNumber}`);
        const result = await response.json();
        console.log('Job status:', result);
        return result;
    } catch (error) {
        console.error('Status check failed:', error);
        return { error: error.message };
    }
}

// Global function for manual status checking
window.checkJenkinsJobStatus = checkJenkinsJobStatus;

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showJenkinsJobForm,
        previewJenkinsJob,
        testJenkinsConnection,
        triggerJenkinsJob,
        displayJenkinsJobResults,
        formatParameterName,
        formatDuration,
        formatBuildTimestamp,
        formatJobTimestamp,
        isValidEmail,
        debugJenkinsConnection,
        testJenkinsJobTrigger
    };
}

// Global variable to track security analysis state
let currentSecurityAnalysis = null;

// Function to show security analysis interface
function showSecurityAnalysis() {
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) return;
    
    const securityAnalysisContent = `
        <div class="tab-content" id="security-analysis-tab">
            <h3>🔒 Fraud & Security Analysis</h3>
            <p style="color: #cccccc; margin-bottom: 25px; text-align: center; font-size: 1rem;">
                AI-powered fraud and security analysis for Jira tickets with comprehensive reporting
            </p>
            
            <div class="security-analysis-container">
                <div class="security-command-section">
                    <h4>Natural Language Commands</h4>
                    <p style="color: #888; margin-bottom: 15px; font-size: 0.9rem;">
                        Type commands like: "Do fraud & security analysis for ticket PROJ-123"
                    </p>
                    
                    <div class="input-group">
                        <input type="text" 
                               id="security-command-input" 
                               placeholder="Do fraud & security analysis for ticket TICKET-123"
                               class="form-input"
                               style="flex: 1; margin-right: 10px;">
                        <button onclick="processSecurityCommand()" 
                                class="btn btn-primary"
                                id="security-analyze-btn">
                            <span>🤖</span>
                            <span>Analyze</span>
                        </button>
                    </div>
                    
                    <div class="security-examples" style="margin-top: 15px;">
                        <h5>Example Commands:</h5>
                        <div class="example-commands">
                            <button class="example-cmd-btn" onclick="setSecurityCommand('Do fraud & security analysis for ticket PROJ-123')">
                                Fraud & Security Analysis
                            </button>
                            <button class="example-cmd-btn" onclick="setSecurityCommand('Run security analysis for ticket DEV-456')">
                                Security Analysis
                            </button>
                            <button class="example-cmd-btn" onclick="setSecurityCommand('Analyze ticket SUPPORT-789 for fraud')">
                                Fraud Analysis
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="security-features" style="margin-top: 30px;">
                    <h4>Analysis Features</h4>
                    <div class="feature-grid">
                        <div class="feature-item">
                            <div class="feature-icon">🔍</div>
                            <h5>Comprehensive Analysis</h5>
                            <p>AI analyzes ticket content, comments, attachments, and change history</p>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">⚠️</div>
                            <h5>Risk Assessment</h5>
                            <p>Fraud risk scoring (1-10) and security vulnerability identification</p>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">📊</div>
                            <h5>Impact Analysis</h5>
                            <p>Business impact assessment and compliance concern evaluation</p>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">📄</div>
                            <h5>Word Reports</h5>
                            <p>Professional Word documents with detailed findings and recommendations</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    chatContainer.innerHTML = securityAnalysisContent;
    showTab('security-analysis');
    
    // Add event listener for Enter key
    const commandInput = document.getElementById('security-command-input');
    if (commandInput) {
        commandInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                processSecurityCommand();
            }
        });
        commandInput.focus();
    }
}

// Function to set example commands
function setSecurityCommand(command) {
    const commandInput = document.getElementById('security-command-input');
    if (commandInput) {
        commandInput.value = command;
        commandInput.focus();
    }
}

// Main function to process security analysis commands
async function processSecurityCommand() {
    const commandInput = document.getElementById('security-command-input');
    const analyzeBtn = document.getElementById('security-analyze-btn');
    
    if (!commandInput || !commandInput.value.trim()) {
        showAlert('Please enter a security analysis command');
        return;
    }
    
    const command = commandInput.value.trim();
    
    // Show loading state
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<span>⏳</span><span>Processing...</span>';
    }
    
    // Add user message
    addMessage(`🔒 **Security Analysis Command:** ${command}`, false);
    
    // Add AI processing message
    const processingMessage = addMessage(`
        <div style="text-align: center; padding: 25px; background: #1a2d1a; border-radius: 10px; border: 1px solid #00ff88;">
            <div style="font-size: 2.5rem; margin-bottom: 15px;">🤖</div>
            <h4 style="color: #00ff88; margin-bottom: 15px;">AI Security Analysis in Progress</h4>
            <p style="color: #cccccc; margin-bottom: 20px;">Performing comprehensive fraud and security analysis...</p>
            
            <div style="background: #2d2d30; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <div style="color: #888; font-size: 0.9rem; line-height: 1.6;">
                    <div>🔍 Extracting comprehensive ticket data...</div>
                    <div>🧠 AI analyzing content for fraud indicators...</div>
                    <div>⚡ Assessing security vulnerabilities...</div>
                    <div>📊 Evaluating business impact and compliance...</div>
                    <div>📄 Generating professional Word report...</div>
                </div>
            </div>
            
            <div class="loading-spinner" style="margin: 0 auto;"></div>
        </div>
    `, false);
    
    try {
        const response = await fetch('/api/process-security-command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command: command })
        });

        const result = await response.json();
        
        // Remove processing message
        if (processingMessage) {
            processingMessage.remove();
        }

        if (result.success) {
            currentSecurityAnalysis = result;
            displaySecurityAnalysisResults(result);
        } else {
            addMessage(`❌ **Analysis Failed:** ${result.error}`, false);
        }
        
    } catch (error) {
        console.error('Security analysis error:', error);
        if (processingMessage) {
            processingMessage.remove();
        }
        addMessage(`❌ **Error:** Failed to process security analysis - ${error.message}`, false);
    } finally {
        // Reset button state
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<span>🤖</span><span>Analyze</span>';
        }
        
        // Clear input
        if (commandInput) {
            commandInput.value = '';
        }
    }
}

// Function to display security analysis results
function displaySecurityAnalysisResults(result) {
    const resultHtml = `
        <div style="background: #1a2d1a; border-radius: 12px; padding: 25px; border: 2px solid #00ff88; margin: 15px 0;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h3 style="color: #00ff88; margin-bottom: 10px;">✅ Security Analysis Complete</h3>
                <p style="color: #cccccc; font-size: 1.1rem;">Ticket: <strong>${result.ticket_key}</strong></p>
            </div>
            
            <div class="risk-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                <div class="risk-card" style="background: #2d2d30; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">🚨</div>
                    <h5 style="color: #ff6b6b; margin-bottom: 5px;">Fraud Risk</h5>
                    <p style="font-size: 1.2rem; font-weight: bold; color: white;">${result.fraud_risk_score}/10</p>
                </div>
                
                <div class="risk-card" style="background: #2d2d30; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">🔒</div>
                    <h5 style="color: #ffa500; margin-bottom: 5px;">Security Risk</h5>
                    <p style="font-size: 1.2rem; font-weight: bold; color: white;">${result.security_risk_level}</p>
                </div>
                
                <div class="risk-card" style="background: #2d2d30; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">📊</div>
                    <h5 style="color: #4ecdc4; margin-bottom: 5px;">Business Impact</h5>
                    <p style="font-size: 1.2rem; font-weight: bold; color: white;">${result.business_impact}</p>
                </div>
            </div>
            
            <div class="analysis-summary" style="background: #2d2d30; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="color: #00ff88; margin-bottom: 15px;">📋 Analysis Summary</h4>
                <p style="color: #cccccc; line-height: 1.6;">${result.analysis_summary}</p>
                
                <div style="margin-top: 15px; display: flex; gap: 20px; flex-wrap: wrap;">
                    <div style="color: #888;">
                        <span style="color: #00ff88;">Key Findings:</span> ${result.key_findings_count || 0}
                    </div>
                    <div style="color: #888;">
                        <span style="color: #00ff88;">Recommendations:</span> ${result.recommendations_count || 0}
                    </div>
                    <div style="color: #888;">
                        <span style="color: #00ff88;">Analysis Time:</span> ${new Date(result.analysis_timestamp).toLocaleString()}
                    </div>
                </div>
            </div>
            
            <div class="download-section" style="text-align: center;">
                <button onclick="downloadSecurityReport('${result.download_id}')" 
                        class="download-report-btn"
                        style="background: linear-gradient(45deg, #00ff88, #00cc6a); color: #000; border: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 1rem; margin: 10px;">
                    📄 Download Detailed Security Report
                </button>
                
                <p style="color: #888; font-size: 0.9rem; margin-top: 10px;">
                    Professional Word document with comprehensive analysis, findings, and recommendations
                </p>
            </div>
        </div>
    `;
    
    addMessage(resultHtml, false);
    
    // Scroll to show results
    scrollToBottom();
}

// Function to download security report
async function downloadSecurityReport(downloadId) {
    try {
        const downloadUrl = `/api/download-security-report/${downloadId}`;
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        showAlert('Report download started!', 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showAlert('Failed to download report. Please try again.', 'error');
    }
}

// Function to add security analysis to navigation (if you have a nav menu)
function addSecurityAnalysisToNav() {
    // This function can be called to add the security analysis option to your navigation
    // Adapt this based on your existing navigation structure
    
    const navContainer = document.querySelector('.nav-tabs') || document.querySelector('.main-nav');
    if (navContainer) {
        const securityTab = document.createElement('button');
        securityTab.className = 'tab-btn';
        securityTab.onclick = () => showSecurityAnalysis();
        securityTab.innerHTML = '🔒 Security Analysis';
        navContainer.appendChild(securityTab);
    }
}

// Enhanced alert function for better user feedback
function showAlert(message, type = 'info') {
    const alertClass = type === 'success' ? 'alert-success' : 
                     type === 'error' ? 'alert-error' : 'alert-info';
    
    const alertHtml = `
        <div class="custom-alert ${alertClass}" style="
            position: fixed; 
            top: 20px; 
            right: 20px; 
            padding: 15px 20px; 
            border-radius: 8px; 
            z-index: 1000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            ${type === 'success' ? 'background: #1a2d1a; border: 1px solid #00ff88; color: #00ff88;' : 
              type === 'error' ? 'background: #2d1a1a; border: 1px solid #ff6b6b; color: #ff6b6b;' : 
              'background: #1a1a2d; border: 1px solid #4a9eff; color: #4a9eff;'}
        ">
            ${message}
        </div>
    `;
    
    const alertElement = document.createElement('div');
    alertElement.innerHTML = alertHtml;
    document.body.appendChild(alertElement);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (alertElement.parentNode) {
            alertElement.parentNode.removeChild(alertElement);
        }
    }, 3000);
}

// Function to get security analysis debug info
function debugSecurityAnalysis() {
    console.log('=== SECURITY ANALYSIS DEBUG ===');
    console.log('Current Analysis:', currentSecurityAnalysis);
    console.log('Available Commands:', [
        'Do fraud & security analysis for ticket TICKET-123',
        'Run security analysis for ticket TICKET-123', 
        'Analyze ticket TICKET-123 for fraud'
    ]);
    console.log('================================');
    
    return {
        currentAnalysis: currentSecurityAnalysis,
        isConfigured: true // You can check actual config here
    };
}

// Add to global scope for debugging
window.debugSecurityAnalysis = debugSecurityAnalysis;
window.showSecurityAnalysis = showSecurityAnalysis;

// Auto-initialize security analysis if called directly
if (typeof window !== 'undefined') {
    // You can call addSecurityAnalysisToNav() here if you want to auto-add to navigation
    console.log('Security Analysis module loaded successfully');
}

function isSecurityAnalysisCommand(query) {
    const securityPatterns = [
        /(?:do|perform|run)\s+fraud\s*[&+]\s*security\s+analysis/i,
        /(?:do|perform|run)\s+security\s+analysis/i,
        /(?:do|perform|run)\s+fraud\s+analysis/i,
        /analyze\s+(?:ticket\s+)?[A-Z]+-\d+\s+(?:for\s+)?(?:fraud|security)/i,
        /security\s+(?:review|analysis|check)\s+(?:for\s+)?(?:ticket\s+)?[A-Z]+-\d+/i,
        /fraud\s+(?:review|analysis|check)\s+(?:for\s+)?(?:ticket\s+)?[A-Z]+-\d+/i,
        /(?:fraud|security)\s+(?:and|&)\s+(?:security|fraud)\s+(?:analysis|review)/i
    ];
    
    return securityPatterns.some(pattern => pattern.test(query));
}

// New function to handle security analysis within Jira tab
async function processSecurityAnalysisInJiraTab(query) {
    const queryInput = document.getElementById('queryInput');
    const sendButton = document.getElementById('sendButton');
    
    // Show loading state
    if (sendButton) {
        sendButton.disabled = true;
        sendButton.innerHTML = '<span>⏳</span><span>Analyzing...</span>';
    }
    
    // Add user message
    addMessage(`🔒 **Security Analysis Request:** ${query}`, true);
    
    // Add AI processing message
    const processingMessage = addMessage(`
        <div style="text-align: center; padding: 25px; background: #1a2d1a; border-radius: 10px; border: 1px solid #00ff88;">
            <div style="font-size: 2.5rem; margin-bottom: 15px;">🤖</div>
            <h4 style="color: #00ff88; margin-bottom: 15px;">AI Security Analysis in Progress</h4>
            <p style="color: #cccccc; margin-bottom: 20px;">Performing comprehensive fraud and security analysis...</p>
            
            <div style="background: #2d2d30; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <div style="color: #888; font-size: 0.9rem; line-height: 1.6;">
                    <div>🔍 Extracting comprehensive ticket data...</div>
                    <div>🧠 AI analyzing content for fraud indicators...</div>
                    <div>⚡ Assessing security vulnerabilities...</div>
                    <div>📊 Evaluating business impact and compliance...</div>
                    <div>📄 Generating professional Word report...</div>
                </div>
            </div>
            
            <div class="loading-spinner" style="margin: 0 auto;"></div>
        </div>
    `, false);
    
    try {
        const response = await fetch('/api/process-security-command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command: query })
        });

        const result = await response.json();
        
        // Remove processing message
        if (processingMessage) {
            processingMessage.remove();
        }

        if (result.success) {
            displaySecurityAnalysisResultsInJira(result);
        } else {
            addMessage(`❌ **Security Analysis Failed:** ${result.error}`, false);
        }
        
    } catch (error) {
        console.error('Security analysis error:', error);
        if (processingMessage) {
            processingMessage.remove();
        }
        addMessage(`❌ **Error:** Failed to process security analysis - ${error.message}`, false);
    } finally {
        // Reset button state
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.innerHTML = '<span>🚀</span><span>Send</span>';
        }
        
        // Clear input
        if (queryInput) {
            queryInput.value = '';
        }
    }
}

// New function to handle regular Jira queries (your existing logic)
async function processRegularJiraQuery(query) {
    const queryInput = document.getElementById('queryInput');
    const sendButton = document.getElementById('sendButton');
    
    // Add user message with back button context
    const userMessageHtml = `
        <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
            <div style="max-width: 70%; padding: 15px 20px; background: #000000; color: white; border-radius: 18px; border-bottom-right-radius: 6px;">
                ${query}
            </div>
        </div>
    `;
    
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        chatContainer.innerHTML += userMessageHtml;
    }

    // Show loading state
    if (sendButton) {
        sendButton.disabled = true;
        sendButton.innerHTML = '<span>⏳</span><span>Searching...</span>';
    }

    // Add loading message
    addMessage('', false, true);

    try {
        const response = await fetch('/api/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query })
        });

        const result = await response.json();

        // Remove loading message
        removeLoadingMessage();

        if (result.success && result.data) {
            const responseHtml = formatJiraResponse(result.data);
            addMessage(responseHtml, false);
        } else {
            const errorMessage = result.error || 'Unknown error occurred';
            addMessage(`❌ **Error:** ${errorMessage}`, false);
        }

    } catch (error) {
        console.error('Query error:', error);
        removeLoadingMessage();
        addMessage(`❌ **Error:** Failed to process query - ${error.message}`, false);
    } finally {
        // Reset button state
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.innerHTML = '<span>🚀</span><span>Send</span>';
        }
        
        // Clear input
        if (queryInput) {
            queryInput.value = '';
        }
    }
}

// New function to display security analysis results in Jira tab
function displaySecurityAnalysisResultsInJira(result) {
    const resultHtml = `
        <div style="background: #1a2d1a; border-radius: 12px; padding: 25px; border: 2px solid #00ff88; margin: 15px 0;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h3 style="color: #00ff88; margin-bottom: 10px;">✅ Security Analysis Complete</h3>
                <p style="color: #cccccc; font-size: 1.1rem;">Ticket: <strong>${result.ticket_key}</strong></p>
            </div>
            
            <div class="risk-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                <div class="risk-card" style="background: #2d2d30; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">🚨</div>
                    <h5 style="color: #ff6b6b; margin-bottom: 5px;">Fraud Risk</h5>
                    <p style="font-size: 1.2rem; font-weight: bold; color: white;">${result.fraud_risk_score}/10</p>
                </div>
                
                <div class="risk-card" style="background: #2d2d30; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">🔒</div>
                    <h5 style="color: #ffa500; margin-bottom: 5px;">Security Risk</h5>
                    <p style="font-size: 1.2rem; font-weight: bold; color: white;">${result.security_risk_level}</p>
                </div>
                
                <div class="risk-card" style="background: #2d2d30; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">📊</div>
                    <h5 style="color: #4ecdc4; margin-bottom: 5px;">Business Impact</h5>
                    <p style="font-size: 1.2rem; font-weight: bold; color: white;">${result.business_impact}</p>
                </div>
            </div>
            
            <div class="analysis-summary" style="background: #2d2d30; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="color: #00ff88; margin-bottom: 15px;">📋 Analysis Summary</h4>
                <p style="color: #cccccc; line-height: 1.6;">${result.analysis_summary}</p>
                
                <div style="margin-top: 15px; display: flex; gap: 20px; flex-wrap: wrap;">
                    <div style="color: #888;">
                        <span style="color: #00ff88;">Key Findings:</span> ${result.key_findings_count || 0}
                    </div>
                    <div style="color: #888;">
                        <span style="color: #00ff88;">Recommendations:</span> ${result.recommendations_count || 0}
                    </div>
                    <div style="color: #888;">
                        <span style="color: #00ff88;">Analysis Time:</span> ${new Date(result.analysis_timestamp).toLocaleString()}
                    </div>
                </div>
            </div>
            
            <div class="download-section" style="text-align: center;">
                <button onclick="downloadSecurityReport('${result.download_id}')" 
                        class="download-report-btn"
                        style="background: linear-gradient(45deg, #00ff88, #00cc6a); color: #000; border: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 1rem; margin: 10px;">
                    📄 Download Detailed Security Report
                </button>
                
                <p style="color: #888; font-size: 0.9rem; margin-top: 10px;">
                    Professional Word document with comprehensive analysis, findings, and recommendations
                </p>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="showMoreSecurityOptions()" 
                        style="background: #333; color: #cccccc; border: 1px solid #555; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                    🔍 Analyze Another Ticket
                </button>
            </div>
        </div>
    `;
    
    addMessage(resultHtml, false);
    scrollToBottom();
}

// Helper function to show more security options
function showMoreSecurityOptions() {
    const queryInput = document.getElementById('queryInput');
    if (queryInput) {
        queryInput.placeholder = 'Try: "Do fraud & security analysis for ticket PROJ-456"';
        queryInput.focus();
    }
}

// Function to download security report (reused from previous implementation)
async function downloadSecurityReport(downloadId) {
    try {
        const downloadUrl = `/api/download-security-report/${downloadId}`;
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        showAlert('Security report download started!', 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showAlert('Failed to download report. Please try again.', 'error');
    }
}

// Enhanced alert function for better user feedback
function showAlert(message, type = 'info') {
    const alertClass = type === 'success' ? 'alert-success' : 
                     type === 'error' ? 'alert-error' : 'alert-info';
    
    const alertHtml = `
        <div class="custom-alert ${alertClass}" style="
            position: fixed; 
            top: 20px; 
            right: 20px; 
            padding: 15px 20px; 
            border-radius: 8px; 
            z-index: 1000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            ${type === 'success' ? 'background: #1a2d1a; border: 1px solid #00ff88; color: #00ff88;' : 
              type === 'error' ? 'background: #2d1a1a; border: 1px solid #ff6b6b; color: #ff6b6b;' : 
              'background: #1a1a2d; border: 1px solid #4a9eff; color: #4a9eff;'}
        ">
            ${message}
        </div>
    `;
    
    const alertElement = document.createElement('div');
    alertElement.innerHTML = alertHtml;
    document.body.appendChild(alertElement);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (alertElement.parentNode) {
            alertElement.parentNode.removeChild(alertElement);
        }
    }, 3000);
}

// Helper function to scroll to bottom
function scrollToBottom() {
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}


// Enhanced frontend JavaScript for JWT validation display
// Add to static/js/main.js

// Enhanced fraud analysis function with JWT validation
async function performFraudAnalysis() {
    console.log('Starting enhanced fraud analysis with JWT validation...');
    
    const sessionIdInput = document.getElementById('sessionId');
    const fraudTypeSelect = document.getElementById('fraudType');
    const analyzeBtn = document.querySelector('.analyze-button');
    
    if (!sessionIdInput || !fraudTypeSelect) {
        console.error('Required inputs not found');
        return;
    }
    
    const sessionId = sessionIdInput.value.trim();
    const fraudType = fraudTypeSelect.value;
    
    if (!sessionId || !fraudType) {
        showAlert('Please enter session ID and select fraud type');
        return;
    }
    
    // Show loading state
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '🔄 Analyzing with JWT Validation...';
    }
    
    try {
        console.log('Sending enhanced fraud analysis request:', sessionId, fraudType);
        
        const response = await fetch('/api/fraud-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                fraud_type: fraudType,
                include_jwt_validation: true
            })
        });

        const result = await response.json();
        console.log('Enhanced fraud analysis result:', result);

        if (result.success) {
            displayEnhancedFraudResults(result);
        } else {
            addMessage(`<div class="error-message">Error: ${result.error}</div>`, false);
        }
        
    } catch (error) {
        console.error('Enhanced fraud analysis error:', error);
        addMessage(`<div class="error-message">Network Error: ${error.message}</div>`, false);
    } finally {
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '🚨 Analyze Fraud Patterns';
        }
    }
}

function displayEnhancedFraudResults(result) {
    console.log('Displaying enhanced fraud results with JWT validation:', result);
    
    const analysis = result.analysis || {};
    const jwtValidation = result.jwt_validation || {};
    const aiInsights = analysis.ai_insights || {};
    
    // Create comprehensive results display
    const enhancedResultsHtml = `
        ${addBackButton('fraud-analysis')}
        
        <!-- Session Overview -->
        <div class="fraud-results-container">
            <div class="fraud-header">
                <h3 style="display: flex; align-items: center; gap: 10px;">
                    <span>🚨</span>
                    <span>Enhanced Fraud Analysis: ${result.session_id}</span>
                </h3>
                <div class="analysis-badges">
                    <span class="badge badge-${result.fraud_type}">${result.fraud_type.replace('_', ' ').toUpperCase()}</span>
                    <span class="badge badge-jwt">JWT VALIDATED</span>
                    <span class="badge badge-score">Score: ${aiInsights.session_score || 0}/100</span>
                </div>
            </div>
            
            <!-- JWT Validation Summary -->
            ${generateJWTValidationSummary(jwtValidation)}
            
            <!-- JWT Tokens Table -->
            ${generateJWTTokensTable(jwtValidation)}
            
            <!-- Identity Consistency Table -->
            ${generateIdentityConsistencyTable(jwtValidation)}
            
            <!-- Header Analysis Table -->
            ${generateHeaderAnalysisTable(jwtValidation)}
            
            <!-- AI Insights Enhanced -->
            ${generateEnhancedAIInsights(aiInsights, jwtValidation)}
            
            <!-- Fraud Monitoring Analysis -->
            ${generateFraudMonitoringTable(analysis)}
            
            <!-- Security Recommendations -->
            ${generateSecurityRecommendations(aiInsights, jwtValidation)}
        </div>
        
        ${addBottomActionButton('fraud-analysis')}
    `;
    
    addMessage(enhancedResultsHtml, false);
}

function generateJWTValidationSummary(jwtValidation) {
    const summary = jwtValidation.validation_summary || {};
    const riskLevel = summary.risk_level || 'UNKNOWN';
    const overallScore = summary.overall_score || 0;
    
    const getRiskColor = (level) => {
        switch(level) {
            case 'LOW': return '#00ff88';
            case 'MEDIUM': return '#ffaa00';
            case 'HIGH': return '#ff4444';
            default: return '#888888';
        }
    };
    
    const getRiskIcon = (level) => {
        switch(level) {
            case 'LOW': return '✅';
            case 'MEDIUM': return '⚠️';
            case 'HIGH': return '🚨';
            default: return '❓';
        }
    };
    
    return `
        <div class="jwt-validation-summary" style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 12px; border-left: 4px solid ${getRiskColor(riskLevel)};">
            <h4 style="color: #ffffff; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                <span>🔐</span>
                <span>JWT Identity Validation Summary</span>
            </h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div class="summary-metric">
                    <div style="color: #cccccc; font-size: 0.9rem;">Total JWT Tokens</div>
                    <div style="color: #ffffff; font-size: 1.4rem; font-weight: bold;">${summary.total_tokens_found || 0}</div>
                </div>
                
                <div class="summary-metric">
                    <div style="color: #cccccc; font-size: 0.9rem;">Successfully Decoded</div>
                    <div style="color: #00ff88; font-size: 1.4rem; font-weight: bold;">${summary.tokens_successfully_decoded || 0}</div>
                </div>
                
                <div class="summary-metric">
                    <div style="color: #cccccc; font-size: 0.9rem;">Validation Errors</div>
                    <div style="color: #ff4444; font-size: 1.4rem; font-weight: bold;">${summary.tokens_with_errors || 0}</div>
                </div>
                
                <div class="summary-metric">
                    <div style="color: #cccccc; font-size: 0.9rem;">Identity Consistency</div>
                    <div style="color: #00ff88; font-size: 1.4rem; font-weight: bold;">${Math.round(summary.identity_consistency_score || 100)}%</div>
                </div>
                
                <div class="summary-metric">
                    <div style="color: #cccccc; font-size: 0.9rem;">Risk Level</div>
                    <div style="color: ${getRiskColor(riskLevel)}; font-size: 1.4rem; font-weight: bold; display: flex; align-items: center; gap: 5px;">
                        <span>${getRiskIcon(riskLevel)}</span>
                        <span>${riskLevel}</span>
                    </div>
                </div>
                
                <div class="summary-metric">
                    <div style="color: #cccccc; font-size: 0.9rem;">Validation Score</div>
                    <div style="color: ${overallScore >= 80 ? '#00ff88' : overallScore >= 60 ? '#ffaa00' : '#ff4444'}; font-size: 1.4rem; font-weight: bold;">${overallScore}/100</div>
                </div>
            </div>
        </div>
    `;
}

function generateJWTTokensTable(jwtValidation) {
    const tokens = jwtValidation.jwt_tokens_found || [];
    const validations = jwtValidation.identity_consistency_checks || [];
    
    if (tokens.length === 0) {
        return `
            <div style="margin-bottom: 20px; padding: 15px; background: #2a2a2a; border-radius: 8px; border-left: 4px solid #ffaa00;">
                <h4 style="color: #ffffff; margin-bottom: 10px;">🔍 JWT Tokens Analysis</h4>
                <p style="color: #cccccc; margin: 0;">No JWT tokens found in session logs for analysis.</p>
            </div>
        `;
    }
    
    const tokenRows = tokens.map((token, index) => {
        const validation = validations.find(v => v.token_id && v.token_id.includes(token.log_id)) || {};
        const status = validation.validation_status || 'UNKNOWN';
        const identityData = validation.identity_data || {};
        
        const getStatusColor = (status) => {
            switch(status) {
                case 'DECODED': return '#00ff88';
                case 'INVALID_STRUCTURE': return '#ff4444';
                case 'ERROR': return '#ff4444';
                default: return '#ffaa00';
            }
        };
        
        const getStatusIcon = (status) => {
            switch(status) {
                case 'DECODED': return '✅';
                case 'INVALID_STRUCTURE': return '❌';
                case 'ERROR': return '⚠️';
                default: return '❓';
            }
        };
        
        // Extract identity values
        const userId = identityData.user_id?.value || 'N/A';
        const accountNumber = identityData.account_number?.value || 'N/A';
        const mdn = identityData.mdn?.value || 'N/A';
        const email = identityData.email?.value || 'N/A';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><code style="font-size: 0.8rem;">${token.log_id || 'Unknown'}</code></td>
                <td><code style="font-size: 0.8rem;">${token.api_endpoint || 'N/A'}</code></td>
                <td>${token.source_field || 'headers'}</td>
                <td>
                    <span style="color: ${getStatusColor(status)}; display: flex; align-items: center; gap: 5px;">
                        <span>${getStatusIcon(status)}</span>
                        <span>${status}</span>
                    </span>
                </td>
                <td><code style="font-size: 0.8rem;">${userId}</code></td>
                <td><code style="font-size: 0.8rem;">${accountNumber}</code></td>
                <td><code style="font-size: 0.8rem;">${mdn}</code></td>
                <td><code style="font-size: 0.8rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${email}</code></td>
                <td><small style="color: #cccccc;">${token.timestamp ? new Date(token.timestamp).toLocaleTimeString() : 'N/A'}</small></td>
            </tr>
        `;
    }).join('');
    
    return `
        <div style="margin-bottom: 25px;">
            <h4 style="color: #ffffff; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                <span>🎫</span>
                <span>JWT Tokens Detailed Analysis</span>
            </h4>
            
            <div style="overflow-x: auto; background: #1a1a1a; border-radius: 8px; border: 1px solid #333;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: #2a2a2a; border-bottom: 2px solid #444;">
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">#</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Log ID</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">API Endpoint</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Source</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Status</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">User ID</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Account #</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">MDN</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Email</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tokenRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateIdentityConsistencyTable(jwtValidation) {
    const consistencyChecks = (jwtValidation.identity_consistency_checks || [])
        .filter(check => check.check_type === 'IDENTITY_CONSISTENT' || check.check_type === 'IDENTITY_INCONSISTENCY');
    
    if (consistencyChecks.length === 0) {
        return `
            <div style="margin-bottom: 20px; padding: 15px; background: #2a2a2a; border-radius: 8px; border-left: 4px solid #888;">
                <h4 style="color: #ffffff; margin-bottom: 10px;">🔄 Identity Consistency Analysis</h4>
                <p style="color: #cccccc; margin: 0;">No identity consistency data available for analysis.</p>
            </div>
        `;
    }
    
    const consistencyRows = consistencyChecks.map(check => {
        const status = check.status || 'UNKNOWN';
        const severity = check.severity || 'INFO';
        const details = check.details || {};
        
        const getStatusColor = (status) => {
            switch(status) {
                case 'PASS': return '#00ff88';
                case 'RISK': return '#ff4444';
                default: return '#ffaa00';
            }
        };
        
        const getStatusIcon = (status) => {
            switch(status) {
                case 'PASS': return '✅';
                case 'RISK': return '🚨';
                default: return '⚠️';
            }
        };
        
        const getSeverityColor = (severity) => {
            switch(severity) {
                case 'INFO': return '#00aaff';
                case 'MEDIUM': return '#ffaa00';
                case 'HIGH': return '#ff4444';
                default: return '#888888';
            }
        };
        
        return `
            <tr>
                <td style="text-transform: capitalize;">${check.identity_field?.replace('_', ' ') || 'Unknown'}</td>
                <td>
                    <span style="color: ${getStatusColor(status)}; display: flex; align-items: center; gap: 5px;">
                        <span>${getStatusIcon(status)}</span>
                        <span>${status}</span>
                    </span>
                </td>
                <td>
                    <span style="color: ${getSeverityColor(severity)}; font-weight: 600;">${severity}</span>
                </td>
                <td style="max-width: 300px;">
                    <div style="color: #cccccc; font-size: 0.9rem;">${check.description || 'No description'}</div>
                    ${details.value ? `<div style="color: #00ff88; font-size: 0.8rem; margin-top: 2px;"><code>${details.value}</code></div>` : ''}
                </td>
                <td>
                    ${details.token_count ? `<span style="color: #ffaa00;">${details.token_count} tokens</span>` : 'N/A'}
                </td>
                <td>
                    ${details.unique_values && details.unique_values.length > 1 ? 
                        `<div style="color: #ff4444; font-size: 0.8rem;">${details.unique_values.join(', ')}</div>` : 
                        '<span style="color: #00ff88;">Consistent</span>'
                    }
                </td>
            </tr>
        `;
    }).join('');
    
    return `
        <div style="margin-bottom: 25px;">
            <h4 style="color: #ffffff; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                <span>🔄</span>
                <span>Identity Consistency Analysis</span>
            </h4>
            
            <div style="overflow-x: auto; background: #1a1a1a; border-radius: 8px; border: 1px solid #333;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: #2a2a2a; border-bottom: 2px solid #444;">
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Identity Field</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Status</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Severity</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Description</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Token Count</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Values Found</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${consistencyRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateHeaderAnalysisTable(jwtValidation) {
    const headerAnalysis = jwtValidation.header_analysis || [];
    
    if (headerAnalysis.length === 0) {
        return `
            <div style="margin-bottom: 20px; padding: 15px; background: #2a2a2a; border-radius: 8px; border-left: 4px solid #888;">
                <h4 style="color: #ffffff; margin-bottom: 10px;">📋 Header Analysis</h4>
                <p style="color: #cccccc; margin: 0;">No outgoing headers found for analysis.</p>
            </div>
        `;
    }
    
    const headerRows = headerAnalysis.map(analysis => {
        const authMethods = analysis.auth_methods || [];
        const securityHeaders = analysis.security_headers || [];
        const suspiciousPatterns = analysis.suspicious_patterns || [];
        
        return `
            <tr>
                <td><code style="font-size: 0.8rem;">${analysis.log_id || 'Unknown'}</code></td>
                <td><code style="font-size: 0.8rem;">${analysis.api_endpoint || 'N/A'}</code></td>
                <td>
                    ${authMethods.length > 0 ? 
                        authMethods.map(method => `
                            <div style="margin-bottom: 2px;">
                                <span style="color: #00ff88; font-weight: 600;">${method.method}</span>
                                <div style="color: #cccccc; font-size: 0.8rem;">${method.value_preview}</div>
                            </div>
                        `).join('') : 
                        '<span style="color: #888;">None</span>'
                    }
                </td>
                <td>
                    ${securityHeaders.length > 0 ? 
                        securityHeaders.map(header => `
                            <div style="margin-bottom: 2px;">
                                <span style="color: #00aaff;">${header.header_name}</span>
                                <span style="color: #888; font-size: 0.8rem;"> (${header.header_type})</span>
                            </div>
                        `).join('') : 
                        '<span style="color: #888;">None</span>'
                    }
                </td>
                <td>
                    ${suspiciousPatterns.length > 0 ? 
                        suspiciousPatterns.map(pattern => `
                            <div style="margin-bottom: 2px; color: ${pattern.severity === 'HIGH' ? '#ff4444' : pattern.severity === 'MEDIUM' ? '#ffaa00' : '#00aaff'};">
                                <strong>${pattern.pattern}</strong>
                                <div style="font-size: 0.8rem;">${pattern.description}</div>
                            </div>
                        `).join('') : 
                        '<span style="color: #00ff88;">None detected</span>'
                    }
                </td>
                <td><small style="color: #cccccc;">${analysis.timestamp ? new Date(analysis.timestamp).toLocaleTimeString() : 'N/A'}</small></td>
            </tr>
        `;
    }).join('');
    
    return `
        <div style="margin-bottom: 25px;">
            <h4 style="color: #ffffff; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                <span>📋</span>
                <span>Outgoing Headers Analysis</span>
            </h4>
            
            <div style="overflow-x: auto; background: #1a1a1a; border-radius: 8px; border: 1px solid #333;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: #2a2a2a; border-bottom: 2px solid #444;">
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Log ID</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">API Endpoint</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Auth Methods</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Security Headers</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Suspicious Patterns</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${headerRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateEnhancedAIInsights(aiInsights, jwtValidation) {
    const sessionScore = aiInsights.session_score || 0;
    const jwtScore = aiInsights.jwt_validation_score || 0;
    const keyFindings = aiInsights.key_findings || [];
    const recommendations = aiInsights.recommended_actions || [];
    
    const getScoreColor = (score) => {
        if (score >= 80) return '#00ff88';
        if (score >= 60) return '#ffaa00';
        return '#ff4444';
    };
    
    const getScoreIcon = (score) => {
        if (score >= 80) return '✅';
        if (score >= 60) return '⚠️';
        return '🚨';
    };
    
    return `
        <div style="margin-bottom: 25px;">
            <h4 style="color: #ffffff; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                <span>🤖</span>
                <span>Enhanced AI Insights</span>
            </h4>
            
            <!-- Score Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 20px; border-radius: 10px; text-align: center;">
                    <div style="color: #ffffff; font-size: 0.9rem; margin-bottom: 5px;">Overall Session Score</div>
                    <div style="color: ${getScoreColor(sessionScore)}; font-size: 2rem; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <span>${getScoreIcon(sessionScore)}</span>
                        <span>${sessionScore}/100</span>
                    </div>
                </div>
                
                <div style="background: linear-gradient(135deg, #7c2d12, #ea580c); padding: 20px; border-radius: 10px; text-align: center;">
                    <div style="color: #ffffff; font-size: 0.9rem; margin-bottom: 5px;">JWT Validation Score</div>
                    <div style="color: ${getScoreColor(jwtScore)}; font-size: 2rem; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <span>${getScoreIcon(jwtScore)}</span>
                        <span>${jwtScore}/100</span>
                    </div>
                </div>
            </div>
            
            <!-- Key Findings and Recommendations -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; border-left: 4px solid #00aaff;">
                    <h5 style="color: #00aaff; margin-bottom: 10px;">🔍 Key Findings</h5>
                    <ul style="color: #cccccc; margin: 0; padding-left: 20px;">
                        ${keyFindings.map(finding => `<li style="margin-bottom: 5px;">${finding}</li>`).join('')}
                    </ul>
                </div>
                
                <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; border-left: 4px solid #ffaa00;">
                    <h5 style="color: #ffaa00; margin-bottom: 10px;">💡 Recommendations</h5>
                    <ul style="color: #cccccc; margin: 0; padding-left: 20px;">
                        ${recommendations.map(rec => `<li style="margin-bottom: 5px;">${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
}

function generateFraudMonitoringTable(analysis) {
    const fraudMonitoring = analysis.fraud_monitoring_analysis || {};
    const totalCalls = fraudMonitoring.total_calls || 0;
    const successfulCalls = fraudMonitoring.successful_calls || 0;
    const failedCalls = fraudMonitoring.failed_calls || 0;
    const callCategories = fraudMonitoring.call_categories || {};
    
    if (totalCalls === 0) {
        return `
            <div style="margin-bottom: 20px; padding: 15px; background: #2a2a2a; border-radius: 8px; border-left: 4px solid #888;">
                <h4 style="color: #ffffff; margin-bottom: 10px;">📊 Fraud Monitoring Analysis</h4>
                <p style="color: #cccccc; margin: 0;">No fraud monitoring calls detected in session.</p>
            </div>
        `;
    }
    
    const successRate = ((successfulCalls / totalCalls) * 100).toFixed(1);
    const categoryRows = Object.entries(callCategories).map(([category, count]) => {
        return `
            <tr>
                <td style="text-transform: capitalize;">${category.replace('_', ' ')}</td>
                <td style="text-align: center; color: #00ff88; font-weight: 600;">${count}</td>
                <td style="text-align: center; color: #cccccc;">${((count / totalCalls) * 100).toFixed(1)}%</td>
                <td>
                    <div style="background: #333; height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="background: #00ff88; height: 100%; width: ${(count / totalCalls) * 100}%; transition: width 0.3s ease;"></div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    return `
        <div style="margin-bottom: 25px;">
            <h4 style="color: #ffffff; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                <span>📊</span>
                <span>Fraud Monitoring Analysis</span>
            </h4>
            
            <!-- Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #333;">
                    <div style="color: #cccccc; font-size: 0.9rem;">Total Calls</div>
                    <div style="color: #ffffff; font-size: 1.5rem; font-weight: bold;">${totalCalls}</div>
                </div>
                <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #333;">
                    <div style="color: #cccccc; font-size: 0.9rem;">Successful</div>
                    <div style="color: #00ff88; font-size: 1.5rem; font-weight: bold;">${successfulCalls}</div>
                </div>
                <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #333;">
                    <div style="color: #cccccc; font-size: 0.9rem;">Failed</div>
                    <div style="color: #ff4444; font-size: 1.5rem; font-weight: bold;">${failedCalls}</div>
                </div>
                <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #333;">
                    <div style="color: #cccccc; font-size: 0.9rem;">Success Rate</div>
                    <div style="color: ${successRate >= 80 ? '#00ff88' : successRate >= 60 ? '#ffaa00' : '#ff4444'}; font-size: 1.5rem; font-weight: bold;">${successRate}%</div>
                </div>
            </div>
            
            <!-- Category Breakdown -->
            <div style="background: #1a1a1a; border-radius: 8px; border: 1px solid #333;">
                <div style="background: #2a2a2a; padding: 15px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #444;">
                    <h5 style="color: #ffffff; margin: 0;">Call Categories Breakdown</h5>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #222; border-bottom: 1px solid #444;">
                            <th style="padding: 12px; text-align: left; color: #ffffff; font-weight: 600;">Category</th>
                            <th style="padding: 12px; text-align: center; color: #ffffff; font-weight: 600;">Count</th>
                            <th style="padding: 12px; text-align: center; color: #ffffff; font-weight: 600;">Percentage</th>
                            <th style="padding: 12px; text-align: left; color: #ffffff; font-weight: 600;">Distribution</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categoryRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateSecurityRecommendations(aiInsights, jwtValidation) {
    const recommendations = [];
    const jwtSummary = jwtValidation.validation_summary || {};
    
    // Generate dynamic recommendations based on JWT validation results
    if (jwtSummary.tokens_with_errors > 0) {
        recommendations.push({
            category: 'JWT Security',
            priority: 'HIGH',
            issue: 'Invalid JWT tokens detected',
            action: 'Investigate JWT token generation and validation processes',
            details: `${jwtSummary.tokens_with_errors} tokens failed validation`
        });
    }
    
    if (jwtSummary.identity_consistency_score < 95) {
        recommendations.push({
            category: 'Identity Validation',
            priority: 'MEDIUM',
            issue: 'Identity inconsistencies found',
            action: 'Review identity claim mapping and session management',
            details: `Consistency score: ${Math.round(jwtSummary.identity_consistency_score)}%`
        });
    }
    
    if (jwtSummary.security_issues_found > 0) {
        recommendations.push({
            category: 'Token Security',
            priority: 'MEDIUM',
            issue: 'Security indicators detected in JWT tokens',
            action: 'Review JWT signing algorithms and token expiration policies',
            details: `${jwtSummary.security_issues_found} security issues identified`
        });
    }
    
    // Add default recommendations if no issues found
    if (recommendations.length === 0) {
        recommendations.push({
            category: 'Monitoring',
            priority: 'LOW',
            issue: 'Validation passed all checks',
            action: 'Continue monitoring session patterns and maintain current security posture',
            details: 'All JWT validation checks passed successfully'
        });
    }
    
    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'HIGH': return '#ff4444';
            case 'MEDIUM': return '#ffaa00';
            case 'LOW': return '#00ff88';
            default: return '#888888';
        }
    };
    
    const getPriorityIcon = (priority) => {
        switch(priority) {
            case 'HIGH': return '🚨';
            case 'MEDIUM': return '⚠️';
            case 'LOW': return 'ℹ️';
            default: return '📋';
        }
    };
    
    const recommendationRows = recommendations.map(rec => {
        return `
            <tr>
                <td>
                    <span style="color: ${getPriorityColor(rec.priority)}; display: flex; align-items: center; gap: 5px; font-weight: 600;">
                        <span>${getPriorityIcon(rec.priority)}</span>
                        <span>${rec.priority}</span>
                    </span>
                </td>
                <td style="color: #00aaff; font-weight: 600;">${rec.category}</td>
                <td style="color: #cccccc;">${rec.issue}</td>
                <td style="color: #ffffff;">${rec.action}</td>
                <td style="color: #888; font-size: 0.9rem;">${rec.details}</td>
            </tr>
        `;
    }).join('');
    
    return `
        <div style="margin-bottom: 25px;">
            <h4 style="color: #ffffff; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                <span>🛡️</span>
                <span>Security Recommendations</span>
            </h4>
            
            <div style="overflow-x: auto; background: #1a1a1a; border-radius: 8px; border: 1px solid #333;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: #2a2a2a; border-bottom: 2px solid #444;">
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Priority</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Category</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Issue</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Recommended Action</th>
                            <th style="padding: 12px 8px; text-align: left; color: #ffffff; font-weight: 600;">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recommendationRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Enhanced CSS for JWT validation display
function addJWTValidationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .jwt-validation-summary .summary-metric {
            background: rgba(255, 255, 255, 0.05);
            padding: 10px;
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .fraud-results-container table {
            border-spacing: 0;
        }
        
        .fraud-results-container table td {
            padding: 10px 8px;
            border-bottom: 1px solid #333;
            vertical-align: top;
        }
        
        .fraud-results-container table tr:hover {
            background: rgba(255, 255, 255, 0.05);
        }
        
        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .badge-identity_fraud {
            background: #ff4444;
            color: white;
        }
        
        .badge-jwt {
            background: #00ff88;
            color: black;
        }
        
        .badge-score {
            background: #00aaff;
            color: white;
        }
        
        .fraud-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding: 15px;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border-radius: 8px;
            border-left: 4px solid #00ff88;
        }
        
        .analysis-badges {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
    `;
    document.head.appendChild(style);
}

// Initialize JWT validation styles when page loads
document.addEventListener('DOMContentLoaded', function() {
    addJWTValidationStyles();
});

// Export functions for use in other modules
window.performFraudAnalysis = performFraudAnalysis;
window.displayEnhancedFraudResults = displayEnhancedFraudResults;
