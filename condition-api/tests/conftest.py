# Copyright © 2019 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Common setup and fixtures for the py-test suite used by this service."""
from flask import g

import pytest
from flask_migrate import Migrate, upgrade
from sqlalchemy import event, text
from sqlalchemy.orm import scoped_session, sessionmaker

from condition_api import create_app, get_named_config
from condition_api import jwt as _jwt
from condition_api.models import db as _db

from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import factory_auth_header

CONFIG = get_named_config("testing")


@pytest.fixture(scope="session", autouse=True)
def app():
    """Return a session-wide application configured in TEST mode."""
    _app = create_app("testing")
    with _app.app_context():
        yield _app
        _db.session.remove()


@pytest.fixture(scope="function")
def app_request():
    """Return a session-wide application configured in TEST mode."""
    _app = create_app("testing")

    return _app


@pytest.fixture(scope="session")
def client(app):  # pylint: disable=redefined-outer-name
    """Return a session-wide Flask test client."""
    return app.test_client()


@pytest.fixture(scope="session")
def jwt(app):
    """Return session-wide jwt manager."""
    return _jwt


@pytest.fixture(scope="session")
def client_ctx(app):
    """Return session-wide Flask test client."""
    with app.test_client() as _client:
        yield _client


@pytest.fixture(scope='session')
def db(app):
    """Return a session-wide initialized database with schema setup."""
    schema_name = "condition"
    db_user = CONFIG.DB_USER  # Should be 'condition'

    with app.app_context():
        g.jwt_oidc_token_info = TestJwtClaims.staff_admin_role
        sess = _db.session()

        print('-===========' * 100)
        # Ensure the role exists
        sess.execute(text(f"DO $$ BEGIN "
                          f"IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '{db_user}') THEN "
                          f"CREATE ROLE {db_user} LOGIN PASSWORD '{CONFIG.DB_PASSWORD}'; "
                          f"END IF; END $$;"))

        # Drop and recreate schema
        sess.execute(text(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE"))
        sess.execute(text(f"CREATE SCHEMA {schema_name}"))
        sess.execute(text(f"GRANT ALL ON SCHEMA {schema_name} TO {db_user}"))
        sess.execute(text(f"GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA {schema_name} TO {db_user}"))
        sess.execute(text(f"SET search_path TO {schema_name}"))
        sess.commit()

        # Apply migrations
        Migrate(app, _db)
        upgrade()

        return _db


@pytest.fixture(scope="session")
def docker_compose_files(pytestconfig):
    """Get the docker-compose.yml absolute path."""
    import os

    return [
        os.path.join(str(pytestconfig.rootdir), "tests/docker", "docker-compose.yml")
    ]


@pytest.fixture(scope="function", autouse=True)
def session(app, db):
    """Return a function-scoped session."""
    with app.app_context(), db.engine.connect() as conn:
        conn.begin()
        session_factory = sessionmaker(bind=conn)
        sess = scoped_session(session_factory)
        sess.begin_nested()

        @event.listens_for(sess(), 'after_transaction_end')
        def restart_savepoint(sess2, trans):
            if trans.nested and not trans._parent.nested:
                sess2.expire_all()
                sess.begin_nested()

        db.session = sess

        sql = text('select 1')
        sess.execute(sql)

        yield sess


@pytest.fixture()
def auth_header(client, jwt, request):
    """Create a basic admin header for tests."""
    staff_user = TestJwtClaims.staff_admin_role
    headers = factory_auth_header(jwt=jwt, claims=staff_user)
    return headers
