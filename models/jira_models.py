# models/jira_models.py
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any
from enum import Enum

class QueryType(Enum):
    STORY_SEARCH = "story_search"
    EPIC_SEARCH = "epic_search"
    STATUS_FILTER = "status_filter"
    ASSIGNEE_FILTER = "assignee_filter"
    DATE_RANGE = "date_range"
    PROJECT_FILTER = "project_filter"

@dataclass
class JiraQuery:
    """Represents a parsed Jira query"""
    query_type: QueryType
    project_key: Optional[str] = None
    assignee: Optional[str] = None
    status: Optional[str] = None
    epic_key: Optional[str] = None
    story_key: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    keywords: Optional[List[str]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        result = asdict(self)
        result['query_type'] = self.query_type.value
        return result

@dataclass
class JiraIssue:
    """Represents a Jira issue"""
    key: str
    summary: str
    description: Optional[str] = None
    status: Optional[str] = None
    assignee: Optional[str] = None
    reporter: Optional[str] = None
    priority: Optional[str] = None
    issue_type: Optional[str] = None
    project: Optional[str] = None
    created: Optional[str] = None
    updated: Optional[str] = None
    labels: Optional[List[str]] = None
    components: Optional[List[str]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class SecurityAnalysisResult:
    """Represents security analysis result"""
    success: bool
    issue_key: str
    analysis: Optional[str] = None
    risk_level: Optional[str] = None
    recommendations: Optional[List[str]] = None
    analyzed_at: Optional[str] = None
    error: Optional[str] = None
    
    def __post_init__(self):
        if self.analyzed_at is None:
            self.analyzed_at = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)