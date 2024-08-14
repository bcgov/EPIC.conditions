FROM python:3.9-buster

USER root

# Create the application directory and set permissions
RUN mkdir /opt/app-root && chmod 755 /opt/app-root
WORKDIR /opt/app-root

# Copy requirements.txt and install dependencies
COPY ./requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Ensure correct permissions for the app directory
RUN chmod -R 755 /opt/app-root

# Change ownership of the directory to the non-root user
RUN chown -R 1001:1001 /opt/app-root

# Install the application itself
RUN pip install .

# Switch to a non-root user
USER 1001

# Set the PYTHONPATH environment variable
ENV PYTHONPATH=/opt/app-root

# Set the entrypoint for the container
ENTRYPOINT ["python", "gradio_ui.py"]
