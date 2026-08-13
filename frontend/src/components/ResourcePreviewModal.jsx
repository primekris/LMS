import Modal from "./ui/Modal";

/**
 * Opens ANY resource (file or external link) inside an in-app modal window
 * instead of redirecting to a new tab. We always try to render it in an
 * iframe first. Some external sites block being framed (X-Frame-Options) —
 * that's outside our control, so we also show a small "Open in new tab"
 * fallback inside the same modal for those cases, but the default
 * experience stays in-app.
 */
export default function ResourcePreviewModal({ open, onClose, title, src, kind }) {
  return (
    <Modal open={open} onClose={onClose} title={title || "Preview"}>
      <div className="space-y-3">
        <div className={kind === "image" ? "" : "aspect-video w-full overflow-hidden rounded-md bg-slate-100"}>
          {kind === "image" ? (
            <img src={src} alt={title} className="max-h-[70vh] w-full rounded-md object-contain" />
          ) : (
            <iframe
              src={src}
              title={title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
        <p className="text-xs text-slate-400">
          Not loading?{" "}
          <a href={src} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
            Open in a new tab ↗
          </a>{" "}
          — some sites block being shown inside another page.
        </p>
      </div>
    </Modal>
  );
}
