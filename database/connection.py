
# database/connection.py
import cx_Oracle
import logging
from contextlib import contextmanager
from config.settings import Config

logger = logging.getLogger(__name__)

class OracleConnection:
    """Oracle database connection manager with connection pooling"""
    
    _pool = None
    
    @classmethod
    def initialize_pool(cls):
        """Initialize Oracle connection pool"""
        try:
            if cls._pool is None:
                logger.info("Initializing Oracle connection pool...")
                cls._pool = cx_Oracle.create_pool(
                    user=Config.ORACLE_USER,
                    password=Config.ORACLE_PASSWORD,
                    dsn=Config.ORACLE_DSN,
                    min=Config.ORACLE_POOL_MIN,
                    max=Config.ORACLE_POOL_MAX,
                    increment=Config.ORACLE_POOL_INCREMENT,
                    encoding="UTF-8"
                )
                logger.info("✅ Oracle connection pool initialized successfully")
        except cx_Oracle.Error as e:
            logger.error(f"Failed to create Oracle connection pool: {e}")
            raise
    
    @classmethod
    @contextmanager
    def get_connection(cls):
        """Get database connection from pool"""
        if cls._pool is None:
            cls.initialize_pool()
        
        connection = None
        try:
            connection = cls._pool.acquire()
            yield connection
        except cx_Oracle.Error as e:
            logger.error(f"Database connection error: {e}")
            if connection:
                connection.rollback()
            raise
        finally:
            if connection:
                cls._pool.release(connection)
    
    @classmethod
    def close_pool(cls):
        """Close connection pool"""
        if cls._pool:
            cls._pool.close()
            cls._pool = None
            logger.info("Oracle connection pool closed")
    
    @classmethod
    def test_connection(cls):
        """Test database connection"""
        try:
            with cls.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1 FROM DUAL")
                result = cursor.fetchone()
                cursor.close()
                return {
                    'success': True,
                    'message': 'Oracle connection successful',
                    'result': result[0] if result else None
                }
        except Exception as e:
            return {
                'success': False,
                'error': f'Oracle connection failed: {str(e)}'
            }