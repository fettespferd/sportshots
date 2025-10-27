"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    description: "",
    is_active: true,
  });
  const supabase = createClient();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      description: template.description || "",
      is_active: template.is_active,
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      subject: "",
      body: "",
      description: "",
      is_active: true,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from("email_templates")
          .update(formData)
          .eq("id", editingTemplate.id);

        if (error) throw error;
        alert("Template erfolgreich aktualisiert!");
      } else {
        // Create new template
        const { error } = await supabase
          .from("email_templates")
          .insert(formData);

        if (error) throw error;
        alert("Template erfolgreich erstellt!");
      }

      setShowModal(false);
      loadTemplates();
    } catch (error: any) {
      console.error("Error saving template:", error);
      alert("Fehler beim Speichern: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Möchtest du dieses Template wirklich löschen?")) return;

    try {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      alert("Template gelöscht!");
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Fehler beim Löschen");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              E-Mail Templates
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Verwalte deine E-Mail-Vorlagen für Lead-Kontaktierung
            </p>
          </div>
          <button
            onClick={handleNew}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Neues Template
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {template.description || template.name}
                    </h3>
                    {!template.is_active && (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        Inaktiv
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    ID: {template.name}
                  </p>
                </div>
              </div>

              <div className="mb-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Betreff:
                  </p>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                    {template.subject}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Inhalt:
                  </p>
                  <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {template.body}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl rounded-lg bg-white p-6 dark:bg-zinc-800 max-h-[90vh] overflow-y-auto">
              <h2 className="mb-6 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {editingTemplate ? "Template bearbeiten" : "Neues Template erstellen"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Template ID (für Code-Referenz)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!!editingTemplate}
                    className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700"
                    placeholder="z.B. surf_school_intro"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Beschreibung
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700"
                    placeholder="z.B. Erste Kontaktaufnahme für Surf-Schulen"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Betreff
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700"
                    placeholder="E-Mail Betreff"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Verfügbare Platzhalter: {'{{name}}'}, {'{{email}}'}, {'{{location}}'}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    E-Mail Inhalt
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    rows={12}
                    className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-700"
                    placeholder="E-Mail Text..."
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Verfügbare Platzhalter: {'{{name}}'}, {'{{email}}'}, {'{{location}}'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  <label htmlFor="is_active" className="text-sm text-zinc-700 dark:text-zinc-300">
                    Template ist aktiv
                  </label>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

