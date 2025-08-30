import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function LoadingScreen() {
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [rotateAnim] = useState(new Animated.Value(0));
  const router = useRouter();

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Scale animation
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Continuous rotation for loading indicator
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    // Navigate to main menu after 3 seconds
    const timer = setTimeout(() => {
      setLoading(false);
      router.replace('/main-menu');
    }, 3000);

    return () => {
      clearTimeout(timer);
      rotateAnimation.stop();
    };
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Game Logo/Title */}
        <View style={styles.logoContainer}>
          <Text style={styles.gameTitle}>🧩</Text>
          <Text style={styles.gameName}>Puzzle Dayı</Text>
          <Text style={styles.subtitle}>Zihin Oyunları Koleksiyonu</Text>
        </View>

        {/* Loading Animation */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingSpinner,
              {
                transform: [{ rotate }]
              }
            ]}
          >
            <Text style={styles.spinnerText}>⟲</Text>
          </Animated.View>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  gameTitle: {
    fontSize: 80,
    marginBottom: 10,
  },
  gameName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a8a8a8',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  spinnerText: {
    fontSize: 40,
    color: '#4ecdc4',
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});