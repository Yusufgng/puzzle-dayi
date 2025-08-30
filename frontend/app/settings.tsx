import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Settings() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.8);
  const [musicVolume, setMusicVolume] = useState(0.6);
  const router = useRouter();

  const handleBackPress = () => {
    router.back();
  };

  const renderVolumeControl = (volume: number, setVolume: (v: number) => void, enabled: boolean) => {
    const volumeOptions = [0.2, 0.4, 0.6, 0.8, 1.0];
    
    return (
      <View style={styles.volumeContainer}>
        {volumeOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.volumeButton,
              volume === option && enabled && styles.volumeButtonActive,
              !enabled && styles.volumeButtonDisabled
            ]}
            onPress={() => enabled && setVolume(option)}
            disabled={!enabled}
          >
            <Text style={[
              styles.volumeText,
              volume === option && enabled && styles.volumeTextActive,
              !enabled && styles.volumeTextDisabled
            ]}>
              {Math.round(option * 100)}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
        >
          <Ionicons name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Sound Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 Ses Ayarları</Text>
          
          {/* Sound Effects */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Ses Efektleri</Text>
              <Text style={styles.settingDescription}>Oyun ses efektlerini açar/kapatır</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#333', true: '#4ecdc4' }}
              thumbColor={soundEnabled ? '#ffffff' : '#666'}
            />
          </View>

          {/* Sound Volume */}
          <View style={styles.settingItem}>
            <Text style={styles.settingName}>Ses Seviyesi</Text>
            {renderVolumeControl(soundVolume, setSoundVolume, soundEnabled)}
          </View>
        </View>

        {/* Music Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎵 Müzik Ayarları</Text>
          
          {/* Background Music */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Arka Plan Müziği</Text>
              <Text style={styles.settingDescription}>Oyun müziğini açar/kapatır</Text>
            </View>
            <Switch
              value={musicEnabled}
              onValueChange={setMusicEnabled}
              trackColor={{ false: '#333', true: '#4ecdc4' }}
              thumbColor={musicEnabled ? '#ffffff' : '#666'}
            />
          </View>

          {/* Music Volume */}
          <View style={styles.settingItem}>
            <Text style={styles.settingName}>Müzik Seviyesi</Text>
            {renderVolumeControl(musicVolume, setMusicVolume, musicEnabled)}
          </View>
        </View>

        {/* Credits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍💻 Emeği Geçenler</Text>
          
          <View style={styles.creditsContainer}>
            <View style={styles.creditItem}>
              <Text style={styles.creditRole}>Geliştirici</Text>
              <Text style={styles.creditName}>F. Yusuf Güngör</Text>
            </View>
            
            <View style={styles.creditItem}>
              <Text style={styles.creditRole}>Tasarım & UI/UX</Text>
              <Text style={styles.creditName}>F. Yusuf Güngör</Text>
            </View>
            
            <View style={styles.creditItem}>
              <Text style={styles.creditRole}>Oyun Algoritmaları</Text>
              <Text style={styles.creditName}>F. Yusuf Güngör</Text>
            </View>
            
            <View style={styles.creditItem}>
              <Text style={styles.creditRole}>Backend Geliştirme</Text>
              <Text style={styles.creditName}>F. Yusuf Güngör</Text>
            </View>
            
            <View style={styles.creditItem}>
              <Text style={styles.creditRole}>Proje Yöneticisi</Text>
              <Text style={styles.creditName}>F. Yusuf Güngör</Text>
            </View>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Uygulama Bilgisi</Text>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Puzzle Dayı v1.0.0</Text>
            <Text style={styles.infoText}>© 2025 - Tüm hakları saklıdır</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  settingInfo: {
    marginBottom: 8,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#a8a8a8',
  },
  volumeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  volumeButton: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  volumeButtonActive: {
    backgroundColor: '#4ecdc4',
    borderColor: '#4ecdc4',
  },
  volumeButtonDisabled: {
    opacity: 0.3,
  },
  volumeText: {
    fontSize: 12,
    color: '#a8a8a8',
    fontWeight: '600',
  },
  volumeTextActive: {
    color: '#ffffff',
  },
  volumeTextDisabled: {
    color: '#555',
  },
  creditsContainer: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  creditItem: {
    marginBottom: 12,
  },
  creditRole: {
    fontSize: 14,
    color: '#a8a8a8',
    marginBottom: 4,
  },
  creditName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ecdc4',
  },
  infoContainer: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a3f5f',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#a8a8a8',
    marginBottom: 4,
  },
  bottomSpacing: {
    height: 20,
  },
});