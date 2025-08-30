import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const puzzleGames = [
  { id: 'sudoku', name: 'Sudoku', icon: '⚏', description: '9x9 sayı bulmacası', available: true },
  { id: 'kriptogram', name: 'Kriptogram', icon: '🔤', description: 'Şifreli kelime bulmacası', available: false },
  { id: 'gizli-kelime', name: 'Gizli Kelime', icon: '🔍', description: 'Kelime arama oyunu', available: false },
  { id: 'gruplanmis', name: 'Gruplanmış', icon: '📦', description: 'Kelime gruplandırma', available: false },
  { id: 'hashtag', name: 'Hashtag', icon: '#️⃣', description: 'Sosyal medya bulmacası', available: false },
  { id: 'capraz-bulmaca', name: 'Çapraz Bulmaca', icon: '✚', description: 'Klasik çapraz bulmaca', available: false },
  { id: 'mini-bulmaca', name: 'Mini Bulmaca', icon: '🔲', description: 'Küçük boyutlu bulmacalar', available: false },
  { id: 'parola', name: 'Parola', icon: '🔐', description: 'Şifre çözme oyunu', available: false },
  { id: 'cladder', name: 'Cladder', icon: '🪜', description: 'Kelime merdiveni', available: false },
  { id: 'kelime-arama', name: 'Kelime Arama', icon: '🔎', description: 'Harf karışıklığında kelime bulma', available: false },
  { id: 'isim-sehir', name: 'İsim Şehir', icon: '🏙️', description: 'Kategori oyunu', available: false },
  { id: 'tangle', name: 'Tangle', icon: '🌀', description: 'İp çözme bulmacası', available: false },
  { id: 'anygram', name: 'Anygram', icon: '🔄', description: 'Harf sıralam oyunu', available: false },
];

export default function MainMenu() {
  const router = useRouter();

  const handleGamePress = (gameId: string) => {
    if (gameId === 'sudoku') {
      router.push('/sudoku');
    } else {
      // Show coming soon message
      alert('Bu oyun henüz hazır değil. Yakında eklenecek!');
    }
  };

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧩 Puzzle Dayı</Text>
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={handleSettingsPress}
        >
          <Ionicons name="settings-outline" size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Games List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.gamesContainer}>
          <Text style={styles.sectionTitle}>Bulmaca Oyunları</Text>
          {puzzleGames.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[
                styles.gameCard,
                !game.available && styles.gameCardDisabled
              ]}
              onPress={() => handleGamePress(game.id)}
              disabled={!game.available}
            >
              <View style={styles.gameIconContainer}>
                <Text style={styles.gameIcon}>{game.icon}</Text>
              </View>
              <View style={styles.gameInfo}>
                <Text style={[
                  styles.gameName,
                  !game.available && styles.gameNameDisabled
                ]}>
                  {game.name}
                </Text>
                <Text style={[
                  styles.gameDescription,
                  !game.available && styles.gameDescriptionDisabled
                ]}>
                  {game.description}
                </Text>
              </View>
              <View style={styles.gameStatus}>
                {game.available ? (
                  <Ionicons name="chevron-forward" size={24} color="#4ecdc4" />
                ) : (
                  <Text style={styles.comingSoonText}>Yakında</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  gamesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  gameCardDisabled: {
    backgroundColor: '#1a1a2e',
    opacity: 0.6,
  },
  gameIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    borderRadius: 25,
    marginRight: 16,
  },
  gameIcon: {
    fontSize: 24,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  gameNameDisabled: {
    color: '#666',
  },
  gameDescription: {
    fontSize: 14,
    color: '#a8a8a8',
  },
  gameDescriptionDisabled: {
    color: '#555',
  },
  gameStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 20,
  },
});