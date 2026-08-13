import { useState } from "react";
import ResourcePreviewModal from "./ResourcePreviewModal";
import { toEmbeddableUrl } from "../utils/embed";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function ResourceItem({ resource }) {
  const { title, resource_type, kind, external_url, file_path } = resource;
  const [previewOpen, setPreviewOpen] = useState(false);

  if (resource_type === "external_link") {
    const embedUrl = toEmbeddableUrl(external_url);
    const isDirectVideoEmbed = kind === "video" && embedUrl !== external_url;

    return (
      <div className="rounded-lg border border-slate-200 p-3">
        <p className="mb-2 text-sm font-medium text-slate-800">{title}</p>
        {isDirectVideoEmbed ? (
          <div className="aspect-video w-full overflow-hidden rounded-md">
            <iframe
              src={embedUrl}
              title={title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <button type="button" onClick={() => setPreviewOpen(true)} className="btn-secondary">
            Open Resource
          </button>
        )}
        <ResourcePreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title={title}
          src={embedUrl}
          kind={kind}
        />
      </div>
    );
  }

  const fileUrl = `${API_BASE}/uploads/${file_path}`;

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="mb-2 text-sm font-medium text-slate-800">{title}</p>
      {kind === "image" ? (
        <img src={fileUrl} alt={title} className="max-h-64 w-full rounded-md object-contain" />
      ) : kind === "video" ? (
        <video controls className="w-full rounded-md">
          <source src={fileUrl} />
        </video>
      ) : (
        <button type="button" onClick={() => setPreviewOpen(true)} className="btn-secondary">
          Open Resource
        </button>
      )}
      <ResourcePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        src={fileUrl}
        kind={kind}
      />
    </div>
  );
}
