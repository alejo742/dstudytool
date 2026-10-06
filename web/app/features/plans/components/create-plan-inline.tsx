import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { Input } from "~/shared/components/ui/input";
import { Field } from "~/shared/components/ui/field";
import { plansApi } from "~/features/plans/services/plans-api";
import { toast } from "sonner";
import type { Plan } from "~/shared/types/domain";

export function CreatePlanInline({ onCreated }: { onCreated: (p: Plan) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const start = () => {
    setOpen(true);
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  const cancel = () => {
    setOpen(false);
    setTitle("");
    setCourse("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const plan = await plansApi.create({
        title: title.trim(),
        course_code: course.trim() || undefined,
      });
      toast.success("Plan created");
      onCreated(plan);
      cancel();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        {!open ? (
          <motion.div
            key="trigger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button onClick={start} iconLeft={<Plus size={14} />}>
              New plan
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={submit}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -2, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-[min(32rem,90vw)] bg-white border border-ink-200 rounded-lg shadow-xl p-5"
          >
            <h3 className="font-serif text-xl mb-4">New study plan</h3>
            <div className="flex gap-3">
              <Field label="Title" required className="flex-1">
                {({ id }) => (
                  <Input
                    ref={titleRef}
                    id={id}
                    placeholder="e.g. Multivariable Calculus"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                )}
              </Field>
              <Field label="Course code" className="w-28">
                {({ id }) => (
                  <Input
                    id={id}
                    placeholder="MATH 13"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                  />
                )}
              </Field>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={cancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={!title.trim()}
              >
                Create plan
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
