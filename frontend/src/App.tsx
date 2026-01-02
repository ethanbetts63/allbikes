import { Routes, Route } from 'react-router-dom';
import NavBar from './components/ui/NavBar';
import Footer from './components/ui/Footer';
import HomePage from './pages/HomePage';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;