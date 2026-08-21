# EPIC.conditions
A project for the Environmental Assessment Office to manage conditions required for a certificate

Condition Repository is an online application designed to extract, store, and present environmental assessment conditions from PDF documents.

### Key Benefits
- **Conditions Repository**: A single repository providing access to all conditions across multiple projects
- **Consolidated Conditions View**: Enables viewing of all conditions for a project, including amendments to the original condition documents, in a unified format

## Condition Repository Setup Instructions

This document outlines the setup instructions for both the backend and front-end components of the project. Ensure you follow the steps in sequence for a smooth setup.

## Backend Setup
See [API Application Readme](condition-api/README.md)

## Front End Setup
See [Web Application Readme](condition-web/README.md)

## Extraction Pipeline Setup
See [Condition Cron Readme](condition-cron/README.md)


## Usage

Conditions are extracted automatically from uploaded PDF documents:

1. Staff upload a document through the Condition Web application, creating a pending extraction request.
2. `condition-cron` picks up the request on its schedule, downloads the PDF from S3, classifies its structure, and extracts conditions — along with clauses, management plan deliverables, and report submission requirements — using OpenAI. See [Condition Cron Readme](condition-cron/README.md) for how the pipeline works.
3. Staff review the extracted result in the web UI and either import it into the condition tables or reject it.

## Directory Structure

    .github/                   - PR, CI action workflows and Issue templates
    docs/                      - Miscellaneous documentation
    condition-web/             - Condition Web application root
    └── src/                   - React.js application
    condition-api/             - Condition API application root
    ├── src/                   - Python Flask application
    │   └── condition_api/     - Models, Resources and Services
    └── migrations/            - Database migration scripts
    └── tests/                 - API application tests
        └── unit/              - Python unit tests
    condition-cron/            - Scheduled job that extracts conditions from uploaded PDFs and stages them for staff review
    deployment/                - Helm charts for OpenShift deployment
    tools/condition-extractor/ - Azure-hosted OpenAI proxy used by condition-cron
    LICENSE                    - License

## Demo
[![Condition extractor demo](https://github.com/user-attachments/assets/a25b0093-b04b-4ddb-89cd-153ddaa582cd)](https://bcgov.sharepoint.com/:b:/t/04612/EYzyqtlP82BJt8ocy2AISNwBwiS-2BgJ23NqRZts-Nn6jw?e=CM1Nt3)
[Recording]() - [(Slides)](https://bcgov.sharepoint.com/:b:/t/04612/EYzyqtlP82BJt8ocy2AISNwBwiS-2BgJ23NqRZts-Nn6jw?e=CM1Nt3)

## Resources
- [AI crashcourse presentation](https://bcgov.sharepoint.com/:v:/t/04612/EX_-99Ne-IJPlyOr09vqRZgBCvCGLNEmWr5baMlF5VgraQ?e=Xw8rB2) - [(Slides)](https://bcgov.sharepoint.com/:b:/t/04612/EdJII7T6wfJCl3xOS9ANGKYB0w8oYdEgroBIoOVZPMmCNg?e=K0W55d)
- [Sample output JSONs (August 2024)](https://bcgov.sharepoint.com/:f:/t/04612/EnKdD_vryA5JrSXxcloZUi8BQzcUhJjHAK4pDeGy1PuK2w?e=n4cJ5l)
- [API cost analysis (out of date)](https://bcgov.sharepoint.com/:x:/t/04612/ETA885_P64BBhUWoGvWHT_ABuYQZC2jjLCC-q8zGOr4MeA?e=WG5ZeX)

- [OpenAI function calling documentation](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI API reference](https://platform.openai.com/docs/api-reference/chat)[.](https://github.com/user-attachments/assets/cac337de-097d-4bfb-b946-56b98a2f1e1d)


## License

    Copyright © 2024 Province of British Columbia

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
