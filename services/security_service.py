# services/security_service.py
import openai
import logging
from typing import Dict, Any
from config.settings import Config
from models.jira_models import SecurityAnalysisResult
from services.jira_service import JiraService

logger = logging.getLogger(__name__)

class SecurityService:
    """Service for security analysis operations"""
    
    def __init__(self):
        self.jira_service = JiraService()
        openai.api_key = Config.OPENAI_API_KEY
    
    def analyze_issue_security_impact(self, issue_key: str) -> Dict[str, Any]:
        """Analyze a specific issue for fraud and security impact"""
        try:
            # Get issue details
            issue_data = self.jira_service.get_issue_details(issue_key)
            
            if not issue_data:
                return SecurityAnalysisResult(
                    success=False,
                    issue_key=issue_key,
                    error=f'Issue {issue_key} not found or inaccessible'
                ).to_dict()
            
            # Prepare issue context for LLM
            issue_context = self._prepare_issue_context(issue_data)
            
            # Get LLM security analysis
            analysis_result = self._get_llm_security_analysis(issue_context, issue_key)
            
            return SecurityAnalysisResult(
                success=True,
                issue_key=issue_key,
                analysis=analysis_result['analysis'],
                risk_level=analysis_result.get('risk_level'),
                recommendations=analysis_result.get('recommendations', [])
            ).to_dict()
            
        except Exception as e:
            logger.error(f"Error analyzing issue {issue_key}: {e}")
            return SecurityAnalysisResult(
                success=False,
                issue_key=issue_key,
                error=str(e)
            ).to_dict()
    
    def _prepare_issue_context(self, issue_data: Dict) -> str:
        """Prepare issue context for LLM analysis"""
        fields = issue_data['fields']
        
        context = f"""
        Issue Key: {issue_data['key']}
        Summary: {fields.get('summary', '')}
        Description: {fields.get('description', 'No description provided')}
        Type: {fields.get('issuetype', {}).get('name', '')}
        Priority: {fields.get('priority', {}).get('name', '')}
        Status: {fields.get('status', {}).get('name', '')}
        Labels: {', '.join(fields.get('labels', []))}
        Components: {', '.join([comp['name'] for comp in fields.get('components', [])])}
        """
        
        return context.strip()
    
    def _get_llm_security_analysis(self, issue_context: str, issue_key: str) -> Dict[str, Any]:
        """Get LLM security analysis for the issue"""
        prompt = f"""
        You are a cybersecurity expert analyzing a Jira issue for fraud and security risks.
        
        Issue Details:
        {issue_context}
        
        Provide a comprehensive fraud & security impact analysis in simple, non-technical language that a business manager can understand.
        
        Focus on:
        1. Security risks this issue might create
        2. Potential exploitation vectors for fraud
        3. Business impact assessment
        4. Risk level (Low/Medium/High/Critical)
        5. Specific mitigation recommendations
        
        Return your analysis in the following JSON format:
        {{
            "analysis": "Detailed analysis text here...",
            "risk_level": "Low/Medium/High/Critical",
            "recommendations": ["recommendation 1", "recommendation 2", ...]
        }}
        
        Keep recommendations actionable and business-focused. Avoid technical jargon.
        """
        
        try:
            response = openai.ChatCompletion.create(
                model=Config.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=600
            )
            
            content = response.choices[0].message.content.strip()
            
            # Try to parse as JSON, fallback to text analysis
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # If JSON parsing fails, return the content as analysis
                return {
                    "analysis": content,
                    "risk_level": "Medium",
                    "recommendations": ["Review the detailed analysis above for specific recommendations"]
                }
                
        except Exception as e:
            logger.error(f"Error getting LLM analysis: {e}")
            return {
                "analysis": f"Unable to generate security analysis. Error: {str(e)}",
                "risk_level": "Unknown",
                "recommendations": ["Manual security review recommended"]
            }
