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

    // Add user message with back button context
    const userMessageHtml = `
        <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
            <div style="max-width: 70%; padding: 15px 20px; border-radius: 18px; font-size: 0.95rem; line-height: 1.5; background: #000000; color: white; border-bottom-right-radius: 6px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="font-size: 0.8rem; opacity: 0.8;">💬 Your Question:</span>
                </div>
                ${query}
            </div>
        </div>
    `;
    
    // Remove welcome message and add user message
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        const welcomeMessage = chatContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        chatContainer.insertAdjacentHTML('beforeend', userMessageHtml);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // Clear input and reset height
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
            // Use the updated formatJiraResponse that includes back buttons
            const jiraResponseHtml = formatJiraResponse(result.data);
            addMessage(jiraResponseHtml, false);
        } else {
            const errorHtml = `
                ${addBackButton('jira')}
                <div class="error-message">Error: ${result.error}</div>
                ${addBottomActionButton('jira')}
            `;
            addMessage(errorHtml, false);
        }
        
    } catch (error) {
        console.error('Query error:', error);
        removeLoadingMessage();
        const networkErrorHtml = `
            ${addBackButton('jira')}
            <div class="error-message">Network Error: ${error.message}</div>
            ${addBottomActionButton('jira')}
        `;
        addMessage(networkErrorHtml, false);
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
    const div = document.createElement('div');
    div.textContent = text;
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
    if (!timestamp) return 'Unknown';
    try {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
    } catch {
        return timestamp;
    }
}


function createFraudMonitoringSection(monitoringAnalysis) {
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
    
    return `
        <div style="background: linear-gradient(135deg, #1a2d1a, #2d3a2d); border: 1px solid #00ff88; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
                <h5 style="color: #00ff88; margin: 0; display: flex; align-items: center; gap: 8px;">
                    🤖 AI Insights Summary
                </h5>
                <div style="background: ${getScoreColor(aiInsights.session_score)}20; color: ${getScoreColor(aiInsights.session_score)}; padding: 6px 12px; border-radius: 15px; font-size: 0.8rem; font-weight: 600; border: 1px solid ${getScoreColor(aiInsights.session_score)};">
                    Session Score: ${aiInsights.session_score || 'N/A'}/100
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
                            `<span style="background: #333; color: #fff; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; border: 1px solid #555;">${finding}</span>`
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
                                `<div style="color: #ff6666; margin: 4px 0;">• ${issue}</div>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${aiInsights.positive_indicators && aiInsights.positive_indicators.length > 0 ? `
                    <div>
                        <strong style="color: #00ff88; display: block; margin-bottom: 8px;">✅ Positive Indicators:</strong>
                        <div style="font-size: 0.8rem;">
                            ${aiInsights.positive_indicators.map(indicator => 
                                `<div style="color: #66ff88; margin: 4px 0;">• ${indicator}</div>`
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
    const isSuccessful = analysis.is_successful;
    const statusColor = isSuccessful ? '#00ff88' : '#ff4444';
    const statusText = isSuccessful ? 'Success' : 'Failed';
    const statusIcon = isSuccessful ? '✅' : '❌';
    const rowClass = isSuccessful ? 'api-success' : 'api-failed';
    const bgColor = index % 2 === 0 ? '#2d2d30' : '#1a1a1a';
    
    const confidenceScore = Math.round((analysis.confidence_score || 0) * 100);
    const scoreColor = confidenceScore >= 80 ? '#00ff88' : confidenceScore >= 60 ? '#ffaa00' : '#ff4444';
    
    return `
        <tr class="${rowClass}" style="background: ${bgColor}; transition: background-color 0.2s;" 
            onmouseover="this.style.background='#333333'" 
            onmouseout="this.style.background='${bgColor}'">
            
            <td style="border: 1px solid #444; padding: 8px; color: #00ff88; font-family: monospace; font-size: 0.8rem;">
                ${formatAPITimestamp(analysis.timestamp)}
            </td>
            
            <td style="border: 1px solid #444; padding: 8px; color: #88ccff; font-family: monospace; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                <div title="${analysis.api_endpoint || 'Unknown'}">${truncateText(analysis.api_endpoint || 'Unknown', 25)}</div>
                ${analysis.component ? `<small style="color: #888; font-size: 0.7rem;">${analysis.component}</small>` : ''}
            </td>
            
            <td style="border: 1px solid #444; padding: 8px; text-align: center;">
                <span style="background: ${getHttpMethodColor(analysis.http_method)}20; color: ${getHttpMethodColor(analysis.http_method)}; padding: 3px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">
                    ${analysis.http_method || 'N/A'}
                </span>
            </td>
            
            <td style="border: 1px solid #444; padding: 8px; text-align: center;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                    <span style="color: ${statusColor}; font-size: 1rem;">${statusIcon}</span>
                    <span style="color: ${statusColor}; font-size: 0.7rem; font-weight: 600;">${statusText}</span>
                    ${analysis.status_code ? `<span style="color: #888; font-size: 0.6rem;">${analysis.status_code}</span>` : ''}
                </div>
            </td>
            
            <td style="border: 1px solid #444; padding: 8px; color: #ffffff; max-width: 250px;">
                <div style="font-size: 0.8rem; line-height: 1.3;">
                    ${truncateText(analysis.request_purpose || 'Purpose not identified', 40)}
                </div>
                ${analysis.fraud_relevance ? `
                    <div style="margin-top: 4px; font-size: 0.7rem; color: #ffaa88; font-style: italic;">
                        ${truncateText(analysis.fraud_relevance, 50)}
                    </div>
                ` : ''}
            </td>
            
            <td style="border: 1px solid #444; padding: 8px; color: #cccccc; max-width: 250px;">
                <div style="font-size: 0.8rem; line-height: 1.3;">
                    ${truncateText(analysis.response_analysis || 'No analysis available', 60)}
                </div>
                ${analysis.error_details ? `
                    <div style="margin-top: 4px; padding: 4px; background: #2d1a1a; border-radius: 4px; border-left: 2px solid #ff4444;">
                        <span style="font-size: 0.7rem; color: #ff6666;">Error: ${truncateText(analysis.error_details, 50)}</span>
                    </div>
                ` : ''}
                ${analysis.processing_time_ms ? `
                    <div style="margin-top: 4px; font-size: 0.7rem; color: #888;">
                        ⏱️ ${analysis.processing_time_ms}ms
                    </div>
                ` : ''}
            </td>
            
            <td style="border: 1px solid #444; padding: 8px; color: #ffffff;">
                ${analysis.risk_indicators && analysis.risk_indicators.length > 0 ? `
                    <div style="display: flex; flex-wrap: wrap; gap: 2px;">
                        ${analysis.risk_indicators.slice(0, 3).map(indicator => 
                            `<span style="background: #ff444420; color: #ff6666; padding: 2px 4px; border-radius: 6px; font-size: 0.6rem; border: 1px solid #ff4444;" title="${indicator}">
                                ${truncateText(indicator, 10)}
                            </span>`
                        ).join('')}
                        ${analysis.risk_indicators.length > 3 ? `<span style="color: #888; font-size: 0.6rem;">+${analysis.risk_indicators.length - 3}</span>` : ''}
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
        return timestamp.substring(0, 16);
    }
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}// Add these functions to main.js for fraud analysis functionality

// Global variable to track current fraud type
let currentFraudType = null;

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
        analyzeBtn.innerHTML = '<span>🔄</span><span>Analyzing...</span>';
    }
    
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

        if (result.success) {
            displayFraudResults(result);
        } else {
            addMessage(`<div class="error-message">❌ Error: ${result.error}</div>`, false);
        }
        
    } catch (error) {
        console.error('Fraud analysis error:', error);
        addMessage(`<div class="error-message">❌ Network Error: ${error.message}</div>`, false);
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
    
    const analysis = result.analysis;
    const fraudConfig = getFraudConfig(result.fraud_type);
    const riskLevel = analysis.risk_assessment;
    
    const fraudResultsHtml = `
        ${addBackButton('fraud')}
        
        <div class="fraud-results">
            <div class="fraud-results-header">
                <h3>
                    <span>${fraudConfig.icon}</span>
                    <span>${fraudConfig.title}: ${result.session_id}</span>
                </h3>
                <div class="fraud-risk-badge fraud-risk-${riskLevel.level.toLowerCase()}">
                    ${riskLevel.level} RISK (${Math.round(riskLevel.score)}/100)
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
    const triggeredCalls = monitoringAnalysis.triggered_calls || {};
    const callSequence = monitoringAnalysis.call_sequence || [];
    
    let monitoringHtml = `
        <div class="fraud-section">
            <h4>🔍 Fraud Monitoring Analysis</h4>
            <div style="margin-bottom: 15px;">
                <strong style="color: #ffaa00;">Monitoring Categories Triggered:</strong>
            </div>
    `;
    
    if (Object.keys(triggeredCalls).length === 0) {
        monitoringHtml += `
            <div style="text-align: center; padding: 20px; background: #2d2d30; border-radius: 8px; color: #888;">
                No fraud monitoring calls detected in the logs
            </div>
        `;
    } else {
        monitoringHtml += '<div class="fraud-grid">';
        
        Object.entries(triggeredCalls).forEach(([category, calls]) => {
            const successCount = calls.filter(call => call.success).length;
            const totalCount = calls.length;
            const successRate = totalCount > 0 ? (successCount / totalCount) : 0;
            const categoryColor = successRate >= 0.8 ? '#00ff88' : successRate >= 0.6 ? '#ffaa00' : '#ff4444';
            
            monitoringHtml += `
                <div style="background: #2d2d30; border: 1px solid #444; border-radius: 6px; padding: 15px;">
                    <strong style="color: ${categoryColor};">${category.replace('_', ' ').toUpperCase()}</strong>
                    <div style="margin-top: 8px;">
                        <div style="font-size: 1.2rem; color: ${categoryColor}; margin-bottom: 5px;">${successCount}/${totalCount}</div>
                        <div style="font-size: 0.8rem; color: #ccc;">Success Rate: ${Math.round(successRate * 100)}%</div>
                        <div style="margin-top: 8px;">
                            ${calls.map(call => 
                                `<div style="font-size: 0.7rem; color: ${call.success ? '#00ff88' : '#ff4444'}; margin: 2px 0;">
                                    ${call.success ? '✅' : '❌'} ${call.call_type}
                                </div>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            `;
        });
        
        monitoringHtml += '</div>';
    }
    
    // Add failed calls section if any
    const failedCalls = monitoringAnalysis.failed_calls || [];
    if (failedCalls.length > 0) {
        monitoringHtml += `
            <div style="margin-top: 20px; padding: 15px; background: #2d1a1a; border-radius: 8px; border-left: 4px solid #ff4444;">
                <strong style="color: #ff4444;">⚠️ Failed Monitoring Calls (${failedCalls.length}):</strong>
                <div style="margin-top: 10px;">
                    ${failedCalls.slice(0, 5).map(call => `
                        <div style="font-size: 0.8rem; color: #ff6666; margin: 5px 0; padding: 8px; background: #331a1a; border-radius: 4px;">
                            <strong>${call.category}</strong>: ${call.call_type} - ${call.message.substring(0, 100)}${call.message.length > 100 ? '...' : ''}
                        </div>
                    `).join('')}
                    ${failedCalls.length > 5 ? `<div style="color: #888; font-size: 0.8rem; margin-top: 5px;">... and ${failedCalls.length - 5} more</div>` : ''}
                </div>
            </div>
        `;
    }
    
    monitoringHtml += '</div>';
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
