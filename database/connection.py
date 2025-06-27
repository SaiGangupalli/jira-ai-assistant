# database/connection.py
import oracledb
import logging
from config.settings import Config

logger = logging.getLogger(__name__)

class OracleConnection:
    """Simple Oracle database connection for SELECT queries only"""
    
    @classmethod
    def get_connection(cls):
        """Get a simple Oracle database connection"""
        try:
            connection = oracledb.connect(
                user=Config.ORACLE_USER,
                password=Config.ORACLE_PASSWORD,
                dsn=Config.ORACLE_DSN
            )
            return connection
        except Exception as e:
            logger.error(f"Failed to connect to Oracle: {e}")
            raise
    
    @classmethod
    def execute_select(cls, query: str, params: dict = None):
        """
        Execute a SELECT query and return results as list of dictionaries
        
        Args:
            query: SQL SELECT query
            params: Dictionary of parameters for the query
            
        Returns:
            List of dictionaries with column names as keys
        """
        connection = None
        cursor = None
        try:
            connection = cls.get_connection()
            cursor = connection.cursor()
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            # Get column names
            columns = [desc[0].lower() for desc in cursor.description]
            
            # Fetch all rows
            rows = cursor.fetchall()
            
            # Convert to list of dictionaries
            result = []
            for row in rows:
                row_dict = {}
                for i, value in enumerate(row):
                    row_dict[columns[i]] = value
                result.append(row_dict)
            
            return result
            
        except Exception as e:
            logger.error(f"Error executing query: {e}")
            raise
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    @classmethod
    def test_connection(cls):
        """Test database connection"""
        try:
            result = cls.execute_select("SELECT 1 as test_value FROM DUAL")
            if result and result[0]['test_value'] == 1:
                return {
                    'success': True,
                    'message': 'Oracle connection successful',
                    'driver': 'oracledb'
                }
            else:
                return {
                    'success': False,
                    'error': 'Unexpected test query result'
                }
        except Exception as e:
            return {
                'success': False,
                'error': f'Connection test failed: {str(e)}'
            }
