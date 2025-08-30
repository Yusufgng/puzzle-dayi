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


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Kriptogram Models
class CryptogramLevel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    level: int
    difficulty: str  # easy, medium, hard, expert
    original_text: str
    encrypted_text: str
    cipher_map: dict  # key mapping for encryption
    hint: Optional[str] = None
    time_limit: int = 600  # seconds
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CryptogramProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    level: int
    is_completed: bool = False
    current_solution: dict = {}  # user's current letter mappings
    completion_time: Optional[int] = None  # in seconds
    hints_used: int = 0
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class CryptogramSolution(BaseModel):
    level: int
    solution: dict  # letter mappings

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Kriptogram Routes
@api_router.get("/cryptogram/levels", response_model=List[CryptogramLevel])
async def get_cryptogram_levels():
    """Get all cryptogram levels"""
    levels = await db.cryptogram_levels.find().sort("level", 1).to_list(1000)
    return [CryptogramLevel(**level) for level in levels]

@api_router.get("/cryptogram/level/{level_num}", response_model=CryptogramLevel)
async def get_cryptogram_level(level_num: int):
    """Get specific cryptogram level"""
    level = await db.cryptogram_levels.find_one({"level": level_num})
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    return CryptogramLevel(**level)

@api_router.post("/cryptogram/progress")
async def save_cryptogram_progress(progress: CryptogramProgress):
    """Save user's progress on a cryptogram level"""
    # Update existing progress or create new
    existing = await db.cryptogram_progress.find_one({
        "user_id": progress.user_id,
        "level": progress.level
    })
    
    if existing:
        await db.cryptogram_progress.update_one(
            {"_id": existing["_id"]},
            {"$set": progress.dict(exclude={"id"})}
        )
    else:
        await db.cryptogram_progress.insert_one(progress.dict())
    
    return {"status": "success"}

@api_router.get("/cryptogram/progress/{user_id}")
async def get_user_progress(user_id: str):
    """Get user's progress across all levels"""
    progress = await db.cryptogram_progress.find({"user_id": user_id}).to_list(1000)
    return [CryptogramProgress(**p) for p in progress]

@api_router.post("/cryptogram/check-solution")
async def check_cryptogram_solution(solution: CryptogramSolution):
    """Check if the user's solution is correct"""
    level = await db.cryptogram_levels.find_one({"level": solution.level})
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    
    level_obj = CryptogramLevel(**level)
    is_correct = solution.solution == level_obj.cipher_map
    
    return {
        "is_correct": is_correct,
        "correct_mapping": level_obj.cipher_map if not is_correct else None
    }

@api_router.post("/cryptogram/init-levels")
async def initialize_cryptogram_levels():
    """Initialize cryptogram levels with sample data"""
    # Check if levels already exist
    existing_count = await db.cryptogram_levels.count_documents({})
    if existing_count > 0:
        return {"message": "Levels already initialized", "count": existing_count}
    
    # Turkish sample texts for cryptograms
    sample_texts = [
        # Easy levels (1-10)
        "MERHABA DUNYA",
        "BUGÜN HAVA ÇOK GÜZEL",
        "KITAP OKUMAK FAYDALIDIR",
        "SPOR YAPMAK SAĞLIKLIDIR",
        "MÜZIK DİNLEMEK KEYİFLİDIR",
        "BAHÇEDE ÇİÇEKLER AÇMIŞ",
        "KEDI EVE GELDİ",
        "OKULA GİTMEK LAZIM",
        "YEMEK PİŞİRMEK ZEVKLI",
        "ARKADAŞ OLMAK GÜZEL",
        
        # Medium levels (11-20)
        "HAYAT BİR MACERA GİBİ GEÇİP GİDER",
        "BİLGİ GÜÇ DEMEKTİR VE ÖĞRENMEKTİR",
        "DOSTLUK EN DEĞERLİ HAZINE SAYILIR",
        "SABIR VE AZIM HER ŞEYİN ÜSTESİNDEN GELİR",
        "GÜZEL GÜNLER HEP BERABER YAŞANIR",
        "UMUT HİÇBİR ZAMAN TÜKENMEYECEKTİR",
        "ÇALIŞKAN İNSAN HEP BAŞARILI OLUR",
        "DOĞA ANA HEPİMİZİN ORTAK EVİDİR",
        "SANAT RUHU BESLEYEN BİR BESİN KAYNAĞI",
        "SEVGİ VE SAYGI İLE DÜNYA DAHA GÜZEL",
        
        # Hard levels (21-30)
        "İNSAN YAŞADIĞI SÜRECE ÖĞRENMEYE VE GELİŞMEYE DEVAM ETMELİDİR",
        "BAŞARI SADECE ÇALIŞMAKLA DEĞİL AKILLI ÇALIŞMAKLA ELDE EDİLİR",
        "GERÇEK MUTLULUK İÇİMİZDEN GELEN BİR HİSSİR VE PAYLAŞTIKÇA ARTAR",
        "BİLİM VE TEKNOLOJİ İNSANLIĞIN GELECEK NESİLLERE ARMAĞANDIR",
        "KÜLTÜR VE SANAT BİR MİLLETİN AYNASI VE TAHİLİNİN GÖSTERGESİDİR",
        "ÇEVRE KORUMA BİLİNCİ GELECEK NESİLLERE KALACAK EN BÜYÜK MİRASTIR",
        "EĞİTİM SİSTEMİ BİR ÜLKENIN KALKINMASINDA EN ÖNEMLİ ETKEN SAYILIR",
        "TOPLUMSAL DAYANIŞMA VE YARDIMLAŞMA MEDENİYETİN TEMELİ OLUŞTURUR",
        "DİL VE KÜLTÜR KORUMA BİR MİLLETİN VAR OLMA MÜCADELESİNİN PARÇASIDIR",
        "BARIŞÇIL BİR DÜNYA İÇİN TÜM İNSANLAR BİRLİKTE ÇALIŞMALI VE SAVAŞMALDIR",
        
        # Expert levels (31-40)
        "FELSEFİ DÜŞÜNCE İNSANIN VARLIK SERÜVENİNDE EN DEĞERLİ REHBERLERDEN BİRİDİR VE HAYATIN ANLAM ARAYIŞINDA BİZE YOL GÖSTERİR",
        "PSİKOLOJİK SAĞLIK FİZİKSEL SAĞLIK KADAR ÖNEMLİDİR VE İNSANIN TOPLUMSAL İLİŞKİLERİNDE VE KİŞİSEL GELİŞİMİNDE TEMEL ROL OYNAR",
        "KÜRESEL İKLİM DEĞİŞİKLİĞİ GÜNÜMÜZün EN CİDDİ PROBLEMLERİNDEN BİRİ HALINE GELMİŞ VE ÇÖZÜMÜ TÜM İNSANLIĞIN ORTAK SORUMLULUĞUDUR",
        "YAPAY ZEKA VE OTOMASYON TEKNOLOJİLERİ ÇALIŞMA HAYATINI KÖKTEN DEĞİŞTİRMEKTE VE YENİ BECERİLER KAZANMAYI ZORUNLU HALE GETİRMEKTEDİR",
        "SOSYAL MEDYA VE DİJİTAL İLETİŞİM ARAÇLARI İNSAN İLİŞKİLERİNİ YENİDEN ŞEKİLLENDİRİRKEN AYNI ZAMANDA YENİ SORUNLAR DA YARATMAKTADIR",
        "BİYOETİK KONULARI MODERN TIP VE BİLİMİN GELİŞİMİ İLE BİRLİKTE DAHA KARMAŞIK HALE GELMİŞ VE ETİK KURULLARIN ROLÜNÜ ARTIRMAKTADIR",
        "UZAY ARAŞTIRMALARI VE KEŞİFLERİ İNSANLIĞIN EVREN HAKKINDAKİ BİLGİLERİNİ GENİŞLETMEKTE VE GELECEKTEKİ YAŞAMIMIZı ETKİLEYECEK BULUŞLARA YOL AÇMAKTADIR",
        "KÜLTÜRLERARASı DİYALOG VE ANLAYIŞ KÜRESEL BARIŞIN TESİSİNDE EN ÖNEMLİ FAKTÖRLERDEN BİRİ OLARAK KABUL EDİLMEKTE VE ÇATIŞMALARIN ÇÖZÜMÜNDE ROL OYNAMAKTADIR",
        "SÜRDÜRÜLEBİLİR KALKINMA HEDEFLERİ ÇEVRECİ YAKLAŞIMLAR VE EKONOMİK BÜYÜME ARASINDAKİ DENGEYİ KORUYARAK GELECEK NESİLLERE YAŞANIR BİR DÜNYA BIRAKMAYI AMAÇLAMAKTADIR",
        "İNSAN HAKLARI VE DEMOKRASİ PRENSİPLERİ KÜRESEL ÇAPta KABUL GÖREN EVRENSEL DEĞERLER HALİNE GELMİŞ OLSA DA FARKLI KÜLTÜRLER VE SİSTEMLER ARASINDA UYGULAMA FARKLILIKLARI YAŞANMAYA DEVAM ETMEKTEDİR"
    ]
    
    levels = []
    for i, text in enumerate(sample_texts, 1):
        # Determine difficulty based on level
        if i <= 10:
            difficulty = "easy"
            time_limit = 300  # 5 minutes
        elif i <= 20:
            difficulty = "medium"
            time_limit = 450  # 7.5 minutes
        elif i <= 30:
            difficulty = "hard"
            time_limit = 600  # 10 minutes
        else:
            difficulty = "expert"
            time_limit = 900  # 15 minutes
        
        # Create cipher mapping
        alphabet = "ABCÇDEFGĞHIİJKLMNOÖPQRSŞTUÜVWXYZ"
        shuffled = list(alphabet)
        random.Random(i * 42).shuffle(shuffled)  # Deterministic shuffle based on level
        cipher_map = dict(zip(alphabet, shuffled))
        
        # Encrypt text
        encrypted_text = ""
        for char in text:
            if char in cipher_map:
                encrypted_text += cipher_map[char]
            else:
                encrypted_text += char
        
        # Create hint (reveal 2-3 letters)
        revealed_letters = random.Random(i * 123).sample([k for k in cipher_map.keys() if k in text], min(3, len(set(text))))
        hint = f"İpucu: {', '.join([f'{k}={cipher_map[k]}' for k in revealed_letters])}"
        
        level = CryptogramLevel(
            level=i,
            difficulty=difficulty,
            original_text=text,
            encrypted_text=encrypted_text,
            cipher_map=cipher_map,
            hint=hint,
            time_limit=time_limit
        )
        levels.append(level.dict())
    
    # Insert levels into database
    await db.cryptogram_levels.insert_many(levels)
    
    return {"message": "Levels initialized successfully", "count": len(levels)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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