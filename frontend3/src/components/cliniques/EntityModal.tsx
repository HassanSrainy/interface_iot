// frontend3/src/components/cliniques/EntityModal.tsx
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

/**
 * Generic field descriptor (name is string to avoid keyof<T> inference issues).
 */
type FieldDef = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "textarea";
};

interface EntityModalProps {
  open: boolean;
  title: string;
  fields: FieldDef[];
  initialData?: Record<string, any>;
  onClose: () => void;
  onSave: (payload: Record<string, any>) => Promise<void>;
}

/**
 * Modal générique implémentée avec React.createElement (pas de JSX).
 * Retourne React.ReactElement pour éviter dépendance à namespace JSX.
 */
export function EntityModal({
  open,
  title,
  fields,
  initialData = {},
  onClose,
  onSave,
}: EntityModalProps): React.ReactElement {
  const [form, setForm] = useState<Record<string, any>>(initialData ?? {});

  useEffect(() => {
    setForm(initialData ?? {});
  }, [initialData, open]);

  const handleChange = (k: string, v: any) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const handleSubmit = async () => {
    await onSave(form);
    onClose();
  };

  const h = React.createElement;

  return h(
    Dialog,
    { open, onOpenChange: (openParam: boolean) => { if (!openParam) onClose(); } },
    h(
      DialogContent,
      null,
      h(
        DialogHeader,
        null,
        h(DialogTitle, null, title)
      ),
      h(
        "div",
        { className: "space-y-3 mt-2" },
        ...fields.map((f) =>
          h(
            "div",
            { key: f.name },
            h("label", { className: "block text-sm font-medium mb-1" }, f.label),
            f.type === "textarea"
              ? h("textarea", {
                  className: "w-full rounded-md border px-3 py-2",
                  placeholder: f.placeholder,
                  value: form[f.name] ?? "",
                  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(f.name, e.target.value),
                })
              : h(Input, {
                  placeholder: f.placeholder,
                  value: form[f.name] ?? "",
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(f.name, f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value),
                })
          )
        )
      ),
      h(
        "div",
        { className: "flex justify-end gap-2 mt-4" },
        h(Button, { variant: "outline", onClick: onClose }, "Annuler"),
        h(Button, { onClick: handleSubmit }, "Enregistrer")
      )
    )
  );
}

export default EntityModal;
