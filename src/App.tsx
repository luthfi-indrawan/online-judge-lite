import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import ProblemWorkspace from "./pages/ProblemWorkspace";
import ScoreboardPage from "./pages/Scoreboard";
import AdminUsers from "./pages/AdminUsers";
import AdminGroups from "./pages/AdminGroups";
import AdminProblems from "./pages/AdminProblems";

function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-code">404</div>
      <h1>Halaman tidak ditemukan</h1>
      <p>Halaman yang kamu cari tidak tersedia atau sudah dipindahkan.</p>
      {/* Gunakan Link dari react-router-dom agar tidak full refresh */}
      <Link className="btn btn-primary" to="/">
        Kembali ke dashboard
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="groups" element={<Groups />} />
              <Route path="groups/:id" element={<GroupDetail />} />
              <Route path="problems/:id" element={<ProblemWorkspace />} />
              <Route path="scoreboards" element={<ScoreboardPage />} />
              <Route path="scoreboards/:groupId" element={<ScoreboardPage />} />

              <Route element={<ProtectedRoute adminOnly />}>
                <Route path="admin/users" element={<AdminUsers />} />
                <Route path="admin/groups" element={<AdminGroups />} />
                <Route path="admin/problems" element={<AdminProblems />} />
              </Route>
            </Route>
          </Route>

          {/* Pastikan route wildcard (*) selalu berada di dalam <Routes> */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
