import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Lock, Star, Clock, Trophy } from 'lucide-react';
import CryptogramGame from './CryptogramGame';

const CryptogramLevels = () => {
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId] = useState('user_' + Math.random().toString(36).substr(2, 9)); // Simple user ID

  useEffect(() => {
    loadLevels();
    loadUserProgress();
  }, []);

  const loadLevels = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cryptogram/levels`);
      const data = await response.json();
      setLevels(data);
    } catch (error) {
      console.error('Failed to load levels:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cryptogram/progress/${userId}`);
      const data = await response.json();
      setUserProgress(data);
    } catch (error) {
      console.error('Failed to load user progress:', error);
    }
  };

  const initializeLevels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cryptogram/init-levels`, {
        method: 'POST'
      });
      const result = await response.json();
      console.log(result.message);
      await loadLevels();
    } catch (error) {
      console.error('Failed to initialize levels:', error);
    }
  };

  const getLevelProgress = (levelNum) => {
    return userProgress.find(p => p.level === levelNum);
  };

  const isLevelUnlocked = (levelNum) => {
    if (levelNum === 1) return true;
    const previousLevel = getLevelProgress(levelNum - 1);
    return previousLevel && previousLevel.is_completed;
  };

  const handleLevelComplete = async (levelNum, completionTime) => {
    const progress = {
      user_id: userId,
      level: levelNum,
      is_completed: true,
      completion_time: completionTime,
      completed_at: new Date().toISOString()
    };

    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cryptogram/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progress)
      });
      
      await loadUserProgress();
      setCurrentLevel(null);
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Kolay';
      case 'medium': return 'Orta';
      case 'hard': return 'Zor';
      case 'expert': return 'Uzman';
      default: return difficulty;
    }
  };

  const getCompletedLevelsCount = () => {
    return userProgress.filter(p => p.is_completed).length;
  };

  const getTotalStars = () => {
    return userProgress.reduce((total, p) => {
      if (!p.is_completed) return total;
      const level = levels.find(l => l.level === p.level);
      if (!level) return total;
      
      // Calculate stars based on completion time vs time limit
      const timeRatio = p.completion_time / level.time_limit;
      if (timeRatio <= 0.5) return total + 3; // 3 stars
      if (timeRatio <= 0.75) return total + 2; // 2 stars
      return total + 1; // 1 star
    }, 0);
  };

  if (currentLevel) {
    return (
      <CryptogramGame
        level={currentLevel}
        onComplete={handleLevelComplete}
        onBack={() => setCurrentLevel(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Seviyeler yükleniyor...</p>
      </div>
    );
  }

  if (levels.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Kriptogram Seviyeleri</h1>
          <p className="text-gray-600 mb-6">Henüz seviye bulunamadı. Seviyeleri başlatmak için aşağıdaki butona tıklayın.</p>
          <Button onClick={initializeLevels}>Seviyeleri Başlat</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">🔐 Kriptogram Meydan Okuma</h1>
        <p className="text-gray-600 mb-6">
          Şifreli metinleri çöz ve harf değiştirme tekniğini öğren!
        </p>
        
        {/* Stats */}
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold">{getCompletedLevelsCount()}</span>
            </div>
            <p className="text-sm text-gray-600">Tamamlanan Level</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold">{getTotalStars()}</span>
            </div>
            <p className="text-sm text-gray-600">Toplam Yıldız</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              {Math.round((getCompletedLevelsCount() / levels.length) * 100)}%
            </div>
            <p className="text-sm text-gray-600">İlerleme</p>
          </div>
        </div>
        
        <Progress value={(getCompletedLevelsCount() / levels.length) * 100} className="max-w-md mx-auto" />
      </div>

      {/* Difficulty Sections */}
      {['easy', 'medium', 'hard', 'expert'].map(difficulty => {
        const difficultyLevels = levels.filter(l => l.difficulty === difficulty);
        if (difficultyLevels.length === 0) return null;

        return (
          <div key={difficulty} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Badge className={getDifficultyColor(difficulty)}>
                {getDifficultyText(difficulty)}
              </Badge>
              <span className="text-lg font-normal text-gray-600">
                ({difficultyLevels.filter(l => getLevelProgress(l.level)?.is_completed).length}/{difficultyLevels.length} tamamlandı)
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {difficultyLevels.map(level => {
                const progress = getLevelProgress(level.level);
                const isUnlocked = isLevelUnlocked(level.level);
                const isCompleted = progress?.is_completed;

                return (
                  <Card 
                    key={level.id} 
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      !isUnlocked ? 'opacity-50' : ''
                    } ${isCompleted ? 'border-green-500 bg-green-50' : ''}`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span>Level {level.level}</span>
                        <div className="flex items-center gap-1">
                          {!isUnlocked && <Lock className="w-4 h-4 text-gray-400" />}
                          {isCompleted && (
                            <>
                              {/* Show stars based on completion time */}
                              {progress.completion_time && (() => {
                                const timeRatio = progress.completion_time / level.time_limit;
                                const stars = timeRatio <= 0.5 ? 3 : timeRatio <= 0.75 ? 2 : 1;
                                return Array(stars).fill(0).map((_, i) => (
                                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                                ));
                              })()}
                            </>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{Math.floor(level.time_limit / 60)} dakika</span>
                        </div>
                        
                        {isCompleted && progress.completion_time && (
                          <div className="text-sm text-green-600">
                            Tamamlanma: {Math.floor(progress.completion_time / 60)}:{(progress.completion_time % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                        
                        <Button 
                          className="w-full mt-3" 
                          onClick={() => setCurrentLevel(level)}
                          disabled={!isUnlocked}
                          variant={isCompleted ? "outline" : "default"}
                        >
                          {!isUnlocked ? 'Kilitli' : isCompleted ? 'Tekrar Oyna' : 'Oyna'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CryptogramLevels;