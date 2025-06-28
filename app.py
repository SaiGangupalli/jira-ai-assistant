#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import logging
import json
from datetime import datetime
from enum import Enum

# Setup basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Custom JSON Encoder
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Enum):
            return obj.value
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def create_app():
    """Application factory pattern with proper static file handling"""
    
    # Create Flask app with explicit static and template folder configuration
    app = Flask(__name__, 
                static_folder='static',
                static_url_path='/static',
                template_folder='templates')
    
    # Configure JSON encoder
    app.json_encoder = CustomJSONEncoder
    
    # Basic configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'jira-ai-secret-key-change-in-production')
    app.config['DEBUG'] = os.environ.get('FLASK_ENV') == 'development'
    
    # Enable CORS
    CORS(app)
    
    # Ensure directories exist
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    
    # Try to import services (graceful degradation if modules are missing)
    jira_service = None
    security_service = None
    order_validator = None
    elasticsearch_service = None
    
    try:
        from config.settings import Config
        if Config.validate():
            logger.info("Configuration validation passed")
            try:
                from services.jira_service import JiraService
                from services.security_service import SecurityService
                from database.validators import OrderValidator
                
                jira_service = JiraService()
                security_service = SecurityService()
                order_validator = OrderValidator()

                # Try to initialize Elasticsearch service
                try:
                    from services.elasticsearch_service import ElasticsearchService
                    elasticsearch_service = ElasticsearchService()
                    logger.info("Elasticsearch service initialized successfully")
                except Exception as es_error:
                    logger.warning(f"Elasticsearch service initialization failed: {es_error}")
                    elasticsearch_service = None
                    
                logger.info("All services initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize services: {e}")
        else:
            logger.warning("Configuration validation failed")
    except ImportError as e:
        logger.warning(f"Could not import configuration: {e}")
    except Exception as e:
        logger.error(f"Configuration error: {e}")
    
    @app.route('/')
    def index():
        """Serve the main application page"""
        try:
            return render_template('index.html')
        except Exception as e:
            logger.error(f"Error rendering template: {e}")
            # Return a simple fallback HTML
            return '''
            <!DOCTYPE html>
            <html>
            <head>
                <title>Jira AI Assistant</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                    .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .error { background: #ffebee; border: 1px solid #f44336; color: #c62828; padding: 20px; border-radius: 5px; margin: 20px 0; }
                    .btn { background: #2196f3; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 5px; }
                    .btn:hover { background: #1976d2; }
                    input { width: 200px; padding: 8px; margin: 5px; border: 1px solid #ddd; border-radius: 3px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🤖 Jira AI Assistant</h1>
                    <div class="error">
                        <strong>Template Error:</strong> The main template could not be loaded. 
                        Please ensure the templates/index.html file exists and is properly formatted.
                    </div>
                    
                    <h3>Quick Test - Order Validation</h3>
                    <input type="text" id="orderNumber" placeholder="Order Number" value="ORD-001">
                    <input type="text" id="locationCode" placeholder="Location Code" value="NYC">
                    <button class="btn" onclick="testValidation()">Test Validation</button>
                    
                    <h3>Quick Test - Health Check</h3>
                    <button class="btn" onclick="testHealth()">Check Health</button>
                    
                    <div id="results" style="margin-top: 20px; padding: 10px; background: #f9f9f9; border-radius: 5px;"></div>
                </div>
                
                <script>
                    async function testValidation() {
                        const orderNumber = document.getElementById('orderNumber').value;
                        const locationCode = document.getElementById('locationCode').value;
                        const resultsDiv = document.getElementById('results');
                        
                        try {
                            const response = await fetch('/api/validate-order', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({order_number: orderNumber, location_code: locationCode})
                            });
                            const result = await response.json();
                            resultsDiv.innerHTML = '<h4>Validation Result:</h4><pre>' + JSON.stringify(result, null, 2) + '</pre>';
                        } catch (error) {
                            resultsDiv.innerHTML = '<h4 style="color: red;">Error:</h4>' + error.message;
                        }
                    }
                    
                    async function testHealth() {
                        const resultsDiv = document.getElementById('results');
                        try {
                            const response = await fetch('/api/health');
                            const result = await response.json();
                            resultsDiv.innerHTML = '<h4>Health Check:</h4><pre>' + JSON.stringify(result, null, 2) + '</pre>';
                        } catch (error) {
                            resultsDiv.innerHTML = '<h4 style="color: red;">Error:</h4>' + error.message;
                        }
                    }
                </script>
            </body>
            </html>
            '''
    
    @app.route('/static/<path:filename>')
    def serve_static(filename):
        """Explicitly serve static files"""
        try:
            return send_from_directory('static', filename)
        except Exception as e:
            logger.error(f"Error serving static file {filename}: {e}")
            return f"Static file not found: {filename}", 404
    
    @app.route('/api/validate-order', methods=['POST'])
    def api_validate_order():
        """API endpoint to validate order in Oracle DB"""
        if not order_validator:
            return jsonify({
                'success': False,
                'error': 'Order validation service not available. Please check Oracle DB configuration.'
            }), 503
            
        try:
            data = request.get_json()
            
            # Validate required fields
            if not data or not data.get('order_number') or not data.get('location_code'):
                return jsonify({
                    'success': False,
                    'error': 'Missing required fields: order_number and location_code'
                }), 400
            
            order_number = str(data['order_number']).strip()
            location_code = str(data['location_code']).strip().upper()
            
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
                'error': 'Security analysis service not available. Please check Jira and OpenAI configuration.'
            }), 503
            
        try:
            data = request.get_json()
            
            if not data or not data.get('issue_key'):
                return jsonify({
                    'success': False,
                    'error': 'Missing required field: issue_key'
                }), 400
            
            issue_key = str(data['issue_key']).strip().upper()
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
                'error': 'Jira service not available. Please check Jira and OpenAI configuration.'
            }), 503
            
        try:
            data = request.get_json()
            
            if not data or not data.get('query'):
                return jsonify({
                    'success': False,
                    'error': 'Missing required field: query'
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
        status = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'services': {
                'jira_service': jira_service is not None,
                'security_service': security_service is not None,
                'order_validator': order_validator is not None
            }
        }
        
        try:
            from config.settings import Config
            status.update({
                'jira_configured': bool(Config.JIRA_URL and Config.JIRA_USERNAME and Config.JIRA_TOKEN),
                'openai_configured': bool(Config.OPENAI_API_KEY),
                'oracle_configured': bool(Config.ORACLE_DSN and Config.ORACLE_USER)
            })
        except:
            status.update({
                'jira_configured': False,
                'openai_configured': False,
                'oracle_configured': False,
                'config_error': 'Configuration module not available'
            })
            
        return jsonify(status)
    
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
    
    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

# Add this to app.py - Elasticsearch log search API endpoint

@app.route('/api/search-logs', methods=['POST'])
def api_search_logs():
        """API endpoint for Elasticsearch log analysis"""
        
        if not elasticsearch_service:
            return jsonify({
                'success': False,
                'error': 'Elasticsearch service not available. Please check Elasticsearch configuration.'
            }), 503
            
        try:
            data = request.get_json()
            
            # Validate required fields
            if not data or not data.get('log_type') or not data.get('session_id'):
                return jsonify({
                    'success': False,
                    'error': 'Missing required fields: log_type and session_id'
                }), 400
            
            log_type = str(data['log_type']).strip()
            session_id = str(data['session_id']).strip()
            
            # Extract optional filters
            filters = {
                'time_range': data.get('time_range', '24h'),
                'log_level': data.get('log_level', 'all'),
                'max_results': int(data.get('max_results', 100)),
                'component': data.get('component'),
            }
            
            # Add log-type specific filters
            log_specific_filters = [
                'transaction_id', 'merchant_id', 'xml_version', 'validation_status',
                'user_id', 'auth_method', 'payment_id', 'gateway', 'risk_score',
                'decision', 'api_endpoint', 'http_method'
            ]
            
            for filter_name in log_specific_filters:
                if data.get(filter_name):
                    filters[filter_name] = str(data[filter_name]).strip()
            
            # Search logs using Elasticsearch service
            result = elasticsearch_service.search_logs(log_type, session_id, **filters)
            
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"Log search API error: {e}")
            return jsonify({
                'success': False,
                'error': f'Log search failed: {str(e)}'
            }), 500

@app.route('/api/elasticsearch-health', methods=['GET'])
def elasticsearch_health():
        """Check Elasticsearch connection health"""
        if not elasticsearch_service:
            return jsonify({
                'success': False,
                'error': 'Elasticsearch service not available'
            }), 503
            
        try:
            result = elasticsearch_service.test_connection()
            return jsonify(result)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500    

@app.route('/api/log-components/<log_type>', methods=['GET'])
def get_log_components(log_type):
        """Get available components for a log type"""
        if not elasticsearch_service:
            return jsonify({
                'success': False,
                'error': 'Elasticsearch service not available'
            }), 503
            
        try:
            components = elasticsearch_service.get_available_components(log_type)
            return jsonify({
                'success': True,
                'log_type': log_type,
                'components': components
            })
        except Exception as e:
            logger.error(f"Error getting components for {log_type}: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

if __name__ == '__main__':
    app = create_app()
    
    print("🚀 Starting Jira AI Assistant with Oracle DB Integration...")
    print("=" * 70)
    
    # Check static files
    static_files = {
        'static/css/style.css': 'CSS styles',
        'static/js/main.js': 'JavaScript functionality',
        'templates/index.html': 'HTML template'
    }
    
    print("📁 Checking static files:")
    for file_path, description in static_files.items():
        if os.path.exists(file_path):
            print(f"   ✅ {file_path} - {description}")
        else:
            print(f"   ❌ {file_path} - {description} (MISSING)")
    
    # Check services
    print("\n🔧 Service status:")
    try:
        from config.settings import Config
        print(f"   - Jira URL: {Config.JIRA_URL or 'Not configured'}")
        print(f"   - OpenAI API: {'✅ Configured' if Config.OPENAI_API_KEY else '❌ Missing'}")
        print(f"   - Oracle DB: {'✅ Configured' if Config.ORACLE_DSN else '❌ Missing'}")
    except Exception as e:
        print(f"   ⚠️  Configuration module: {e}")
    
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
