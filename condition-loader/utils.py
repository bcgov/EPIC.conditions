import json

def convert_to_pg_array(json_array):
    """Convert JSON array to PostgreSQL array format."""
    return '{' + ','.join(json.dumps(item) for item in json_array) + '}'

def get_document_category_id(document_type):
    """Return document_type_id based on type string."""
    mapping = {
        "Exemption Order": 2,
        "Other Order": 4,
        "Amendment": 3,
        "Schedule B/Certificate": 1
    }
    return mapping.get(document_type)
