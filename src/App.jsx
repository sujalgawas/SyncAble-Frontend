import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import { TimetableProvider } from "./context/TimetableContext";

function App() {
  return (
    <TimetableProvider>
      <Router>
        <Header />
        <main className="homepage">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </TimetableProvider>
  );
}

export default App;
