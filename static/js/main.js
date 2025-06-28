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

// Add back button functionality
function addBackButton(tabName) {
    return `
        <div style="margin-bottom: 20px;">
            <button onclick="goBackToForm('${tabName}')" 
                    style="background: #333333; color: #ffffff; border: 1px solid #555; padding: 10px 20px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; transition: all 0.2s;"
                    onmouseover="this.style.background='#444444'; this.style.transform='translateY(-1px)'"
                    onmouseout="this.style.background='#333333'; this.style.transform='translateY(0)'">
                <span>←</span>
                <span>Back to ${tabName === 'validation' ? 'Order Validation' : 'Security Analysis'}</span>
            </button>
        </div>
    `;
}

// Function to go back to the form
function goBackToForm(tabName) {
    // Clear the chat container and restore the welcome message
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        // Create the welcome message content
        const welcomeContent = `
            <div class="welcome-message">
                <h2>Welcome to your Enhanced Jira AI Assistant! 👋</h2>
                <p>Your Jira and Oracle DB connections are configured and ready. Choose your operation:</p>
                
                <div class="feature-tabs">
                    <button class="tab-button ${currentTab === 'jira' ? 'active' : ''}" onclick="showTab('jira')">
                        📋 Jira Queries
                    </button>
                    <button class="tab-button ${currentTab === 'validation' ? 'active' : ''}" onclick="showTab('validation')">
                        🔍 Order Validation
                    </button>
                    <button class="tab-button ${currentTab === 'security' ? 'active' : ''}" onclick="showTab('security')">
                        🛡️ Security Analysis
                    </button>
                </div>

                <div class="tab-content ${currentTab === 'jira' ? '' : 'hidden'}" id="jira-tab">
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

                <div class="tab-content ${currentTab === 'validation' ? '' : 'hidden'}" id="validation-tab">
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

                <div class="tab-content ${currentTab === 'security' ? '' : 'hidden'}" id="security-tab">
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
        `;
        
        chatContainer.innerHTML = welcomeContent;
        
        // Make sure the correct tab is shown and input visibility is set
        showTab(tabName);
        
        // Clear form inputs
        if (tabName === 'validation') {
            const orderNumber = document.getElementById('orderNumber');
            const locationCode = document.getElementById('locationCode');
            if (orderNumber) orderNumber.value = '';
            if (locationCode) locationCode.value = '';
        } else if (tabName === 'security') {
            const issueKey = document.getElementById('issueKey');
            if (issueKey) issueKey.value = '';
        }
    }
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
            
            <div style="margin-top: 25px; text-align: center;">
                <button onclick="goBackToForm('validation')" 
                        style="background: #000000; color: #ffffff; border: 1px solid #333; padding: 12px 24px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 600; transition: all 0.2s;"
                        onmouseover="this.style.background='#333333'; this.style.transform='translateY(-2px)'"
                        onmouseout="this.style.background='#000000'; this.style.transform='translateY(0)'">
                    <span>🔍</span>
                    <span>Validate Another Order</span>
                </button>
            </div>
        </div>
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
            
            <div style="margin-top: 25px; text-align: center;">
                <button onclick="goBackToForm('security')" 
                        style="background: #000000; color: #ffffff; border: 1px solid #333; padding: 12px 24px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 600; transition: all 0.2s;"
                        onmouseover="this.style.background='#333333'; this.style.transform='translateY(-2px)'"
                        onmouseout="this.style.background='#000000'; this.style.transform='translateY(0)'">
                    <span>🛡️</span>
                    <span>Analyze Another Issue</span>
                </button>
            </div>
        </div>
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
