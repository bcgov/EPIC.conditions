import os
import json

# Define the paths to the folders and verification status file
json_folder = '../condition_jsons'
verification_status_file = 'VERIFICATION_STATUSES.json'

# Get the list of JSON files
json_files = sorted([f for f in os.listdir(json_folder) if f.endswith('.json')])

# Create a dictionary with all files set to unverified
verification_statuses = {file: {"verified_by_human": False} for file in json_files}

# Save the verification statuses to the file
with open(verification_status_file, 'w') as file:
    json.dump(verification_statuses, file, indent=4)

print(f"Created {verification_status_file} with all files set to unverified.")
