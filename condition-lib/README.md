# CONDITION-LIBRARY-API

A gradio application.

## Getting Started

### Development Environment
* Install the following:
    - [Python](https://www.python.org/)
    - [Docker](https://www.docker.com/)
    - [Docker-Compose](https://docs.docker.com/compose/install/)
* Start the application
    - Run `python -m venv venv` to create a python virtual environment.
    - Run `.\venv\Scripts\activate`(on Windows) or `. venv/bin/activate`(on Linux) to create a python virtual environment.
    - Run `docker-compose up --build` in the root of the project (condition-lib)

## Environment Variables

The development scripts for this application allow customization via an environment file in the root directory called `.env`. See an example of the environment variables that can be overridden in `sample.env`.

> Run the application.  
Open [http://localhost:7861/](http://localhost:7861/) to view it in the browser.<br/>
