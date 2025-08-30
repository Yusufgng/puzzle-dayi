import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface UserProgress {
  current_level: number;
  completed_levels: number[];
  highest_level: number;
  total_games_played: number;
  total_time_played: number;
}

export default function SudokuLevels() {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUserProgress();
  }, []);

  const loadUserProgress = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/user/progress/sudoku`);
      const progress = await response.json();
      setUserProgress(progress);
    } catch (error) {
      console.error('Error loading progress:', error);
      Alert.alert('Hata', 'İlerleme bilgileri yüklenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyInfo = (level: number) => {
    if (level <= 10) {
      return { name: 'KOLAY', color: '#4ecdc4', icon: '😊' };
    } else if (level <= 20) {
      return { name: 'ORTA', color: '#ffd93d', icon: '🤔' };
    } else if (level <= 30) {
      return { name: 'ZOR', color: '#ff6b6b', icon: '😤' };
    } else {
      return { name: 'UZMAN', color: '#a8e6cf', icon: '🧠' };
    }
  };

  const handleLevelSelect = (level: number) => {
    if (!userProgress) return;
    
    // Check if level is unlocked
    if (level > userProgress.highest_level) {
      Alert.alert(
        'Bölüm Kilitli',
        `Bu bölümü oynayabilmek için önce ${level - 1}. bölümü tamamlamanız gerekiyor.`
      );
      return;
    }

    // Navigate to sudoku game with selected level
    router.push({
      pathname: '/sudoku',
      params: { level: level.toString() }
    });
  };

  const renderLevelGrid = () => {
    if (!userProgress) return null;

    const levels = [];
    const maxLevels = 40; // Show up to level 40

    for (let i = 1; i <= maxLevels; i++) {
      const isCompleted = userProgress.completed_levels.includes(i);
      const isUnlocked = i <= userProgress.highest_level;
      const isCurrent = i === userProgress.current_level;
      const difficulty = getDifficultyInfo(i);

      levels.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.levelCard,
            isCompleted && styles.completedLevel,
            isCurrent && styles.currentLevel,
            !isUnlocked && styles.lockedLevel
          ]}
          onPress={() => handleLevelSelect(i)}
          disabled={!isUnlocked}
        >
          <View style={styles.levelHeader}>
            <Text style={[
              styles.levelNumber,
              isCompleted && styles.completedLevelText,
              !isUnlocked && styles.lockedLevelText
            ]}>
              {i}
            </Text>
            {isCompleted && (
              <Ionicons name="checkmark-circle" size={16} color="#4ecdc4" />
            )}
            {!isUnlocked && (
              <Ionicons name="lock-closed" size={16} color="#666" />
            )}
          </View>
          
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: isUnlocked ? difficulty.color : '#444' }
          ]}>
            <Text style={styles.difficultyEmoji}>
              {isUnlocked ? difficulty.icon : '🔒'}
            </Text>
            <Text style={[
              styles.difficultyName,
              !isUnlocked && styles.lockedText
            ]}>
              {difficulty.name}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return levels;
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}s ${minutes}d`;
    }
    return `${minutes}d`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sudoku Bölümleri</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Stats */}
      {userProgress && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userProgress.completed_levels.length}</Text>
            <Text style={styles.statLabel}>Tamamlanan</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userProgress.highest_level - 1}</Text>
            <Text style={styles.statLabel}>Açılan Bölüm</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userProgress.total_games_played}</Text>
            <Text style={styles.statLabel}>Oyun Sayısı</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatTime(userProgress.total_time_played)}</Text>
            <Text style={styles.statLabel}>Toplam Süre</Text>
          </View>
        </View>
      )}

      {/* Difficulty Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Zorluk Seviyeleri</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4ecdc4' }]} />
            <Text style={styles.legendText}>1-10: Kolay</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ffd93d' }]} />
            <Text style={styles.legendText}>11-20: Orta</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ff6b6b' }]} />
            <Text style={styles.legendText}>21-30: Zor</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#a8e6cf' }]} />
            <Text style={styles.legendText}>31+: Uzman</Text>
          </View>
        </View>
      </View>

      {/* Levels Grid */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.levelsGrid}>
          {renderLevelGrid()}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  placeholder: {
    width: 44,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#16213e',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4ecdc4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#a8a8a8',
    textAlign: 'center',
  },
  legendContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#a8a8a8',
  },
  scrollView: {
    flex: 1,
  },
  levelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 8,
  },
  levelCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3f5f',
    marginBottom: 8,
  },
  completedLevel: {
    borderColor: '#4ecdc4',
    backgroundColor: '#1a4f48',
  },
  currentLevel: {
    borderColor: '#ff6b6b',
    borderWidth: 2,
  },
  lockedLevel: {
    backgroundColor: '#0d0d0d',
    borderColor: '#1a1a1a',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  completedLevelText: {
    color: '#4ecdc4',
  },
  lockedLevelText: {
    color: '#666',
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 50,
  },
  difficultyEmoji: {
    fontSize: 12,
    marginBottom: 2,
  },
  difficultyName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  lockedText: {
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
  },
  bottomSpacing: {
    height: 20,
  },
});