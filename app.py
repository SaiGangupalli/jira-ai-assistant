#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import logging
import json
from datetime import datetime
from enum import Enum
try:
    from services.fraud_analysis_service import FraudAnalysisService
    fraud_analysis_service = FraudAnalysisService()
    logger.info("Fraud Analysis service initialized successfully")
except Exception as e:
    logger.warning(f"Fraud Analysis service initialization failed: {e}")
    fraud_analysis_service = None

# Setup basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
# Add these imports to the top of app.py
from services.jenkins_service import JenkinsService

# Initialize Jenkins service after other services
jenkins_service = None
try:
    from services.jenkins_service import JenkinsService
    jenkins_service = JenkinsService()
    logger.info("Jenkins service initialized successfully")
except Exception as e:
    logger.warning(f"Jenkins service initialization failed: {e}")
    jenkins_service = None
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

    # Add this new API endpoint to your app.py
@app.route('/api/process-security-command', methods=['POST'])
def process_security_command():
    """Process natural language security analysis commands"""
    if not jira_service:
        return jsonify({
            'success': False,
            'error': 'Jira service not available. Please check Jira and OpenAI configuration.'
        }), 503
    
    try:
        data = request.get_json()
        
        if not data or not data.get('command'):
            return jsonify({
                'success': False,
                'error': 'Missing required field: command'
            }), 400
        
        user_command = data.get('command', '').strip()
        
        if not user_command:
            return jsonify({
                'success': False,
                'error': 'Command cannot be empty'
            }), 400
        
        # Process the security analysis command
        result = jira_service.process_security_analysis_command(user_command)
        
        if result['success']:
            # Store file info for download
            file_id = result['download_id']
            download_files[file_id] = {
                'path': result['document_path'],
                'filename': result['filename'],
                'created': datetime.now(),
                'ticket_key': result['ticket_key']
            }
            
            # Clean up old files (older than 1 hour)
            cleanup_old_downloads()
            
            # Remove sensitive file path from response
            response_data = {k: v for k, v in result.items() if k != 'document_path'}
            response_data['download_url'] = f'/api/download-security-report/{file_id}'
            
            return jsonify(response_data)
        else:
            return jsonify(result), 400
        
    except Exception as e:
        logger.error(f"Error processing security command: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to process command: {str(e)}'
        }), 500

@app.route('/api/download-security-report/<file_id>')
def download_security_report(file_id):
    """Download generated security analysis report"""
    try:
        if file_id not in download_files:
            return jsonify({
                'error': 'File not found or expired'
            }), 404
        
        file_info = download_files[file_id]
        file_path = file_info['path']
        
        # Check if file still exists
        if not os.path.exists(file_path):
            # Clean up the entry
            del download_files[file_id]
            return jsonify({
                'error': 'File not found on server'
            }), 404
        
        # Send the file
        response = send_file(
            file_path,
            as_attachment=True,
            download_name=file_info['filename'],
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        
        # Schedule file cleanup after download
        # Note: In production, you might want to use a background task for this
        try:
            os.unlink(file_path)
            del download_files[file_id]
        except:
            pass  # Ignore cleanup errors
        
        return response
        
    except Exception as e:
        logger.error(f"Error downloading file {file_id}: {e}")
        return jsonify({
            'error': 'Download failed'
        }), 500

def cleanup_old_downloads():
    """Clean up download files older than 1 hour"""
    try:
        current_time = datetime.now()
        expired_files = []
        
        for file_id, file_info in download_files.items():
            if current_time - file_info['created'] > timedelta(hours=1):
                expired_files.append(file_id)
        
        for file_id in expired_files:
            try:
                file_path = download_files[file_id]['path']
                if os.path.exists(file_path):
                    os.unlink(file_path)
                del download_files[file_id]
                logger.info(f"Cleaned up expired download file: {file_id}")
            except Exception as e:
                logger.error(f"Error cleaning up file {file_id}: {e}")
                
    except Exception as e:
        logger.error(f"Error in cleanup_old_downloads: {e}")

    
    @app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    status = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'jira_service': jira_service is not None,
            'security_service': security_service is not None,
            'order_validator': order_validator is not None,
            'elasticsearch_service': elasticsearch_service is not None
        }
    }
    
    try:
        from config.settings import Config
        status.update({
            'jira_configured': bool(Config.JIRA_URL and Config.JIRA_USERNAME and Config.JIRA_TOKEN),
            'openai_configured': bool(Config.OPENAI_API_KEY),
            'oracle_configured': bool(Config.ORACLE_DSN and Config.ORACLE_USER),
            'elasticsearch_configured': bool(Config.ELASTICSEARCH_HOST and Config.ELASTICSEARCH_USERNAME)
        })
        
        # Add log analysis configuration info
        log_info = Config.get_log_analysis_info()
        status['log_analysis'] = log_info
        
    except:
        status.update({
            'jira_configured': False,
            'openai_configured': False,
            'oracle_configured': False,
            'elasticsearch_configured': False,
            'config_error': 'Configuration module not available'
        })
        
    return jsonify(status)

# Replace the existing test_connections function with this updated version:

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
    
    # Test Elasticsearch connection
    if elasticsearch_service:
        try:
            elasticsearch_result = elasticsearch_service.test_connection()
            results['elasticsearch'] = elasticsearch_result
        except Exception as e:
            results['elasticsearch'] = {'success': False, 'error': str(e)}
    else:
        results['elasticsearch'] = {'success': False, 'error': 'Service not initialized'}
    
    return jsonify(results)

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

# Add these endpoints to app.py

# app.py - Enhanced API endpoint for fraud analysis with JWT validation
# Add this to your existing app.py file

@app.route('/api/fraud-analysis', methods=['POST'])
def api_fraud_analysis():
    """Enhanced fraud analysis with JWT validation"""
    try:
        if not fraud_analysis_service:
            return jsonify({
                'success': False,
                'error': 'Fraud analysis service not available'
            }), 503
        
        data = request.get_json()
        if not data or not data.get('session_id'):
            return jsonify({
                'success': False,
                'error': 'Missing required field: session_id'
            }), 400
        
        session_id = str(data['session_id']).strip()
        fraud_type = data.get('fraud_type', 'identity_fraud')
        include_jwt_validation = data.get('include_jwt_validation', True)
        
        logger.info(f"Starting enhanced fraud analysis for session: {session_id}, type: {fraud_type}")
        
        # Perform enhanced fraud analysis with JWT validation
        result = fraud_analysis_service.analyze_fraud_session(session_id, fraud_type)
        
        if result.get('success'):
            # Enhance response with additional metadata
            result['analysis_metadata'] = {
                'analysis_type': 'enhanced_with_jwt',
                'jwt_validation_enabled': include_jwt_validation,
                'analysis_timestamp': datetime.now().isoformat(),
                'fraud_type': fraud_type,
                'session_id': session_id
            }
            
            # Add validation summary to top level for easy access
            jwt_validation = result.get('jwt_validation', {})
            if jwt_validation:
                validation_summary = jwt_validation.get('validation_summary', {})
                result['jwt_summary'] = {
                    'total_tokens': validation_summary.get('total_tokens_found', 0),
                    'successful_validations': validation_summary.get('tokens_successfully_decoded', 0),
                    'validation_errors': validation_summary.get('tokens_with_errors', 0),
                    'consistency_score': validation_summary.get('identity_consistency_score', 100),
                    'overall_score': validation_summary.get('overall_score', 0),
                    'risk_level': validation_summary.get('risk_level', 'UNKNOWN')
                }
            
            logger.info(f"Enhanced fraud analysis completed successfully for session: {session_id}")
            return jsonify(result)
        else:
            logger.error(f"Enhanced fraud analysis failed for session: {session_id}")
            return jsonify(result), 500
            
    except Exception as e:
        logger.error(f"Error in enhanced fraud analysis API: {e}")
        return jsonify({
            'success': False,
            'error': f'Enhanced fraud analysis failed: {str(e)}',
            'session_id': data.get('session_id', 'unknown') if data else 'unknown'
        }), 500

@app.route('/api/jwt-validation-preview', methods=['POST'])
def api_jwt_validation_preview():
    """Preview JWT tokens found in session before full analysis"""
    try:
        if not fraud_analysis_service:
            return jsonify({
                'success': False,
                'error': 'Fraud analysis service not available'
            }), 503
        
        data = request.get_json()
        if not data or not data.get('session_id'):
            return jsonify({
                'success': False,
                'error': 'Missing required field: session_id'
            }), 400
        
        session_id = str(data['session_id']).strip()
        
        logger.info(f"Generating JWT validation preview for session: {session_id}")
        
        # Get session logs
        session_logs = fraud_analysis_service._gather_session_logs(session_id)
        
        # Flatten logs for analysis
        all_logs = []
        for log_type, logs in session_logs.items():
            for log in logs:
                log['source_type'] = log_type
                all_logs.append(log)
        
        # Extract JWT tokens (quick preview)
        jwt_tokens = fraud_analysis_service._extract_jwt_tokens_from_logs(all_logs)
        
        # Quick analysis of headers
        headers_with_auth = 0
        total_api_calls = 0
        
        for log in all_logs:
            if log.get('api_endpoint'):
                total_api_calls += 1
            
            # Check for authentication headers
            for field in ['headers', 'outgoing_headers', 'request_headers']:
                if field in log:
                    header_data = str(log[field]).lower()
                    if 'authorization' in header_data or 'bearer' in header_data:
                        headers_with_auth += 1
                        break
        
        preview_result = {
            'success': True,
            'session_id': session_id,
            'preview_data': {
                'total_logs_analyzed': len(all_logs),
                'jwt_tokens_found': len(jwt_tokens),
                'api_calls_detected': total_api_calls,
                'headers_with_auth': headers_with_auth,
                'token_sources': list(set([token.get('source_field', 'unknown') for token in jwt_tokens])),
                'api_endpoints_with_tokens': list(set([token.get('api_endpoint', 'unknown') for token in jwt_tokens if token.get('api_endpoint')])),
                'estimated_validation_time': min(10 + (len(jwt_tokens) * 3), 60)  # seconds
            },
            'has_jwt_data': len(jwt_tokens) > 0,
            'analysis_ready': len(jwt_tokens) > 0 and total_api_calls > 0
        }
        
        logger.info(f"JWT validation preview completed: {len(jwt_tokens)} tokens found")
        
        return jsonify(preview_result)
        
    except Exception as e:
        logger.error(f"Error in JWT validation preview: {e}")
        return jsonify({
            'success': False,
            'error': f'JWT validation preview failed: {str(e)}',
            'session_id': data.get('session_id', 'unknown') if data else 'unknown'
        }), 500

@app.route('/api/jwt-token-details', methods=['POST'])
def api_jwt_token_details():
    """Get detailed information about specific JWT token"""
    try:
        if not fraud_analysis_service:
            return jsonify({
                'success': False,
                'error': 'Fraud analysis service not available'
            }), 503
        
        data = request.get_json()
        if not data or not data.get('token'):
            return jsonify({
                'success': False,
                'error': 'Missing required field: token'
            }), 400
        
        token = data.get('token')
        
        logger.info("Analyzing individual JWT token details")
        
        # Create mock token info for validation
        token_info = {
            'token': token,
            'log_id': data.get('log_id', 'manual'),
            'source_field': data.get('source_field', 'manual_input'),
            'api_endpoint': data.get('api_endpoint', 'N/A'),
            'timestamp': datetime.now().isoformat()
        }
        
        # Validate the token
        validation_result = fraud_analysis_service._validate_individual_jwt_token(token_info)
        
        # Add additional analysis
        validation_result['token_analysis'] = {
            'token_length': len(token),
            'parts_count': len(token.split('.')),
            'estimated_payload_size': len(token.split('.')[1]) if len(token.split('.')) > 1 else 0,
            'analysis_timestamp': datetime.now().isoformat()
        }
        
        result = {
            'success': True,
            'token_details': validation_result,
            'recommendations': []
        }
        
        # Generate token-specific recommendations
        if validation_result.get('validation_status') == 'INVALID_STRUCTURE':
            result['recommendations'].append('Token structure is invalid - verify JWT format')
        
        if validation_result.get('expiry_status') == 'EXPIRED':
            result['recommendations'].append('Token is expired - refresh authentication')
        
        security_indicators = validation_result.get('security_indicators', [])
        if security_indicators:
            for indicator in security_indicators:
                if indicator.get('severity') == 'HIGH':
                    result['recommendations'].append(f"Security risk: {indicator.get('description')}")
        
        if not result['recommendations']:
            result['recommendations'].append('Token validation passed all checks')
        
        logger.info("JWT token details analysis completed")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in JWT token details analysis: {e}")
        return jsonify({
            'success': False,
            'error': f'JWT token analysis failed: {str(e)}'
        }), 500

@app.route('/api/identity-consistency-check', methods=['POST'])
def api_identity_consistency_check():
    """Perform identity consistency check across multiple JWT tokens"""
    try:
        if not fraud_analysis_service:
            return jsonify({
                'success': False,
                'error': 'Fraud analysis service not available'
            }), 503
        
        data = request.get_json()
        if not data or not data.get('session_id'):
            return jsonify({
                'success': False,
                'error': 'Missing required field: session_id'
            }), 400
        
        session_id = str(data['session_id']).strip()
        
        logger.info(f"Performing identity consistency check for session: {session_id}")
        
        # Get session logs and extract JWT tokens
        session_logs = fraud_analysis_service._gather_session_logs(session_id)
        all_logs = []
        for log_type, logs in session_logs.items():
            for log in logs:
                log['source_type'] = log_type
                all_logs.append(log)
        
        jwt_tokens = fraud_analysis_service._extract_jwt_tokens_from_logs(all_logs)
        
        if not jwt_tokens:
            return jsonify({
                'success': True,
                'session_id': session_id,
                'consistency_results': {
                    'status': 'NO_TOKENS',
                    'message': 'No JWT tokens found for consistency analysis',
                    'token_count': 0,
                    'consistency_score': 100,
                    'issues': []
                }
            })
        
        # Validate all tokens and extract identity data
        token_validations = []
        for token_info in jwt_tokens:
            validation = fraud_analysis_service._validate_individual_jwt_token(token_info)
            token_validations.append(validation)
        
        # Store validations for consistency analysis
        fraud_analysis_service.current_validations = token_validations
        
        # Perform consistency analysis
        consistency_checks = fraud_analysis_service._analyze_identity_consistency(jwt_tokens, all_logs)
        
        # Calculate overall consistency score
        total_checks = len([c for c in consistency_checks if c.get('check_type') in ['IDENTITY_CONSISTENT', 'IDENTITY_INCONSISTENCY']])
        passed_checks = len([c for c in consistency_checks if c.get('status') == 'PASS'])
        
        consistency_score = (passed_checks / total_checks * 100) if total_checks > 0 else 100
        
        # Identify critical issues
        critical_issues = [c for c in consistency_checks if c.get('severity') == 'HIGH']
        
        result = {
            'success': True,
            'session_id': session_id,
            'consistency_results': {
                'status': 'ANALYZED',
                'token_count': len(jwt_tokens),
                'consistency_score': round(consistency_score, 1),
                'total_checks': total_checks,
                'passed_checks': passed_checks,
                'failed_checks': total_checks - passed_checks,
                'critical_issues': len(critical_issues),
                'detailed_checks': consistency_checks,
                'risk_level': 'HIGH' if consistency_score < 80 else 'MEDIUM' if consistency_score < 95 else 'LOW'
            }
        }
        
        logger.info(f"Identity consistency check completed: {consistency_score}% consistency")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in identity consistency check: {e}")
        return jsonify({
            'success': False,
            'error': f'Identity consistency check failed: {str(e)}',
            'session_id': data.get('session_id', 'unknown') if data else 'unknown'
        }), 500

# Enhanced fraud types endpoint with JWT validation info
@app.route('/api/fraud-types', methods=['GET'])
def api_fraud_types_enhanced():
    """Get available fraud analysis types with JWT validation capabilities"""
    try:
        fraud_types = {
            'identity_fraud': {
                'title': 'Identity Fraud Analysis',
                'description': 'Comprehensive identity verification with JWT token validation and consistency checks',
                'icon': '🆔',
                'features': [
                    'JWT token extraction and validation',
                    'Identity claim consistency analysis', 
                    'Outgoing header analysis',
                    'Cross-reference validation',
                    'Security indicator detection',
                    'AI-powered risk assessment'
                ],
                'jwt_validation': True,
                'estimated_time': '15-30 seconds'
            },
            'digital_fraud': {
                'title': 'Digital Fraud Detection',
                'description': 'Bot detection and digital fingerprinting analysis',
                'icon': '🤖',
                'features': [
                    'Bot behavior analysis',
                    'Device fingerprinting',
                    'Session pattern analysis',
                    'Digital fraud indicators'
                ],
                'jwt_validation': False,
                'estimated_time': '10-20 seconds'
            },
            'transaction_fraud': {
                'title': 'Transaction Fraud Analysis',
                'description': 'Transaction pattern and velocity analysis',
                'icon': '💳',
                'features': [
                    'Velocity pattern analysis',
                    'Transaction risk scoring',
                    'Payment fraud detection',
                    'Amount validation'
                ],
                'jwt_validation': False,
                'estimated_time': '10-15 seconds'
            },
            'assisted_fraud': {
                'title': 'Assisted Fraud Detection',
                'description': 'Human-assisted fraud pattern analysis',
                'icon': '👥',
                'features': [
                    'Behavioral analysis',
                    'Interaction patterns',
                    'Assistance fraud indicators',
                    'Social engineering detection'
                ],
                'jwt_validation': False,
                'estimated_time': '15-25 seconds'
            }
        }
        
        return jsonify({
            'success': True,
            'fraud_types': fraud_types,
            'jwt_validation_available': True,
            'enhanced_features': [
                'Real-time JWT token analysis',
                'Identity consistency validation',
                'Security header analysis',
                'Cross-parameter verification',
                'Enhanced AI insights'
            ]
        })
    except Exception as e:
        logger.error(f"Error getting enhanced fraud types: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Additional utility endpoint for JWT token testing
@app.route('/api/test-jwt-extraction', methods=['POST'])
def api_test_jwt_extraction():
    """Test JWT token extraction from sample text (for debugging)"""
    try:
        data = request.get_json()
        if not data or not data.get('sample_text'):
            return jsonify({
                'success': False,
                'error': 'Missing required field: sample_text'
            }), 400
        
        sample_text = data.get('sample_text')
        
        logger.info("Testing JWT extraction from sample text")
        
        # Use fraud analysis service to extract tokens
        tokens = fraud_analysis_service._find_jwt_tokens_in_text(sample_text)
        
        result = {
            'success': True,
            'sample_text_length': len(sample_text),
            'tokens_found': len(tokens),
            'tokens': tokens,
            'patterns_matched': []
        }
        
        # Check which patterns matched
        for pattern_name, pattern in fraud_analysis_service.jwt_patterns.items():
            import re
            if re.search(pattern, sample_text):
                result['patterns_matched'].append(pattern_name)
        
        logger.info(f"JWT extraction test completed: {len(tokens)} tokens found")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in JWT extraction test: {e}")
        return jsonify({
            'success': False,
            'error': f'JWT extraction test failed: {str(e)}'
        }), 500
            '
        
@app.route('/api/jenkins-jobs', methods=['GET'])
def get_jenkins_jobs():
    """Get available Jenkins jobs"""
    if not jenkins_service:
        return jsonify({
            'success': False,
            'error': 'Jenkins service not available. Please check Jenkins configuration.'
        }), 503
    
    try:
        result = jenkins_service.get_available_jobs()
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error getting Jenkins jobs: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/jenkins-job-info/<job_type>', methods=['GET'])
def get_jenkins_job_info(job_type):
    """Get information about a specific Jenkins job"""
    if not jenkins_service:
        return jsonify({
            'success': False,
            'error': 'Jenkins service not available'
        }), 503
    
    try:
        result = jenkins_service.get_job_info(job_type)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error getting job info for {job_type}: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/jenkins-trigger-job', methods=['POST'])
def trigger_jenkins_job():
    """Trigger a Jenkins job with parameters"""
    if not jenkins_service:
        return jsonify({
            'success': False,
            'error': 'Jenkins service not available. Please check Jenkins configuration.'
        }), 503
    
    try:
        data = request.get_json()
        
        if not data or not data.get('job_type'):
            return jsonify({
                'success': False,
                'error': 'Missing required field: job_type'
            }), 400
        
        job_type = str(data['job_type']).strip()
        parameters = data.get('parameters', {})
        
        # Validate parameters before triggering
        validation_result = jenkins_service.validate_parameters(job_type, parameters)
        
        if not validation_result['success']:
            return jsonify({
                'success': False,
                'error': 'Parameter validation failed',
                'validation_errors': validation_result['errors'],
                'validation_warnings': validation_result.get('warnings', [])
            }), 400
        
        # Trigger the job
        result = jenkins_service.trigger_job(job_type, validation_result['validated_parameters'])
        
        # Log the job trigger for auditing
        if result['success']:
            logger.info(f"Jenkins job {job_type} triggered successfully with parameters: {list(parameters.keys())}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Jenkins job trigger error: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to trigger job: {str(e)}'
        }), 500

@app.route('/api/jenkins-build-status/<job_type>/<int:build_number>', methods=['GET'])
def get_jenkins_build_status(job_type, build_number):
    """Get status of a specific Jenkins build"""
    if not jenkins_service:
        return jsonify({
            'success': False,
            'error': 'Jenkins service not available'
        }), 503
    
    try:
        result = jenkins_service.get_build_status(job_type, build_number)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error getting build status: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/jenkins-health', methods=['GET'])
def jenkins_health():
    """Check Jenkins connection health"""
    if not jenkins_service:
        return jsonify({
            'success': False,
            'error': 'Jenkins service not available'
        }), 503
    
    try:
        result = jenkins_service.test_connection()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# Update the health check endpoint to include Jenkins
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    status = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'jira_service': jira_service is not None,
            'security_service': security_service is not None,
            'order_validator': order_validator is not None,
            'elasticsearch_service': elasticsearch_service is not None,
            'fraud_analysis_service': fraud_analysis_service is not None,
            'jenkins_service': jenkins_service is not None  # Add this line
        }
    }
    
    try:
        from config.settings import Config
        status.update({
            'jira_configured': bool(Config.JIRA_URL and Config.JIRA_USERNAME and Config.JIRA_TOKEN),
            'openai_configured': bool(Config.OPENAI_API_KEY),
            'oracle_configured': bool(Config.ORACLE_DSN and Config.ORACLE_USER),
            'elasticsearch_configured': bool(Config.ELASTICSEARCH_HOST and Config.ELASTICSEARCH_USERNAME),
            'jenkins_configured': bool(Config.JENKINS_URL and Config.JENKINS_USERNAME and Config.JENKINS_TOKEN)  # Add this line
        })
        
        # Add log analysis configuration info
        log_info = Config.get_log_analysis_info()
        status['log_analysis'] = log_info
        
        # Add fraud analysis info
        status['fraud_analysis'] = {
            'service_available': fraud_analysis_service is not None,
            'ai_enabled': bool(Config.OPENAI_API_KEY),
            'supported_types': ['digital_fraud', 'assisted_fraud', 'transaction_fraud', 'identity_fraud'] if fraud_analysis_service else []
        }
        
        # Add Jenkins info
        status['jenkins'] = {
            'service_available': jenkins_service is not None,
            'configured': bool(Config.JENKINS_URL and Config.JENKINS_USERNAME and Config.JENKINS_TOKEN),
            'available_jobs': ['fraud_story_prediction'] if jenkins_service else []
        }
        
    except:
        status.update({
            'jira_configured': False,
            'openai_configured': False,
            'oracle_configured': False,
            'elasticsearch_configured': False,
            'jenkins_configured': False,
            'fraud_analysis': {'service_available': False},
            'jenkins': {'service_available': False},
            'config_error': 'Configuration module not available'
        })
        
    return jsonify(status)

# Update the test connections endpoint to include Jenkins
@app.route('/api/test-connections', methods=['GET'])
def test_connections():
    """Test all service connections including Jenkins"""
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
    
    # Test Elasticsearch connection
    if elasticsearch_service:
        try:
            elasticsearch_result = elasticsearch_service.test_connection()
            results['elasticsearch'] = elasticsearch_result
        except Exception as e:
            results['elasticsearch'] = {'success': False, 'error': str(e)}
    else:
        results['elasticsearch'] = {'success': False, 'error': 'Service not initialized'}
    
    # Test Fraud Analysis service
    if fraud_analysis_service:
        try:
            fraud_types = fraud_analysis_service.get_fraud_types()
            results['fraud_analysis'] = {
                'success': True,
                'message': 'Fraud analysis service operational',
                'available_types': len(fraud_types),
                'ai_enabled': bool(getattr(Config, 'OPENAI_API_KEY', None)),
                'elasticsearch_required': True
            }
        except Exception as e:
            results['fraud_analysis'] = {'success': False, 'error': str(e)}
    else:
        results['fraud_analysis'] = {'success': False, 'error': 'Service not initialized'}
    
    # Test Jenkins connection
    if jenkins_service:
        try:
            jenkins_result = jenkins_service.test_connection()
            results['jenkins'] = jenkins_result
        except Exception as e:
            results['jenkins'] = {'success': False, 'error': str(e)}
    else:
        results['jenkins'] = {'success': False, 'error': 'Service not initialized'}
    
    return jsonify(results)

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
