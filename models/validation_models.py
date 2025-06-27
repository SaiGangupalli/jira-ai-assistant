# models/validation_models.py
from dataclasses import dataclass, asdict
from typing import List, Optional, Any, Dict
from datetime import datetime

@dataclass
class MandatoryField:
    """Represents a mandatory field validation result"""
    field_name: str
    field_value: Any
    is_valid: bool
    error_message: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class OrderValidationResult:
    """Represents the complete order validation result"""
    success: bool
    order_number: str
    location_code: str
    is_valid: Optional[bool] = None
    mandatory_fields: Optional[List[MandatoryField]] = None
    missing_fields: Optional[List[str]] = None
    order_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    validated_at: Optional[str] = None
    
    def __post_init__(self):
        if self.validated_at is None:
            self.validated_at = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        result = asdict(self)
        # Convert MandatoryField objects to dictionaries
        if self.mandatory_fields:
            result['mandatory_fields'] = [field.to_dict() for field in self.mandatory_fields]
        return result