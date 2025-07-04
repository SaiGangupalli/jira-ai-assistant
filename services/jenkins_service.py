# services/jenkins_service.py
import logging
import requests
import json
import base64
from typing import Dict, Any, Optional
from datetime import datetime
from config.settings import Config

logger = logging.getLogger(__name__)

class JenkinsService:
    """Service for Jenkins job operations"""
    
    def __init__(self):
        self.jenkins_url = Config.JENKINS_URL.rstrip('/')
        self.jenkins_username = Config.JENKINS_USERNAME
        self.jenkins_token = Config.JENKINS_TOKEN
        
        # Create authentication header
        if self.jenkins_username and self.jenkins_token:
            credentials = f"{self.jenkins_username}:{self.jenkins_token}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            self.auth_header = f"Basic {encoded_credentials}"
        else:
            self.auth_header = None
        
        # Jenkins job configurations
        self.job_configs = {
            'fraud_story_prediction': {
                'job_name': 'fraud-story-prediction',
                'display_name': 'Fraud Story Prediction',
                'description': 'AI-powered fraud story prediction based on enterprise release data',
                'parameters': ['enterprise_release', 'email_id'],
                'icon': '🤖',
                'estimated_runtime': '5-10 minutes'
            }
        }
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Jenkins connection"""
        try:
            headers = {'Content-Type': 'application/json'}
            if self.auth_header:
                headers['Authorization'] = self.auth_header
            
            # Test connection with Jenkins API info endpoint
            response = requests.get(
                f"{self.jenkins_url}/api/json",
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            
            jenkins_info = response.json()
            return {
                'success': True,
                'message': 'Jenkins connection successful',
                'jenkins_version': jenkins_info.get('version', 'Unknown'),
                'mode': jenkins_info.get('mode', 'Unknown'),
                'node_name': jenkins_info.get('nodeName', 'Unknown'),
                'num_executors': jenkins_info.get('numExecutors', 0)
            }
            
        except requests.exceptions.ConnectionError:
            return {
                'success': False,
                'error': 'Connection failed: Unable to connect to Jenkins server'
            }
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': 'Connection timeout: Jenkins server did not respond'
            }
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                return {
                    'success': False,
                    'error': 'Authentication failed: Invalid username or token'
                }
            elif e.response.status_code == 403:
                return {
                    'success': False,
                    'error': 'Access denied: Insufficient permissions'
                }
            else:
                return {
                    'success': False,
                    'error': f'HTTP error: {e.response.status_code}'
                }
        except Exception as e:
            logger.error(f"Jenkins connection test failed: {e}")
            return {
                'success': False,
                'error': f'Connection failed: {str(e)}'
            }
    
    def get_job_info(self, job_type: str) -> Dict[str, Any]:
        """Get information about a specific job type"""
        if job_type not in self.job_configs:
            return {
                'success': False,
                'error': f'Unknown job type: {job_type}'
            }
        
        job_config = self.job_configs[job_type]
        job_name = job_config['job_name']
        
        try:
            headers = {'Content-Type': 'application/json'}
            if self.auth_header:
                headers['Authorization'] = self.auth_header
            
            # Get job information from Jenkins
            response = requests.get(
                f"{self.jenkins_url}/job/{job_name}/api/json",
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            
            job_info = response.json()
            
            # Get last build information if available
            last_build_info = None
            if job_info.get('lastBuild'):
                try:
                    build_response = requests.get(
                        f"{self.jenkins_url}/job/{job_name}/{job_info['lastBuild']['number']}/api/json",
                        headers=headers,
                        timeout=5
                    )
                    if build_response.status_code == 200:
                        last_build_info = build_response.json()
                except:
                    pass  # Continue without last build info if it fails
            
            return {
                'success': True,
                'job_type': job_type,
                'job_name': job_name,
                'display_name': job_config['display_name'],
                'description': job_config['description'],
                'icon': job_config['icon'],
                'estimated_runtime': job_config['estimated_runtime'],
                'parameters': job_config['parameters'],
                'jenkins_info': {
                    'displayName': job_info.get('displayName'),
                    'buildable': job_info.get('buildable', False),
                    'lastBuild': job_info.get('lastBuild', {}).get('number') if job_info.get('lastBuild') else None,
                    'nextBuildNumber': job_info.get('nextBuildNumber'),
                    'lastSuccessfulBuild': job_info.get('lastSuccessfulBuild', {}).get('number') if job_info.get('lastSuccessfulBuild') else None,
                    'lastFailedBuild': job_info.get('lastFailedBuild', {}).get('number') if job_info.get('lastFailedBuild') else None
                },
                'last_build_info': last_build_info
            }
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                return {
                    'success': False,
                    'error': f'Job not found: {job_name}'
                }
            else:
                return {
                    'success': False,
                    'error': f'Failed to get job info: HTTP {e.response.status_code}'
                }
        except Exception as e:
            logger.error(f"Error getting job info for {job_type}: {e}")
            return {
                'success': False,
                'error': f'Failed to get job information: {str(e)}'
            }
    
    def trigger_job(self, job_type: str, parameters: Dict[str, str]) -> Dict[str, Any]:
        """Trigger a Jenkins job with parameters"""
        if job_type not in self.job_configs:
            return {
                'success': False,
                'error': f'Unknown job type: {job_type}'
            }
        
        job_config = self.job_configs[job_type]
        job_name = job_config['job_name']
        
        # Validate required parameters
        missing_params = []
        for required_param in job_config['parameters']:
            if required_param not in parameters or not parameters[required_param].strip():
                missing_params.append(required_param)
        
        if missing_params:
            return {
                'success': False,
                'error': f'Missing required parameters: {", ".join(missing_params)}'
            }
        
        try:
            headers = {'Content-Type': 'application/x-www-form-urlencoded'}
            if self.auth_header:
                headers['Authorization'] = self.auth_header
            
            # Prepare parameters for Jenkins
            jenkins_params = {}
            for param_name in job_config['parameters']:
                jenkins_params[param_name] = parameters.get(param_name, '')
            
            # Add timestamp for tracking
            jenkins_params['triggered_at'] = datetime.now().isoformat()
            jenkins_params['triggered_by'] = 'Jira AI Assistant'
            
            logger.info(f"Triggering Jenkins job {job_name} with parameters: {list(jenkins_params.keys())}")
            
            # Trigger the job
            response = requests.post(
                f"{self.jenkins_url}/job/{job_name}/buildWithParameters",
                headers=headers,
                data=jenkins_params,
                timeout=30
            )
            response.raise_for_status()
            
            # Get the queue item location from the response
            queue_location = response.headers.get('Location')
            
            return {
                'success': True,
                'job_type': job_type,
                'job_name': job_name,
                'display_name': job_config['display_name'],
                'message': f'Job {job_config["display_name"]} triggered successfully',
                'parameters': jenkins_params,
                'queue_location': queue_location,
                'estimated_runtime': job_config['estimated_runtime'],
                'triggered_at': datetime.now().isoformat(),
                'status': 'triggered',
                'next_steps': [
                    f'Job execution started in Jenkins',
                    f'Results will be sent to: {parameters.get("email_id", "specified email")}',
                    f'Expected completion: {job_config["estimated_runtime"]}',
                    'You can check Jenkins console for real-time progress'
                ]
            }
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                return {
                    'success': False,
                    'error': 'Authentication failed: Invalid credentials'
                }
            elif e.response.status_code == 403:
                return {
                    'success': False,
                    'error': 'Access denied: Insufficient permissions to trigger job'
                }
            elif e.response.status_code == 404:
                return {
                    'success': False,
                    'error': f'Job not found: {job_name}'
                }
            else:
                return {
                    'success': False,
                    'error': f'Failed to trigger job: HTTP {e.response.status_code}'
                }
        except Exception as e:
            logger.error(f"Error triggering job {job_type}: {e}")
            return {
                'success': False,
                'error': f'Failed to trigger job: {str(e)}'
            }
    
    def get_build_status(self, job_type: str, build_number: int) -> Dict[str, Any]:
        """Get the status of a specific build"""
        if job_type not in self.job_configs:
            return {
                'success': False,
                'error': f'Unknown job type: {job_type}'
            }
        
        job_config = self.job_configs[job_type]
        job_name = job_config['job_name']
        
        try:
            headers = {'Content-Type': 'application/json'}
            if self.auth_header:
                headers['Authorization'] = self.auth_header
            
            response = requests.get(
                f"{self.jenkins_url}/job/{job_name}/{build_number}/api/json",
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            
            build_info = response.json()
            
            return {
                'success': True,
                'job_type': job_type,
                'job_name': job_name,
                'build_number': build_number,
                'status': 'completed' if not build_info.get('building', False) else 'running',
                'result': build_info.get('result'),  # SUCCESS, FAILURE, ABORTED, etc.
                'building': build_info.get('building', False),
                'duration': build_info.get('duration', 0),
                'estimated_duration': build_info.get('estimatedDuration', 0),
                'timestamp': build_info.get('timestamp'),
                'url': build_info.get('url'),
                'description': build_info.get('description', ''),
                'parameters': self._extract_build_parameters(build_info)
            }
            
        except Exception as e:
            logger.error(f"Error getting build status for {job_type}:{build_number}: {e}")
            return {
                'success': False,
                'error': f'Failed to get build status: {str(e)}'
            }
    
    def _extract_build_parameters(self, build_info: Dict) -> Dict[str, str]:
        """Extract parameters from build info"""
        parameters = {}
        actions = build_info.get('actions', [])
        
        for action in actions:
            if action.get('_class') == 'hudson.model.ParametersAction':
                params = action.get('parameters', [])
                for param in params:
                    if 'name' in param and 'value' in param:
                        parameters[param['name']] = param['value']
        
        return parameters
    
    def get_available_jobs(self) -> Dict[str, Any]:
        """Get all available job types"""
        return {
            'success': True,
            'jobs': {
                job_type: {
                    'display_name': config['display_name'],
                    'description': config['description'],
                    'icon': config['icon'],
                    'parameters': config['parameters'],
                    'estimated_runtime': config['estimated_runtime']
                }
                for job_type, config in self.job_configs.items()
            }
        }
    
    def validate_parameters(self, job_type: str, parameters: Dict[str, str]) -> Dict[str, Any]:
        """Validate job parameters before triggering"""
        if job_type not in self.job_configs:
            return {
                'success': False,
                'error': f'Unknown job type: {job_type}'
            }
        
        job_config = self.job_configs[job_type]
        errors = []
        warnings = []
        
        # Check required parameters
        for required_param in job_config['parameters']:
            if required_param not in parameters or not parameters[required_param].strip():
                errors.append(f"Missing required parameter: {required_param}")
        
        # Validate specific parameter formats
        if job_type == 'fraud_story_prediction':
            if 'email_id' in parameters:
                email = parameters['email_id'].strip()
                if email and '@' not in email:
                    errors.append("Invalid email format")
                elif email and not email.endswith(('.com', '.org', '.net', '.edu', '.gov')):
                    warnings.append("Email domain seems unusual")
            
            if 'enterprise_release' in parameters:
                release = parameters['enterprise_release'].strip()
                if release and not release.replace('.', '').replace('-', '').replace('_', '').isalnum():
                    warnings.append("Enterprise release format seems unusual")
        
        return {
            'success': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'validated_parameters': {k: v.strip() for k, v in parameters.items() if v.strip()}
        }
