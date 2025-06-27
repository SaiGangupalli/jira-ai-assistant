# database/validators.py
import logging
from typing import Dict, Any, List
from database.connection import OracleConnection

logger = logging.getLogger(__name__)

class OrderValidator:
    """Oracle DB validator - checks ALL fields in order data as mandatory"""
    
    def __init__(self):
        # Fields to exclude from mandatory validation (if any)
        self.exclude_from_validation = [
            'created_date',     # System generated
            'updated_date',     # System generated
            'internal_notes',   # Optional internal field
            'customer_email',   # Optional field
            'customer_phone'    # Optional field
        ]
    
    def validate_order(self, order_number: str, location_code: str) -> Dict[str, Any]:
        """
        Validate order by checking ALL fields in the order data
        
        Args:
            order_number: Order number to validate
            location_code: Location code for the order
            
        Returns:
            Dict containing validation results
        """
        try:
            logger.info(f"Validating order {order_number} at location {location_code}")
            
            # Get order data from database
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
                created_date,
                updated_date,
                customer_name,
                customer_email,
                customer_phone
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.order_number = :order_number 
            AND o.location_code = :location_code
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
            
            # Get ALL field names from the returned data (dynamic mandatory fields)
            all_fields = list(order_data.keys())
            
            # Remove excluded fields from validation
            mandatory_fields = [
                field for field in all_fields 
                if field.lower() not in [f.lower() for f in self.exclude_from_validation]
            ]
            
            logger.info(f"Checking {len(mandatory_fields)} mandatory fields: {mandatory_fields}")
            
            # Validate ALL fields as mandatory
            missing_fields = []
            field_status = {}
            mandatory_field_results = []
            
            for field in all_fields:  # Check all fields, not just mandatory
                value = order_data.get(field)
                is_mandatory = field.lower() not in [f.lower() for f in self.exclude_from_validation]
                
                # For mandatory fields, check if they have values
                if is_mandatory:
                    is_valid = value is not None and str(value).strip() != ''
                    if not is_valid:
                        missing_fields.append(field)
                else:
                    # Optional fields are always "valid" but we still show their status
                    is_valid = True
                
                field_status[field] = {
                    'value': value,
                    'is_valid': is_valid,
                    'is_mandatory': is_mandatory,
                    'is_empty': value is None or str(value).strip() == ''
                }
                
                # Add to mandatory field results for display
                mandatory_field_results.append({
                    'field_name': field,
                    'field_value': value,
                    'is_valid': is_valid,
                    'is_mandatory': is_mandatory,
                    'error_message': None if is_valid else f"Required field '{field}' is missing or empty"
                })
            
            # Overall validation status - all mandatory fields must have values
            is_valid = len(missing_fields) == 0
            
            # Summary statistics
            total_fields = len(all_fields)
            mandatory_count = len(mandatory_fields)
            optional_count = total_fields - mandatory_count
            filled_mandatory = len([f for f in mandatory_fields if field_status[f]['value'] is not None and str(field_status[f]['value']).strip() != ''])
            
            return {
                'success': True,
                'order_number': order_number,
                'location_code': location_code,
                'is_valid': is_valid,
                'missing_fields': missing_fields,
                'field_status': field_status,
                'order_data': order_data,
                'mandatory_fields': mandatory_field_results,
                'validation_summary': {
                    'total_fields': total_fields,
                    'mandatory_fields': mandatory_count,
                    'optional_fields': optional_count,
                    'filled_mandatory_fields': filled_mandatory,
                    'missing_mandatory_fields': len(missing_fields),
                    'completion_percentage': round((filled_mandatory / mandatory_count * 100) if mandatory_count > 0 else 100, 1)
                }
            }
            
        except Exception as e:
            logger.error(f"Error validating order {order_number}: {e}")
            return {
                'success': False,
                'order_number': order_number,
                'location_code': location_code,
                'error': f'Validation failed: {str(e)}'
            }
    
    def get_all_order_fields(self) -> List[str]:
        """
        Get all possible field names from the orders table structure
        """
        try:
            # Query to get column names from the orders table
            query = """
            SELECT column_name 
            FROM user_tab_columns 
            WHERE table_name = 'ORDERS' 
            ORDER BY column_id
            """
            
            results = OracleConnection.execute_select(query)
            return [row['column_name'].lower() for row in results] if results else []
            
        except Exception as e:
            logger.error(f"Error getting order fields: {e}")
            return []
    
    def validate_order_completeness(self, order_number: str, location_code: str) -> Dict[str, Any]:
        """
        Advanced validation that shows detailed field analysis
        """
        try:
            validation_result = self.validate_order(order_number, location_code)
            
            if not validation_result['success']:
                return validation_result
            
            field_status = validation_result['field_status']
            
            # Categorize fields
            mandatory_filled = []
            mandatory_empty = []
            optional_filled = []
            optional_empty = []
            
            for field_name, status in field_status.items():
                if status['is_mandatory']:
                    if status['is_empty']:
                        mandatory_empty.append(field_name)
                    else:
                        mandatory_filled.append(field_name)
                else:
                    if status['is_empty']:
                        optional_empty.append(field_name)
                    else:
                        optional_filled.append(field_name)
            
            # Add detailed analysis
            validation_result['field_analysis'] = {
                'mandatory_filled': mandatory_filled,
                'mandatory_empty': mandatory_empty,
                'optional_filled': optional_filled,
                'optional_empty': optional_empty,
                'completeness_score': len(mandatory_filled) / (len(mandatory_filled) + len(mandatory_empty)) if (len(mandatory_filled) + len(mandatory_empty)) > 0 else 1.0
            }
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Error in completeness validation: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_field_configuration(self) -> Dict[str, Any]:
        """
        Get current field validation configuration
        """
        return {
            'excluded_fields': self.exclude_from_validation,
            'validation_mode': 'all_fields_mandatory',
            'description': 'All fields except excluded ones are treated as mandatory'
        }
    
    def update_excluded_fields(self, excluded_fields: List[str]):
        """
        Update the list of fields to exclude from mandatory validation
        """
        self.exclude_from_validation = excluded_fields
        logger.info(f"Updated excluded fields: {excluded_fields}")
    
    def test_connection(self):
        """Test database connection and orders table access"""
        try:
            # Test basic connection
            connection_test = OracleConnection.test_connection()
            
            if not connection_test['success']:
                return connection_test
            
            # Test orders table access and get field count
            try:
                query = """
                SELECT COUNT(*) as order_count,
                       (SELECT COUNT(*) FROM user_tab_columns WHERE table_name = 'ORDERS') as field_count
                FROM orders WHERE ROWNUM <= 1
                """
                result = OracleConnection.execute_select(query)
                
                if result:
                    return {
                        'success': True,
                        'message': 'Oracle connection and orders table access successful',
                        'orders_table_accessible': True,
                        'total_fields_in_table': result[0].get('field_count', 0),
                        'validation_mode': 'all_fields_mandatory',
                        'excluded_fields': self.exclude_from_validation,
                        'driver': 'oracledb'
                    }
                else:
                    return {
                        'success': True,
                        'message': 'Connection successful but no data',
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
