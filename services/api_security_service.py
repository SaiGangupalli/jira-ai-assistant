# services/api_security_service.py
import logging
import openai
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from services.elasticsearch_service import ElasticsearchService
from config.settings import Config

logger = logging.getLogger(__name__)

class APISecurityService:
    """Service for API Security test case generation with Elasticsearch integration"""
    
    def __init__(self):
        self.elasticsearch_service = ElasticsearchService()
        openai.api_key = Config.OPENAI_API_KEY
        
        # Define sub-services available for API security testing
        self.sub_services = {
            'payment_gateway': {
                'name': 'Payment Gateway',
                'description': 'Payment processing and transaction APIs',
                'es_index': 'payment-api-logs*',
                'api_patterns': ['payment', 'transaction', 'checkout', 'billing']
            },
            'user_management': {
                'name': 'User Management',
                'description': 'User authentication and authorization APIs',
                'es_index': 'user-api-logs*',
                'api_patterns': ['user', 'auth', 'login', 'register', 'profile']
            },
            'order_processing': {
                'name': 'Order Processing',
                'description': 'Order creation and management APIs',
                'es_index': 'order-api-logs*',
                'api_patterns': ['order', 'cart', 'inventory', 'fulfillment']
            },
            'notification_service': {
                'name': 'Notification Service',
                'description': 'Email, SMS and push notification APIs',
                'es_index': 'notification-api-logs*',
                'api_patterns': ['notification', 'email', 'sms', 'push']
            },
            'analytics_service': {
                'name': 'Analytics Service',
                'description': 'Data analytics and reporting APIs',
                'es_index': 'analytics-api-logs*',
                'api_patterns': ['analytics', 'reporting', 'metrics', 'dashboard']
            },
            'integration_service': {
                'name': 'Integration Service',
                'description': 'Third-party integration APIs',
                'es_index': 'integration-api-logs*',
                'api_patterns': ['integration', 'webhook', 'callback', 'partner']
            }
        }
    
    def get_sub_services(self) -> Dict[str, Any]:
        """Get available sub-services for API security testing"""
        return {
            'success': True,
            'sub_services': self.sub_services
        }
    
    def generate_security_test_cases(self, sub_service: str, additional_filters: Optional[Dict] = None) -> Dict[str, Any]:
        """Generate API security test cases for a specific sub-service"""
        try:
            if sub_service not in self.sub_services:
                return {
                    'success': False,
                    'error': f'Invalid sub-service: {sub_service}. Available services: {list(self.sub_services.keys())}'
                }
            
            service_config = self.sub_services[sub_service]
            
            # Step 1: Fetch API data from Elasticsearch
            api_data = self._fetch_api_data_from_elasticsearch(service_config, additional_filters)
            
            if not api_data['success']:
                return api_data
            
            # Step 2: Generate security test cases using LLM
            test_cases = self._generate_test_cases_with_llm(api_data['data'], service_config)
            
            return {
                'success': True,
                'sub_service': sub_service,
                'service_name': service_config['name'],
                'api_data_count': len(api_data['data']),
                'test_cases': test_cases,
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating security test cases for {sub_service}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _fetch_api_data_from_elasticsearch(self, service_config: Dict, additional_filters: Optional[Dict] = None) -> Dict[str, Any]:
        """Fetch API request/response data from Elasticsearch"""
        try:
            # Build Elasticsearch query
            query = {
                "size": 50,  # Limit results for processing
                "query": {
                    "bool": {
                        "must": [
                            {
                                "range": {
                                    "@timestamp": {
                                        "gte": "now-24h"  # Last 24 hours
                                    }
                                }
                            }
                        ],
                        "should": [
                            {
                                "terms": {
                                    "api_endpoint.keyword": service_config['api_patterns']
                                }
                            },
                            {
                                "multi_match": {
                                    "query": " ".join(service_config['api_patterns']),
                                    "fields": ["request_path", "service_name", "endpoint"]
                                }
                            }
                        ],
                        "minimum_should_match": 1
                    }
                },
                "sort": [
                    {
                        "@timestamp": {"order": "desc"}
                    }
                ],
                "_source": [
                    "request_method",
                    "request_path", 
                    "request_headers",
                    "request_body",
                    "response_status",
                    "response_headers",
                    "response_body",
                    "outgoing_headers",
                    "api_endpoint",
                    "service_name",
                    "@timestamp"
                ]
            }
            
            # Apply additional filters if provided
            if additional_filters:
                if additional_filters.get('status_code'):
                    query["query"]["bool"]["must"].append({
                        "term": {"response_status": additional_filters['status_code']}
                    })
                
                if additional_filters.get('method'):
                    query["query"]["bool"]["must"].append({
                        "term": {"request_method.keyword": additional_filters['method']}
                    })
            
            # Execute search
            search_results = self.elasticsearch_service.search(
                index=service_config['es_index'],
                body=query
            )
            
            if not search_results['success']:
                return {
                    'success': False,
                    'error': f'Elasticsearch search failed: {search_results.get("error", "Unknown error")}'
                }
            
            # Process and format results
            api_data = []
            for hit in search_results['hits']['hits']:
                source = hit['_source']
                
                api_entry = {
                    'timestamp': source.get('@timestamp'),
                    'method': source.get('request_method'),
                    'path': source.get('request_path'),
                    'endpoint': source.get('api_endpoint'),
                    'service_name': source.get('service_name'),
                    'request': {
                        'headers': source.get('request_headers', {}),
                        'body': source.get('request_body', {})
                    },
                    'response': {
                        'status': source.get('response_status'),
                        'headers': source.get('response_headers', {}),
                        'body': source.get('response_body', {})
                    },
                    'outgoing_headers': source.get('outgoing_headers', {})
                }
                
                api_data.append(api_entry)
            
            return {
                'success': True,
                'data': api_data,
                'total_found': search_results['hits']['total']['value']
            }
            
        except Exception as e:
            logger.error(f"Error fetching API data from Elasticsearch: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_test_cases_with_llm(self, api_data: List[Dict], service_config: Dict) -> List[Dict]:
        """Generate security test cases using LLM"""
        try:
            # Prepare API data summary for LLM
            api_summary = self._prepare_api_summary(api_data)
            
            # Create prompt for LLM
            prompt = f"""
You are a cybersecurity expert specializing in API security testing. Based on the following API data from the {service_config['name']} service, generate comprehensive security test cases.

Service Information:
- Name: {service_config['name']}
- Description: {service_config['description']}
- API Patterns: {', '.join(service_config['api_patterns'])}

API Data Summary:
{api_summary}

Generate detailed security test cases covering the following areas:
1. Authentication & Authorization vulnerabilities
2. Input validation and injection attacks
3. Rate limiting and DoS protection
4. Data exposure and privacy issues
5. Session management vulnerabilities
6. CORS and cross-origin issues
7. API versioning and deprecation security
8. Error handling and information disclosure

For each test case, provide:
- Test Case ID
- Test Case Name
- Vulnerability Category
- Risk Level (Critical, High, Medium, Low)
- Test Description
- Expected Behavior
- Test Steps
- Payload Examples (if applicable)
- Remediation Suggestions

Format the response as a JSON array of test case objects.
"""
            
            # Call OpenAI API
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a cybersecurity expert specializing in API security testing."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=4000,
                temperature=0.3
            )
            
            # Parse LLM response
            llm_response = response.choices[0].message.content.strip()
            
            # Try to parse as JSON
            try:
                test_cases = json.loads(llm_response)
                if isinstance(test_cases, list):
                    return test_cases
                else:
                    # If not a list, wrap in array
                    return [test_cases]
            except json.JSONDecodeError:
                # If JSON parsing fails, create a single test case with the raw response
                return [{
                    'test_case_id': 'API_SEC_001',
                    'test_case_name': 'Generated Security Test Cases',
                    'vulnerability_category': 'General Security',
                    'risk_level': 'Medium',
                    'test_description': llm_response,
                    'expected_behavior': 'Review and implement suggested security measures',
                    'test_steps': ['Review the generated recommendations', 'Implement security measures'],
                    'payload_examples': [],
                    'remediation_suggestions': ['Follow the detailed recommendations provided']
                }]
                
        except Exception as e:
            logger.error(f"Error generating test cases with LLM: {e}")
            return [{
                'test_case_id': 'API_SEC_ERROR',
                'test_case_name': 'Error in Test Case Generation',
                'vulnerability_category': 'System Error',
                'risk_level': 'High',
                'test_description': f'Failed to generate test cases: {str(e)}',
                'expected_behavior': 'System should generate test cases successfully',
                'test_steps': ['Check system configuration', 'Verify API connectivity'],
                'payload_examples': [],
                'remediation_suggestions': ['Review system logs', 'Check OpenAI API configuration']
            }]
    
    def _prepare_api_summary(self, api_data: List[Dict]) -> str:
        """Prepare a summary of API data for LLM processing"""
        if not api_data:
            return "No API data available for analysis."
        
        summary = f"Total API calls analyzed: {len(api_data)}\n\n"
        
        # Group by endpoint
        endpoints = {}
        methods = set()
        status_codes = set()
        
        for api_call in api_data:
            endpoint = api_call.get('path', 'unknown')
            method = api_call.get('method', 'unknown')
            status = api_call.get('response', {}).get('status', 'unknown')
            
            methods.add(method)
            status_codes.add(status)
            
            if endpoint not in endpoints:
                endpoints[endpoint] = {
                    'methods': set(),
                    'status_codes': set(),
                    'sample_request': None,
                    'sample_response': None
                }
            
            endpoints[endpoint]['methods'].add(method)
            endpoints[endpoint]['status_codes'].add(status)
            
            # Store sample request/response for first occurrence
            if not endpoints[endpoint]['sample_request']:
                endpoints[endpoint]['sample_request'] = api_call.get('request', {})
                endpoints[endpoint]['sample_response'] = api_call.get('response', {})
        
        summary += f"HTTP Methods used: {', '.join(methods)}\n"
        summary += f"Response status codes: {', '.join(map(str, status_codes))}\n\n"
        
        summary += "API Endpoints analyzed:\n"
        for endpoint, data in list(endpoints.items())[:10]:  # Limit to first 10
            summary += f"- {endpoint}\n"
            summary += f"  Methods: {', '.join(data['methods'])}\n"
            summary += f"  Status codes: {', '.join(map(str, data['status_codes']))}\n"
            
            # Add sample headers for security analysis
            if data['sample_request'] and data['sample_request'].get('headers'):
                summary += f"  Sample request headers: {list(data['sample_request']['headers'].keys())}\n"
            
            if data['sample_response'] and data['sample_response'].get('headers'):
                summary += f"  Sample response headers: {list(data['sample_response']['headers'].keys())}\n"
            
            summary += "\n"
        
        return summary
    
    def test_connection(self) -> Dict[str, Any]:
        """Test service connections"""
        try:
            # Test Elasticsearch connection
            es_test = self.elasticsearch_service.test_connection()
            
            # Test OpenAI API
            openai_test = bool(Config.OPENAI_API_KEY)
            
            return {
                'success': True,
                'message': 'API Security service operational',
                'elasticsearch': es_test,
                'openai_configured': openai_test,
                'sub_services_count': len(self.sub_services)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
