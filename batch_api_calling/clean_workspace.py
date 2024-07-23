import os
import shutil
from colorama import Fore, Style

# List of folders to clean
folders_to_clean = [
    "batch_requests_jsonl_files",
    "batch_requests_jsonl_files_length_fix",
    "batch_responses_jsonl_files",
    "batch_responses_jsonl_files_length_fix",
    "condition_jsons"
]

files_to_delete = [
    "BATCH_STATUSES.json",
    "CONDITION_COUNT.json",
    "BATCH_STATUSES_LENGTH_FIX.json"
]

def delete_files_in_folder(folder):
    if os.path.exists(folder):
        for filename in os.listdir(folder):
            file_path = os.path.join(folder, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f'Failed to delete {file_path}. Reason: {e}')
    else:
        print(f'Folder {folder} does not exist.')

def delete_files(files):
    for file in files:
        if os.path.exists(file):
            try:
                os.unlink(file)
            except Exception as e:
                print(f'Failed to delete {file}. Reason: {e}')
        else:
            print(f'File {file} does not exist.')

def main():
    confirmation = input(Fore.CYAN + "Are you sure you want to delete all files in the specified folders? This action cannot be undone. (Press Enter to confirm)" + Style.RESET_ALL).strip().lower()
    
    if confirmation in ['', 'yes']:
        for folder in folders_to_clean:
            delete_files_in_folder(folder)
            print(Fore.GREEN + f'All files in {folder} have been deleted.' + Style.RESET_ALL)            

        delete_files(files_to_delete)
        print(Fore.GREEN + 'All files have been deleted.' + Style.RESET_ALL)

    else:
        print("Operation cancelled.")

if __name__ == "__main__":
    main()
