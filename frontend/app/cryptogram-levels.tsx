import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface UserProgress {
  completed_levels: number[];
  highest_level: number;
  total_games_played: number;
  total_time_played: number;
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export default function CryptogramLevels() {
  const router = useRouter();
  const [userProgress, setUserProgress] = useState<UserProgress>({
    completed_levels: [],
    highest_level: 1,
    total_games_played: 0,
    total_time_played: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProgress();
  }, []);

  const loadUserProgress = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/user/progress/kriptogram`);
      if (response.ok) {
        const progress = await response.json();
        setUserProgress(progress);
      }
    } catch (error) {
      console.error('Failed to load user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyInfo = (level: number) => {
    if (level <= 10) return { name: 'Kolay', color: '#4CAF50', bgColor: '#E8F5E8' };
    if (level <= 20) return { name: 'Orta', color: '#FF9800', bgColor: '#FFF3E0' };
    if (level <= 30) return { name: 'Zor', color: '#F44336', bgColor: '#FFEBEE' };
    return { name: 'Uzman', color: '#9C27B0', bgColor: '#F3E5F5' };
  };

  const isLevelUnlocked = (level: number) => {
    return level <= userProgress.highest_level;
  };

  const isLevelCompleted = (level: number) => {
    return userProgress.completed_levels.includes(level);
  };

  const handleLevelPress = (level: number) => {
    if (!isLevelUnlocked(level)) {
      Alert.alert('Seviye Kilitli', 'Bu seviyeyi açmak için önceki seviyeleri tamamlamanız gerekiyor.');
      return;
    }
    
    router.push(`/cryptogram?level=${level}`);
  };

  const handleBackPress = () => {
    router.push('/main-menu');
  };

  const renderLevelGrid = () => {
    const levels = [];
    for (let i = 1; i <= 40; i++) {
      const difficulty = getDifficultyInfo(i);
      const unlocked = isLevelUnlocked(i);
      const completed = isLevelCompleted(i);

      levels.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.levelCard,
            { borderColor: difficulty.color },
            !unlocked && styles.levelCardLocked,
            completed && styles.levelCardCompleted
          ]}
          onPress={() => handleLevelPress(i)}
          disabled={!unlocked}
        >
          <View style={styles.levelNumber}>
            <Text style={[
              styles.levelNumberText,
              !unlocked && styles.levelNumberTextLocked,
              completed && styles.levelNumberTextCompleted
            ]}>
              {i}
            </Text>
          </View>
          
          {!unlocked && (
            <Ionicons 
              name="lock-closed" 
              size={16} 
              color="#666" 
              style={styles.lockIcon} 
            />
          )}
          
          {completed && (
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color="#4CAF50" 
              style={styles.completedIcon} 
            />
          )}
          
          <Text style={[
            styles.difficultyText,
            { color: difficulty.color },
            !unlocked && styles.difficultyTextLocked
          ]}>
            {difficulty.name}
          </Text>
        </TouchableOpacity>
      );
    }
    return levels;
  };

  const getProgressStats = () => {
    const completedCount = userProgress.completed_levels.length;
    const totalLevels = 40;
    const progressPercentage = (completedCount / totalLevels) * 100;
    
    return {
      completedCount,
      totalLevels,
      progressPercentage: Math.round(progressPercentage)
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Seviyeler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stats = getProgressStats();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔤 Kriptogram</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.completedCount}</Text>
          <Text style={styles.statLabel}>Tamamlanan</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.progressPercentage}%</Text>
          <Text style={styles.statLabel}>İlerleme</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userProgress.total_games_played}</Text>
          <Text style={styles.statLabel}>Oynanan</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.levelsContainer}>
          <Text style={styles.sectionTitle}>Seviyeler</Text>
          <View style={styles.levelsGrid}>
            {renderLevelGrid()}
          </View>
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b6b',
    textAlign: 'center',
    marginLeft: -40, // Compensate for back button
  },
  headerSpacer: {
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#16213e',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ecdc4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#a8a8a8',
  },
  scrollView: {
    flex: 1,
  },
  levelsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
  },
  levelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  levelCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  levelCardLocked: {
    backgroundColor: '#1a1a2e',
    opacity: 0.6,
    borderColor: '#666',
  },
  levelCardCompleted: {
    backgroundColor: '#1B4D3E',
    borderColor: '#4CAF50',
  },
  levelNumber: {
    marginBottom: 4,
  },
  levelNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  levelNumberTextLocked: {
    color: '#666',
  },
  levelNumberTextCompleted: {
    color: '#4CAF50',
  },
  lockIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  completedIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  difficultyTextLocked: {
    color: '#666',
  },
  bottomSpacing: {
    height: 20,
  },
});