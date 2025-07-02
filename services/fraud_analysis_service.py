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
        """Analyze which fraud monitoring calls were triggered and their results"""
        monitoring_analysis = {
            'triggered_calls': {},
            'success_rate': 0.0,
            'failed_calls': [],
            'call_sequence': [],
            'risk_scores': [],
            'decisions': []
        }
        
        # Focus on fraud detection logs
        fraud_logs = session_logs.get('fraud_detection', [])
        
        if not fraud_logs:
            return monitoring_analysis
        
        total_calls = 0
        successful_calls = 0
        
        for log_entry in fraud_logs:
            # Extract call information
            call_info = {
                'timestamp': log_entry.get('timestamp'),
                'message': log_entry.get('message', ''),
                'level': log_entry.get('level', 'INFO'),
                'component': log_entry.get('component', ''),
                'success': False
            }
            
            # Determine which monitoring category this call belongs to
            message_lower = call_info['message'].lower()
            component_lower = call_info['component'].lower()
            
            for category, call_types in self.fraud_monitoring_calls.items():
                for call_type in call_types:
                    if call_type in message_lower or call_type in component_lower:
                        if category not in monitoring_analysis['triggered_calls']:
                            monitoring_analysis['triggered_calls'][category] = []
                        
                        # Determine success/failure
                        call_info['success'] = self._determine_call_success(log_entry)
                        call_info['call_type'] = call_type
                        call_info['category'] = category
                        
                        monitoring_analysis['triggered_calls'][category].append(call_info)
                        monitoring_analysis['call_sequence'].append(call_info)
                        
                        total_calls += 1
                        if call_info['success']:
                            successful_calls += 1
                        else:
                            monitoring_analysis['failed_calls'].append(call_info)
                        
                        break
            
            # Extract risk scores and decisions
            if log_entry.get('risk_score') is not None:
                monitoring_analysis['risk_scores'].append({
                    'score': log_entry['risk_score'],
                    'timestamp': log_entry.get('timestamp')
                })
            
            if log_entry.get('decision'):
                monitoring_analysis['decisions'].append({
                    'decision': log_entry['decision'],
                    'timestamp': log_entry.get('timestamp')
                })
        
        # Calculate success rate
        if total_calls > 0:
            monitoring_analysis['success_rate'] = successful_calls / total_calls
        
        # Sort sequences by timestamp
        monitoring_analysis['call_sequence'].sort(key=lambda x: x.get('timestamp', ''))
        monitoring_analysis['risk_scores'].sort(key=lambda x: x.get('timestamp', ''))
        monitoring_analysis['decisions'].sort(key=lambda x: x.get('timestamp', ''))
        
        return monitoring_analysis

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
