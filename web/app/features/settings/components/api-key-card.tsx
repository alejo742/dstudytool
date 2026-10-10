import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, Eye, EyeOff, Key, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/shared/components/ui/button";
import { Input } from "~/shared/components/ui/input";
import { Field } from "~/shared/components/ui/field";
import { settingsApi } from "~/features/settings/services/settings-api";
import type { ApiKeyStatus } from "~/shared/types/domain";
import { Badge, StatusDot } from "~/shared/components/ui/badge";

export function ApiKeyCard() {
  const [status, setStatus] = useState<ApiKeyStatus | null>(null);
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    settingsApi.getKeyStatus().then(setStatus).catch(() =>
      setStatus({ configured: false, last_verified_at: null, masked_hint: null }),
    );
  }, []);

  const save = async () => {
    if (!key.trim()) return;
    setSaving(true);
    try {
      const next = await settingsApi.setKey(key.trim());
      setStatus(next);
      setKey("");
      toast.success(
        next.last_verified_at ? "Key saved and verified" : "Key saved",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save key");
    } finally {
      setSaving(false);
    }
  };

  const verify = async () => {
    setVerifying(true);
    try {
      const next = await settingsApi.verifyKey();
      setStatus(next);
      toast.success("Key verified");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const remove = async () => {
    if (!confirm("Remove your Dartmouth Chat API key?")) return;
    try {
      await settingsApi.removeKey();
      setStatus({ configured: false, last_verified_at: null, masked_hint: null });
      toast.success("Key removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove key");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-paper2 border-[1.5px] border-ink"
    >
      <header className="flex items-start justify-between gap-6 p-5 border-b border-ink flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Key size={16} className="text-ink2" />
            <h2 className="font-head font-bold text-2xl text-ink leading-none">
              Dartmouth Chat API key
            </h2>
          </div>
          <p className="text-ink2 max-w-md text-pretty mt-2">
            Required to generate practice material. Issued at your Dartmouth AI
            portal — your key never leaves this account.
          </p>
        </div>
        {status?.configured && (
          <Badge tone={status.last_verified_at ? "success" : "warning"}>
            <StatusDot tone={status.last_verified_at ? "success" : "warning"} />
            {status.last_verified_at ? "Verified" : "Unverified"}
          </Badge>
        )}
      </header>

      <div className="p-5">
        {status?.configured && (
          <div className="mb-5 p-4 bg-paper border border-rule flex items-center justify-between flex-wrap gap-3">
            <div className="min-w-0">
              <p className="eyebrow text-xs mb-1">Current key</p>
              <p className="font-mono text-sm text-ink truncate">
                {status.masked_hint ?? "sk-••••••••"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={verify}
                loading={verifying}
                iconLeft={<Check size={14} />}
              >
                Verify
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={remove}
                iconLeft={<Trash2 size={14} />}
              >
                Remove
              </Button>
            </div>
          </div>
        )}

        <Field
          label={status?.configured ? "Replace with a new key" : "Paste your key"}
          hint="Starts with sk- or similar."
        >
          {({ id }) => (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id={id}
                  type={showKey ? "text" : "password"}
                  placeholder="sk-••••••••••••••••••••••••••••"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center text-ink3 hover:text-ink hover:bg-hl-wash"
                  aria-label={showKey ? "Hide" : "Show"}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <Button onClick={save} loading={saving} disabled={!key.trim()}>
                Save
              </Button>
            </div>
          )}
        </Field>
      </div>
    </motion.section>
  );
}
