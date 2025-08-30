import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  Dimensions,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - 60) / 9; // Responsive cell size

interface SudokuGame {
  id: string;
  level: number;
  difficulty: string;
  puzzle: number[][];
}

export default function SudokuGame() {
  const [currentPuzzle, setCurrentPuzzle] = useState<SudokuGame | null>(null);
  const [gameGrid, setGameGrid] = useState<number[][]>([]);
  const [originalGrid, setOriginalGrid] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [level, setLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [movesCount, setMovesCount] = useState(0);
  const [cellAnimations, setCellAnimations] = useState<{[key: string]: 'correct' | 'incorrect' | null}>({});
  
  const router = useRouter();
  const params = useLocalSearchParams();

  // Load user progress on component mount
  useEffect(() => {
    const levelParam = params.level ? parseInt(params.level as string) : null;
    if (levelParam) {
      setLevel(levelParam);
      loadNewPuzzle(levelParam);
    } else {
      loadUserProgress();
    }
  }, [params.level]);

  const loadUserProgress = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/user/progress/sudoku`);
      const progress = await response.json();
      
      if (progress.highest_level > 1) {
        setLevel(progress.current_level || progress.highest_level - 1);
      }
      
      // Load the current level puzzle
      loadNewPuzzle(progress.current_level || 1);
    } catch (error) {
      console.error('Error loading progress:', error);
      loadNewPuzzle(1);
    }
  };

  const loadNewPuzzle = async (gameLevel: number) => {
    setIsLoading(true);
    try {
      // Start game session
      const sessionResponse = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/game/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: 'sudoku',
          level: gameLevel,
          difficulty: getDifficultyName(gameLevel)
        })
      });
      const sessionData = await sessionResponse.json();
      setSessionId(sessionData.session_id);

      // Get new puzzle
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/sudoku/new/${gameLevel}`);
      const puzzle = await response.json();
      
      setCurrentPuzzle(puzzle);
      setGameGrid(puzzle.puzzle.map((row: number[]) => [...row]));
      setOriginalGrid(puzzle.puzzle.map((row: number[]) => [...row]));
      setSelectedCell(null);
      setGameStartTime(new Date());
      setHintsUsed(0);
      setMovesCount(0);
    } catch (error) {
      console.error('Error loading puzzle:', error);
      Alert.alert('Hata', 'Yeni oyun yüklenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyName = (level: number) => {
    if (level <= 10) return 'kolay';
    if (level <= 20) return 'orta';
    if (level <= 30) return 'zor';
    return 'uzman';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'kolay': return '#4ecdc4';
      case 'orta': return '#ffd93d';
      case 'zor': return '#ff6b6b';
      case 'uzman': return '#a8e6cf';
      default: return '#4ecdc4';
    }
  };

  const handleCellPress = (row: number, col: number) => {
    // Don't allow editing original puzzle cells
    if (originalGrid[row][col] !== 0) return;
    
    setSelectedCell({ row, col });
    setShowNumberPad(true);
  };

  const handleNumberSelect = (number: number) => {
    if (!selectedCell) return;
    
    const newGrid = gameGrid.map(row => [...row]);
    
    if (number === 0) {
      // Clear cell
      newGrid[selectedCell.row][selectedCell.col] = 0;
    } else {
      // Set number
      newGrid[selectedCell.row][selectedCell.col] = number;
    }
    
    setGameGrid(newGrid);
    setMovesCount(prev => prev + 1);
    setShowNumberPad(false);
    setSelectedCell(null);
    
    // Check if puzzle is completed
    if (isPuzzleComplete(newGrid)) {
      handlePuzzleComplete();
    }
  };

  const isPuzzleComplete = (grid: number[][]) => {
    // Check if all cells are filled
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) return false;
      }
    }
    return true;
  };

  const handlePuzzleComplete = async () => {
    if (!currentPuzzle || !sessionId || !gameStartTime) return;

    try {
      // Validate solution
      const validateResponse = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/sudoku/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzle_id: currentPuzzle.id,
          solution: gameGrid
        })
      });
      const validation = await validateResponse.json();

      const timeTaken = Math.floor((new Date().getTime() - gameStartTime.getTime()) / 1000);

      // End game session
      await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/game/session/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          completed: validation.is_correct,
          moves_count: movesCount,
          hints_used: hintsUsed
        })
      });

      if (validation.is_correct) {
        // Update user progress
        await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/user/progress/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game_type: 'sudoku',
            level: level,
            time_taken: timeTaken
          })
        });

        Alert.alert(
          '🎉 Tebrikler!',
          `Bölüm ${level} tamamlandı!\n\nSüre: ${Math.floor(timeTaken / 60)}:${(timeTaken % 60).toString().padStart(2, '0')}\nHamle: ${movesCount}\nİpucu: ${hintsUsed}`,
          [
            { text: 'Sonraki Bölüm', onPress: () => nextLevel() },
            { text: 'Ana Menü', onPress: () => router.back() }
          ]
        );
      } else {
        Alert.alert('❌ Yanlış Çözüm', 'Çözümünüzü kontrol ediniz.');
      }
    } catch (error) {
      console.error('Error completing puzzle:', error);
    }
  };

  const nextLevel = () => {
    const newLevel = level + 1;
    setLevel(newLevel);
    loadNewPuzzle(newLevel);
  };

  const handleHint = async () => {
    if (!currentPuzzle || hintsUsed >= 3) {
      Alert.alert(
        'İpucu Sınırı',
        'Bu bölümde maksimum 3 ipucu kullanabilirsiniz.'
      );
      return;
    }

    try {
      // Get the correct solution from backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/sudoku/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzle_id: currentPuzzle.id,
          solution: gameGrid
        })
      });
      const validation = await response.json();
      
      if (validation.correct_solution) {
        const correctSolution = validation.correct_solution;
        
        // Find an empty cell that can be filled
        const emptyCells = [];
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            if (gameGrid[row][col] === 0 && originalGrid[row][col] === 0) {
              emptyCells.push({ row, col, value: correctSolution[row][col] });
            }
          }
        }
        
        if (emptyCells.length > 0) {
          // Randomly select an empty cell to fill
          const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
          
          const newGrid = gameGrid.map(row => [...row]);
          newGrid[randomCell.row][randomCell.col] = randomCell.value;
          
          setGameGrid(newGrid);
          setHintsUsed(prev => prev + 1);
          setMovesCount(prev => prev + 1);
          
          Alert.alert(
            '💡 İpucu Kullanıldı',
            `Satır ${randomCell.row + 1}, Sütun ${randomCell.col + 1} konumuna ${randomCell.value} sayısı yerleştirildi.\n\nKalan ipucu: ${2 - hintsUsed}`
          );
          
          // Check if puzzle is completed after hint
          if (isPuzzleComplete(newGrid)) {
            setTimeout(() => handlePuzzleComplete(), 500);
          }
        }
      }
    } catch (error) {
      console.error('Error getting hint:', error);
      Alert.alert('Hata', 'İpucu alınırken hata oluştu.');
    }
  };

  const handleValidateMove = () => {
    if (!currentPuzzle) return;

    let incorrectCells = 0;
    let emptyCells = 0;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (originalGrid[row][col] === 0) { // Only check user-filled cells
          if (gameGrid[row][col] === 0) {
            emptyCells++;
          } else {
            // Check if the number is valid in current position
            if (!isValidPlacement(gameGrid, row, col, gameGrid[row][col])) {
              incorrectCells++;
            }
          }
        }
      }
    }

    if (incorrectCells > 0) {
      Alert.alert(
        '⚠️ Hatalı Hamle',
        `${incorrectCells} adet hatalı sayı bulundu. Lütfen kontrol ediniz.`
      );
    } else if (emptyCells > 0) {
      Alert.alert(
        '✅ Doğru Yolda',
        `Şu ana kadar tüm hamleleriniz doğru! ${emptyCells} hücre daha doldurmanız gerekiyor.`
      );
    }
  };

  const isValidPlacement = (grid: number[][], row: number, col: number, num: number) => {
    // Check row
    for (let j = 0; j < 9; j++) {
      if (j !== col && grid[row][j] === num) {
        return false;
      }
    }
    
    // Check column
    for (let i = 0; i < 9; i++) {
      if (i !== row && grid[i][col] === num) {
        return false;
      }
    }
    
    // Check 3x3 box
    const startRow = 3 * Math.floor(row / 3);
    const startCol = 3 * Math.floor(col / 3);
    
    for (let i = startRow; i < startRow + 3; i++) {
      for (let j = startCol; j < startCol + 3; j++) {
        if ((i !== row || j !== col) && grid[i][j] === num) {
          return false;
        }
      }
    }
    
    return true;
  };

  const restartPuzzle = () => {
    Alert.alert(
      'Oyunu Yeniden Başlat',
      'Bu bölümü yeniden başlatmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Yeniden Başlat', onPress: () => loadNewPuzzle(level) }
      ]
    );
  };

  const getCellStyle = (row: number, col: number) => {
    const isOriginal = originalGrid[row][col] !== 0;
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const isInSameBox = selectedCell && 
      Math.floor(selectedCell.row / 3) === Math.floor(row / 3) &&
      Math.floor(selectedCell.col / 3) === Math.floor(col / 3);
    const isInSameRowOrCol = selectedCell && 
      (selectedCell.row === row || selectedCell.col === col);

    return [
      styles.cell,
      isOriginal && styles.originalCell,
      isSelected && styles.selectedCell,
      isInSameBox && !isSelected && styles.highlightedBox,
      isInSameRowOrCol && !isSelected && styles.highlightedRowCol,
      // Border styles for 3x3 boxes
      (row + 1) % 3 === 0 && row !== 8 && styles.bottomBorder,
      (col + 1) % 3 === 0 && col !== 8 && styles.rightBorder,
    ];
  };

  const renderGrid = () => {
    return (
      <View style={styles.gridContainer}>
        {gameGrid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <TouchableOpacity
                key={`${rowIndex}-${colIndex}`}
                style={getCellStyle(rowIndex, colIndex)}
                onPress={() => handleCellPress(rowIndex, colIndex)}
                disabled={originalGrid[rowIndex][colIndex] !== 0}
              >
                <Text style={[
                  styles.cellText,
                  originalGrid[rowIndex][colIndex] !== 0 ? styles.originalCellText : styles.userCellText
                ]}>
                  {cell !== 0 ? cell.toString() : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderNumberPad = () => (
    <Modal
      visible={showNumberPad}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowNumberPad(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.numberPadContainer}>
          <Text style={styles.numberPadTitle}>Sayı Seçin</Text>
          <View style={styles.numberGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
              <TouchableOpacity
                key={number}
                style={styles.numberButton}
                onPress={() => handleNumberSelect(number)}
              >
                <Text style={styles.numberButtonText}>{number}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.numberPadActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={() => handleNumberSelect(0)}
            >
              <Text style={styles.actionButtonText}>Temizle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => setShowNumberPad(false)}
            >
              <Text style={styles.actionButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yeni oyun yükleniyor...</Text>
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
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Sudoku</Text>
          <View style={styles.levelInfo}>
            <Text style={styles.levelText}>Bölüm {level}</Text>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentPuzzle?.difficulty || 'kolay') }]}>
              <Text style={styles.difficultyText}>{currentPuzzle?.difficulty?.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.restartButton} onPress={restartPuzzle}>
          <Ionicons name="refresh" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Game Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Hamle</Text>
          <Text style={styles.statValue}>{movesCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>İpucu</Text>
          <Text style={styles.statValue}>{hintsUsed}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Süre</Text>
          <Text style={styles.statValue}>
            {gameStartTime ? Math.floor((new Date().getTime() - gameStartTime.getTime()) / 60000) : 0}:
            {gameStartTime ? Math.floor(((new Date().getTime() - gameStartTime.getTime()) % 60000) / 1000).toString().padStart(2, '0') : '00'}
          </Text>
        </View>
      </View>

      {/* Sudoku Grid */}
      <View style={styles.gameContainer}>
        {renderGrid()}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionBtn, hintsUsed >= 3 && styles.disabledBtn]} 
          onPress={handleHint}
          disabled={hintsUsed >= 3}
        >
          <Ionicons name="help-circle-outline" size={24} color={hintsUsed >= 3 ? "#666" : "#4ecdc4"} />
          <Text style={[styles.actionBtnText, hintsUsed >= 3 && styles.disabledText]}>
            İpucu ({3 - hintsUsed})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleValidateMove}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#4ecdc4" />
          <Text style={styles.actionBtnText}>Kontrol Et</Text>
        </TouchableOpacity>
      </View>

      {renderNumberPad()}
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
  headerInfo: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 4,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelText: {
    fontSize: 14,
    color: '#a8a8a8',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  restartButton: {
    padding: 8,
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
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#a8a8a8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ecdc4',
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  gridContainer: {
    backgroundColor: '#16213e',
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2a3f5f',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#2a3f5f',
    backgroundColor: '#1a1a2e',
  },
  originalCell: {
    backgroundColor: '#0f3460',
  },
  selectedCell: {
    backgroundColor: '#4ecdc4',
  },
  highlightedBox: {
    backgroundColor: '#2a3f5f',
  },
  highlightedRowCol: {
    backgroundColor: '#222538',
  },
  bottomBorder: {
    borderBottomWidth: 2,
    borderBottomColor: '#4ecdc4',
  },
  rightBorder: {
    borderRightWidth: 2,
    borderRightColor: '#4ecdc4',
  },
  cellText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  originalCellText: {
    color: '#ffffff',
  },
  userCellText: {
    color: '#4ecdc4',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  actionBtn: {
    alignItems: 'center',
    padding: 12,
  },
  actionBtnText: {
    fontSize: 12,
    color: '#4ecdc4',
    marginTop: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberPadContainer: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 20,
    minWidth: 300,
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  numberPadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  numberButton: {
    width: 60,
    height: 60,
    backgroundColor: '#0f3460',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ecdc4',
  },
  numberPadActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#666',
  },
});