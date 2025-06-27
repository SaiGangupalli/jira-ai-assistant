# services/jira_service.py
import requests
import json
import openai
import logging
from typing import Dict, List, Optional, Any
from config.settings import Config
from models.jira_models import JiraQuery, QueryType, JiraIssue

logger = logging.getLogger(__name__)

class JiraService:
    """Service for Jira operations"""
    
    def __init__(self):
        self.jira_url = Config.JIRA_URL.rstrip('/')
        self.auth = (Config.JIRA_USERNAME, Config.JIRA_TOKEN)
        self.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        openai.api_key = Config.OPENAI_API_KEY
    
    def parse_natural_language_query(self, user_query: str) -> JiraQuery:
        """Use AI to parse natural language queries into structured JiraQuery objects"""
        prompt = f"""
        Parse the following user query about Jira tickets and extract relevant information:
        
        User Query: "{user_query}"
        
        Extract and return a JSON object with the following fields (set to null if not mentioned):
        - query_type: one of ["story_search", "epic_search", "status_filter", "assignee_filter", "date_range", "project_filter"]
        - project_key: project abbreviation (e.g., "PROJ", "DEV")
        - assignee: person's name or username
        - status: ticket status (e.g., "To Do", "In Progress", "Done")
        - epic_key: specific epic identifier
        - story_key: specific story identifier
        - date_from: start date in YYYY-MM-DD format
        - date_to: end date in YYYY-MM-DD format
        - keywords: array of relevant search terms
        
        Examples:
        - "Show me all stories assigned to John" -> {{"query_type": "assignee_filter", "assignee": "John"}}
        - "Find epic PROJ-123" -> {{"query_type": "epic_search", "epic_key": "PROJ-123"}}
        - "Stories in progress for project DEV" -> {{"query_type": "status_filter", "project_key": "DEV", "status": "In Progress"}}
        
        Return only the JSON object:
        """
        
        try:
            response = openai.ChatCompletion.create(
                model=Config.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            
            parsed_data = json.loads(response.choices[0].message.content)
            
            return JiraQuery(
                query_type=QueryType(parsed_data.get('query_type', 'story_search')),
                project_key=parsed_data.get('project_key'),
                assignee=parsed_data.get('assignee'),
                status=parsed_data.get('status'),
                epic_key=parsed_data.get('epic_key'),
                story_key=parsed_data.get('story_key'),
                date_from=parsed_data.get('date_from'),
                date_to=parsed_data.get('date_to'),
                keywords=parsed_data.get('keywords', [])
            )
        except Exception as e:
            logger.error(f"Error parsing query: {e}")
            return JiraQuery(
                query_type=QueryType.STORY_SEARCH,
                keywords=user_query.split()
            )
    
    def build_jql_query(self, parsed_query: JiraQuery) -> str:
        """Convert parsed query into JQL (Jira Query Language)"""
        jql_parts = []
        
        if parsed_query.project_key:
            jql_parts.append(f'project = "{parsed_query.project_key}"')
        
        if parsed_query.query_type == QueryType.EPIC_SEARCH:
            jql_parts.append('issuetype = Epic')
        elif parsed_query.query_type == QueryType.STORY_SEARCH:
            jql_parts.append('issuetype = Story')
        
        if parsed_query.epic_key:
            jql_parts.append(f'key = "{parsed_query.epic_key}"')
        if parsed_query.story_key:
            jql_parts.append(f'key = "{parsed_query.story_key}"')
        
        if parsed_query.assignee:
            jql_parts.append(f'assignee ~ "{parsed_query.assignee}"')
        
        if parsed_query.status:
            jql_parts.append(f'status = "{parsed_query.status}"')
        
        if parsed_query.date_from:
            jql_parts.append(f'created >= "{parsed_query.date_from}"')
        if parsed_query.date_to:
            jql_parts.append(f'created <= "{parsed_query.date_to}"')
        
        if parsed_query.keywords:
            keyword_search = ' OR '.join([f'summary ~ "{kw}" OR description ~ "{kw}"' for kw in parsed_query.keywords])
            jql_parts.append(f'({keyword_search})')
        
        return ' AND '.join(jql_parts) if jql_parts else 'project is not EMPTY'
    
    def search_jira_issues(self, jql_query: str, max_results: int = 50) -> Dict[str, Any]:
        """Execute JQL query against Jira API"""
        search_url = f"{self.jira_url}/rest/api/3/search"
        
        payload = {
            'jql': jql_query,
            'maxResults': max_results,
            'fields': [
                'summary', 'description', 'status', 'assignee', 'reporter',
                'created', 'updated', 'priority', 'issuetype', 'project',
                'parent', 'subtasks', 'labels', 'components'
            ]
        }
        
        try:
            response = requests.post(
                search_url,
                headers=self.headers,
                auth=self.auth,
                data=json.dumps(payload),
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error querying Jira: {e}")
            raise Exception(f"Failed to query Jira: {str(e)}")
    
    def process_user_query(self, user_query: str) -> Dict[str, Any]:
        """Main method to process user queries end-to-end"""
        logger.info(f"Processing query: '{user_query}'")
        
        try:
            # Parse natural language query
            parsed_query = self.parse_natural_language_query(user_query)
            logger.info(f"Parsed query: {parsed_query}")
            
            # Build JQL query
            jql_query = self.build_jql_query(parsed_query)
            logger.info(f"JQL Query: {jql_query}")
            
            # Execute search
            issues_data = self.search_jira_issues(jql_query)
            
            return {
                'success': True,
                'data': issues_data,
                'jql_query': jql_query,
                'parsed_query': parsed_query.to_dict()
            }
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_issue_details(self, issue_key: str) -> Dict[str, Any]:
        """Get detailed information about a specific Jira issue"""
        issue_url = f"{self.jira_url}/rest/api/3/issue/{issue_key}"
        
        params = {
            'fields': 'summary,description,status,assignee,priority,issuetype,labels,components,reporter,created,updated'
        }
        
        try:
            response = requests.get(
                issue_url,
                headers=self.headers,
                auth=self.auth,
                params=params,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching Jira issue {issue_key}: {e}")
            raise Exception(f"Failed to fetch issue {issue_key}: {str(e)}")
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Jira connection"""
        try:
            test_jql = "project is not EMPTY ORDER BY created DESC"
            search_url = f"{self.jira_url}/rest/api/3/search"
            
            payload = {
                'jql': test_jql,
                'maxResults': 1,
                'fields': ['summary', 'status', 'issuetype', 'project']
            }
            
            response = requests.post(
                search_url,
                headers=self.headers,
                auth=self.auth,
                data=json.dumps(payload),
                timeout=10
            )
            response.raise_for_status()
            result = response.json()
            
            return {
                'success': True,
                'message': 'Jira connection successful',
                'total_issues': result.get('total', 0)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Jira connection failed: {str(e)}'
            }