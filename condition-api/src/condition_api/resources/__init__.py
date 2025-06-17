# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Exposes all of the resource endpoints mounted in Flask-Blueprint style.

Uses restplus namespaces to mount individual api endpoints into the service.

All services have 2 defaults sets of endpoints:
 - ops
 - meta
That are used to expose operational health information about the service, and meta information.
"""

from flask import Blueprint

from .apihelper import Api
from .amendment import API as AMENDMENT_API
from .attribute_key import API as ATTRIBUTE_KEY_API
from .condition import API as CONDITION_API
from .condition_attribute import API as CONDITION_ATTRIBUTE_API
from .consolidated_condition import API as CONSOLIDATED_CONDITION_API
from .document import API as DOCUMENT_API
from .document_category import API as DOCUMENT_CATEGORY_API
from .ops import API as OPS_API
from .project import API as PROJECT_API
from .staff_user import API as STAFF_USER_API


__all__ = ('API_BLUEPRINT', 'OPS_BLUEPRINT')

URL_PREFIX = '/api/'
API_BLUEPRINT = Blueprint('API', __name__, url_prefix=URL_PREFIX)
OPS_BLUEPRINT = Blueprint("API_OPS", __name__, url_prefix="/ops")

API_OPS = Api(
    OPS_BLUEPRINT,
    title="Service OPS API",
    version="1.0",
    description="The Core API for the Reports System",
)

API_OPS.add_namespace(OPS_API, path="/")

API = Api(
    API_BLUEPRINT,
    title='CONDITION API',
    version='1.0',
    description='The Core API for CONDITION'
)

# HANDLER = ExceptionHandler(API)

API.add_namespace(AMENDMENT_API)
API.add_namespace(ATTRIBUTE_KEY_API)
API.add_namespace(CONDITION_API)
API.add_namespace(CONDITION_ATTRIBUTE_API)
API.add_namespace(CONSOLIDATED_CONDITION_API)
API.add_namespace(DOCUMENT_CATEGORY_API)
API.add_namespace(DOCUMENT_API)
API.add_namespace(PROJECT_API)
API.add_namespace(STAFF_USER_API)
