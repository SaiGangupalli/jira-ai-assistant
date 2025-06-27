# app.py - Fixed Main Flask Application
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import logging
import json
from datetime import datetime
from enum import Enum

# Import our custom modules
try:
    from config.settings import Config
    from services.jira_service import JiraService
    from services.security_service import SecurityService
    from database.validators import OrderValidator
    from utils.logging_config import setup_logging
    from utils.helpers import validate_required_fields, CustomJSONEncoder
except ImportError as e:
    print(f"Import error: {e}")
    print("Running in standalone mode with embedded components...")
    # Fallback imports will be defined below

# Setup logging
try:
    setup_logging()
except:
    logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Custom JSON Encoder (fallback)
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Enum):
            return obj.value
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def create_app():
    """Application factory pattern with proper static file handling"""
    app = Flask(__name__, 
                static_folder='static',
                static_url_path='/static',
                template_folder='templates')
    
    # Configure JSON encoder
    app.json_encoder = CustomJSONEncoder
    
    # Basic configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'jira-ai-secret-key-change-in-production')
    app.config['DEBUG'] = os.environ.get('FLASK_ENV') == 'development'
    
    CORS(app)
    
    # Ensure static and template directories exist
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    
    # Initialize services (with error handling)
    try:
        from config.settings import Config
        if not Config.validate():
            logger.warning("Configuration validation failed, some features may not work")
        
        jira_service = JiraService()
        security_service = SecurityService()
        order_validator = OrderValidator()
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        jira_service = None
        security_service = None
        order_validator = None
    
    @app.route('/')
    def index():
        """Serve the main application page"""
        try:
            return render_template('index.html')
        except Exception as e:
            logger.error(f"Error rendering template: {e}")
            # Return embedded HTML if template fails
            return get_embedded_html()
    
    @app.route('/static/<path:filename>')
    def serve_static(filename):
        """Explicitly serve static files"""
        return send_from_directory('static', filename)
    
    @app.route('/api/validate-order', methods=['POST'])
    def api_validate_order():
        """API endpoint to validate order in Oracle DB"""
        if not order_validator:
            return jsonify({
                'success': False,
                'error': 'Order validation service not available'
            }), 503
            
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['order_number', 'location_code']
            validation_error = validate_required_fields(data, required_fields)
            if validation_error:
                return jsonify({
                    'success': False,
                    'error': validation_error
                }), 400
            
            order_number = data['order_number'].strip()
            location_code = data['location_code'].strip().upper()
            
            # Validate order in Oracle DB
            validation_result = order_validator.validate_order(order_number, location_code)
            
            return jsonify(validation_result)
            
        except Exception as e:
            logger.error(f"Order validation API error: {e}")
            return jsonify({
                'success': False,
                'error': f'Validation failed: {str(e)}'
            }), 500
    
    @app.route('/api/security-analysis', methods=['POST'])
    def api_security_analysis():
        """API endpoint for fraud & security impact analysis"""
        if not security_service:
            return jsonify({
                'success': False,
                'error': 'Security analysis service not available'
            }), 503
            
        try:
            data = request.get_json()
            
            validation_error = validate_required_fields(data, ['issue_key'])
            if validation_error:
                return jsonify({
                    'success': False,
                    'error': validation_error
                }), 400
            
            issue_key = data['issue_key'].strip().upper()
            result = security_service.analyze_issue_security_impact(issue_key)
            
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"Security analysis API error: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route('/api/query', methods=['POST'])
    def api_query():
        """API endpoint to process Jira queries"""
        if not jira_service:
            return jsonify({
                'success': False,
                'error': 'Jira service not available'
            }), 503
            
        try:
            data = request.get_json()
            
            validation_error = validate_required_fields(data, ['query'])
            if validation_error:
                return jsonify({
                    'success': False,
                    'error': validation_error
                }), 400
            
            result = jira_service.process_user_query(data['query'])
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"Query API error: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        try:
            from config.settings import Config
            jira_configured = bool(Config.JIRA_URL and Config.JIRA_USERNAME and Config.JIRA_TOKEN)
            openai_configured = bool(Config.OPENAI_API_KEY)
            oracle_configured = bool(Config.ORACLE_DSN and Config.ORACLE_USER)
        except:
            jira_configured = False
            openai_configured = False
            oracle_configured = False
            
        return jsonify({
            'status': 'healthy',
            'jira_configured': jira_configured,
            'openai_configured': openai_configured,
            'oracle_configured': oracle_configured,
            'services': {
                'jira_service': jira_service is not None,
                'security_service': security_service is not None,
                'order_validator': order_validator is not None
            }
        })
    
    @app.route('/api/test-connections', methods=['GET'])
    def test_connections():
        """Test all service connections"""
        results = {}
        
        # Test Jira connection
        if jira_service:
            try:
                jira_result = jira_service.test_connection()
                results['jira'] = jira_result
            except Exception as e:
                results['jira'] = {'success': False, 'error': str(e)}
        else:
            results['jira'] = {'success': False, 'error': 'Service not initialized'}
        
        # Test Oracle connection
        if order_validator:
            try:
                oracle_result = order_validator.test_connection()
                results['oracle'] = oracle_result
            except Exception as e:
                results['oracle'] = {'success': False, 'error': str(e)}
        else:
            results['oracle'] = {'success': False, 'error': 'Service not initialized'}
        
        return jsonify(results)
    
    return app

def validate_required_fields(data, required_fields):
    """Fallback validation function"""
    if not data:
        return "Request data is missing"
    
    missing_fields = []
    for field in required_fields:
        if field not in data or not data[field] or str(data[field]).strip() == '':
            missing_fields.append(field)
    
    if missing_fields:
        return f"Missing required fields: {', '.join(missing_fields)}"
    
    return None

def get_embedded_html():
    """Fallback HTML when template system fails"""
    return '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jira AI Assistant with Oracle DB</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
        .status-bar {
            background: #e8f5e8;
            border-left: 4px solid #36b37e;
            padding: 15px 30px;
            color: #006644;
            font-weight: 600;
        }
        .main-content {
            flex: 1;
            padding: 30px;
            overflow-y: auto;
        }
        .welcome-message {
            text-align: center;
            color: #5e6c84;
            margin-bottom: 30px;
        }
        .feature-tabs {
            display: flex;
            justify-content: center;
            margin: 20px 0;
            gap: 10px;
        }
        .tab-button {
            background: #f4f5f7;
            border: 2px solid #dfe1e6;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 600;
        }
        .tab-button.active {
            background: #0052cc;
            color: white;
            border-color: #0052cc;
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
        .form-group input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #dfe1e6;
            border-radius: 8px;
            font-size: 1rem;
        }
        .btn {
            background: #0052cc;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            margin: 10px 0;
        }
        .error-message {
            background: #ffebe6;
            border: 1px solid #ff8f73;
            color: #de350b;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
        }
        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Jira AI Assistant</h1>
            <p>AI-powered Jira queries with Oracle DB order validation</p>
        </div>

        <div class="status-bar">
            ⚠️ Template system unavailable - Running in fallback mode
        </div>

        <div class="main-content">
            <div class="welcome-message">
                <h2>Welcome to your Enhanced Jira AI Assistant! 👋</h2>
                
                <div class="feature-tabs">
                    <button class="tab-button active" onclick="showTab('validation')">
                        🔍 Order Validation
                    </button>
                    <button class="tab-button" onclick="showTab('health')">
                        ❤️ Health Check
                    </button>
                </div>

                <div id="validation-tab">
                    <h3>Order Validation</h3>
                    <div style="max-width: 500px; margin: 0 auto; background: #f8f9ff; padding: 25px; border-radius: 15px;">
                        <div class="form-group">
                            <label for="orderNumber">Order Number:</label>
                            <input type="text" id="orderNumber" placeholder="e.g., ORD-123456">
                        </div>
                        <div class="form-group">
                            <label for="locationCode">Location Code:</label>
                            <input type="text" id="locationCode" placeholder="e.g., NYC, LA, CHI">
                        </div>
                        <button class="btn" onclick="validateOrder()">
                            🔍 Validate Order
                        </button>
                    </div>
                </div>

                <div id="health-tab" class="hidden">
                    <h3>System Health Check</h3>
                    <button class="btn" onclick="checkHealth()">
                        ❤️ Check System Health
                    </button>
                </div>

                <div id="results"></div>
            </div>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
            
            document.getElementById('validation-tab').classList.toggle('hidden', tabName !== 'validation');
            document.getElementById('health-tab').classList.toggle('hidden', tabName !== 'health');
        }

        async function validateOrder() {
            const orderNumber = document.getElementById('orderNumber').value.trim();
            const locationCode = document.getElementById('locationCode').value.trim();
            const resultsDiv = document.getElementById('results');
            
            if (!orderNumber || !locationCode) {
                resultsDiv.innerHTML = '<div class="error-message">Please enter both order number and location code</div>';
                return;
            }
            
            try {
                const response = await fetch('/api/validate-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_number: orderNumber,
                        location_code: locationCode
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    const status = result.is_valid ? 'Valid ✅' : 'Invalid ❌';
                    const statusColor = result.is_valid ? '#00875a' : '#de350b';
                    
                    resultsDiv.innerHTML = `
                        <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${statusColor};">
                            <h3>Validation Result: ${status}</h3>
                            <p><strong>Order:</strong> ${result.order_number}</p>
                            <p><strong>Location:</strong> ${result.location_code}</p>
                            ${result.missing_fields && result.missing_fields.length > 0 ? 
                                `<p style="color: #de350b;"><strong>Missing Fields:</strong> ${result.missing_fields.join(', ')}</p>` : 
                                '<p style="color: #00875a;">All mandatory fields are present</p>'
                            }
                        </div>
                    `;
                } else {
                    resultsDiv.innerHTML = `<div class="error-message">Error: ${result.error}</div>`;
                }
            } catch (error) {
                resultsDiv.innerHTML = `<div class="error-message">Network Error: ${error.message}</div>`;
            }
        }

        async function checkHealth() {
            const resultsDiv = document.getElementById('results');
            
            try {
                const response = await fetch('/api/health');
                const result = await response.json();
                
                resultsDiv.innerHTML = `
                    <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <h3>System Health Status</h3>
                        <p><strong>Overall Status:</strong> ${result.status}</p>
                        <p><strong>Jira Configured:</strong> ${result.jira_configured ? '✅' : '❌'}</p>
                        <p><strong>OpenAI Configured:</strong> ${result.openai_configured ? '✅' : '❌'}</p>
                        <p><strong>Oracle Configured:</strong> ${result.oracle_configured ? '✅' : '❌'}</p>
                        <h4>Services:</h4>
                        <p><strong>Jira Service:</strong> ${result.services?.jira_service ? '✅' : '❌'}</p>
                        <p><strong>Security Service:</strong> ${result.services?.security_service ? '✅' : '❌'}</p>
                        <p><strong>Order Validator:</strong> ${result.services?.order_validator ? '✅' : '❌'}</p>
                    </div>
                `;
            } catch (error) {
                resultsDiv.innerHTML = `<div class="error-message">Health Check Failed: ${error.message}</div>`;
            }
        }
    </script>
</body>
</html>'''

if __name__ == '__main__':
    app = create_app()
    
    print("🚀 Starting Jira AI Assistant with Oracle DB Integration...")
    print("=" * 70)
    
    # Check if services are available
    try:
        from config.settings import Config
        print(f"📊 Configuration:")
        print(f"   - Jira URL: {Config.JIRA_URL}")
        print(f"   - Jira Username: {Config.JIRA_USERNAME}")
        print(f"   - OpenAI API: {'✅ Configured' if Config.OPENAI_API_KEY else '❌ Missing'}")
        print(f"   - Oracle DB: {'✅ Configured' if Config.ORACLE_DSN else '❌ Missing'}")
    except Exception as e:
        print(f"⚠️  Configuration warning: {e}")
        print("   - Running in fallback mode")
    
    print("=" * 70)
    print("🌐 Server starting at: http://localhost:5000")
    print("🔍 Health check: http://localhost:5000/api/health")
    print("🧪 Test connections: http://localhost:5000/api/test-connections")
    print("=" * 70)
    
    try:
        port = int(os.environ.get('PORT', 5000))
        debug = os.environ.get('FLASK_ENV') == 'development'
        
        app.run(
            debug=debug,
            host='0.0.0.0',
            port=port
        )
    except KeyboardInterrupt:
        print("\n👋 Shutting down Jira AI Assistant...")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        print("💡 Make sure port 5000 is available or set PORT environment variable")
