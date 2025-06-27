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
        
        missing_jira = [var for var, value in required_jira.items() if not value]
        missing_oracle = [var for var, value in required_oracle.items() if not value]
        
        if missing_jira:
            logger.error(f"Missing required Jira environment variables: {', '.join(missing_jira)}")
            cls._print_env_help()
            return False
            
        if missing_oracle:
            logger.error(f"Missing required Oracle environment variables: {', '.join(missing_oracle)}")
            cls._print_env_help()
            return False
            
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
