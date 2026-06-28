import { Plus } from "lucide-react";
import welcomeScreenImg from "../../assets/welcomeScreen.webp";

interface WelcomeScreenProps {
  onAddConnection: () => void;
}

const PROVIDERS = ["AWS S3", "Cloudflare R2", "Backblaze B2", "MinIO", "Custom S3"];

/** Shown on first launch when no connections exist */
export default function WelcomeScreen({ onAddConnection }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 select-none bg-[var(--s3-window-bg)]">
      {/* ── Hero image ── */}
      <img
        src={welcomeScreenImg}
        alt=""
        draggable={false}
        className="w-96 h-auto mb-6 opacity-90 dark:opacity-80 pointer-events-none"
      />

      {/* ── Headline ── */}
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
        Welcome to S3 Explorer
      </h2>
      <p className="mt-2 text-sm text-gray-400 dark:text-gray-500 max-w-sm leading-relaxed">
        Connect your S3-compatible storage and manage files across providers from one place.
      </p>

      {/* ── CTA ── */}
      <button
        onClick={onAddConnection}
        className="
          mt-6 inline-flex items-center gap-2 px-5 py-2.5
          text-sm font-medium text-white bg-[var(--s3-accent-active)] rounded-lg
          hover:bg-[var(--s3-accent-hover)] active:bg-[var(--s3-accent-hover)]
          transition-colors shadow-sm cursor-pointer
        "
      >
        <Plus size={16} />
        Add Your First Connection
      </button>

      {/* ── Supported providers ── */}
      <div className="mt-6 flex items-center justify-center gap-3 flex-nowrap max-w-xl text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {PROVIDERS.map((provider, index) => (
          <span key={provider} className="inline-flex items-center gap-3">
            {index > 0 && <span className="opacity-50">•</span>}
            <span>{provider}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
