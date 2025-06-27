# app.py - Main Flask Application
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
import logging
from config.settings import Config
from services.jira_service import JiraService
from services.security_service import SecurityService
from database.validators import OrderValidator
from utils.logging_config import setup_logging
from utils.helpers import validate_required_fields

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app)
    
    # Validate configuration
    if not Config.validate():
        logger.error("Configuration validation failed")
        exit(1)
    
    # Initialize services
    jira_service = JiraService()
    security_service = SecurityService()
    order_validator = OrderValidator()
    
    @app.route('/')
    def index():
        """Serve the main application page"""
        return render_template('index.html')
    
    @app.route('/api/validate-order', methods=['POST'])
    def api_validate_order():
        """API endpoint to validate order in Oracle DB"""
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
        return jsonify({
            'status': 'healthy',
            'jira_configured': bool(Config.JIRA_URL and Config.JIRA_USERNAME and Config.JIRA_TOKEN),
            'openai_configured': bool(Config.OPENAI_API_KEY),
            'oracle_configured': bool(Config.ORACLE_DSN and Config.ORACLE_USER)
        })
    
    @app.route('/api/test-connections', methods=['GET'])
    def test_connections():
        """Test all service connections"""
        results = {}
        
        # Test Jira connection
        try:
            jira_result = jira_service.test_connection()
            results['jira'] = jira_result
        except Exception as e:
            results['jira'] = {'success': False, 'error': str(e)}
        
        # Test Oracle connection
        try:
            oracle_result = order_validator.test_connection()
            results['oracle'] = oracle_result
        except Exception as e:
            results['oracle'] = {'success': False, 'error': str(e)}
        
        return jsonify(results)
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    print("🚀 Starting Jira AI Assistant with Oracle DB Integration...")
    print("=" * 70)
    print(f"📊 Configuration:")
    print(f"   - Jira URL: {Config.JIRA_URL}")
    print(f"   - Jira Username: {Config.JIRA_USERNAME}")
    print(f"   - OpenAI API: {'✅ Configured' if Config.OPENAI_API_KEY else '❌ Missing'}")
    print(f"   - Oracle DB: {'✅ Configured' if Config.ORACLE_DSN else '❌ Missing'}")
    print("=" * 70)
    print("🌐 Server starting at: http://localhost:5000")
    print("🔍 Health check: http://localhost:5000/api/health")
    print("🧪 Test connections: http://localhost:5000/api/test-connections")
    print("=" * 70)
    
    try:
        app.run(
            debug=Config.DEBUG,
            host='0.0.0.0',
            port=Config.PORT
        )
    except KeyboardInterrupt:
        print("\n👋 Shutting down Jira AI Assistant...")
    except Exception as e:
        print(f"❌ Error starting server: {e}")