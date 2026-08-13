import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as publicApi from "../api/public";

function Counter({ value, label }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-white sm:text-4xl">{value ?? "—"}</p>
      <p className="mt-1 text-sm text-white/70">{label}</p>
    </div>
  );
}

export default function Landing() {
  const { data: stats } = useQuery({ queryKey: ["public-stats"], queryFn: publicApi.publicStats });
  const { data: courses = [] } = useQuery({ queryKey: ["featured-courses"], queryFn: publicApi.featuredCourses });
  const { data: campaigns = [] } = useQuery({
    queryKey: ["featured-campaigns"],
    queryFn: publicApi.featuredCampaigns,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="font-semibold text-brand-dark">
            NGO <span className="text-brand">LMS</span>
          </span>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-secondary">
              Log in
            </Link>
            <Link to="/signup" className="btn-primary">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-brand-dark px-4 py-16 text-center sm:px-6 sm:py-24">
        <h1 className="mx-auto max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
          Learning that reaches <span className="text-brand-100">every community</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
          Free courses, certified skills, and community-funded impact — an NGO learning
          platform built for students, instructors, and donors alike.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/signup" className="btn-primary">
            Get started
          </Link>
          <Link to="/login" className="btn-secondary bg-white/10 !text-white hover:bg-white/20">
            I already have an account
          </Link>
        </div>

        {/* Live counters */}
        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
          <Counter value={stats?.total_students} label="Students" />
          <Counter value={stats?.total_courses} label="Courses" />
          <Counter value={stats?.total_instructors} label="Instructors" />
          <Counter value={stats?.total_certificates} label="Certificates issued" />
        </div>
      </section>

      {/* Featured courses */}
      {courses.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Latest courses</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <div key={c.id} className="card">
                <h3 className="font-semibold text-slate-900">{c.title}</h3>
                <Link to="/signup" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
                  Sign up to enroll →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured campaigns */}
      {campaigns.length > 0 && (
        <section className="bg-white px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Active donation campaigns</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {campaigns.map((c) => {
                const pct = c.goal_amount > 0 ? Math.min(100, Math.round((c.raised_amount / c.goal_amount) * 100)) : 0;
                return (
                  <div key={c.id} className="card">
                    <h3 className="font-semibold text-slate-900">{c.title}</h3>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-slate-500">
                        <span>${c.raised_amount.toLocaleString()}</span>
                        <span>${c.goal_amount.toLocaleString()}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <Link to="/signup" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
                      Donate as a donor →
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Why join */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="card text-center">
            <p className="text-2xl">📚</p>
            <h3 className="mt-2 font-semibold text-slate-900">Learn for free</h3>
            <p className="mt-1 text-sm text-slate-500">Courses, quizzes, and assignments built by real instructors.</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl">🎓</p>
            <h3 className="mt-2 font-semibold text-slate-900">Earn certificates</h3>
            <p className="mt-1 text-sm text-slate-500">Complete a course and get a verifiable certificate.</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl">❤️</p>
            <h3 className="mt-2 font-semibold text-slate-900">Support the mission</h3>
            <p className="mt-1 text-sm text-slate-500">Donors fund campaigns that keep learning free and open.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} NGO LMS. All rights reserved.
      </footer>
    </div>
  );
}
