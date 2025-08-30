import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { AlertCircle, Clock, Lightbulb, RotateCcw, Check } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

const CryptogramGame = ({ level, onComplete, onBack }) => {
  const [userSolution, setUserSolution] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(level?.time_limit || 600);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [message, setMessage] = useState('');

  // Timer
  useEffect(() => {
    if (timeLeft > 0 && !isCompleted) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isCompleted]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get unique letters from encrypted text
  const getUniqueLetters = useCallback(() => {
    if (!level?.encrypted_text) return [];
    const letters = level.encrypted_text.match(/[A-ZÇĞIİÖŞÜ]/g) || [];
    return [...new Set(letters)].sort();
  }, [level?.encrypted_text]);

  // Handle letter mapping input
  const handleLetterChange = (encryptedLetter, originalLetter) => {
    setUserSolution(prev => ({
      ...prev,
      [encryptedLetter]: originalLetter.toUpperCase()
    }));
  };

  // Apply user's solution to display text
  const getDisplayText = () => {
    if (!level?.encrypted_text) return '';
    return level.encrypted_text.split('').map(char => {
      if (userSolution[char]) {
        return userSolution[char];
      }
      return char.match(/[A-ZÇĞIİÖŞÜ]/) ? '_' : char;
    }).join('');
  };

  // Check solution
  const checkSolution = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cryptogram/check-solution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: level.level,
          solution: userSolution
        })
      });

      const result = await response.json();
      
      if (result.is_correct) {
        setIsCompleted(true);
        setMessage('Tebrikler! Kriptogramı doğru çözdünüz!');
        const completionTime = level.time_limit - timeLeft;
        onComplete && onComplete(level.level, completionTime);
      } else {
        setMessage('Henüz doğru çözüm değil. Tekrar deneyin!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Solution check failed:', error);
      setMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Reset game
  const resetGame = () => {
    setUserSolution({});
    setShowHint(false);
    setTimeLeft(level?.time_limit || 600);
    setIsCompleted(false);
    setShowSolution(false);
    setMessage('');
  };

  // Show solution
  const revealSolution = () => {
    setUserSolution(level.cipher_map);
    setShowSolution(true);
    setMessage('Çözüm gösterildi!');
  };

  const uniqueLetters = getUniqueLetters();
  const progressPercentage = (Object.keys(userSolution).length / uniqueLetters.length) * 100;

  if (!level) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Level yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Kriptogram Level {level.level}</h1>
            <Badge variant={
              level.difficulty === 'easy' ? 'secondary' : 
              level.difficulty === 'medium' ? 'default' : 
              level.difficulty === 'hard' ? 'destructive' : 'destructive'
            }>
              {level.difficulty === 'easy' ? 'Kolay' :
               level.difficulty === 'medium' ? 'Orta' :
               level.difficulty === 'hard' ? 'Zor' : 'Uzman'}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className={`font-mono ${timeLeft < 60 ? 'text-red-500' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <Progress value={(timeLeft / level.time_limit) * 100} className="w-32" />
        </div>
      </div>

      {/* Message */}
      {message && (
        <Alert className={`mb-4 ${isCompleted ? 'border-green-500 bg-green-50' : ''}`}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Area */}
        <div className="space-y-4">
          {/* Encrypted Text Display */}
          <Card>
            <CardHeader>
              <CardTitle>Şifreli Metin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-lg leading-relaxed p-4 bg-gray-50 rounded border">
                {level.encrypted_text}
              </div>
            </CardContent>
          </Card>

          {/* User's Solution Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Çözümünüz
                <span className="text-sm font-normal">
                  %{Math.round(progressPercentage)} tamamlandı
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-lg leading-relaxed p-4 bg-blue-50 rounded border">
                {getDisplayText()}
              </div>
              <Progress value={progressPercentage} className="mt-2" />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={checkSolution} disabled={isCompleted || Object.keys(userSolution).length === 0}>
              <Check className="w-4 h-4 mr-2" />
              Kontrol Et
            </Button>
            <Button variant="outline" onClick={() => setShowHint(!showHint)}>
              <Lightbulb className="w-4 h-4 mr-2" />
              İpucu {showHint ? 'Gizle' : 'Göster'}
            </Button>
            <Button variant="outline" onClick={resetGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Sıfırla
            </Button>
            <Button variant="outline" onClick={revealSolution} disabled={isCompleted}>
              Çözümü Göster
            </Button>
          </div>

          {/* Hint */}
          {showHint && level.hint && (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>{level.hint}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Letter Mapping Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Harf Eşleştirme</CardTitle>
              <p className="text-sm text-gray-600">
                Her şifreli harfi gerçek harfle eşleştirin
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {uniqueLetters.map(letter => (
                  <div key={letter} className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center font-mono font-bold">
                      {letter}
                    </div>
                    <span>=</span>
                    <Input
                      type="text"
                      maxLength={1}
                      value={userSolution[letter] || ''}
                      onChange={(e) => handleLetterChange(letter, e.target.value)}
                      className="w-12 h-8 text-center font-mono font-bold uppercase"
                      disabled={isCompleted}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CryptogramGame;