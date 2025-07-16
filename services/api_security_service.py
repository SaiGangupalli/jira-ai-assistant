# Add these endpoints to your app.py file

from services.api_security_service import APISecurityService

# Initialize API Security Service
api_security_service = None
try:
    api_security_service = APISecurityService()
    logger.info("API Security Service initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize API Security Service: {e}")

# API Security Test Case Generation Endpoints

@app.route('/api/api-security/sub-services', methods=['GET'])
def get_api_security_sub_services():
    """Get available sub-services for API security testing"""
    if not api_security_service:
        return jsonify({
            'success': False,
            'error': 'API Security service not available. Please check Elasticsearch and OpenAI configuration.'
        }), 503
    
    try:
        result = api_security_service.get_sub_services()
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error getting sub-services: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/api-security/generate-test-cases', methods=['POST'])
def generate_api_security_test_cases():
    """Generate API security test cases for a specific sub-service"""
    if not api_security_service:
        return jsonify({
            'success': False,
            'error': 'API Security service not available. Please check Elasticsearch and OpenAI configuration.'
        }), 503
    
    try:
        data = request.get_json()
        if not data or not data.get('sub_service'):
            return jsonify({
                'success': False,
                'error': 'Missing required field: sub_service'
            }), 400
        
        sub_service = data.get('sub_service')
        additional_filters = data.get('filters', {})
        
        logger.info(f"Generating API security test cases for sub-service: {sub_service}")
        
        result = api_security_service.generate_security_test_cases(
            sub_service=sub_service,
            additional_filters=additional_filters
        )
        
        if result['success']:
            logger.info(f"Successfully generated {len(result['test_cases'])} test cases for {sub_service}")
        else:
            logger.error(f"Failed to generate test cases for {sub_service}: {result.get('error')}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in API security test case generation: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/api-security/test-connection', methods=['GET'])
def test_api_security_connection():
    """Test API Security service connection"""
    if not api_security_service:
        return jsonify({
            'success': False,
            'error': 'API Security service not available'
        }), 503
    
    try:
        result = api_security_service.test_connection()
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error testing API security connection: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Update the health check endpoint to include API Security service
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint - UPDATE this existing function to include API Security service"""
    status = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'jira_service': jira_service is not None,
            'security_service': security_service is not None,
            'order_validator': order_validator is not None,
            'elasticsearch_service': elasticsearch_service is not None,
            'fraud_analysis_service': fraud_analysis_service is not None,
            'jenkins_service': jenkins_service is not None,
            'api_security_service': api_security_service is not None  # Add this line
        }
    }
    
    try:
        from config.settings import Config
        status.update({
            'jira_configured': bool(Config.JIRA_URL and Config.JIRA_USERNAME and Config.JIRA_TOKEN),
            'openai_configured': bool(Config.OPENAI_API_KEY),
            'oracle_configured': bool(Config.ORACLE_DSN and Config.ORACLE_USER),
            'elasticsearch_configured': bool(Config.ELASTICSEARCH_HOST and Config.ELASTICSEARCH_USERNAME),
            'jenkins_configured': bool(Config.JENKINS_URL and Config.JENKINS_USERNAME and Config.JENKINS_TOKEN)
        })
        
        # Add API Security service info
        status['api_security'] = {
            'service_available': api_security_service is not None,
            'elasticsearch_required': True,
            'openai_required': True,
            'sub_services_available': len(api_security_service.sub_services) if api_security_service else 0
        }
        
    except:
        status.update({
            'jira_configured': False,
            'openai_configured': False,
            'oracle_configured': False,
            'elasticsearch_configured': False,
            'jenkins_configured': False,
            'api_security': {'service_available': False},
            'config_error': 'Configuration module not available'
        })
        
    return jsonify(status)

# Update the test connections endpoint to include API Security service
@app.route('/api/test-connections', methods=['GET'])
def test_connections():
    """Test all service connections including API Security service - UPDATE this existing function"""
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
    
    # Test API Security service
    if api_security_service:
        try:
            api_security_result = api_security_service.test_connection()
            results['api_security'] = api_security_result
        except Exception as e:
            results['api_security'] = {'success': False, 'error': str(e)}
    else:
        results['api_security'] = {'success': False, 'error': 'Service not initialized'}
    
    return jsonify(results)
