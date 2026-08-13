import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Overview from "./pages/dashboard/Overview";
import Courses from "./pages/dashboard/Courses";
import CourseDetail from "./pages/dashboard/CourseDetail";
import LessonView from "./pages/dashboard/LessonView";
import QuizTake from "./pages/dashboard/QuizTake";
import MyCourses from "./pages/dashboard/MyCourses";
import Users from "./pages/dashboard/Users";
import Donations from "./pages/dashboard/Donations";
import MyCertificates from "./pages/dashboard/MyCertificates";
import CertificateView from "./pages/dashboard/CertificateView";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="courses/:id/lesson/:lessonId" element={<LessonView />} />
        <Route path="courses/:id/quiz/:quizId" element={<QuizTake />} />
        <Route path="my-courses" element={<MyCourses />} />
        <Route path="donations" element={<Donations />} />
        <Route path="my-certificates" element={<MyCertificates />} />
        <Route path="certificates/:certId" element={<CertificateView />} />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={["head_admin"]}>
              <Users />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
