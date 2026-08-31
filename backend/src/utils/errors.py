class ConfigurationError(RuntimeError):
    """Required backend configuration is missing."""


class WorkflowError(RuntimeError):
    """An external AI/search workflow failed."""
