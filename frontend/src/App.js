import { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import CryptogramLevels from "./components/CryptogramLevels";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const helloWorldApi = async () => {
    try {
      const response = await axios.get(`${API}/`);
      console.log(response.data.message);
    } catch (e) {
      console.error(e, `errored out requesting / api`);
    }
  };

  useEffect(() => {
    helloWorldApi();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🧩 Puzzle Dayı
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Zihinsel becerilerinizi geliştirin ve eğlenceli puzzle oyunları oynayın!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Kriptogram Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                 onClick={() => window.location.href = '/cryptogram'}>
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-bold mb-2">Kriptogram</h3>
              <p className="text-gray-600 mb-4">
                Şifreli metinleri çöz ve harf değiştirme tekniğini öğren
              </p>
              <div className="text-sm text-blue-600">
                40 seviye • Zorluğa göre sıralı
              </div>
            </div>

            {/* Coming Soon Cards */}
            <div className="bg-white rounded-lg shadow-lg p-6 opacity-50">
              <div className="text-4xl mb-4">🔢</div>
              <h3 className="text-xl font-bold mb-2">Sudoku</h3>
              <p className="text-gray-600 mb-4">
                Sayıları doğru yerlere yerleştir
              </p>
              <div className="text-sm text-gray-400">
                Çok yakında...
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 opacity-50">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">Kelime Oyunu</h3>
              <p className="text-gray-600 mb-4">
                Harflerden kelimeler oluştur
              </p>
              <div className="text-sm text-gray-400">
                Çok yakında...
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-500">
          <p>Emergent AI tarafından geliştirilmiştir</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cryptogram" element={<CryptogramLevels />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
