import logging
from typing import Dict, List, Any, Optional
from models.validation_models import OrderValidationResult, MandatoryField
from database.connection import OracleConnection
from config.settings import Config

logger = logging.getLogger(__name__)

class OrderValidator:
    """Oracle DB validator for order data"""
    
    def __init__(self):
        self.mandatory_fields = Config.ORDER_MANDATORY_FIELDS
    
    def validate_order(self, order_number: str, location_code: str) -> Dict[str, Any]:
        """
        Validate order in Oracle DB by checking mandatory parameters
        
        Args:
            order_number: Order number to validate
            location_code: Location code for the order
            
        Returns:
            Dict containing validation results
        """
        try:
            logger.info(f"Validating order {order_number} at location {location_code}")
            
            # Get order data from database
            order_data = self._get_order_data(order_number, location_code)
            
            if not order_data:
                return OrderValidationResult(
                    success=False,
                    order_number=order_number,
                    location_code=location_code,
                    error="Order not found in database"
                ).to_dict()
            
            # Validate mandatory fields
            validation_results = self._validate_mandatory_fields(order_data)
            
            # Calculate overall validation status
            missing_fields = [field.field_name for field in validation_results if not field.is_valid]
            is_valid = len(missing_fields) == 0
            
            return OrderValidationResult(
                success=True,
                order_number=order_number,
                location_code=location_code,
                is_valid=is_valid,
                mandatory_fields=validation_results,
                missing_fields=missing_fields,
                order_data=self._sanitize_order_data(order_data)
            ).to_dict()
            
        except Exception as e:
            logger.error(f"Error validating order {order_number}: {e}")
            return OrderValidationResult(
                success=False,
                order_number=order_number,
                location_code=location_code,
                error=f"Validation failed: {str(e)}"
            ).to_dict()
    
    def _get_order_data(self, order_number: str, location_code: str) -> Optional[Dict[str, Any]]:
        """Fetch order data from Oracle database"""
        query = """
        SELECT 
            o.order_id,
            o.order_number,
            o.customer_id,
            o.order_date,
            o.delivery_address,
            o.order_status,
            o.total_amount,
            o.location_code,
            o.created_date,
            o.updated_date,
            c.customer_name,
            c.customer_email,
            c.customer_phone
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.customer_id
        WHERE o.order_number = :order_number 
        AND o.location_code = :location_code
        """
        
        try:
            with OracleConnection.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, {
                    'order_number': order_number,
                    'location_code': location_code
                })
                
                columns = [desc[0].lower() for desc in cursor.description]
                row = cursor.fetchone()
                cursor.close()
                
                if row:
                    return dict(zip(columns, row))
                return None
                
        except Exception as e:
            logger.error(f"Database query error: {e}")
            raise
    
    def _validate_mandatory_fields(self, order_data: Dict[str, Any]) -> List[MandatoryField]:
        """Validate that all mandatory fields have values"""
        validation_results = []
        
        for field_name in self.mandatory_fields:
            field_value = order_data.get(field_name)
            is_valid = field_value is not None and str(field_value).strip() != ''
            
            validation_results.append(MandatoryField(
                field_name=field_name,
                field_value=field_value,
                is_valid=is_valid,
                error_message=None if is_valid else f"Field '{field_name}' is missing or empty"
            ))
        
        return validation_results
    
    def _sanitize_order_data(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive data and format for response"""
        # Create a copy to avoid modifying original data
        sanitized = order_data.copy()
        
        # Format dates
        for date_field in ['order_date', 'created_date', 'updated_date']:
            if date_field in sanitized and sanitized[date_field]:
                sanitized[date_field] = sanitized[date_field].isoformat() if hasattr(sanitized[date_field], 'isoformat') else str(sanitized[date_field])
        
        # Remove sensitive fields (if any)
        sensitive_fields = ['customer_email', 'customer_phone']
        for field in sensitive_fields:
            if field in sanitized:
                # Mask email and phone for privacy
                if field == 'customer_email' and sanitized[field]:
                    email = str(sanitized[field])
                    if '@' in email:
                        name, domain = email.split('@')
                        sanitized[field] = f"{name[:2]}***@{domain}"
                elif field == 'customer_phone' and sanitized[field]:
                    phone = str(sanitized[field])
                    sanitized[field] = f"***-***-{phone[-4:]}" if len(phone) >= 4 else "***"
        
        return sanitized
    
    def get_order_history(self, customer_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get order history for a customer"""
        query = """
        SELECT 
            order_number,
            order_date,
            order_status,
            total_amount,
            location_code
        FROM orders 
        WHERE customer_id = :customer_id 
        ORDER BY order_date DESC
        FETCH FIRST :limit ROWS ONLY
        """
        
        try:
            with OracleConnection.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, {
                    'customer_id': customer_id,
                    'limit': limit
                })
                
                columns = [desc[0].lower() for desc in cursor.description]
                rows = cursor.fetchall()
                cursor.close()
                
                return [dict(zip(columns, row)) for row in rows]
                
        except Exception as e:
            logger.error(f"Error fetching order history: {e}")
            raise
    
    def test_connection(self):
        """Test Oracle database connection"""
        return OracleConnection.test_connection()
