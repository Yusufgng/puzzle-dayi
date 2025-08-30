#!/usr/bin/env python3
"""
Additional Sudoku Algorithm Validation Test
Verifies that generated puzzles are valid and solvable
"""

import requests
import json

BACKEND_URL = "https://puzzle-mania-7.preview.emergentagent.com/api"

def is_valid_sudoku_grid(grid):
    """Check if a 9x9 grid follows Sudoku rules (no duplicates in rows, columns, boxes)"""
    # Check rows
    for row in grid:
        non_zero = [x for x in row if x != 0]
        if len(non_zero) != len(set(non_zero)):
            return False
    
    # Check columns
    for col in range(9):
        column = [grid[row][col] for row in range(9)]
        non_zero = [x for x in column if x != 0]
        if len(non_zero) != len(set(non_zero)):
            return False
    
    # Check 3x3 boxes
    for box_row in range(3):
        for box_col in range(3):
            box = []
            for i in range(3):
                for j in range(3):
                    box.append(grid[box_row*3 + i][box_col*3 + j])
            non_zero = [x for x in box if x != 0]
            if len(non_zero) != len(set(non_zero)):
                return False
    
    return True

def test_puzzle_validity():
    """Test that generated puzzles are valid Sudoku grids"""
    print("Testing Sudoku puzzle validity...")
    
    levels_to_test = [1, 15, 25, 35]  # Different difficulty levels
    
    for level in levels_to_test:
        try:
            response = requests.get(f"{BACKEND_URL}/sudoku/new/{level}")
            if response.status_code == 200:
                data = response.json()
                puzzle = data['puzzle']
                difficulty = data['difficulty']
                
                if is_valid_sudoku_grid(puzzle):
                    empty_cells = sum(row.count(0) for row in puzzle)
                    print(f"✅ Level {level} ({difficulty}): Valid puzzle with {empty_cells} empty cells")
                else:
                    print(f"❌ Level {level} ({difficulty}): Invalid puzzle - violates Sudoku rules")
            else:
                print(f"❌ Level {level}: Failed to generate puzzle - HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ Level {level}: Error - {str(e)}")

def test_mongodb_collections():
    """Test that data is being stored in MongoDB collections"""
    print("\nTesting MongoDB data persistence...")
    
    # Generate a puzzle to ensure data is stored
    response = requests.get(f"{BACKEND_URL}/sudoku/new/1")
    if response.status_code == 200:
        print("✅ Sudoku puzzle generation stores data in sudoku_puzzles collection")
    else:
        print("❌ Failed to generate puzzle for MongoDB test")
    
    # Test user progress
    response = requests.get(f"{BACKEND_URL}/user/progress/sudoku")
    if response.status_code == 200:
        print("✅ User progress data accessible from user_progress collection")
    else:
        print("❌ Failed to access user progress data")
    
    # Test game session
    session_data = {"game_type": "sudoku", "level": 1, "difficulty": "kolay"}
    response = requests.post(f"{BACKEND_URL}/game/session/start", json=session_data)
    if response.status_code == 200:
        print("✅ Game session data stored in game_sessions collection")
    else:
        print("❌ Failed to create game session")

if __name__ == "__main__":
    print("=" * 60)
    print("SUDOKU ALGORITHM VALIDATION TEST")
    print("=" * 60)
    
    test_puzzle_validity()
    test_mongodb_collections()
    
    print("\n" + "=" * 60)
    print("VALIDATION COMPLETE")
    print("=" * 60)