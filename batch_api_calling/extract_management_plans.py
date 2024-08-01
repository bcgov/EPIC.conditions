import sys
sys.path.append('..')
import os
import argparse 
from colorama import Fore, Style
from gpt import extract_management_plan_info_from_json

def extract_management_plans(jsons_folder_path, output_folder_path):

    if not os.path.exists(output_folder_path):
        os.makedirs(output_folder_path)

    for file in os.listdir(jsons_folder_path):
        if file.endswith('.json'):
            output_file_path = os.path.join(output_folder_path, file)
            if os.path.exists(output_file_path):
                print(f"Skipping {file} as it already exists in the output folder")
                continue
            print(Fore.CYAN + f"\n\nExtracting management plan info from {file}" + Style.RESET_ALL)
            input_file_path = os.path.join(jsons_folder_path, file)
            extract_management_plan_info_from_json(input_file_path, output_file_path)

    print(Fore.GREEN + f"SUCCESS: All management plans extracted to new JSONs in {output_folder_path}" + Style.RESET_ALL)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--jsons_folder_path', 
        type=str, 
        default='./condition_jsons', 
        help='Path to the folder containing the JSONs (default: ./condition_jsons)'
    )
    parser.add_argument(
        '--output_folder_path', 
        type=str, 
        default='./condition_jsons_with_management_plans', 
        help='Path to the folder to save the updated JSONs (default: ./condition_jsons_with_management_plans)'
    )
    args = parser.parse_args()

    extract_management_plans(args.jsons_folder_path, args.output_folder_path)
