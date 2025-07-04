import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class Config:
    """Application configuration class"""
    
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'jira-ai-secret-key-change-in-production')
    DEBUG = os.environ.get('FLASK_ENV') == 'development'
    PORT = int(os.environ.get('PORT', 5000))
    
    # Jira Configuration
    JIRA_URL = os.environ.get('JIRA_URL')
    JIRA_USERNAME = os.environ.get('JIRA_USERNAME')
    JIRA_TOKEN = os.environ.get('JIRA_TOKEN')
    
    # OpenAI Configuration
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-3.5-turbo')
    
    # Oracle Database Configuration
    ORACLE_USER = os.environ.get('ORACLE_USER')
    ORACLE_PASSWORD = os.environ.get('ORACLE_PASSWORD')
    ORACLE_HOST = os.environ.get('ORACLE_HOST', 'localhost')
    ORACLE_PORT = os.environ.get('ORACLE_PORT', '1521')
    ORACLE_SERVICE = os.environ.get('ORACLE_SERVICE')
    ORACLE_SID = os.environ.get('ORACLE_SID')
    
    # Connection pool settings
    ORACLE_POOL_MIN = int(os.environ.get('ORACLE_POOL_MIN', '2'))
    ORACLE_POOL_MAX = int(os.environ.get('ORACLE_POOL_MAX', '10'))
    ORACLE_POOL_INCREMENT = int(os.environ.get('ORACLE_POOL_INCREMENT', '1'))

    # Elasticsearch Configuration
    ELASTICSEARCH_HOST = os.environ.get('ELASTICSEARCH_HOST', 'localhost')
    ELASTICSEARCH_PORT = os.environ.get('ELASTICSEARCH_PORT', '9200')
    ELASTICSEARCH_USERNAME = os.environ.get('ELASTICSEARCH_USERNAME')
    ELASTICSEARCH_PASSWORD = os.environ.get('ELASTICSEARCH_PASSWORD')
    ELASTICSEARCH_USE_SSL = os.environ.get('ELASTICSEARCH_USE_SSL', 'false').lower() == 'true'
    ELASTICSEARCH_VERIFY_SSL = os.environ.get('ELASTICSEARCH_VERIFY_SSL', 'true').lower() == 'true'

    # Jenkins Configuration (add after Elasticsearch configuration)
    JENKINS_URL = os.environ.get('JENKINS_URL')
    JENKINS_USERNAME = os.environ.get('JENKINS_USERNAME')
    JENKINS_TOKEN = os.environ.get('JENKINS_TOKEN')
    
    # Logging Configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.environ.get('LOG_FILE', 'app.log')
    
    # Validation Configuration
    ORDER_MANDATORY_FIELDS = [
        'order_id',
        'customer_id', 
        'order_date',
        'delivery_address',
        'order_status',
        'total_amount'
    ]

    # Fields that are optional (won't be treated as mandatory)
    OPTIONAL_FIELDS = [
        'created_date',     # System generated timestamp
        'updated_date',     # System generated timestamp
        'internal_notes',   # Internal use only
        'customer_email',   # Optional contact info
        'customer_phone',   # Optional contact info
        'delivery_notes',   # Optional delivery instructions
        'promo_code',       # Optional promotional code
        'tracking_number'   # May not be assigned yet
    ]

    LOG_ANALYSIS_CONFIGS = {
        '3d-secure': {
            'index': os.environ.get('ES_INDEX_3D_SECURE', 'logs-3d-secure-*'),
            'session_field': 'sessionId',
            'level_field': 'level',
            'component_field': 'component',
            'display_name': '3D Secure Authentication',
            'description': 'Analyze 3D Secure authentication logs and transactions',
            'icon': '🔐',
            'custom_filters': {
                'transactionId': 'Transaction ID',
                'merchantId': 'Merchant ID',
                'authStatus': 'Auth Status'
            }
        },
        'enforce-xml6': {
            'index': os.environ.get('ES_INDEX_ENFORCE_XML6', 'logs-enforce-xml6-*'),
            'session_field': 'sessionId',
            'level_field': 'level',
            'component_field': 'component',
            'display_name': 'Enforce XML6',
            'description': 'Review XML6 enforcement logs and compliance data',
            'icon': '📋',
            'custom_filters': {
                'xmlVersion': 'XML Version',
                'validationStatus': 'Validation Status',
                'complianceLevel': 'Compliance Level'
            }
        },
        'full-auth': {
            'index': os.environ.get('ES_INDEX_FULL_AUTH', 'logs-full-auth-*'),
            'session_field': 'sessionId',
            'level_field': 'level',
            'component_field': 'component',
            'display_name': 'Full Authentication',
            'description': 'Examine full authentication flow logs and results',
            'icon': '🔑',
            'custom_filters': {
                'authMethod': 'Auth Method',
                'userId': 'User ID',
                'authResult': 'Auth Result'
            }
        },
        'payment-gateway': {
            'index': os.environ.get('ES_INDEX_PAYMENT_GATEWAY', 'logs-payment-gateway-*'),
            'session_field': 'sessionId',
            'level_field': 'level',
            'component_field': 'component',
            'display_name': 'Payment Gateway',
            'description': 'Analyze payment gateway transaction logs',
            'icon': '💳',
            'custom_filters': {
                'paymentId': 'Payment ID',
                'gateway': 'Gateway',
                'currency': 'Currency'
            }
        },
        'fraud-detection': {
            'index': os.environ.get('ES_INDEX_FRAUD_DETECTION', 'logs-fraud-detection-*'),
            'session_field': 'sessionId',
            'level_field': 'level',
            'component_field': 'component',
            'display_name': 'Fraud Detection',
            'description': 'Review fraud detection system logs and alerts',
            'icon': '🚨',
            'custom_filters': {
                'riskScore': 'Risk Score',
                'decision': 'Decision',
                'ruleSet': 'Rule Set'
            }
        },
        'api-gateway': {
            'index': os.environ.get('ES_INDEX_API_GATEWAY', 'logs-api-gateway-*'),
            'session_field': 'sessionId',
            'level_field': 'level',
            'component_field': 'component',
            'display_name': 'API Gateway',
            'description': 'Monitor API gateway access and performance logs',
            'icon': '🌐',
            'custom_filters': {
                'apiEndpoint': 'API Endpoint',
                'httpMethod': 'HTTP Method',
                'statusCode': 'Status Code'
            }
        }
    }
    
    @property
    def ORACLE_DSN(self):
        """Build Oracle DSN from configuration"""
        if not all([self.ORACLE_HOST, self.ORACLE_PORT]):
            return None
            
        if self.ORACLE_SERVICE:
            return f"{self.ORACLE_HOST}:{self.ORACLE_PORT}/{self.ORACLE_SERVICE}"
        elif self.ORACLE_SID:
            return f"{self.ORACLE_HOST}:{self.ORACLE_PORT}:{self.ORACLE_SID}"
        else:
            return None
    
    @classmethod
    def validate(cls):
        """Validate required configuration"""
        required_jira = {
            'JIRA_URL': cls.JIRA_URL,
            'JIRA_USERNAME': cls.JIRA_USERNAME,
            'JIRA_TOKEN': cls.JIRA_TOKEN,
            'OPENAI_API_KEY': cls.OPENAI_API_KEY
        }
        
        required_oracle = {
            'ORACLE_USER': cls.ORACLE_USER,
            'ORACLE_PASSWORD': cls.ORACLE_PASSWORD,
            'ORACLE_HOST': cls.ORACLE_HOST
        }
        
        required_elasticsearch = {
            'ELASTICSEARCH_HOST': cls.ELASTICSEARCH_HOST,
            'ELASTICSEARCH_USERNAME': cls.ELASTICSEARCH_USERNAME,
            'ELASTICSEARCH_PASSWORD': cls.ELASTICSEARCH_PASSWORD
        }

        required_jenkins = {
            'JENKINS_URL': cls.JENKINS_URL,
            'JENKINS_USERNAME': cls.JENKINS_USERNAME,
            'JENKINS_TOKEN': cls.JENKINS_TOKEN
        }
        
        missing_jira = [var for var, value in required_jira.items() if not value]
        missing_oracle = [var for var, value in required_oracle.items() if not value]
        missing_elasticsearch = [var for var, value in required_elasticsearch.items() if not value]
        missing_jenkins = [var for var, value in required_jenkins.items() if not value]
        
        if missing_jira:
            logger.error(f"Missing required Jira environment variables: {', '.join(missing_jira)}")
            cls._print_env_help()
            return False
            
        if missing_oracle:
            logger.error(f"Missing required Oracle environment variables: {', '.join(missing_oracle)}")
            cls._print_env_help()
            return False
            
        if missing_elasticsearch:
            logger.warning(f"Missing Elasticsearch environment variables: {', '.join(missing_elasticsearch)}")
            logger.warning("Log Analysis features will be disabled")

        if missing_jenkins:
            logger.warning(f"Missing Jenkins environment variables: {', '.join(missing_jenkins)}")
            logger.warning("Jenkins Job features will be disabled")                        
            
        if not (cls.ORACLE_SERVICE or cls.ORACLE_SID):
            logger.error("Either ORACLE_SERVICE or ORACLE_SID must be provided")
            cls._print_env_help()
            return False
            
        logger.info("✅ All required environment variables are configured")
        return True
    
    @staticmethod
    def _print_env_help():
        """Print environment variables help"""
        print("\n📝 Please create a .env file with the required variables:")
        print("# Jira Configuration")
        print("JIRA_URL=https://yourcompany.atlassian.net")
        print("JIRA_USERNAME=your-email@company.com")
        print("JIRA_TOKEN=your-jira-api-token")
        print("OPENAI_API_KEY=your-openai-api-key")
        print("\n# Oracle Database Configuration")
        print("ORACLE_USER=your_db_user")
        print("ORACLE_PASSWORD=your_db_password")
        print("ORACLE_HOST=your_db_host")
        print("ORACLE_PORT=1521")
        print("ORACLE_SERVICE=your_service_name  # OR use ORACLE_SID")
        print("# ORACLE_SID=your_sid_name")
        print("\n# Optional Configuration")
        print("LOG_LEVEL=INFO")
        print("ORACLE_POOL_MIN=2")
        print("ORACLE_POOL_MAX=10")
        print("SECRET_KEY=your-secret-key")
        print("\n# Elasticsearch Configuration (Optional - for Log Analysis)")
        print("ELASTICSEARCH_HOST=your-es-host")
        print("ELASTICSEARCH_PORT=9200")
        print("ELASTICSEARCH_USERNAME=your-es-username")
        print("ELASTICSEARCH_PASSWORD=your-es-password")
        print("ELASTICSEARCH_USE_SSL=false")
        print("ELASTICSEARCH_VERIFY_SSL=true")
        print("\n# Custom Elasticsearch Index Names (Optional)")
        print("ES_INDEX_3D_SECURE=logs-3d-secure-*")
        print("ES_INDEX_ENFORCE_XML6=logs-enforce-xml6-*")
        print("ES_INDEX_FULL_AUTH=logs-full-auth-*")
        print("ES_INDEX_PAYMENT_GATEWAY=logs-payment-gateway-*")
        print("ES_INDEX_FRAUD_DETECTION=logs-fraud-detection-*")
        print("ES_INDEX_API_GATEWAY=logs-api-gateway-*")
        print("\n# Jenkins Configuration")
        print("JENKINS_URL=https://your-jenkins-server.com")
        print("JENKINS_USERNAME=your-jenkins-username")
        print("JENKINS_TOKEN=your-jenkins-api-token")

    @classmethod
    def get_log_analysis_info(cls):
        """Get log analysis configuration info"""
        return {
            'elasticsearch_configured': bool(cls.ELASTICSEARCH_HOST and cls.ELASTICSEARCH_USERNAME),
            'available_log_types': list(cls.LOG_ANALYSIS_CONFIGS.keys()),
            'log_type_configs': cls.LOG_ANALYSIS_CONFIGS
        }
