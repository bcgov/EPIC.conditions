# CONDITION-LOADER

Module for loading extracted conditions into the database.

## Getting Started

## Step 1. Install Python 3.12.4
Ensure Python 3.12.4 is installed in your WSL environment. Download it from the [official Python website](https://www.python.org/downloads/release/python-3124/).

## Step 2. Set Up PYTHONPATH
Add the following line to your `.bashrc` or `.zshrc` file to set the `PYTHONPATH` environment variable:
export PYTHONPATH="/path/to/condition-api:${PYTHONPATH}"

## Step 3. Configure Environment Variables
Create a `.env` file in your condition-api with the necessary configurations. Reference sample.env to see what variables you need to configure
Update PostgreSQL credentials for your environment

## Step 4. Set Up `condition-loader`
1. Open a separate terminal.

2. Navigate to the `` directory:
    cd condition-loader

3. Create a virtual environment. Refer to the official Python documentation on how to create a virtual environment: [Python venv](https://docs.python.org/3/library/venv.html).
    python -m venv venv

4. Activate the virtual environment:
    - source venv/bin/activate  # Mac/Linux
    - venv\Scripts\activate     # Windows

5. Install the required Python packages:
    pip install psycopg2 python-dotenv

6. Place the extracted JSON files in the condition_jsons folder, following the structure shown in sample.json

7. Run script for importing the extracted conditions into the database:
    - python loadConditions.py
