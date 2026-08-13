import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as certificatesApi from "../../api/certificates";
import Button from "../../components/ui/Button";

export default function CertificateView() {
  const { certId } = useParams();

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["my-certificates"],
    queryFn: certificatesApi.myCertificates,
  });

  const cert = certificates.find((c) => String(c.id) === String(certId));

  if (isLoading) return <p className="text-sm text-slate-500">Loading certificate...</p>;

  if (!cert) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/my-certificates" className="text-sm font-medium text-brand hover:underline">
          ← Back to my certificates
        </Link>
        <p className="text-sm text-slate-500">Certificate not found.</p>
      </div>
    );
  }

  const issuedDate = new Date(cert.issued_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/dashboard/my-certificates" className="text-sm font-medium text-brand hover:underline">
          ← Back to my certificates
        </Link>
        <Button onClick={() => window.print()}>🖨️ Print / Save as PDF</Button>
      </div>

      <div className="overflow-x-auto pb-2">
        <div
          id="certificate-print-area"
          className="relative mx-auto aspect-[1.414/1] w-full min-w-[720px] max-w-4xl overflow-hidden bg-white p-3 shadow-2xl"
        >
          {/* Outer ornamental border */}
          <div className="relative flex h-full w-full flex-col items-center justify-between border-[3px] border-brand-700 p-8 text-center">
            <div className="absolute inset-2 border border-brand-100" />

            {/* Corner flourishes */}
            <span className="absolute left-3 top-3 text-2xl text-brand-500">✦</span>
            <span className="absolute right-3 top-3 text-2xl text-brand-500">✦</span>
            <span className="absolute bottom-3 left-3 text-2xl text-brand-500">✦</span>
            <span className="absolute bottom-3 right-3 text-2xl text-brand-500">✦</span>

            {/* Header */}
            <div className="relative z-10">
              <p className="text-2xl">🎓</p>
              <p className="mt-1 font-serif text-lg font-bold tracking-widest text-brand-700">
                {cert.org_name || "NGO LMS"}
              </p>
              <div className="mx-auto mt-3 h-px w-24 bg-brand-500" />
            </div>

            {/* Body */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-2 px-4">
              <p className="font-serif text-3xl font-bold uppercase tracking-wide text-slate-800 sm:text-4xl">
                Certificate of Completion
              </p>
              <p className="mt-4 text-sm uppercase tracking-widest text-slate-500">This is to certify that</p>
              <p className="font-script text-5xl leading-tight text-brand-700 sm:text-6xl">
                {cert.student_name || "Student"}
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                has successfully completed the course
              </p>
              <p className="font-serif text-xl font-semibold text-slate-800 sm:text-2xl">
                “{cert.course_title || "Course"}”
              </p>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex w-full items-end justify-between px-4 pt-6">
              <div className="text-left">
                <p className="font-script text-2xl text-slate-700">
                  {cert.issuer_name || "Program Director"}
                </p>
                <div className="mt-1 w-40 border-t border-slate-400" />
                <p className="mt-1 text-xs text-slate-500">Program Director</p>
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-400">Certificate No.</p>
                <p className="font-mono text-xs tracking-wider text-slate-600">{cert.code}</p>
              </div>

              <div className="text-right">
                <p className="text-sm text-slate-700">{issuedDate}</p>
                <div className="mt-1 w-40 border-t border-slate-400" />
                <p className="mt-1 text-xs text-slate-500">Date Issued</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 print:hidden">
        Anyone can verify this certificate's authenticity using code{" "}
        <span className="font-mono font-medium text-slate-600">{cert.code}</span>.
      </p>
    </div>
  );
}
