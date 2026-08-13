import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as certificatesApi from "../../api/certificates";
import Card from "../../components/ui/Card";

export default function MyCertificates() {
  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["my-certificates"],
    queryFn: certificatesApi.myCertificates,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">My Certificates</h1>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : certificates.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-slate-500">
            No certificates yet — complete a course to earn one.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <Link
              key={cert.id}
              to={`/dashboard/certificates/${cert.id}`}
              className="card group block overflow-hidden transition hover:shadow-lg"
            >
              {/* Mini certificate preview */}
              <div className="relative mb-4 flex aspect-[1.414/1] flex-col items-center justify-center gap-1 rounded-lg border-2 border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 text-center">
                <span className="absolute left-2 top-2 text-brand-400">✦</span>
                <span className="absolute right-2 top-2 text-brand-400">✦</span>
                <span className="absolute bottom-2 left-2 text-brand-400">✦</span>
                <span className="absolute bottom-2 right-2 text-brand-400">✦</span>
                <span className="text-xl">🎓</span>
                <p className="font-serif text-xs font-bold uppercase tracking-widest text-brand-700">
                  Certificate of Completion
                </p>
                <p className="font-script text-2xl text-slate-700">{cert.student_name || "You"}</p>
              </div>

              <p className="truncate font-semibold text-slate-900">{cert.course_title || "Course"}</p>
              <p className="mt-1 text-xs text-slate-500">
                Issued {new Date(cert.issued_at).toLocaleDateString()}
              </p>
              <p className="mt-2 truncate rounded-md bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
                {cert.code}
              </p>
              <span className="mt-3 inline-block text-sm font-semibold text-brand group-hover:underline">
                View / print certificate →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
