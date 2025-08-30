import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface CryptogramPuzzle {
  id: string;
  level: number;
  difficulty: string;
  encrypted_text: string;
  hint_letters: string[];
  time_limit: number;
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export default function Cryptogram() {
  const router = useRouter();
  const { level } = useLocalSearchParams();
  const [puzzle, setPuzzle] = useState<CryptogramPuzzle | null>(null);
  const [userMapping, setUserMapping] = useState<{[key: string]: string}>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [hintMapping, setHintMapping] = useState<{[key: string]: string}>({});
  const [sessionId, setSessionId] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (level) {
      loadPuzzle(parseInt(level as string));
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [level]);

  useEffect(() => {
    if (timeLeft > 0 && !isCompleted) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && puzzle && !isCompleted) {
      handleTimeUp();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, isCompleted]);

  const loadPuzzle = async (levelNum: number) => {
    try {
      setLoading(true);
      
      // Start game session
      const sessionResponse = await fetch(`${BACKEND_URL}/api/game/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: 'kriptogram',
          level: levelNum,
          difficulty: getDifficultyName(levelNum)
        })
      });
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        setSessionId(sessionData.session_id);
      }
      
      // Load puzzle
      const response = await fetch(`${BACKEND_URL}/api/cryptogram/new/${levelNum}`);
      if (response.ok) {
        const puzzleData = await response.json();
        setPuzzle(puzzleData);
        setTimeLeft(puzzleData.time_limit);
        
        // Initialize user mapping with empty values
        const uniqueLetters = getUniqueLetters(puzzleData.encrypted_text);
        const initialMapping: {[key: string]: string} = {};
        uniqueLetters.forEach(letter => {
          initialMapping[letter] = '';
        });
        setUserMapping(initialMapping);
      } else {
        Alert.alert('Hata', 'Puzzle yüklenemedi. Lütfen tekrar deneyin.');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load puzzle:', error);
      Alert.alert('Hata', 'Bağlantı hatası. Lütfen tekrar deneyin.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyName = (level: number) => {
    if (level <= 10) return 'kolay';
    if (level <= 20) return 'orta';
    if (level <= 30) return 'zor';
    return 'uzman';
  };

  const getDifficultyInfo = (level: number) => {
    if (level <= 10) return { name: 'Kolay', color: '#4CAF50' };
    if (level <= 20) return { name: 'Orta', color: '#FF9800' };
    if (level <= 30) return { name: 'Zor', color: '#F44336' };
    return { name: 'Uzman', color: '#9C27B0' };
  };

  const getUniqueLetters = (text: string): string[] => {
    const letters = text.match(/[A-ZÇĞIİÖŞÜ]/g) || [];
    return [...new Set(letters)].sort();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDecodedText = (): string => {
    if (!puzzle) return '';
    return puzzle.encrypted_text.split('').map(char => {
      if (userMapping[char]) {
        return userMapping[char];
      }
      return char.match(/[A-ZÇĞIİÖŞÜ]/) ? '_' : char;
    }).join('');
  };

  const getCompletionPercentage = (): number => {
    if (!puzzle) return 0;
    const uniqueLetters = getUniqueLetters(puzzle.encrypted_text);
    const filledLetters = uniqueLetters.filter(letter => userMapping[letter] && userMapping[letter].trim() !== '');
    return Math.round((filledLetters.length / uniqueLetters.length) * 100);
  };

  const handleLetterChange = (encryptedLetter: string, originalLetter: string) => {
    setUserMapping(prev => ({
      ...prev,
      [encryptedLetter]: originalLetter.toUpperCase()
    }));
  };

  const handleCheckSolution = async () => {
    if (!puzzle) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/cryptogram/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzle_id: puzzle.id,
          mapping: userMapping
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.is_correct) {
          setIsCompleted(true);
          await handleLevelComplete();
          Alert.alert(
            'Tebrikler! 🎉',
            'Kriptogramı başarıyla çözdünüz!',
            [{ text: 'Devam Et', onPress: () => router.back() }]
          );
        } else {
          Alert.alert('Henüz Değil', 'Çözüm doğru değil. Tekrar deneyin!');
        }
      }
    } catch (error) {
      console.error('Failed to check solution:', error);
      Alert.alert('Hata', 'Çözüm kontrol edilemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleGetHint = async () => {
    if (!puzzle) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/cryptogram/hint/${puzzle.id}`);
      if (response.ok) {
        const hintData = await response.json();
        setHintMapping(hintData.hint_mapping);
        setShowHint(true);
        
        // Apply hint to user mapping
        setUserMapping(prev => ({
          ...prev,
          ...hintData.hint_mapping
        }));
      }
    } catch (error) {
      console.error('Failed to get hint:', error);
      Alert.alert('Hata', 'İpucu alınamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleLevelComplete = async () => {
    if (!puzzle || !sessionId) return;
    
    try {
      // End game session
      await fetch(`${BACKEND_URL}/api/game/session/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          completed: true,
          hints_used: showHint ? 1 : 0
        })
      });
      
      // Update user progress
      await fetch(`${BACKEND_URL}/api/user/progress/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: 'kriptogram',
          level: puzzle.level,
          time_taken: puzzle.time_limit - timeLeft
        })
      });
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleTimeUp = () => {
    Alert.alert(
      'Süre Doldu! ⏰',
      'Üzgünüz, süre doldu. Tekrar denemek ister misiniz?',
      [
        { text: 'Geri Dön', onPress: () => router.back() },
        { text: 'Tekrar Dene', onPress: () => loadPuzzle(parseInt(level as string)) }
      ]
    );
  };

  const handleBackPress = () => {
    Alert.alert(
      'Oyundan Çık',
      'Emin misiniz? İlerlemeniz kaybolacak.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çık', onPress: () => router.back() }
      ]
    );
  };

  if (loading || !puzzle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Puzzle yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const difficulty = getDifficultyInfo(puzzle.level);
  const uniqueLetters = getUniqueLetters(puzzle.encrypted_text);
  const completionPercentage = getCompletionPercentage();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Level {puzzle.level}</Text>
          <Text style={[styles.difficultyBadge, { color: difficulty.color }]}>
            {difficulty.name}
          </Text>
        </View>
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={16} color="#ffffff" />
          <Text style={[styles.timerText, timeLeft < 60 && styles.timerWarning]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>İlerleme: %{completionPercentage}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
          </View>
        </View>

        {/* Encrypted Text */}
        <View style={styles.textContainer}>
          <Text style={styles.sectionTitle}>Şifreli Metin</Text>
          <View style={styles.textBox}>
            <Text style={styles.encryptedText}>{puzzle.encrypted_text}</Text>
          </View>
        </View>

        {/* Decoded Text */}
        <View style={styles.textContainer}>
          <Text style={styles.sectionTitle}>Çözümünüz</Text>
          <View style={styles.textBox}>
            <Text style={styles.decodedText}>{getDecodedText()}</Text>
          </View>
        </View>

        {/* Letter Mapping */}
        <View style={styles.mappingContainer}>
          <Text style={styles.sectionTitle}>Harf Eşleştirme</Text>
          <View style={styles.mappingGrid}>
            {uniqueLetters.map(letter => (
              <View key={letter} style={styles.mappingItem}>
                <Text style={styles.encryptedLetter}>{letter}</Text>
                <Text style={styles.mappingArrow}>→</Text>
                <TextInput
                  style={[
                    styles.mappingInput,
                    hintMapping[letter] && styles.mappingInputHint
                  ]}
                  value={userMapping[letter] || ''}
                  onChangeText={(text) => handleLetterChange(letter, text)}
                  maxLength={1}
                  autoCapitalize="characters"
                  editable={!hintMapping[letter]}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.hintButton]}
            onPress={handleGetHint}
            disabled={showHint}
          >
            <Ionicons name="bulb-outline" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>
              {showHint ? 'İpucu Kullanıldı' : 'İpucu Al'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.checkButton]}
            onPress={handleCheckSolution}
            disabled={completionPercentage < 50} // Require at least 50% completion
          >
            <Ionicons name="checkmark-outline" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Kontrol Et</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  difficultyBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  timerWarning: {
    color: '#ff6b6b',
  },
  scrollView: {
    flex: 1,
  },
  progressContainer: {
    padding: 20,
  },
  progressText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ecdc4',
    borderRadius: 4,
  },
  textContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  textBox: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  encryptedText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'monospace',
  },
  decodedText: {
    color: '#4ecdc4',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'monospace',
  },
  mappingContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mappingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mappingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  encryptedLetter: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  mappingArrow: {
    color: '#666',
    fontSize: 14,
    marginHorizontal: 8,
  },
  mappingInput: {
    backgroundColor: '#0f3460',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 32,
    height: 32,
    borderRadius: 6,
    fontFamily: 'monospace',
  },
  mappingInputHint: {
    backgroundColor: '#4CAF50',
    color: '#ffffff',
  },
  buttonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  hintButton: {
    backgroundColor: '#FF9800',
  },
  checkButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});