from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models for User Progress
class UserProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"  # For now, single user
    game_type: str
    current_level: int = 1
    completed_levels: List[int] = []
    highest_level: int = 1
    total_games_played: int = 0
    total_time_played: int = 0  # in seconds
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class GameSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"
    game_type: str
    level: int
    difficulty: str
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    completed: bool = False
    time_taken: Optional[int] = None  # in seconds
    moves_count: Optional[int] = None
    hints_used: int = 0

class SudokuPuzzle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    level: int
    difficulty: str
    puzzle: List[List[int]]  # 9x9 grid with 0 for empty cells
    solution: List[List[int]]  # 9x9 grid with complete solution
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Sudoku Generator Functions
def generate_complete_sudoku():
    """Generate a complete valid 9x9 Sudoku grid"""
    grid = [[0 for _ in range(9)] for _ in range(9)]
    
    def is_valid(grid, row, col, num):
        # Check row
        for j in range(9):
            if grid[row][j] == num:
                return False
        
        # Check column
        for i in range(9):
            if grid[i][col] == num:
                return False
        
        # Check 3x3 box
        start_row, start_col = 3 * (row // 3), 3 * (col // 3)
        for i in range(start_row, start_row + 3):
            for j in range(start_col, start_col + 3):
                if grid[i][j] == num:
                    return False
        
        return True
    
    def solve_sudoku(grid):
        for row in range(9):
            for col in range(9):
                if grid[row][col] == 0:
                    numbers = list(range(1, 10))
                    random.shuffle(numbers)
                    for num in numbers:
                        if is_valid(grid, row, col, num):
                            grid[row][col] = num
                            if solve_sudoku(grid):
                                return True
                            grid[row][col] = 0
                    return False
        return True
    
    solve_sudoku(grid)
    return grid

def create_puzzle_from_solution(solution, difficulty):
    """Create a puzzle by removing numbers from complete solution"""
    puzzle = [row[:] for row in solution]  # Deep copy
    
    # Difficulty settings (number of cells to remove)
    remove_counts = {
        'kolay': 40,      # Easy: remove 40 cells
        'orta': 50,       # Medium: remove 50 cells  
        'zor': 60,        # Hard: remove 60 cells
        'uzman': 65       # Expert: remove 65 cells
    }
    
    cells_to_remove = remove_counts.get(difficulty, 40)
    
    # Get all cell positions
    positions = [(i, j) for i in range(9) for j in range(9)]
    random.shuffle(positions)
    
    # Remove numbers from random positions
    for i in range(min(cells_to_remove, len(positions))):
        row, col = positions[i]
        puzzle[row][col] = 0
    
    return puzzle

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Puzzle Dayı API"}

@api_router.get("/sudoku/new/{level}")
async def get_new_sudoku(level: int):
    """Generate a new Sudoku puzzle for given level"""
    try:
        # Determine difficulty based on level
        if level <= 10:
            difficulty = 'kolay'
        elif level <= 20:
            difficulty = 'orta'
        elif level <= 30:
            difficulty = 'zor'
        else:
            difficulty = 'uzman'
        
        # Generate complete solution
        solution = generate_complete_sudoku()
        
        # Create puzzle by removing numbers
        puzzle = create_puzzle_from_solution(solution, difficulty)
        
        # Save to database
        sudoku_puzzle = SudokuPuzzle(
            level=level,
            difficulty=difficulty,
            puzzle=puzzle,
            solution=solution
        )
        
        await db.sudoku_puzzles.insert_one(sudoku_puzzle.dict())
        
        return {
            "id": sudoku_puzzle.id,
            "level": level,
            "difficulty": difficulty,
            "puzzle": puzzle
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/sudoku/validate")
async def validate_sudoku(data: dict):
    """Validate if the submitted Sudoku solution is correct"""
    try:
        puzzle_id = data.get("puzzle_id")
        user_solution = data.get("solution")
        
        # Get the original puzzle from database
        puzzle_doc = await db.sudoku_puzzles.find_one({"id": puzzle_id})
        if not puzzle_doc:
            raise HTTPException(status_code=404, detail="Puzzle not found")
        
        correct_solution = puzzle_doc["solution"]
        
        # Check if user solution matches correct solution
        is_correct = user_solution == correct_solution
        
        return {
            "is_correct": is_correct,
            "correct_solution": correct_solution if not is_correct else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/user/progress/{game_type}")
async def get_user_progress(game_type: str):
    """Get user progress for a specific game type"""
    try:
        progress = await db.user_progress.find_one({
            "user_id": "default_user",
            "game_type": game_type
        }, {"_id": 0})  # Exclude MongoDB _id field
        
        if not progress:
            # Create new progress record
            new_progress = UserProgress(game_type=game_type)
            await db.user_progress.insert_one(new_progress.dict())
            return new_progress.dict()
        
        return progress
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/user/progress/update")
async def update_user_progress(data: dict):
    """Update user progress after completing a level"""
    try:
        game_type = data.get("game_type")
        level_completed = data.get("level")
        time_taken = data.get("time_taken", 0)
        
        # Find existing progress
        progress = await db.user_progress.find_one({
            "user_id": "default_user",
            "game_type": game_type
        })
        
        if progress:
            # Update existing progress
            completed_levels = progress.get("completed_levels", [])
            if level_completed not in completed_levels:
                completed_levels.append(level_completed)
            
            highest_level = max(progress.get("highest_level", 1), level_completed + 1)
            total_games = progress.get("total_games_played", 0) + 1
            total_time = progress.get("total_time_played", 0) + time_taken
            
            await db.user_progress.update_one(
                {"user_id": "default_user", "game_type": game_type},
                {
                    "$set": {
                        "completed_levels": completed_levels,
                        "highest_level": highest_level,
                        "total_games_played": total_games,
                        "total_time_played": total_time,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        else:
            # Create new progress
            new_progress = UserProgress(
                game_type=game_type,
                completed_levels=[level_completed],
                highest_level=level_completed + 1,
                total_games_played=1,
                total_time_played=time_taken
            )
            await db.user_progress.insert_one(new_progress.dict())
        
        return {"success": True}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/game/session/start")
async def start_game_session(data: dict):
    """Start a new game session"""
    try:
        session = GameSession(
            game_type=data.get("game_type"),
            level=data.get("level"),
            difficulty=data.get("difficulty", "kolay")
        )
        
        await db.game_sessions.insert_one(session.dict())
        return {"session_id": session.id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/game/session/end")
async def end_game_session(data: dict):
    """End a game session"""
    try:
        session_id = data.get("session_id")
        completed = data.get("completed", False)
        moves_count = data.get("moves_count", 0)
        hints_used = data.get("hints_used", 0)
        
        end_time = datetime.utcnow()
        
        # Calculate time taken
        session = await db.game_sessions.find_one({"id": session_id})
        if session:
            start_time = session["start_time"]
            time_taken = int((end_time - start_time).total_seconds())
            
            await db.game_sessions.update_one(
                {"id": session_id},
                {
                    "$set": {
                        "end_time": end_time,
                        "completed": completed,
                        "time_taken": time_taken,
                        "moves_count": moves_count,
                        "hints_used": hints_used
                    }
                }
            )
            
            return {"success": True, "time_taken": time_taken}
        
        return {"success": False, "error": "Session not found"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()