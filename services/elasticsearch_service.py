# services/elasticsearch_service.py
import logging
import requests
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import base64
from config.settings import Config

logger = logging.getLogger(__name__)

class ElasticsearchService:
    """Service for Elasticsearch log analysis operations"""
    
    def __init__(self):
        self.es_host = Config.ELASTICSEARCH_HOST
        self.es_port = Config.ELASTICSEARCH_PORT
        self.es_username = Config.ELASTICSEARCH_USERNAME
        self.es_password = Config.ELASTICSEARCH_PASSWORD
        self.es_use_ssl = Config.ELASTICSEARCH_USE_SSL
        
        # Build base URL
        protocol = 'https' if self.es_use_ssl else 'http'
        self.base_url = f"{protocol}://{self.es_host}:{self.es_port}"
        
        # Setup authentication
        self.auth_header = self._create_auth_header()
        
        # Log type configurations
        self.log_configs = Config.LOG_ANALYSIS_CONFIGS
    
    def _create_auth_header(self):
        """Create basic authentication header"""
        if self.es_username and self.es_password:
            credentials = f"{self.es_username}:{self.es_password}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            return f"Basic {encoded_credentials}"
        return None
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Elasticsearch connection"""
        try:
            headers = {'Content-Type': 'application/json'}
            if self.auth_header:
                headers['Authorization'] = self.auth_header
            
            response = requests.get(
                f"{self.base_url}/_cluster/health",
                headers=headers,
                timeout=10,
                verify=False if not Config.ELASTICSEARCH_VERIFY_SSL else True
            )
            response.raise_for_status()
            
            health_data = response.json()
            return {
                'success': True,
                'message': 'Elasticsearch connection successful',
                'cluster_name': health_data.get('cluster_name'),
                'status': health_data.get('status'),
                'number_of_nodes': health_data.get('number_of_nodes'),
                'elasticsearch_version': self._get_version()
            }
            
        except Exception as e:
            logger.error(f"Elasticsearch connection test failed: {e}")
            return {
                'success': False,
                'error': f'Connection failed: {str(e)}'
            }
    
    def _get_version(self):
        """Get Elasticsearch version"""
        try:
            headers = {'Content-Type': 'application/json'}
            if self.auth_header:
                headers['Authorization'] = self.auth_header
                
            response = requests.get(
                self.base_url,
                headers=headers,
                timeout=5,
                verify=False if not Config.ELASTICSEARCH_VERIFY_SSL else True
            )
            return response.json().get('version', {}).get('number', 'Unknown')
        except:
            return 'Unknown'
    
    def search_logs(self, log_type: str, session_id: str, **filters) -> Dict[str, Any]:
        """
        Search logs based on log type and session ID
        
        Args:
            log_type: Type of logs (3d-secure, enforce-xml6, full-auth, etc.)
            session_id: Session ID to search for
            **filters: Additional filters (time_range, log_level, etc.)
            
        Returns:
            Dict containing search results
        """
        try:
            # Get configuration for this log type
            log_config = self.log_configs.get(log_type)
            if not log_config:
                return {
                    'success': False,
                    'error': f'Unknown log type: {log_type}'
                }
            
            # Build search query
            query = self._build_search_query(session_id, log_config, filters)
            
            # Get index name
            index_name = log_config['index']
            
            # Perform search
            search_results = self._execute_search(index_name, query)
            
            if search_results['success']:
                # Process and format results
                formatted_results = self._format_search_results(
                    search_results['data'], 
                    log_type, 
                    session_id
                )
                
                return {
                    'success': True,
                    'log_type': log_type,
                    'session_id': session_id,
                    'total_hits': formatted_results['total'],
                    'results': formatted_results['logs'],
                    'filters_applied': filters,
                    'index_searched': index_name,
                    'search_time_ms': search_results.get('took', 0)
                }
            else:
                return search_results
            
        except Exception as e:
            logger.error(f"Error searching logs for {log_type}: {e}")
            return {
                'success': False,
                'error': f'Search failed: {str(e)}'
            }
    
    def _build_search_query(self, session_id: str, log_config: Dict, filters: Dict) -> Dict:
        """Build Elasticsearch query"""
        
        # Base query structure
        query = {
            "query": {
                "bool": {
                    "must": [],
                    "filter": []
                }
            },
            "sort": [
                {"@timestamp": {"order": "desc"}}
            ],
            "size": filters.get('max_results', 100)
        }
        
        # Add session ID filter
        session_field = log_config.get('session_field', 'sessionId')
        query["query"]["bool"]["must"].append({
            "match": {session_field: session_id}
        })
        
        # Add time range filter
        time_range = filters.get('time_range', '24h')
        if time_range:
            time_filter = self._build_time_filter(time_range)
            if time_filter:
                query["query"]["bool"]["filter"].append(time_filter)
        
        # Add log level filter
        log_level = filters.get('log_level')
        if log_level and log_level != 'all':
            level_field = log_config.get('level_field', 'level')
            query["query"]["bool"]["filter"].append({
                "term": {level_field: log_level.upper()}
            })
        
        # Add component filter
        component = filters.get('component')
        if component:
            component_field = log_config.get('component_field', 'component')
            query["query"]["bool"]["filter"].append({
                "term": {component_field: component}
            })
        
        # Add custom fields based on log type
        custom_filters = log_config.get('custom_filters', {})
        for field, value in custom_filters.items():
            if field in filters and filters[field]:
                query["query"]["bool"]["filter"].append({
                    "term": {field: filters[field]}
                })
        
        return query
    
    def _build_time_filter(self, time_range: str) -> Optional[Dict]:
        """Build time range filter"""
        time_map = {
            '1h': 'now-1h',
            '6h': 'now-6h',
            '24h': 'now-24h',
            '7d': 'now-7d',
            '30d': 'now-30d'
        }
        
        if time_range in time_map:
            return {
                "range": {
                    "@timestamp": {
                        "gte": time_map[time_range],
                        "lte": "now"
                    }
                }
            }
        return None
    
    def _execute_search(self, index_name: str, query: Dict) -> Dict[str, Any]:
        """Execute search against Elasticsearch"""
        try:
            headers = {'Content-Type': 'application/json'}
            if self.auth_header:
                headers['Authorization'] = self.auth_header
            
            search_url = f"{self.base_url}/{index_name}/_search"
            
            response = requests.post(
                search_url,
                headers=headers,
                data=json.dumps(query),
                timeout=30,
                verify=False if not Config.ELASTICSEARCH_VERIFY_SSL else True
            )
            response.raise_for_status()
            
            return {
                'success': True,
                'data': response.json()
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Elasticsearch search request failed: {e}")
            return {
                'success': False,
                'error': f'Search request failed: {str(e)}'
            }
        except Exception as e:
            logger.error(f"Unexpected error during search: {e}")
            return {
                'success': False,
                'error': f'Unexpected error: {str(e)}'
            }
    
    def _format_search_results(self, es_response: Dict, log_type: str, session_id: str) -> Dict:
        """Format Elasticsearch response for display"""
        hits = es_response.get('hits', {})
        total = hits.get('total', {})
        
        # Handle different ES versions
        if isinstance(total, dict):
            total_count = total.get('value', 0)
        else:
            total_count = total
        
        formatted_logs = []
        
        for hit in hits.get('hits', []):
            source = hit.get('_source', {})
            
            # Extract common fields
            log_entry = {
                'id': hit.get('_id'),
                'timestamp': source.get('@timestamp'),
                'level': source.get('level', 'INFO'),
                'message': source.get('message', ''),
                'session_id': session_id,
                'component': source.get('component', ''),
                'raw_data': source
            }
            
            # Add log-type specific fields
            if log_type == '3d-secure':
                log_entry.update({
                    'transaction_id': source.get('transactionId'),
                    'card_number': source.get('cardNumber', '').replace(source.get('cardNumber', '')[:12], '*' * 12) if source.get('cardNumber') else '',
                    'auth_status': source.get('authStatus'),
                    'response_code': source.get('responseCode'),
                    'merchant_id': source.get('merchantId')
                })
            elif log_type == 'full-auth':
                log_entry.update({
                    'auth_method': source.get('authMethod'),
                    'user_id': source.get('userId'),
                    'auth_result': source.get('authResult'),
                    'failure_reason': source.get('failureReason'),
                    'ip_address': source.get('ipAddress'),
                    'user_agent': source.get('userAgent')
                })
            elif log_type == 'payment-gateway':
                log_entry.update({
                    'payment_id': source.get('paymentId'),
                    'amount': source.get('amount'),
                    'currency': source.get('currency'),
                    'gateway_response': source.get('gatewayResponse'),
                    'processing_time': source.get('processingTime')
                })
            elif log_type == 'fraud-detection':
                log_entry.update({
                    'risk_score': source.get('riskScore'),
                    'fraud_indicators': source.get('fraudIndicators', []),
                    'decision': source.get('decision'),
                    'rules_triggered': source.get('rulesTriggered', [])
                })
            elif log_type == 'api-gateway':
                log_entry.update({
                    'api_endpoint': source.get('apiEndpoint'),
                    'http_method': source.get('httpMethod'),
                    'response_time': source.get('responseTime'),
                    'status_code': source.get('statusCode'),
                    'request_size': source.get('requestSize'),
                    'response_size': source.get('responseSize')
                })
            
            formatted_logs.append(log_entry)
        
        return {
            'total': total_count,
            'logs': formatted_logs
        }
    
    def get_available_components(self, log_type: str) -> List[str]:
        """Get available components for a log type"""
        try:
            log_config = self.log_configs.get(log_type, {})
            index_name = log_config.get('index')
            
            if not index_name:
                return []
            
            # Query to get unique components
            query = {
                "size": 0,
                "aggs": {
                    "components": {
                        "terms": {
                            "field": log_config.get('component_field', 'component'),
                            "size": 50
                        }
                    }
                }
            }
            
            search_result = self._execute_search(index_name, query)
            
            if search_result['success']:
                buckets = search_result['data'].get('aggregations', {}).get('components', {}).get('buckets', [])
                return [bucket['key'] for bucket in buckets]
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting components for {log_type}: {e}")
            return []
