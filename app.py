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

@app.route('/api/fraud-analysis', methods=['POST'])
def api_fraud_analysis():
    """API endpoint for comprehensive fraud analysis with AI-powered API call analysis"""
    
    if not fraud_analysis_service:
        return jsonify({
            'success': False,
            'error': 'Fraud analysis service not available. Please check Elasticsearch and OpenAI configuration.'
        }), 503
        
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('session_id') or not data.get('fraud_type'):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: session_id and fraud_type'
            }), 400
        
        session_id = str(data['session_id']).strip()
        fraud_type = str(data['fraud_type']).strip()
        
        # Validate fraud type
        valid_fraud_types = ['digital_fraud', 'assisted_fraud', 'transaction_fraud', 'identity_fraud']
        if fraud_type not in valid_fraud_types:
            return jsonify({
                'success': False,
                'error': f'Invalid fraud type. Must be one of: {", ".join(valid_fraud_types)}'
            }), 400
        
        logger.info(f"Starting AI-powered fraud analysis for session: {session_id}, type: {fraud_type}")
        
        # Perform AI-enhanced fraud analysis
        result = fraud_analysis_service.analyze_fraud_session(session_id, fraud_type)
        
        # Add metadata about AI analysis
        if result.get('success') and result.get('analysis'):
            monitoring_analysis = result['analysis'].get('monitoring_analysis', {})
            api_call_count = len(monitoring_analysis.get('api_call_analysis', []))
            
            result['metadata'] = {
                'ai_analysis_enabled': True,
                'api_calls_analyzed': api_call_count,
                'analysis_timestamp': datetime.now().isoformat(),
                'model_used': Config.OPENAI_MODEL if hasattr(Config, 'OPENAI_MODEL') else 'gpt-3.5-turbo'
            }
            
            logger.info(f"AI analysis completed: {api_call_count} API calls analyzed for session {session_id}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Fraud analysis API error: {e}")
        return jsonify({
            'success': False,
            'error': f'Fraud analysis failed: {str(e)}',
            'details': 'Check that OpenAI API key is configured and Elasticsearch is accessible'
        }), 500

@app.route('/api/fraud-types', methods=['GET'])
def get_fraud_types():
    """Get available fraud analysis types with AI capabilities info"""
    try:
        if fraud_analysis_service:
            fraud_types = fraud_analysis_service.get_fraud_types()
            
            # Add AI capabilities info
            for fraud_type in fraud_types.values():
                fraud_type['ai_enabled'] = True
                fraud_type['ai_features'] = [
                    'API call purpose analysis',
                    'Error pattern detection', 
                    'Risk indicator identification',
                    'Business impact assessment',
                    'Automated recommendations'
                ]
        else:
            fraud_types = {}
        
        return jsonify({
            'success': True,
            'fraud_types': fraud_types,
            'ai_capabilities': {
                'model': getattr(Config, 'OPENAI_MODEL', 'gpt-3.5-turbo'),
                'features': [
                    'Real-time API call analysis',
                    'Intelligent error categorization',
                    'Risk pattern recognition',
                    'Business impact scoring',
                    'Actionable recommendations'
                ]
            }
        })
    except Exception as e:
        logger.error(f"Error getting fraud types: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/fraud-session-preview', methods=['POST'])
def api_fraud_session_preview():
    """Preview session data before full AI-powered fraud analysis"""
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
        
        logger.info(f"Generating session preview for: {session_id}")
        
        # Get basic session information
        session_logs = fraud_analysis_service._gather_session_logs(session_id)
        
        # Quick classification
        order_classification = fraud_analysis_service._classify_order_type(session_logs)
        customer_type = fraud_analysis_service._determine_customer_type(session_logs)
        
        # Count logs by type and identify API calls
        log_counts = {log_type: len(logs) for log_type, logs in session_logs.items()}
        
        # Count potential API calls for AI analysis
        api_call_candidates = 0
        for log_type, logs in session_logs.items():
            for log in logs:
                if fraud_analysis_service._is_api_related_log(log):
                    api_call_candidates += 1
        
        preview_result = {
            'success': True,
            'session_id': session_id,
            'log_counts': log_counts,
            'total_logs': sum(log_counts.values()),
            'api_call_candidates': api_call_candidates,
            'order_classification': order_classification,
            'customer_type': customer_type,
            'has_data': sum(log_counts.values()) > 0,
            'ai_analysis_ready': api_call_candidates > 0,
            'estimated_analysis_time': min(30 + (api_call_candidates * 2), 180)  # Seconds
        }
        
        logger.info(f"Session preview completed: {api_call_candidates} API calls identified for AI analysis")
        
        return jsonify(preview_result)
        
    except Exception as e:
        logger.error(f"Fraud session preview error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/debug-fraud-analysis', methods=['POST'])
def debug_fraud_analysis():
    """Debug endpoint to test fraud analysis with detailed logging"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'debug_session_123')
        fraud_type = data.get('fraud_type', 'digital_fraud')
        
        logger.info(f"=== DEBUG FRAUD ANALYSIS START ===")
        logger.info(f"Session ID: {session_id}")
        logger.info(f"Fraud Type: {fraud_type}")
        
        debug_info = {
            'step_1_initialization': 'Service initialized successfully',
            'step_2_log_gathering': {},
            'step_3_log_processing': {},
            'step_4_ai_analysis': {},
            'step_5_final_result': {}
        }
        
        # Step 1: Test service initialization
        try:
            debug_info['step_1_initialization'] = {
                'status': 'success',
                'fraud_service_available': fraud_analysis_service is not None,
                'elasticsearch_available': hasattr(fraud_analysis_service, 'elasticsearch_service') if fraud_analysis_service else False,
                'openai_configured': bool(getattr(Config, 'OPENAI_API_KEY', None))
            }
        except Exception as e:
            debug_info['step_1_initialization'] = {'status': 'failed', 'error': str(e)}
        
        if not fraud_analysis_service:
            return jsonify({
                'success': False,
                'debug_info': debug_info,
                'error': 'Fraud analysis service not initialized'
            })
        
        # Step 2: Test log gathering
        try:
            session_logs = fraud_analysis_service._gather_session_logs(session_id)
            debug_info['step_2_log_gathering'] = {
                'status': 'success',
                'log_counts': {k: len(v) for k, v in session_logs.items()},
                'total_logs': sum(len(v) for v in session_logs.values()),
                'sample_log_types': list(session_logs.keys())
            }
            logger.info(f"Log gathering result: {debug_info['step_2_log_gathering']}")
        except Exception as e:
            debug_info['step_2_log_gathering'] = {'status': 'failed', 'error': str(e)}
            session_logs = {}
        
        # Step 3: Test log processing (looking for API calls)
        try:
            all_api_logs = []
            for log_type, logs in session_logs.items():
                api_logs_in_type = []
                for log_entry in logs:
                    if fraud_analysis_service._is_api_related_log(log_entry):
                        api_logs_in_type.append(log_entry)
                        log_entry['source_type'] = log_type
                        all_api_logs.append(log_entry)
                
                debug_info['step_3_log_processing'][log_type] = {
                    'total_logs': len(logs),
                    'api_related_logs': len(api_logs_in_type),
                    'sample_messages': [log.get('message', '')[:100] for log in logs[:3]]
                }
            
            debug_info['step_3_log_processing']['summary'] = {
                'total_api_logs_found': len(all_api_logs),
                'will_use_mock_data': len(all_api_logs) == 0
            }
            
            # If no API logs found, show what mock data would be created
            if len(all_api_logs) == 0:
                mock_logs = fraud_analysis_service._create_mock_api_logs(fraud_type)
                debug_info['step_3_log_processing']['mock_data_preview'] = {
                    'mock_logs_count': len(mock_logs),
                    'mock_log_examples': [
                        {
                            'endpoint': log.get('api_endpoint'),
                            'method': log.get('http_method'),
                            'message': log.get('message', '')[:100]
                        } for log in mock_logs[:2]
                    ]
                }
                all_api_logs = mock_logs
                
            logger.info(f"Log processing result: {debug_info['step_3_log_processing']['summary']}")
                
        except Exception as e:
            debug_info['step_3_log_processing'] = {'status': 'failed', 'error': str(e)}
            all_api_logs = []
        
        # Step 4: Test AI analysis on first log
        try:
            if all_api_logs:
                sample_log = all_api_logs[0]
                ai_analysis = fraud_analysis_service._analyze_api_call_with_ai(sample_log, fraud_type)
                
                debug_info['step_4_ai_analysis'] = {
                    'status': 'success',
                    'sample_analysis': {
                        'api_endpoint': ai_analysis.get('api_endpoint'),
                        'request_purpose': ai_analysis.get('request_purpose'),
                        'is_successful': ai_analysis.get('is_successful'),
                        'confidence_score': ai_analysis.get('confidence_score'),
                        'risk_indicators_count': len(ai_analysis.get('risk_indicators', []))
                    }
                }
                logger.info(f"AI analysis successful for sample log")
            else:
                debug_info['step_4_ai_analysis'] = {'status': 'skipped', 'reason': 'No logs to analyze'}
        except Exception as e:
            debug_info['step_4_ai_analysis'] = {'status': 'failed', 'error': str(e)}
        
        # Step 5: Test full analysis
        try:
            full_result = fraud_analysis_service.analyze_fraud_session(session_id, fraud_type)
            
            if full_result.get('success'):
                analysis = full_result.get('analysis', {})
                monitoring = analysis.get('monitoring_analysis', {})
                
                debug_info['step_5_final_result'] = {
                    'status': 'success',
                    'api_calls_analyzed': len(monitoring.get('api_call_analysis', [])),
                    'success_rate': monitoring.get('success_rate', 0),
                    'risk_level': analysis.get('risk_assessment', {}).get('level', 'Unknown'),
                    'recommendations_count': len(analysis.get('recommendations', [])),
                    'has_ai_insights': bool(monitoring.get('ai_insights', {}).get('session_score'))
                }
                
                # Store the result for display
                debug_info['full_analysis_result'] = full_result
                logger.info(f"Full analysis completed successfully")
            else:
                debug_info['step_5_final_result'] = {
                    'status': 'failed', 
                    'error': full_result.get('error', 'Unknown error')
                }
                
        except Exception as e:
            debug_info['step_5_final_result'] = {'status': 'failed', 'error': str(e)}
        
        logger.info(f"=== DEBUG FRAUD ANALYSIS COMPLETE ===")
        
        return jsonify({
            'success': True,
            'debug_info': debug_info,
            'recommendations': [
                'Check the step-by-step debug information above',
                'If step_2_log_gathering shows 0 logs, verify Elasticsearch connection',
                'If step_3_log_processing shows will_use_mock_data=true, mock data will be used for demonstration',
                'If step_4_ai_analysis fails, check OpenAI API key configuration',
                'The full_analysis_result contains the complete fraud analysis for UI display'
            ]
        })
        
    except Exception as e:
        logger.error(f"Debug fraud analysis failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'debug_tip': 'Check that FraudAnalysisService can be imported and initialized'
        }), 500

@app.route('/api/test-fraud-ui', methods=['GET'])
def test_fraud_ui():
    """Test endpoint that returns mock fraud analysis data for UI testing"""
    mock_result = {
        'success': True,
        'session_id': 'ui_test_session',
        'fraud_type': 'digital_fraud',
        'analysis': {
            'monitoring_analysis': {
                'api_call_analysis': [
                    {
                        'api_endpoint': '/api/fraud/risk-assessment',
                        'http_method': 'POST',
                        'request_purpose': 'Comprehensive fraud risk evaluation for digital transaction',
                        'response_analysis': 'Risk assessment completed successfully with comprehensive scoring across multiple fraud vectors',
                        'is_successful': True,
                        'error_details': None,
                        'fraud_relevance': 'Primary fraud detection mechanism providing multi-factor risk analysis',
                        'risk_indicators': ['high_velocity_transactions', 'new_device_detected', 'unusual_location'],
                        'business_impact': 'Critical for transaction approval decision - prevents potential fraud losses',
                        'recommendations': 'Continue enhanced monitoring for velocity patterns and device anomalies',
                        'processing_time_ms': 245,
                        'status_code': 200,
                        'confidence_score': 0.92,
                        'timestamp': '2025-01-03T10:30:00Z',
                        'log_level': 'INFO',
                        'source_type': 'fraud_detection',
                        'session_id': 'ui_test_session',
                        'original_message': 'Multi-factor fraud risk assessment completed for session',
                        'component': 'fraud-risk-engine',
                        'raw_log_id': 'log_fra_001'
                    },
                    {
                        'api_endpoint': '/api/payment/gateway/process',
                        'http_method': 'POST',
                        'request_purpose': 'Process payment transaction through secure gateway',
                        'response_analysis': 'Payment processing failed due to insufficient account balance',
                        'is_successful': False,
                        'error_details': 'Transaction declined: Insufficient funds in linked account',
                        'fraud_relevance': 'Payment failure could indicate account compromise or unauthorized access attempts',
                        'risk_indicators': ['payment_decline', 'insufficient_funds', 'multiple_retry_attempts'],
                        'business_impact': 'Transaction rejected resulting in revenue loss and potential customer friction',
                        'recommendations': 'Verify account status, review recent transaction history, implement payment retry logic',
                        'processing_time_ms': 180,
                        'status_code': 402,
                        'confidence_score': 0.88,
                        'timestamp': '2025-01-03T10:30:05Z',
                        'log_level': 'ERROR',
                        'source_type': 'payment_gateway',
                        'session_id': 'ui_test_session',
                        'original_message': 'Payment gateway processing failed - insufficient funds',
                        'component': 'payment-processor',
                        'raw_log_id': 'log_pay_002'
                    },
                    {
                        'api_endpoint': '/api/device/fingerprint/analyze',
                        'http_method': 'POST',
                        'request_purpose': 'Advanced device fingerprinting and behavioral analysis',
                        'response_analysis': 'Device analysis completed with elevated risk indicators detected',
                        'is_successful': True,
                        'error_details': None,
                        'fraud_relevance': 'Device fingerprinting critical for detecting bot activity and device spoofing',
                        'risk_indicators': ['unusual_browser_fingerprint', 'vpn_detected', 'automation_patterns'],
                        'business_impact': 'Enables detection of automated fraud attempts and device-based attacks',
                        'recommendations': 'Flag session for enhanced monitoring, require additional authentication',
                        'processing_time_ms': 320,
                        'status_code': 200,
                        'confidence_score': 0.85,
                        'timestamp': '2025-01-03T10:29:55Z',
                        'log_level': 'WARN',
                        'source_type': 'fraud_detection',
                        'session_id': 'ui_test_session',
                        'original_message': 'Device fingerprinting analysis detected suspicious patterns',
                        'component': 'device-analyzer',
                        'raw_log_id': 'log_dev_003'
                    }
                ],
                'ai_insights': {
                    'overall_session_health': 'Session exhibits mixed indicators with successful fraud detection but payment processing challenges and elevated device risk signals',
                    'key_findings': [
                        'Fraud detection systems functioning properly',
                        'Payment processing failed due to insufficient funds',
                        'Device analysis reveals suspicious automation patterns',
                        'Multiple risk indicators present across different service layers'
                    ],
                    'fraud_risk_assessment': 'Medium-to-high risk due to payment failures, device anomalies, and velocity patterns suggesting potential fraudulent activity',
                    'critical_issues': [
                        'Payment processing failure indicating potential account issues',
                        'Device fingerprinting shows automation and VPN usage',
                        'Multiple retry attempts suggesting scripted behavior'
                    ],
                    'positive_indicators': [
                        'Fraud detection system actively monitoring and scoring',
                        'Risk assessment engine operational with high confidence',
                        'Device analysis successfully detecting anomalies'
                    ],
                    'recommended_actions': [
                        'Implement immediate enhanced verification for this session',
                        'Review account balance verification and notification processes',
                        'Consider implementing progressive authentication for suspicious devices',
                        'Enhance monitoring for payment retry patterns and velocity'
                    ],
                    'session_score': 68,
                    'confidence_level': 'high'
                },
                'summary_statistics': {
                    'total_api_calls': 3,
                    'successful_calls': 2,
                    'failed_calls': 1,
                    'success_rate': 0.67,
                    'unique_endpoints': 3,
                    'error_types': {'payment_errors': 1}
                }
            },
            'order_classification': {
                'type': 'purchase',
                'confidence': 0.78,
                'amount': 247.50,
                'currency': 'USD',
                'indicators': ['purchase', 'checkout', 'payment']
            },
            'customer_type': {
                'type': 'existing_customer',
                'confidence': 0.65,
                'customer_id': 'cust_78945612',
                'indicators': ['previous_orders']
            },
            'risk_assessment': {
                'level': 'MEDIUM',
                'score': 68,
                'color': '#ffaa00',
                'factors': [
                    'Payment processing failure with insufficient funds',
                    'Device fingerprinting detected automation patterns',
                    'VPN usage and unusual browser characteristics',
                    'Multiple transaction retry attempts'
                ]
            },
            'recommendations': [
                'Require additional identity verification for this session',
                'Review and update account balance notification system',
                'Implement enhanced device authentication for suspicious fingerprints',
                'Monitor transaction velocity and retry patterns more closely',
                'Consider progressive friction for automated behavior detection'
            ],
            'statistics': {
                'total_logs_analyzed': 18,
                'fraud_calls_triggered': 3,
                'fraud_call_success_rate': 0.67,
                'risk_scores_recorded': 2,
                'decisions_made': 3
            },
            'timeline': [
                {
                    'timestamp': '2025-01-03T10:29:55Z',
                    'event': 'Device Analysis: fingerprint/analyze',
                    'status': 'Success',
                    'details': 'Advanced device fingerprinting and behavioral analysis'
                },
                {
                    'timestamp': '2025-01-03T10:30:00Z',
                    'event': 'Fraud Detection: risk-assessment',
                    'status': 'Success',
                    'details': 'Comprehensive fraud risk evaluation for digital transaction'
                },
                {
                    'timestamp': '2025-01-03T10:30:05Z',
                    'event': 'Payment Processing: gateway/process',
                    'status': 'Failed',
                    'details': 'Process payment transaction through secure gateway'
                }
            ]
        }
    }
    
    return jsonify(mock_result)

# Update your health check endpoint to include fraud analysis service status
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
            'fraud_analysis_service': fraud_analysis_service is not None  # Add this line
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
        
        # Add fraud analysis info
        status['fraud_analysis'] = {
            'service_available': fraud_analysis_service is not None,
            'ai_enabled': bool(Config.OPENAI_API_KEY),
            'supported_types': ['digital_fraud', 'assisted_fraud', 'transaction_fraud', 'identity_fraud'] if fraud_analysis_service else []
        }
        
    except:
        status.update({
            'jira_configured': False,
            'openai_configured': False,
            'oracle_configured': False,
            'elasticsearch_configured': False,
            'fraud_analysis': {'service_available': False},
            'config_error': 'Configuration module not available'
        })
        
    return jsonify(status)

# Also update your test connections endpoint to include fraud analysis
@app.route('/api/test-connections', methods=['GET'])
def test_connections():
    """Test all service connections including fraud analysis"""
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
            # Test basic functionality
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
