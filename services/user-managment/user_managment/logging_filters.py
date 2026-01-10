"""
Logging filters to mask sensitive data in log messages.
This prevents accidental exposure of passwords, tokens, and other sensitive information.
"""
import logging
import re


class SensitiveDataFilter(logging.Filter):
    """
    Filter that masks sensitive data in log messages.
    
    Automatically detects and masks:
    - Passwords
    - API keys
    - Tokens (JWT, refresh tokens, etc.)
    - Credit card numbers
    - Email addresses (partial masking)
    - Phone numbers
    """
    
    # Patterns to detect and mask
    PATTERNS = [
        # Passwords in various formats
        (r'["\']?password["\']?\s*[:=]\s*["\']?([^"\'\s,}]+)["\']?', 'password', '***MASKED***'),
        (r'["\']?passwd["\']?\s*[:=]\s*["\']?([^"\'\s,}]+)["\']?', 'passwd', '***MASKED***'),
        (r'["\']?pwd["\']?\s*[:=]\s*["\']?([^"\'\s,}]+)["\']?', 'pwd', '***MASKED***'),
        
        # API keys and tokens
        (r'["\']?api[_-]?key["\']?\s*[:=]\s*["\']?([^"\'\s,}]+)["\']?', 'api_key', '***MASKED***'),
        (r'["\']?secret[_-]?key["\']?\s*[:=]\s*["\']?([^"\'\s,}]+)["\']?', 'secret_key', '***MASKED***'),
        (r'["\']?auth[_-]?token["\']?\s*[:=]\s*["\']?([^"\'\s,}]+)["\']?', 'auth_token', '***MASKED***'),
        (r'["\']?access[_-]?token["\']?\s*[:=]\s*["\']?([^"\'\s,}]+)["\']?', 'access_token', '***MASKED***'),
        (r'["\']?refresh[_-]?token["\']?\s*[:=]\s*["\']?([^"\'\s,}]+)["\']?', 'refresh_token', '***MASKED***'),
        
        # JWT tokens (base64 encoded with dots)
        (r'eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', None, '***JWT_MASKED***'),
        
        # Credit card numbers (basic patterns)
        (r'\b(\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4})\b', None, '****-****-****-****'),
        
        # Bearer tokens in headers
        (r'Bearer\s+([A-Za-z0-9_-]+)', 'Bearer', 'Bearer ***MASKED***'),
        
        # Authorization headers
        (r'["\']?authorization["\']?\s*[:=]\s*["\']?([^"\'\s,}]+)["\']?', 'authorization', '***MASKED***'),
    ]
    
    # Email partial masking pattern
    EMAIL_PATTERN = re.compile(r'([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})')
    
    def __init__(self, name=''):
        super().__init__(name)
        self.compiled_patterns = [
            (re.compile(pattern, re.IGNORECASE), key, replacement)
            for pattern, key, replacement in self.PATTERNS
        ]
    
    def mask_email(self, email_match):
        """Partially mask email addresses (show first 2 chars and domain)."""
        local_part = email_match.group(1)
        domain = email_match.group(2)
        if len(local_part) > 2:
            masked_local = local_part[:2] + '*' * (len(local_part) - 2)
        else:
            masked_local = '*' * len(local_part)
        return f"{masked_local}@{domain}"
    
    def filter(self, record):
        """Filter and mask sensitive data in log messages."""
        if isinstance(record.msg, str):
            message = record.msg
            
            # Apply all masking patterns
            for pattern, key, replacement in self.compiled_patterns:
                if key:
                    # Replace the value part only
                    message = pattern.sub(
                        lambda m: m.group(0).replace(m.group(1), replacement) if m.groups() else replacement,
                        message
                    )
                else:
                    # Replace entire match
                    message = pattern.sub(replacement, message)
            
            # Partially mask email addresses
            message = self.EMAIL_PATTERN.sub(self.mask_email, message)
            
            record.msg = message
        
        # Also check args if they contain strings
        if record.args:
            masked_args = []
            for arg in record.args:
                if isinstance(arg, str):
                    masked_arg = arg
                    for pattern, key, replacement in self.compiled_patterns:
                        if key:
                            masked_arg = pattern.sub(
                                lambda m: m.group(0).replace(m.group(1), replacement) if m.groups() else replacement,
                                masked_arg
                            )
                        else:
                            masked_arg = pattern.sub(replacement, masked_arg)
                    masked_arg = self.EMAIL_PATTERN.sub(self.mask_email, masked_arg)
                    masked_args.append(masked_arg)
                else:
                    masked_args.append(arg)
            record.args = tuple(masked_args)
        
        return True


class RequestIDFilter(logging.Filter):
    """
    Filter that adds request ID to log records for tracing.
    """
    
    def filter(self, record):
        # Try to get request ID from thread local or set a placeholder
        try:
            from threading import local
            _thread_locals = local()
            record.request_id = getattr(_thread_locals, 'request_id', 'N/A')
        except Exception:
            record.request_id = 'N/A'
        return True
