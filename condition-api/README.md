# CONDITION-API

A condition Python flask API application to be used as a template.

## Getting Started

## Backend Setup in WSL

## Step 1. Install Python 3.12.4
Ensure Python 3.12.4 is installed in your WSL environment. Download it from the [official Python website](https://www.python.org/downloads/release/python-3124/).

## Step 2. Set Up PYTHONPATH
Add the following line to your `.bashrc` or `.zshrc` file to set the `PYTHONPATH` environment variable:
export PYTHONPATH="/path/to/condition-api:${PYTHONPATH}"

## Step 3. Configure Environment Variables
Create a `.env` file in your condition-api with the necessary configurations. Reference sample.env to see what variables you need to configure

## Step 4. Start Docker Compose
In a separate terminal, launch Docker Compose to set up your containers:
docker-compose up

## Step 5. Run Setup
Navigate to your project directory and run the setup command to prepare your development environment:
make setup

## Step 6. Run Server
Once the setup is completed use make run to start the server:
make run


## Backend Setup on Windows

## Step 1: Download the Latest Python Version

1. Visit the official Python website: [Python Downloads](https://www.python.org/downloads/)
2. Download and install the latest version of Python for your operating system.


## Step 2: Set Environment Variables

1. Set the `FLASK_APP` and `FLASK_ENV` environment variables:
    - set FLASK_APP=app.py 
    - set FLASK_ENV=development
      
2. Configure `PYTHONPATH` to your project's folder location up to `condition-api/src`:
    - set PYTHONPATH=path\to\condition-api\src &&    PYTHONPATH=path\to\condition-api

## Step 3: Start Docker

1. Open a terminal.
2. Navigate to the `condition-api` directory:
    cd condition-api

3. Run the following command to start the services using Docker Compose:
    docker-compose up

## Step 4: Set Up `condition-api`

1. Open a separate terminal.

2. Navigate to the `` directory:
    cd condition-api

3. Create a virtual environment. Refer to the official Python documentation on how to create a virtual environment: [Python venv](https://docs.python.org/3/library/venv.html).
    - python -m venv venv

4. Activate the virtual environment:
    - venv\Scripts\activate

5. Install the required Python packages from both `dev.txt` and `prod.txt` requirements files:
    - python -m pip install -r path/to/requirements/dev.txt
    - python -m pip install -r path/to/requirements/prod.txt

6. Run your Flask app using the Flask CLI:
    - python -m flask run -p 5000


Runs the python application and runs database migrations.
Open [http://localhost:5000/api](http://localhost:5000/api) to view it in the browser.<br/>

> `make test`
>
> Runs the application unit tests<br>

> `make lint`
>
> Lints the application code.

## Debugging in the Editor

### Visual Studio Code

Ensure the latest version of [VS Code](https://code.visualstudio.com) is installed.