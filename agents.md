# Local Development Instructions

This file documents the steps to set up and run the `condition-api` locally.

1. **Start Local Database**
   Ensure your `.env` variables are configured (you can copy `sample.env` to `.env` and fill the variables).
   Run the postgres database locally using `docker-compose`.

   ```bash
   docker-compose up -d
   ```

2. **Project Setup**
   Install all python requirements and configure the virtual environment using the existing `Makefile`.

   ```bash
   make setup
   ```

3. **Start the API**
   Once the database is running and the virtual environment is set up, start the Flask API using `wsgi.py`.
   Make sure to do this within your virtual environment (the `make setup` command will typically guide you or try `. venv/bin/activate`).

   ```bash
   python wsgi.py
   ```
   *Alternative:* `make run`
