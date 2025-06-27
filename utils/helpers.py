# utils/helpers.py
import json
import re
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum

class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle enums, dates, and other objects"""
    def default(self, obj):
        if isinstance(obj, Enum):
            return obj.value
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> Optional[str]:
    """
    Validate that all required fields are present in the data
    
    Args:
        data: Dictionary containing the data to validate
        required_fields: List of field names that are required
        
    Returns:
        Error message if validation fails, None if all fields are present
    """
    if not data:
        return "Request data is missing"
    
    missing_fields = []
    for field in required_fields:
        if field not in data or not data[field] or str(data[field]).strip() == '':
            missing_fields.append(field)
    
    if missing_fields:
        return f"Missing required fields: {', '.join(missing_fields)}"
    
    return None

def sanitize_string(input_string: str, max_length: int = 255) -> str:
    """
    Sanitize input string by removing potentially dangerous characters
    
    Args:
        input_string: String to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized string
    """
    if not input_string:
        return ""
    
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>"\';]', '', str(input_string))
    
    # Limit length
    sanitized = sanitized[:max_length]
    
    # Strip whitespace
    return sanitized.strip()

def format_currency(amount: float, currency: str = 'USD') -> str:
    """Format currency amount"""
    if currency == 'USD':
        return f"${amount:,.2f}"
    elif currency == 'EUR':
        return f"€{amount:,.2f}"
    else:
        return f"{amount:,.2f} {currency}"

def mask_sensitive_data(data: str, data_type: str = 'email') -> str:
    """
    Mask sensitive data for display
    
    Args:
        data: The sensitive data to mask
        data_type: Type of data (email, phone, card, etc.)
        
    Returns:
        Masked version of the data
    """
    if not data:
        return ""
    
    data = str(data)
    
    if data_type == 'email':
        if '@' in data:
            name, domain = data.split('@', 1)
            if len(name) <= 2:
                return f"***@{domain}"
            return f"{name[:2]}***@{domain}"
    
    elif data_type == 'phone':
        # Keep only last 4 digits
        if len(data) >= 4:
            return f"***-***-{data[-4:]}"
        return "***"
    
    elif data_type == 'card':
        # Keep only last 4 digits
        if len(data) >= 4:
            return f"****-****-****-{data[-4:]}"
        return "****"
    
    elif data_type == 'ssn':
        # Keep only last 4 digits
        if len(data) >= 4:
            return f"***-**-{data[-4:]}"
        return "***"
    
    # Generic masking
    if len(data) <= 3:
        return "***"
    return f"{data[:2]}***{data[-1:]}"

def validate_order_number(order_number: str) -> bool:
    """
    Validate order number format
    
    Args:
        order_number: Order number to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not order_number:
        return False
    
    # Order number should be alphanumeric and between 3-20 characters
    pattern = r'^[A-Za-z0-9\-_]+$'
    return bool(re.match(pattern, order_number)) and 3 <= len(order_number) <= 20

def validate_location_code(location_code: str) -> bool:
    """
    Validate location code format
    
    Args:
        location_code: Location code to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not location_code:
        return False
    
    # Location code should be 2-5 uppercase letters
    pattern = r'^[A-Z]{2,5}$'
    return bool(re.match(pattern, location_code.upper()))

def get_risk_color(risk_level: str) -> str:
    """Get color code for risk level"""
    risk_colors = {
        'low': '#36b37e',      # Green
        'medium': '#ff8b00',   # Orange
        'high': '#ff5630',     # Red
        'critical': '#de350b'  # Dark red
    }
    return risk_colors.get(risk_level.lower(), '#5e6c84')  # Default gray

def format_date_for_display(date_obj) -> str:
    """Format date for display in UI"""
    if not date_obj:
        return "N/A"
    
    if isinstance(date_obj, str):
        try:
            date_obj = datetime.fromisoformat(date_obj.replace('Z', '+00:00'))
        except ValueError:
            return date_obj
    
    if hasattr(date_obj, 'strftime'):
        return date_obj.strftime('%Y-%m-%d %H:%M')
    
    return str(date_obj)

def paginate_results(items: List[Any], page: int = 1, per_page: int = 10) -> Dict[str, Any]:
    """
    Paginate a list of items
    
    Args:
        items: List of items to paginate
        page: Current page number (1-indexed)
        per_page: Number of items per page
        
    Returns:
        Dictionary containing paginated results and metadata
    """
    total = len(items)
    start = (page - 1) * per_page
    end = start + per_page
    
    has_prev = page > 1
    has_next = end < total
    
    return {
        'items': items[start:end],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page,
            'has_prev': has_prev,
            'has_next': has_next,
            'prev_num': page - 1 if has_prev else None,
            'next_num': page + 1 if has_next else None
        }
    }
