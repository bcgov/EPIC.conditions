import pytest
import os
import shutil
import json
from extract_management_plans import extract_all_management_plans

known_conditions_with_required_plan = {
    "5c50eee297a31e0024f07c1f_5d2e310d340b690021fc09f3.json": [9],
    "5c35249ec45524002403a89f_5cf6f84f3de7b9001bd36438.json": [9, 10, 11], #9
    "5885118faaecd9001b822018_5887e07df64627133ae5b080.json": [1, 2, 3, 5, 6, 9, 12, 14, 15, 26, 28, 29, 37], #14, 28, 29,
    "588511e1aaecd9001b8272e7_58869290e036fb01057690b9.json": [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22] #5, 19, 22
}

def remove_all_files_in_folder(folder_path):
    if os.path.exists(folder_path) and os.path.isdir(folder_path):
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f'Failed to delete {file_path}. Reason: {e}')
    else:
        print(f'The folder {folder_path} does not exist or is not a directory.')

def get_test_files():
    return [
        (file, known_conditions_with_required_plan.get(file, []))
        for file in os.listdir("./tests/condition_jsons")
        if file.endswith('.json')
    ]

@pytest.fixture(scope="session", autouse=True)
def setup_environment():
    # remove_all_files_in_folder("./tests/condition_jsons_with_management_plans")
    extract_all_management_plans("./tests/condition_jsons", "./tests/condition_jsons_with_management_plans")

@pytest.mark.parametrize("file, expected_conditions", get_test_files())
def test_check_for_subconditions(file, expected_conditions, setup_environment):
    file_path = os.path.join("./tests/condition_jsons_with_management_plans", file)
    
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    actual_conditions_with_required_plan = [
        condition.get("condition_number")
        for condition in data.get("conditions", [])
        if "deliverables" in condition
    ]

    assert sorted(expected_conditions) == sorted(actual_conditions_with_required_plan), (
        f'File {file} failed. Expected: {expected_conditions}, Found: {actual_conditions_with_required_plan}'
    )

    if expected_conditions:
        print(f'File {file} passed with expected conditions having required_plan: {expected_conditions}')
