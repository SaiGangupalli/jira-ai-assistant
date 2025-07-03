# services/fraud_analysis_service.py
import logging
import requests
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from services.elasticsearch_service import ElasticsearchService
from config.settings import Config

logger = logging.getLogger(__name__)

class FraudAnalysisService:
    """Service for comprehensive fraud analysis operations"""
    
    def __init__(self):
        self.elasticsearch_service = ElasticsearchService()
        
        # Fraud monitoring call patterns
        self.fraud_monitoring_calls = {
            'customer_verification': ['customer_lookup', 'identity_check', 'kyc_validation'],
            'transaction_monitoring': ['velocity_check', 'amount_validation', 'pattern_analysis'],
            'device_fingerprinting': ['device_check', 'browser_analysis', 'ip_validation'],
            'behavioral_analysis': ['user_behavior', 'session_analysis', 'interaction_patterns'],
            'risk_scoring': ['risk_calculator', 'ml_scoring', 'rule_engine'],
            'external_checks': ['blacklist_check', 'whitelist_validation', 'bureau_check']
        }
        
        # Order type classification patterns
        self.order_patterns = {
            'purchase': ['buy', 'purchase', 'order', 'checkout', 'payment'],
            'refund': ['refund', 'return', 'chargeback', 'reversal'],
            'subscription': ['subscription', 'recurring', 'monthly', 'annual'],
            'transfer': ['transfer', 'send', 'p2p', 'wire'],
            'withdrawal': ['withdraw', 'cash_out', 'atm', 'disbursement'],
            'deposit': ['deposit', 'add_funds', 'top_up', 'reload']
        }
        
        # Customer type indicators
        self.customer_indicators = {
            'new_customer': ['first_order', 'registration', 'new_account', 'onboarding'],
            'existing_customer': ['repeat_customer', 'returning', 'loyalty', 'previous_orders']
        }

    def analyze_fraud_session(self, session_id: str, fraud_type: str) -> Dict[str, Any]:
        """
        Comprehensive fraud analysis for a given session
        
        Args:
            session_id: Session ID to analyze
            fraud_type: Type of fraud analysis (digital_fraud, assisted_fraud, etc.)
            
        Returns:
            Dict containing fraud analysis results
        """
        try:
            logger.info(f"Starting fraud analysis for session {session_id}, type: {fraud_type}")
            
            # Step 1: Gather all log data for the session
            session_logs = self._gather_session_logs(session_id)
            
            # Step 2: Classify order type
            order_classification = self._classify_order_type(session_logs)
            
            # Step 3: Determine customer type
            customer_type = self._determine_customer_type(session_logs)
            
            # Step 4: Analyze fraud monitoring calls
            fraud_monitoring_analysis = self._analyze_fraud_monitoring_calls(session_logs, fraud_type)
            
            # Step 5: Generate comprehensive analysis
            analysis_result = self._generate_fraud_analysis(
                session_id, fraud_type, session_logs, order_classification, 
                customer_type, fraud_monitoring_analysis
            )
            
            return {
                'success': True,
                'session_id': session_id,
                'fraud_type': fraud_type,
                'analysis': analysis_result,
                'analyzed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in fraud analysis for session {session_id}: {e}")
            return {
                'success': False,
                'session_id': session_id,
                'fraud_type': fraud_type,
                'error': f'Fraud analysis failed: {str(e)}'
            }

    def _gather_session_logs(self, session_id: str) -> Dict[str, List]:
        """Gather logs from all relevant sources for the session"""
        session_logs = {
            'fraud_detection': [],
            'payment_gateway': [],
            'full_auth': [],
            'api_gateway': [],
            'customer_data': []
        }
        
        # Search each log type for the session
        log_types = ['fraud-detection', 'payment-gateway', 'full-auth', 'api-gateway']
        
        for log_type in log_types:
            try:
                result = self.elasticsearch_service.search_logs(
                    log_type=log_type,
                    session_id=session_id,
                    time_range='7d',  # Look back 7 days
                    max_results=500
                )
                
                if result.get('success') and result.get('results'):
                    key = log_type.replace('-', '_')
                    session_logs[key] = result['results']
                    logger.info(f"Found {len(result['results'])} {log_type} logs for session {session_id}")
                    
            except Exception as e:
                logger.warning(f"Failed to get {log_type} logs for session {session_id}: {e}")
                
        return session_logs

    def _classify_order_type(self, session_logs: Dict[str, List]) -> Dict[str, Any]:
        """Classify the type of order based on log patterns"""
        order_classification = {
            'type': 'unknown',
            'confidence': 0.0,
            'indicators': [],
            'amount': None,
            'currency': None
        }
        
        # Analyze all log messages and API calls
        all_text = []
        
        for log_type, logs in session_logs.items():
            for log_entry in logs:
                if log_entry.get('message'):
                    all_text.append(log_entry['message'].lower())
                if log_entry.get('api_endpoint'):
                    all_text.append(log_entry['api_endpoint'].lower())
                
                # Extract financial details
                if log_entry.get('amount') and not order_classification['amount']:
                    order_classification['amount'] = log_entry['amount']
                if log_entry.get('currency') and not order_classification['currency']:
                    order_classification['currency'] = log_entry['currency']
        
        combined_text = ' '.join(all_text)
        
        # Score each order type
        type_scores = {}
        for order_type, patterns in self.order_patterns.items():
            score = 0
            matched_patterns = []
            
            for pattern in patterns:
                if pattern in combined_text:
                    score += 1
                    matched_patterns.append(pattern)
            
            if score > 0:
                type_scores[order_type] = {
                    'score': score,
                    'patterns': matched_patterns
                }
        
        # Determine best match
        if type_scores:
            best_type = max(type_scores.keys(), key=lambda x: type_scores[x]['score'])
            max_possible_score = len(self.order_patterns[best_type])
            
            order_classification.update({
                'type': best_type,
                'confidence': min(type_scores[best_type]['score'] / max_possible_score, 1.0),
                'indicators': type_scores[best_type]['patterns'],
                'all_scores': type_scores
            })
        
        return order_classification

    def _determine_customer_type(self, session_logs: Dict[str, List]) -> Dict[str, Any]:
        """Determine if customer is new or existing based on log patterns"""
        customer_analysis = {
            'type': 'unknown',
            'confidence': 0.0,
            'indicators': [],
            'customer_id': None,
            'registration_indicators': [],
            'history_indicators': []
        }
        
        # Look for customer indicators in logs
        all_text = []
        customer_data = []
        
        for log_type, logs in session_logs.items():
            for log_entry in logs:
                if log_entry.get('message'):
                    all_text.append(log_entry['message'].lower())
                if log_entry.get('user_id'):
                    customer_data.append(log_entry['user_id'])
                
                # Check for specific customer-related fields
                for field in ['customer_id', 'user_id', 'account_id']:
                    if log_entry.get(field):
                        customer_analysis['customer_id'] = log_entry[field]
        
        combined_text = ' '.join(all_text)
        
        # Check for new customer indicators
        new_customer_score = 0
        existing_customer_score = 0
        
        for indicator in self.customer_indicators['new_customer']:
            if indicator in combined_text:
                new_customer_score += 1
                customer_analysis['registration_indicators'].append(indicator)
        
        for indicator in self.customer_indicators['existing_customer']:
            if indicator in combined_text:
                existing_customer_score += 1
                customer_analysis['history_indicators'].append(indicator)
        
        # Determine customer type
        if new_customer_score > existing_customer_score:
            customer_analysis.update({
                'type': 'new_customer',
                'confidence': new_customer_score / len(self.customer_indicators['new_customer']),
                'indicators': customer_analysis['registration_indicators']
            })
        elif existing_customer_score > new_customer_score:
            customer_analysis.update({
                'type': 'existing_customer',
                'confidence': existing_customer_score / len(self.customer_indicators['existing_customer']),
                'indicators': customer_analysis['history_indicators']
            })
        else:
            # Try to infer from customer ID patterns or other heuristics
            if customer_analysis['customer_id']:
                # If we have customer data, lean towards existing
                customer_analysis.update({
                    'type': 'existing_customer',
                    'confidence': 0.5,
                    'indicators': ['customer_id_present']
                })
        
        return customer_analysis

    def _analyze_fraud_monitoring_calls(self, session_logs: Dict[str, List], fraud_type: str) -> Dict[str, Any]:
        """Analyze which fraud monitoring calls were triggered and their results using Gen AI"""
        monitoring_analysis = {
            'api_call_analysis': [],
            'success_rate': 0.0,
            'failed_calls': [],
            'ai_insights': {},
            'summary_statistics': {}
        }
        
        # Collect all API-related logs from different sources
        all_api_logs = []
        
        # Get API Gateway logs (main source for API calls)
        api_gateway_logs = session_logs.get('api_gateway', [])
        fraud_logs = session_logs.get('fraud_detection', [])
        payment_logs = session_logs.get('payment_gateway', [])
        auth_logs = session_logs.get('full_auth', [])
        
        # Combine all logs and sort by timestamp
        combined_logs = []
        for log_type, logs in [('api_gateway', api_gateway_logs), ('fraud_detection', fraud_logs), 
                              ('payment_gateway', payment_logs), ('full_auth', auth_logs)]:
            for log in logs:
                log['source_type'] = log_type
                combined_logs.append(log)
        
        # Sort by timestamp
        combined_logs.sort(key=lambda x: x.get('timestamp', ''))
        
        if not combined_logs:
            return monitoring_analysis
        
        # Process each API call/log entry
        total_calls = 0
        successful_calls = 0
        
        for log_entry in combined_logs:
            # Analyze each log entry with Gen AI
            ai_analysis = self._analyze_api_call_with_ai(log_entry, fraud_type)
            
            if ai_analysis:
                monitoring_analysis['api_call_analysis'].append(ai_analysis)
                total_calls += 1
                
                if ai_analysis.get('is_successful', False):
                    successful_calls += 1
                else:
                    monitoring_analysis['failed_calls'].append(ai_analysis)
        
        # Calculate success rate
        if total_calls > 0:
            monitoring_analysis['success_rate'] = successful_calls / total_calls
        
        # Generate AI insights summary
        monitoring_analysis['ai_insights'] = self._generate_ai_insights_summary(
            monitoring_analysis['api_call_analysis'], fraud_type
        )
        
        # Generate summary statistics
        monitoring_analysis['summary_statistics'] = {
            'total_api_calls': total_calls,
            'successful_calls': successful_calls,
            'failed_calls': len(monitoring_analysis['failed_calls']),
            'success_rate': monitoring_analysis['success_rate'],
            'unique_endpoints': len(set(call.get('api_endpoint', '') for call in monitoring_analysis['api_call_analysis'])),
            'error_types': self._categorize_error_types(monitoring_analysis['failed_calls'])
        }
        
        return monitoring_analysis

    def _analyze_api_call_with_ai(self, log_entry: Dict, fraud_type: str) -> Dict[str, Any]:
        """Use Gen AI to analyze individual API calls"""
        try:
            import openai
            
            # Prepare the log context for AI analysis
            log_context = self._prepare_log_context_for_ai(log_entry)
            
            prompt = f"""
            You are a fraud analysis expert examining API logs. Analyze this API call/log entry and provide insights.
            
            Fraud Analysis Type: {fraud_type}
            Log Entry Context:
            {log_context}
            
            Please analyze this API call and provide a JSON response with the following structure:
            {{
                "api_endpoint": "extracted endpoint or service name",
                "http_method": "HTTP method if available",
                "request_purpose": "what this API call is trying to accomplish",
                "response_analysis": "analysis of the response/outcome",
                "is_successful": true/false,
                "error_details": "error description if failed, null if successful",
                "fraud_relevance": "how this relates to fraud detection/prevention",
                "risk_indicators": ["list", "of", "potential", "risk", "indicators"],
                "business_impact": "potential business impact of this call",
                "recommendations": "specific recommendations for this API call",
                "processing_time_ms": extracted_time_if_available,
                "status_code": extracted_status_code_if_available,
                "confidence_score": 0.0-1.0
            }}
            
            Focus on:
            1. Whether the API call succeeded or failed
            2. What fraud monitoring/prevention purpose it serves
            3. Any error patterns or issues
            4. Risk indicators or suspicious patterns
            5. Business impact and recommendations
            """
            
            response = openai.ChatCompletion.create(
                model=Config.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=800
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Parse the AI response
            try:
                analysis = json.loads(ai_response)
                
                # Add original log metadata
                analysis.update({
                    'timestamp': log_entry.get('timestamp'),
                    'log_level': log_entry.get('level', 'INFO'),
                    'source_type': log_entry.get('source_type', 'unknown'),
                    'session_id': log_entry.get('session_id'),
                    'original_message': log_entry.get('message', '')[:200],  # Truncate for display
                    'component': log_entry.get('component', ''),
                    'raw_log_id': log_entry.get('id', '')
                })
                
                return analysis
                
            except json.JSONDecodeError:
                # Fallback if AI doesn't return valid JSON
                return self._create_fallback_analysis(log_entry, ai_response)
                
        except Exception as e:
            logger.error(f"Error in AI analysis for log entry: {e}")
            return self._create_fallback_analysis(log_entry, f"AI analysis failed: {str(e)}")

    def _prepare_log_context_for_ai(self, log_entry: Dict) -> str:
        """Prepare log entry context for AI analysis"""
        context_parts = []
        
        # Basic log information
        context_parts.append(f"Timestamp: {log_entry.get('timestamp', 'Unknown')}")
        context_parts.append(f"Log Level: {log_entry.get('level', 'INFO')}")
        context_parts.append(f"Source: {log_entry.get('source_type', 'Unknown')}")
        context_parts.append(f"Component: {log_entry.get('component', 'Unknown')}")
        
        # Message content
        message = log_entry.get('message', '')
        if message:
            context_parts.append(f"Message: {message}")
        
        # API-specific fields
        if log_entry.get('api_endpoint'):
            context_parts.append(f"API Endpoint: {log_entry['api_endpoint']}")
        if log_entry.get('http_method'):
            context_parts.append(f"HTTP Method: {log_entry['http_method']}")
        if log_entry.get('status_code'):
            context_parts.append(f"Status Code: {log_entry['status_code']}")
        if log_entry.get('response_time'):
            context_parts.append(f"Response Time: {log_entry['response_time']}ms")
        
        # Fraud-specific fields
        if log_entry.get('risk_score') is not None:
            context_parts.append(f"Risk Score: {log_entry['risk_score']}")
        if log_entry.get('decision'):
            context_parts.append(f"Decision: {log_entry['decision']}")
        if log_entry.get('auth_result'):
            context_parts.append(f"Auth Result: {log_entry['auth_result']}")
        if log_entry.get('gateway_response'):
            context_parts.append(f"Gateway Response: {log_entry['gateway_response']}")
        
        # Payment-specific fields
        if log_entry.get('amount'):
            context_parts.append(f"Amount: {log_entry['amount']} {log_entry.get('currency', '')}")
        if log_entry.get('payment_id'):
            context_parts.append(f"Payment ID: {log_entry['payment_id']}")
        
        # Additional context from raw data
        if log_entry.get('raw_data') and isinstance(log_entry['raw_data'], dict):
            for key, value in log_entry['raw_data'].items():
                if key not in ['message', 'timestamp', 'level'] and value:
                    context_parts.append(f"{key}: {value}")
        
        return '\n'.join(context_parts)

    def _create_fallback_analysis(self, log_entry: Dict, ai_response: str) -> Dict[str, Any]:
        """Create fallback analysis when AI analysis fails"""
        return {
            'api_endpoint': log_entry.get('api_endpoint') or log_entry.get('component', 'Unknown'),
            'http_method': log_entry.get('http_method', 'Unknown'),
            'request_purpose': 'Analysis unavailable',
            'response_analysis': ai_response[:200] if ai_response else 'No analysis available',
            'is_successful': log_entry.get('level', '').lower() not in ['error', 'fatal'],
            'error_details': None if log_entry.get('level', '').lower() not in ['error', 'fatal'] else log_entry.get('message', 'Unknown error'),
            'fraud_relevance': 'Requires manual review',
            'risk_indicators': [],
            'business_impact': 'Unknown',
            'recommendations': 'Manual review recommended',
            'processing_time_ms': log_entry.get('response_time'),
            'status_code': log_entry.get('status_code'),
            'confidence_score': 0.3,
            'timestamp': log_entry.get('timestamp'),
            'log_level': log_entry.get('level', 'INFO'),
            'source_type': log_entry.get('source_type', 'unknown'),
            'session_id': log_entry.get('session_id'),
            'original_message': log_entry.get('message', '')[:200],
            'component': log_entry.get('component', ''),
            'raw_log_id': log_entry.get('id', '')
        }

    def _generate_ai_insights_summary(self, api_analyses: List[Dict], fraud_type: str) -> Dict[str, Any]:
        """Generate AI-powered insights summary from all API analyses"""
        try:
            import openai
            
            # Prepare summary data for AI
            summary_data = []
            for analysis in api_analyses:
                summary_data.append({
                    'endpoint': analysis.get('api_endpoint', 'Unknown'),
                    'success': analysis.get('is_successful', False),
                    'purpose': analysis.get('request_purpose', ''),
                    'fraud_relevance': analysis.get('fraud_relevance', ''),
                    'risk_indicators': analysis.get('risk_indicators', [])
                })
            
            prompt = f"""
            You are a fraud analysis expert reviewing a complete session analysis. Based on the API call analyses below, provide high-level insights.
            
            Fraud Type: {fraud_type}
            API Call Summary: {json.dumps(summary_data, indent=2)}
            
            Provide a JSON response with:
            {{
                "overall_session_health": "assessment of the session",
                "key_findings": ["finding1", "finding2", "finding3"],
                "fraud_risk_assessment": "overall fraud risk evaluation",
                "critical_issues": ["issue1", "issue2"],
                "positive_indicators": ["indicator1", "indicator2"],
                "recommended_actions": ["action1", "action2"],
                "session_score": 0-100,
                "confidence_level": "high/medium/low"
            }}
            """
            
            response = openai.ChatCompletion.create(
                model=Config.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=600
            )
            
            return json.loads(response.choices[0].message.content.strip())
            
        except Exception as e:
            logger.error(f"Error generating AI insights summary: {e}")
            return {
                "overall_session_health": "Analysis unavailable",
                "key_findings": ["AI analysis failed"],
                "fraud_risk_assessment": "Manual review required",
                "critical_issues": [],
                "positive_indicators": [],
                "recommended_actions": ["Manual review recommended"],
                "session_score": 50,
                "confidence_level": "low"
            }

    def _categorize_error_types(self, failed_calls: List[Dict]) -> Dict[str, int]:
        """Categorize types of errors found"""
        error_categories = {
            'authentication_errors': 0,
            'authorization_errors': 0,
            'timeout_errors': 0,
            'validation_errors': 0,
            'system_errors': 0,
            'network_errors': 0,
            'business_logic_errors': 0,
            'unknown_errors': 0
        }
        
        for call in failed_calls:
            error_details = call.get('error_details', '').lower()
            
            if any(term in error_details for term in ['auth', 'login', 'credential', 'token']):
                error_categories['authentication_errors'] += 1
            elif any(term in error_details for term in ['authorization', 'permission', 'forbidden', 'access']):
                error_categories['authorization_errors'] += 1
            elif any(term in error_details for term in ['timeout', 'slow', 'delay']):
                error_categories['timeout_errors'] += 1
            elif any(term in error_details for term in ['validation', 'invalid', 'format', 'required']):
                error_categories['validation_errors'] += 1
            elif any(term in error_details for term in ['system', 'internal', 'server', 'database']):
                error_categories['system_errors'] += 1
            elif any(term in error_details for term in ['network', 'connection', 'unreachable']):
                error_categories['network_errors'] += 1
            elif any(term in error_details for term in ['business', 'rule', 'policy', 'limit']):
                error_categories['business_logic_errors'] += 1
            else:
                error_categories['unknown_errors'] += 1
        
        return {k: v for k, v in error_categories.items() if v > 0}

    def _determine_call_success(self, log_entry: Dict) -> bool:
        """Determine if a fraud monitoring call was successful"""
        # Check log level
        level = log_entry.get('level', '').lower()
        if level in ['error', 'fatal']:
            return False
        
        # Check message content
        message = log_entry.get('message', '').lower()
        failure_indicators = ['error', 'failed', 'timeout', 'exception', 'denied', 'rejected']
        success_indicators = ['success', 'completed', 'approved', 'validated', 'passed']
        
        for indicator in failure_indicators:
            if indicator in message:
                return False
                
        for indicator in success_indicators:
            if indicator in message:
                return True
        
        # Check specific fraud fields
        if log_entry.get('decision') in ['APPROVE', 'ACCEPT', 'PASS']:
            return True
        if log_entry.get('decision') in ['DENY', 'REJECT', 'FAIL', 'BLOCK']:
            return False
        
        # Default to success if no clear indicators (INFO level logs)
        return level in ['info', 'debug']

    def _generate_fraud_analysis(self, session_id: str, fraud_type: str, session_logs: Dict, 
                                order_classification: Dict, customer_type: Dict, 
                                monitoring_analysis: Dict) -> Dict[str, Any]:
        """Generate comprehensive fraud analysis report"""
        
        # Calculate overall risk assessment
        risk_level = self._calculate_risk_level(monitoring_analysis, customer_type, fraud_type)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            fraud_type, order_classification, customer_type, monitoring_analysis, risk_level
        )
        
        # Create summary statistics
        stats = {
            'total_logs_analyzed': sum(len(logs) for logs in session_logs.values()),
            'fraud_calls_triggered': len(monitoring_analysis.get('call_sequence', [])),
            'fraud_call_success_rate': monitoring_analysis.get('success_rate', 0.0),
            'risk_scores_recorded': len(monitoring_analysis.get('risk_scores', [])),
            'decisions_made': len(monitoring_analysis.get('decisions', []))
        }
        
        return {
            'session_id': session_id,
            'fraud_type': fraud_type,
            'order_classification': order_classification,
            'customer_type': customer_type,
            'monitoring_analysis': monitoring_analysis,
            'risk_assessment': risk_level,
            'recommendations': recommendations,
            'statistics': stats,
            'timeline': self._create_timeline(monitoring_analysis)
        }

    def _calculate_risk_level(self, monitoring_analysis: Dict, customer_type: Dict, fraud_type: str) -> Dict[str, Any]:
        """Calculate overall risk level based on analysis"""
        risk_factors = []
        risk_score = 0.0
        
        # Factor 1: Success rate of fraud calls
        success_rate = monitoring_analysis.get('success_rate', 1.0)
        if success_rate < 0.5:
            risk_factors.append(f"Low fraud monitoring success rate: {success_rate:.1%}")
            risk_score += 30
        elif success_rate < 0.8:
            risk_factors.append(f"Moderate fraud monitoring issues: {success_rate:.1%}")
            risk_score += 15
        
        # Factor 2: Failed critical calls
        failed_calls = monitoring_analysis.get('failed_calls', [])
        critical_failures = [call for call in failed_calls if call.get('category') in ['risk_scoring', 'external_checks']]
        if critical_failures:
            risk_factors.append(f"Critical fraud checks failed: {len(critical_failures)}")
            risk_score += 25
        
        # Factor 3: Customer type risk
        if customer_type.get('type') == 'new_customer':
            risk_factors.append("New customer transaction")
            risk_score += 10
        
        # Factor 4: Fraud type specific risks
        if fraud_type == 'digital_fraud':
            # Digital fraud typically has higher automation risks
            if len(monitoring_analysis.get('triggered_calls', {}).get('device_fingerprinting', [])) == 0:
                risk_factors.append("No device fingerprinting performed")
                risk_score += 20
        elif fraud_type == 'assisted_fraud':
            # Assisted fraud requires more behavioral analysis
            if len(monitoring_analysis.get('triggered_calls', {}).get('behavioral_analysis', [])) == 0:
                risk_factors.append("No behavioral analysis performed")
                risk_score += 15
        
        # Factor 5: Risk scores from logs
        risk_scores = monitoring_analysis.get('risk_scores', [])
        if risk_scores:
            avg_risk = sum(score['score'] for score in risk_scores) / len(risk_scores)
            if avg_risk > 75:
                risk_factors.append(f"High average risk score: {avg_risk:.1f}")
                risk_score += avg_risk * 0.3
        
        # Determine risk level
        if risk_score >= 70:
            level = 'HIGH'
            color = '#ff4444'
        elif risk_score >= 40:
            level = 'MEDIUM'
            color = '#ffaa00'
        elif risk_score >= 20:
            level = 'LOW'
            color = '#ffcc00'
        else:
            level = 'MINIMAL'
            color = '#00ff88'
        
        return {
            'level': level,
            'score': min(risk_score, 100),
            'color': color,
            'factors': risk_factors
        }

    def _generate_recommendations(self, fraud_type: str, order_classification: Dict, 
                                customer_type: Dict, monitoring_analysis: Dict, risk_level: Dict) -> List[str]:
        """Generate actionable recommendations based on analysis"""
        recommendations = []
        
        # Risk level based recommendations
        if risk_level['level'] in ['HIGH', 'MEDIUM']:
            recommendations.append("Recommend manual review for this transaction")
            
        if risk_level['level'] == 'HIGH':
            recommendations.append("Consider blocking transaction pending further investigation")
        
        # Failed calls recommendations
        failed_calls = monitoring_analysis.get('failed_calls', [])
        if failed_calls:
            failed_categories = set(call.get('category', '') for call in failed_calls)
            for category in failed_categories:
                recommendations.append(f"Review and fix {category.replace('_', ' ')} monitoring system")
        
        # Customer type recommendations
        if customer_type.get('type') == 'new_customer':
            recommendations.append("Implement enhanced verification for new customer")
            recommendations.append("Consider lower transaction limits for first-time users")
        
        # Fraud type specific recommendations
        if fraud_type == 'digital_fraud':
            if not monitoring_analysis.get('triggered_calls', {}).get('device_fingerprinting'):
                recommendations.append("Implement comprehensive device fingerprinting")
            recommendations.append("Review automated fraud detection rules")
            
        elif fraud_type == 'assisted_fraud':
            recommendations.append("Enhance customer service fraud training")
            recommendations.append("Implement real-time behavioral monitoring")
        
        # Order type recommendations
        order_type = order_classification.get('type')
        if order_type in ['withdrawal', 'transfer']:
            recommendations.append("Apply enhanced monitoring for money movement transactions")
        
        if not recommendations:
            recommendations.append("Transaction appears normal - continue standard monitoring")
        
        return recommendations

    def _create_timeline(self, monitoring_analysis: Dict) -> List[Dict]:
        """Create a timeline of fraud monitoring events"""
        timeline = []
        
        for call in monitoring_analysis.get('call_sequence', []):
            timeline.append({
                'timestamp': call.get('timestamp'),
                'event': f"{call.get('category', '').replace('_', ' ').title()}: {call.get('call_type', '')}",
                'status': 'Success' if call.get('success') else 'Failed',
                'details': call.get('message', '')[:100] + ('...' if len(call.get('message', '')) > 100 else '')
            })
        
        return timeline

    def get_fraud_types(self) -> Dict[str, Any]:
        """Get available fraud analysis types"""
        return {
            'digital_fraud': {
                'title': 'Digital Fraud Analysis',
                'description': 'Analyze automated/bot-driven fraudulent activities',
                'icon': '🤖',
                'focus_areas': ['Device fingerprinting', 'Automated behavior detection', 'Bot identification', 'Digital payment fraud']
            },
            'assisted_fraud': {
                'title': 'Assisted Fraud Analysis', 
                'description': 'Analyze human-assisted fraudulent activities',
                'icon': '👥',
                'focus_areas': ['Social engineering', 'Customer service fraud', 'Human behavior patterns', 'Account takeover']
            },
            'transaction_fraud': {
                'title': 'Transaction Fraud Analysis',
                'description': 'Analyze suspicious transaction patterns',
                'icon': '💳',
                'focus_areas': ['Payment fraud', 'Transaction velocity', 'Amount anomalies', 'Cross-border fraud']
            },
            'identity_fraud': {
                'title': 'Identity Fraud Analysis',
                'description': 'Analyze identity theft and impersonation',
                'icon': '🆔',
                'focus_areas': ['Identity verification', 'Document fraud', 'Synthetic identity', 'Account creation fraud']
            }
        }
