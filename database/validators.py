# database/validators.py
import logging
from typing import Dict, Any
from database.connection import OracleConnection
from config.settings import Config

logger = logging.getLogger(__name__)

class OrderValidator:
    """Simple Oracle DB validator for order data"""
    
    def __init__(self):
        self.mandatory_fields = Config.ORDER_MANDATORY_FIELDS
    
    def validate_order(self, order_number: str, location_code: str) -> Dict[str, Any]:
        """
        Validate order by running SELECT query and checking mandatory fields
        
        Args:
            order_number: Order number to validate
            location_code: Location code for the order
            
        Returns:
            Dict containing validation results
        """
        try:
            logger.info(f"Validating order {order_number} at location {location_code}")
            
            # Simple SELECT query to get order data
            query = """
            SELECT 
                order_id,
                order_number,
                customer_id,
                order_date,
                delivery_address,
                order_status,
                total_amount,
                location_code
            FROM orders 
            WHERE order_number = :order_number 
            AND location_code = :location_code
            """
            
            # Execute query
            results = OracleConnection.execute_select(query, {
                'order_number': order_number,
                'location_code': location_code
            })
            
            # Check if order exists
            if not results:
                return {
                    'success': False,
                    'order_number': order_number,
                    'location_code': location_code,
                    'error': 'Order not found in database'
                }
            
            order_data = results[0]  # Get first result
            
            # Validate mandatory fields
            missing_fields = []
            field_status = {}
            
            for field in self.mandatory_fields:
                value = order_data.get(field)
                is_valid = value is not None and str(value).strip() != ''
                
                field_status[field] = {
                    'value': value,
                    'is_valid': is_valid
                }
                
                if not is_valid:
                    missing_fields.append(field)
            
            # Overall validation status
            is_valid = len(missing_fields) == 0
            
            return {
                'success': True,
                'order_number': order_number,
                'location_code': location_code,
                'is_valid': is_valid,
                'missing_fields': missing_fields,
                'field_status': field_status,
                'order_data': order_data,
                'mandatory_fields': [
                    {
                        'field_name': field,
                        'field_value': field_status[field]['value'],
                        'is_valid': field_status[field]['is_valid'],
                        'error_message': None if field_status[field]['is_valid'] else f"Field '{field}' is missing or empty"
                    }
                    for field in self.mandatory_fields
                ]
            }
            
        except Exception as e:
            logger.error(f"Error validating order {order_number}: {e}")
            return {
                'success': False,
                'order_number': order_number,
                'location_code': location_code,
                'error': f'Validation failed: {str(e)}'
            }
    
    def get_order_info(self, order_number: str, location_code: str) -> Dict[str, Any]:
        """
        Get basic order information (without validation)
        
        Args:
            order_number: Order number
            location_code: Location code
            
        Returns:
            Order data or error
        """
        try:
            query = """
            SELECT 
                order_id,
                order_number,
                customer_id,
                order_date,
                delivery_address,
                order_status,
                total_amount,
                location_code,
                created_date
            FROM orders 
            WHERE order_number = :order_number 
            AND location_code = :location_code
            """
            
            results = OracleConnection.execute_select(query, {
                'order_number': order_number,
                'location_code': location_code
            })
            
            if results:
                return {
                    'success': True,
                    'order_data': results[0]
                }
            else:
                return {
                    'success': False,
                    'error': 'Order not found'
                }
                
        except Exception as e:
            logger.error(f"Error getting order info: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def test_connection(self):
        """Test database connection and orders table access"""
        try:
            # Test basic connection
            connection_test = OracleConnection.test_connection()
            
            if not connection_test['success']:
                return connection_test
            
            # Test orders table access
            try:
                query = "SELECT COUNT(*) as order_count FROM orders WHERE ROWNUM <= 1"
                result = OracleConnection.execute_select(query)
                
                return {
                    'success': True,
                    'message': 'Oracle connection and orders table access successful',
                    'orders_table_accessible': True,
                    'driver': 'oracledb'
                }
            except Exception as e:
                return {
                    'success': True,  # Connection works
                    'message': 'Oracle connection successful but orders table inaccessible',
                    'orders_table_accessible': False,
                    'orders_table_error': str(e),
                    'driver': 'oracledb'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Connection test failed: {str(e)}',
                'driver': 'oracledb'
            }
