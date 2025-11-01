"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Lead {
  id: string;
  name: string;
  business_type: string;
  email: string;
  phone?: string;
  website?: string;
  location?: string;
  notes?: string;
  status: string;
  source?: string;
  contact_person?: string;
  last_contacted_at?: string;
  instagram?: string;
  created_at: string;
  updated_at: string;
}

interface LeadNote {
  id: string;
  note: string;
  created_at: string;
  created_by: string;
}

interface LeadEmail {
  id: string;
  template_name: string;
  subject: string;
  sent_at: string;
  status?: string;
  created_by?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  description?: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [addingLead, setAddingLead] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const [showBulkStatusDropdown, setShowBulkStatusDropdown] = useState(false);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [editLeadForm, setEditLeadForm] = useState<Partial<Lead>>({});
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  }>({ type: "success", message: "" });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadNotes, setLeadNotes] = useState<LeadNote[]>([]);
  const [leadEmails, setLeadEmails] = useState<LeadEmail[]>([]);
  const [newNote, setNewNote] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBusinessType, setFilterBusinessType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedInstagramText, setCopiedInstagramText] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    business_type: "surf_school",
    email: "",
    phone: "",
    website: "",
    location: "",
    notes: "",
    status: "new",
    source: "manual",
    contact_person: "",
    instagram: "",
  });
  const supabase = createClient();

  const showNotificationMessage = (type: "success" | "error", message: string, duration = 5000) => {
    setNotification({ type, message });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), duration);
  };

  const businessTypeLabels: Record<string, string> = {
    surf_school: "🏄 Surf-Schule",
    ski_school: "⛷️ Ski-Schule",
    sports_club: "⚽ Sportverein",
    event_organizer: "🎉 Event-Veranstalter",
    other: "📋 Sonstiges"
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    new: { label: "Neu", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" },
    contacted: { label: "Kontaktiert", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400" },
    interested: { label: "Interessiert", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" },
    negotiating: { label: "Verhandlung", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400" },
    converted: { label: "Kunde", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
    not_interested: { label: "Kein Interesse", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400" }
  };

  useEffect(() => {
    loadLeads();
    loadTemplates();
  }, []);

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error loading leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const toggleLeadSelection = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const toggleAllLeads = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(lead => lead.id)));
    }
  };

  const openLeadDetail = async (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
    
    // Load notes
    const { data: notes } = await supabase
      .from("lead_notes")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false });
    
    setLeadNotes(notes || []);
    
    // Load email history
    const { data: emails } = await supabase
      .from("lead_emails")
      .select("*")
      .eq("lead_id", lead.id)
      .order("sent_at", { ascending: false });
    
    setLeadEmails(emails || []);
  };

  const addNote = async () => {
    if (!selectedLead || !newNote.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("lead_notes")
        .insert({
          lead_id: selectedLead.id,
          note: newNote,
          created_by: user?.id
        });

      if (error) throw error;

      setNewNote("");
      showNotificationMessage("success", "📝 Notiz hinzugefügt");
      
      // Reload notes
      const { data: notes } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("lead_id", selectedLead.id)
        .order("created_at", { ascending: false });
      
      setLeadNotes(notes || []);
    } catch (error) {
      console.error("Error adding note:", error);
      showNotificationMessage("error", "❌ Fehler beim Hinzufügen der Notiz");
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;
      
      // Update local state for immediate feedback
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );
      
      // Update selected lead if open in detail modal
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
      
      setOpenStatusDropdown(null);
      showNotificationMessage("success", "✅ Status aktualisiert");
    } catch (error) {
      console.error("Error updating status:", error);
      showNotificationMessage("error", "❌ Fehler beim Aktualisieren");
    }
  };

  const updateBulkStatus = async (newStatus: string) => {
    if (selectedLeads.size === 0) return;
    
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .in("id", Array.from(selectedLeads));

      if (error) throw error;
      
      showNotificationMessage("success", `✅ ${selectedLeads.size} Lead(s) aktualisiert`);
      setSelectedLeads(new Set());
      loadLeads();
    } catch (error) {
      console.error("Error updating bulk status:", error);
      showNotificationMessage("error", "❌ Fehler beim Aktualisieren");
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm("Lead wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) return;
    
    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", leadId);

      if (error) throw error;
      
      showNotificationMessage("success", "🗑️ Lead gelöscht");
      setShowDetailModal(false);
      loadLeads();
    } catch (error) {
      console.error("Error deleting lead:", error);
      showNotificationMessage("error", "❌ Fehler beim Löschen");
    }
  };

  const deleteBulkLeads = async () => {
    if (selectedLeads.size === 0) return;
    if (!confirm(`${selectedLeads.size} Lead(s) wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return;
    
    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .in("id", Array.from(selectedLeads));

      if (error) throw error;
      
      showNotificationMessage("success", `🗑️ ${selectedLeads.size} Lead(s) gelöscht`);
      setSelectedLeads(new Set());
      loadLeads();
    } catch (error) {
      console.error("Error deleting leads:", error);
      showNotificationMessage("error", "❌ Fehler beim Löschen");
    }
  };

  const startEditingLead = () => {
    if (!selectedLead) return;
    setEditLeadForm({
      name: selectedLead.name,
      business_type: selectedLead.business_type,
      email: selectedLead.email,
      phone: selectedLead.phone || "",
      website: selectedLead.website || "",
      location: selectedLead.location || "",
      notes: selectedLead.notes || "",
      contact_person: selectedLead.contact_person || "",
      instagram: selectedLead.instagram || "",
    });
    setIsEditingLead(true);
  };

  const cancelEditingLead = () => {
    setIsEditingLead(false);
    setEditLeadForm({});
  };

  const saveLeadEdits = async () => {
    if (!selectedLead) return;
    
    try {
      const { error } = await supabase
        .from("leads")
        .update(editLeadForm)
        .eq("id", selectedLead.id);

      if (error) throw error;
      
      showNotificationMessage("success", "✅ Lead aktualisiert");
      setIsEditingLead(false);
      setSelectedLead({ ...selectedLead, ...editLeadForm } as Lead);
      loadLeads();
    } catch (error) {
      console.error("Error updating lead:", error);
      showNotificationMessage("error", "❌ Fehler beim Aktualisieren");
    }
  };

  const addLead = async () => {
    setAddingLead(true);
    try {
      const { error } = await supabase
        .from("leads")
        .insert(newLeadForm);

      if (error) throw error;

      showNotificationMessage("success", "✅ Lead erfolgreich hinzugefügt!");
      setShowAddModal(false);
      setNewLeadForm({
        name: "",
        business_type: "surf_school",
        email: "",
        phone: "",
        website: "",
        location: "",
        notes: "",
        status: "new",
        source: "manual",
        contact_person: "",
        instagram: "",
      });
      loadLeads();
    } catch (error: any) {
      console.error("Error adding lead:", error);
      showNotificationMessage("error", "❌ Fehler beim Hinzufügen: " + error.message);
    } finally {
      setAddingLead(false);
    }
  };

  const sendEmails = async () => {
    if (!selectedTemplate || selectedLeads.size === 0) return;

    setSendingEmail(true);
    const totalEmails = selectedLeads.size;
    const estimatedTime = Math.ceil(totalEmails * 0.55); // 550ms per email
    
    // Show progress notification (longer duration for more emails)
    showNotificationMessage("success", `📧 Versende ${totalEmails} E-Mail(s)... (ca. ${estimatedTime}s)`, Math.max(3000, estimatedTime * 1000));
    
    try {
      const response = await fetch("/api/admin/send-lead-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads),
          templateName: selectedTemplate,
        }),
      });

      if (!response.ok) throw new Error("Failed to send emails");

      const result = await response.json();
      
      const successCount = result.results?.filter((r: any) => r.success).length || 0;
      const failedCount = result.results?.filter((r: any) => !r.success).length || 0;
      
      if (failedCount > 0) {
        showNotificationMessage("error", `⚠️ ${successCount} erfolgreich, ${failedCount} fehlgeschlagen (Rate Limit?)`);
      } else {
        showNotificationMessage("success", `✅ Alle ${successCount} E-Mail(s) erfolgreich versendet!`);
      }
      
      setShowEmailModal(false);
      setSelectedLeads(new Set());
      setSelectedTemplate("");
      loadLeads();
    } catch (error) {
      console.error("Error sending emails:", error);
      showNotificationMessage("error", "❌ Fehler beim Versenden der E-Mails");
    } finally {
      setSendingEmail(false);
    }
  };

  const exportLeadsToCSV = () => {
    const headers = ["Name", "Business Type", "Email", "Phone", "Website", "Location", "Status", "Created At"];
    const rows = filteredLeads.map(lead => [
      lead.name,
      businessTypeLabels[lead.business_type] || lead.business_type,
      lead.email,
      lead.phone || "",
      lead.website || "",
      lead.location || "",
      statusLabels[lead.status]?.label || lead.status,
      new Date(lead.created_at).toLocaleDateString("de-DE")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getInstagramUrl = (lead: Lead) => {
    if (lead.instagram) {
      // Remove @ if present
      const handle = lead.instagram.replace(/^@/, "");
      return `https://www.instagram.com/${handle}/`;
    }
    // Fallback: try to search on Instagram (requires login)
    const searchQuery = encodeURIComponent(lead.name);
    return `https://www.instagram.com/explore/search/keyword/?q=${searchQuery}`;
  };

  const getInstagramMessage = (lead: Lead) => {
    return `Hallo ${lead.name}! 👋

Ich habe Sie über SportShots gefunden - die Plattform für Sportfotografie. Wir helfen Surf-Schulen, Ski-Schulen, Sportvereinen und Event-Veranstaltern dabei, ihre Teilnehmer mit professionellen Fotos zu begeistern.

Würden Sie sich vorstellen können, SportShots für Ihre Events zu nutzen? Gerne können wir telefonisch oder per E-Mail mehr Details besprechen.

Viele Grüße
SportShots Team`;
  };

  const copyInstagramText = async (lead: Lead) => {
    const text = getInstagramMessage(lead);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedInstagramText(true);
      showNotificationMessage("success", "📋 Instagram-Text kopiert!");
      setTimeout(() => setCopiedInstagramText(false), 2000);
    } catch (error) {
      showNotificationMessage("error", "❌ Fehler beim Kopieren");
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
    const matchesBusinessType = filterBusinessType === "all" || lead.business_type === filterBusinessType;
    const matchesSearch = searchTerm === "" || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesBusinessType && matchesSearch;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === "new").length,
    contacted: leads.filter(l => l.status === "contacted").length,
    converted: leads.filter(l => l.status === "converted").length,
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Lead Management
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Verwalte potenzielle Kunden und versende Marketing-E-Mails
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Gesamt
            </div>
            <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats.total}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Neu
            </div>
            <div className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.new}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Kontaktiert
            </div>
            <div className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
              {stats.contacted}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Kunden
            </div>
            <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.converted}
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Lead hinzufügen
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            disabled={selectedLeads.size === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📧 E-Mail senden ({selectedLeads.size})
          </button>
          
          {/* Bulk Actions */}
          {selectedLeads.size > 0 && (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowBulkStatusDropdown(!showBulkStatusDropdown)}
                  className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  🏷️ Status ändern ({selectedLeads.size})
                </button>
                
                {showBulkStatusDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowBulkStatusDropdown(false)}
                    />
                    <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-zinc-800 dark:ring-zinc-700">
                      <div className="py-1">
                        {Object.entries(statusLabels).map(([key, { label, color }]) => (
                          <button
                            key={key}
                            onClick={() => {
                              updateBulkStatus(key);
                              setShowBulkStatusDropdown(false);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
                          >
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
                              {label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <button
                onClick={deleteBulkLeads}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                🗑️ Löschen ({selectedLeads.size})
              </button>
            </>
          )}
          
          <button
            onClick={exportLeadsToCSV}
            disabled={filteredLeads.length === 0}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            📊 CSV Export ({filteredLeads.length})
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          >
            <option value="all">Alle Status</option>
            {Object.entries(statusLabels).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filterBusinessType}
            onChange={(e) => setFilterBusinessType(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          >
            <option value="all">Alle Typen</option>
            {Object.entries(businessTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Leads Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-zinc-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                      onChange={toggleAllLeads}
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Kontakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Erstellt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-800">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {lead.name}
                      </div>
                      {lead.location && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          📍 {lead.location}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                      {businessTypeLabels[lead.business_type] || lead.business_type}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-zinc-900 dark:text-zinc-50">
                        {lead.email}
                      </div>
                      {lead.phone && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {lead.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenStatusDropdown(openStatusDropdown === lead.id ? null : lead.id);
                          }}
                          className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2 text-xs font-semibold leading-5 transition-all hover:opacity-80 ${statusLabels[lead.status]?.color}`}
                        >
                          {statusLabels[lead.status]?.label}
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {openStatusDropdown === lead.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenStatusDropdown(null)}
                            />
                            <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-zinc-800 dark:ring-zinc-700">
                              <div className="py-1">
                                {Object.entries(statusLabels).map(([key, { label, color }]) => (
                                  <button
                                    key={key}
                                    onClick={() => updateLeadStatus(lead.id, key)}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                  >
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
                                      {label}
                                    </span>
                                    {lead.status === key && (
                                      <svg className="ml-auto h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(lead.created_at).toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openLeadDetail(lead)}
                        className="rounded-md bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredLeads.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              Keine Leads gefunden. Füge den ersten Lead hinzu!
            </p>
          </div>
        )}

        {/* Add Lead Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-zinc-800 max-h-[90vh] overflow-y-auto">
              <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Neuen Lead hinzufügen
              </h2>
              
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newLeadForm.name}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                      className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700"
                      placeholder="z.B. Surf School Fuerteventura"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Typ *
                    </label>
                    <select
                      value={newLeadForm.business_type}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, business_type: e.target.value })}
                      className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700"
                    >
                      {Object.entries(businessTypeLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      E-Mail *
                    </label>
                    <input
                      type="email"
                      value={newLeadForm.email}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                      className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700"
                      placeholder="info@example.com"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={newLeadForm.phone}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                      className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700"
                      placeholder="+34 123 456 789"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Website
                    </label>
                    <input
                      type="url"
                      value={newLeadForm.website}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, website: e.target.value })}
                      className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700"
                      placeholder="www.example.com"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Ort
                    </label>
                    <input
                      type="text"
                      value={newLeadForm.location}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, location: e.target.value })}
                      className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700"
                      placeholder="Fuerteventura, Spanien"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Kontaktperson
                    </label>
                    <input
                      type="text"
                      value={newLeadForm.contact_person}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, contact_person: e.target.value })}
                      className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700"
                      placeholder="Max Mustermann"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Instagram (ohne @)
                    </label>
                    <input
                      type="text"
                      value={newLeadForm.instagram}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, instagram: e.target.value.replace(/^@/, "") })}
                      className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700"
                      placeholder="z.B. surfschool_fuerte"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Notizen
                  </label>
                  <textarea
                    value={newLeadForm.notes}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700"
                    placeholder="Weitere Informationen..."
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={addingLead}
                  className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Abbrechen
                </button>
                <button
                  onClick={addLead}
                  disabled={!newLeadForm.name || !newLeadForm.email || addingLead}
                  className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {addingLead ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Wird hinzugefügt...
                    </span>
                  ) : (
                    "Lead hinzufügen"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Lead Detail Modal */}
      {showDetailModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between border-b border-zinc-200 pb-4 dark:border-zinc-700">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedLead.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {selectedLead.contact_person && `${selectedLead.contact_person} • `}
                  {businessTypeLabels[selectedLead.business_type] || selectedLead.business_type}
                </p>
                
                {/* Action Buttons */}
                {!isEditingLead && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={startEditingLead}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      ✏️ Bearbeiten
                    </button>
                    <button
                      onClick={() => deleteLead(selectedLead.id)}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    >
                      🗑️ Löschen
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setIsEditingLead(false);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left Column - Contact Info */}
              <div className="space-y-4">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                  <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    📞 Kontaktinformationen
                  </h3>
                  {isEditingLead ? (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Name *</label>
                        <input
                          type="text"
                          value={editLeadForm.name || ""}
                          onChange={(e) => setEditLeadForm({ ...editLeadForm, name: e.target.value })}
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Email *</label>
                        <input
                          type="email"
                          value={editLeadForm.email || ""}
                          onChange={(e) => setEditLeadForm({ ...editLeadForm, email: e.target.value })}
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Telefon</label>
                        <input
                          type="tel"
                          value={editLeadForm.phone || ""}
                          onChange={(e) => setEditLeadForm({ ...editLeadForm, phone: e.target.value })}
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Website</label>
                        <input
                          type="url"
                          value={editLeadForm.website || ""}
                          onChange={(e) => setEditLeadForm({ ...editLeadForm, website: e.target.value })}
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Standort</label>
                        <input
                          type="text"
                          value={editLeadForm.location || ""}
                          onChange={(e) => setEditLeadForm({ ...editLeadForm, location: e.target.value })}
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Kontaktperson</label>
                        <input
                          type="text"
                          value={editLeadForm.contact_person || ""}
                          onChange={(e) => setEditLeadForm({ ...editLeadForm, contact_person: e.target.value })}
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Instagram (ohne @)</label>
                        <input
                          type="text"
                          value={editLeadForm.instagram || ""}
                          onChange={(e) => setEditLeadForm({ ...editLeadForm, instagram: e.target.value.replace(/^@/, "") })}
                          placeholder="z.B. surfschool_fuerte"
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Business Type</label>
                        <select
                          value={editLeadForm.business_type || ""}
                          onChange={(e) => setEditLeadForm({ ...editLeadForm, business_type: e.target.value })}
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                        >
                          {Object.entries(businessTypeLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Notizen</label>
                        <textarea
                          value={editLeadForm.notes || ""}
                          onChange={(e) => setEditLeadForm({ ...editLeadForm, notes: e.target.value })}
                          rows={3}
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                        />
                      </div>
                      
                      {/* Save/Cancel Buttons */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={saveLeadEdits}
                          className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                          ✓ Speichern
                        </button>
                        <button
                          onClick={cancelEditingLead}
                          className="flex-1 rounded-md bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
                        >
                          ✕ Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">Email:</span>
                        <a href={`mailto:${selectedLead.email}`} className="ml-2 text-blue-600 hover:underline dark:text-blue-400">
                          {selectedLead.email}
                        </a>
                      </div>
                      {selectedLead.phone && (
                        <div>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">Telefon:</span>
                          <a href={`tel:${selectedLead.phone}`} className="ml-2 text-blue-600 hover:underline dark:text-blue-400">
                            {selectedLead.phone}
                          </a>
                        </div>
                      )}
                      {selectedLead.website && (
                        <div>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">Website:</span>
                          <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline dark:text-blue-400">
                            {selectedLead.website}
                          </a>
                        </div>
                      )}
                      {selectedLead.location && (
                        <div>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">Standort:</span>
                          <span className="ml-2 text-zinc-900 dark:text-zinc-100">{selectedLead.location}</span>
                        </div>
                      )}
                      {selectedLead.contact_person && (
                        <div>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">Kontaktperson:</span>
                          <span className="ml-2 text-zinc-900 dark:text-zinc-100">{selectedLead.contact_person}</span>
                        </div>
                      )}
                      {selectedLead.instagram && (
                        <div>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">Instagram:</span>
                          <a 
                            href={getInstagramUrl(selectedLead)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-pink-600 hover:underline dark:text-pink-400"
                          >
                            @{selectedLead.instagram.replace(/^@/, "")}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!isEditingLead && (
                  <>
                    {/* Status Update */}
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                      <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        📊 Status
                      </h3>
                      <select
                        value={selectedLead.status}
                        onChange={(e) => {
                          updateLeadStatus(selectedLead.id, e.target.value);
                          setSelectedLead({ ...selectedLead, status: e.target.value });
                        }}
                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                      >
                        <option value="new">🆕 Neu</option>
                        <option value="contacted">📧 Kontaktiert</option>
                        <option value="interested">💡 Interessiert</option>
                        <option value="negotiation">🤝 Verhandlung</option>
                        <option value="customer">✅ Kunde</option>
                        <option value="not_interested">❌ Nicht interessiert</option>
                      </select>
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        Erstellt: {new Date(selectedLead.created_at).toLocaleDateString("de-DE")}
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                      <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        ⚡ Quick Actions
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`mailto:${selectedLead.email}`}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          📧 E-Mail senden
                        </a>
                        {selectedLead.phone && (
                          <a
                            href={`tel:${selectedLead.phone}`}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                          >
                            📞 Anrufen
                          </a>
                        )}
                        {selectedLead.website && (
                          <a
                            href={selectedLead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
                          >
                            🌐 Website
                          </a>
                        )}
                        <a
                          href={getInstagramUrl(selectedLead)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md bg-pink-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-700"
                        >
                          {selectedLead.instagram ? `📷 @${selectedLead.instagram.replace(/^@/, "")}` : "📷 Instagram finden"}
                        </a>
                      </div>
                    </div>

                    {/* Instagram Text Template */}
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                      <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        💬 Instagram Nachricht
                      </h3>
                      <div className="rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                        <pre className="whitespace-pre-wrap font-sans text-xs">
{getInstagramMessage(selectedLead)}
                        </pre>
                      </div>
                      <button
                        onClick={() => copyInstagramText(selectedLead)}
                        className="mt-3 w-full rounded-md bg-pink-600 px-3 py-2 text-sm font-medium text-white hover:bg-pink-700"
                      >
                        {copiedInstagramText ? "✓ Kopiert!" : "📋 Text kopieren"}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column - Activity */}
              <div className="space-y-4">
                {/* Email History */}
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                  <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    📨 E-Mail Verlauf ({leadEmails.length})
                  </h3>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {leadEmails.length === 0 ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Noch keine E-Mails versendet
                      </p>
                    ) : (
                      leadEmails.map((email) => (
                        <div key={email.id} className="rounded border border-zinc-200 bg-white p-2 text-xs dark:border-zinc-600 dark:bg-zinc-800">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                {email.subject}
                              </div>
                              <div className="mt-1 text-zinc-500 dark:text-zinc-400">
                                {new Date(email.sent_at).toLocaleString("de-DE")}
                              </div>
                            </div>
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              email.status === "sent" 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                                : email.status === "rate_limited"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            }`}>
                              {email.status === "sent" ? "✓ Sent" : email.status === "rate_limited" ? "⏱ Rate Limit" : "✗ Failed"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                  <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    📝 Notizen ({leadNotes.length})
                  </h3>
                  
                  {/* Add Note Form */}
                  <div className="mb-3 flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addNote()}
                      placeholder="Neue Notiz hinzufügen..."
                      className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                    />
                    <button
                      onClick={addNote}
                      disabled={!newNote.trim()}
                      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      +
                    </button>
                  </div>

                  {/* Notes List */}
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {leadNotes.length === 0 ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Noch keine Notizen
                      </p>
                    ) : (
                      leadNotes.map((note) => (
                        <div key={note.id} className="rounded border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-600 dark:bg-zinc-800">
                          <p className="text-zinc-900 dark:text-zinc-100">{note.note}</p>
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(note.created_at).toLocaleString("de-DE")}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end border-t border-zinc-200 pt-4 dark:border-zinc-700">
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 dark:bg-zinc-800">
              <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                E-Mail an {selectedLeads.size} Lead(s) senden
              </h2>
              
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  E-Mail-Template auswählen
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700"
                >
                  <option value="">Bitte wählen...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.name}>
                      {template.description || template.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplate && (
                <div className="mb-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                  <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Vorschau (mit Daten vom ersten Lead):
                  </p>
                  <div className="rounded bg-zinc-50 p-3 dark:bg-zinc-800">
                    <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      Betreff:
                    </p>
                    <p className="mb-3 text-sm text-zinc-900 dark:text-zinc-100">
                      {(() => {
                        const template = templates.find(t => t.name === selectedTemplate);
                        const firstLead = leads.find(l => selectedLeads.has(l.id));
                        if (!template || !firstLead) return template?.subject || "";
                        return template.subject
                          .replace(/\{\{name\}\}/g, firstLead.name)
                          .replace(/\{\{company_name\}\}/g, firstLead.name);
                      })()}
                    </p>
                    <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      Nachricht:
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                      {(() => {
                        const template = templates.find(t => t.name === selectedTemplate);
                        const firstLead = leads.find(l => selectedLeads.has(l.id));
                        if (!template || !firstLead) return template?.body || "";
                        return template.body
                          .replace(/\{\{name\}\}/g, firstLead.name)
                          .replace(/\{\{email\}\}/g, firstLead.email)
                          .replace(/\{\{location\}\}/g, firstLead.location || "")
                          .replace(/\{\{company_name\}\}/g, firstLead.name);
                      })()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  disabled={sendingEmail}
                  className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Abbrechen
                </button>
                <button
                  onClick={sendEmails}
                  disabled={!selectedTemplate || sendingEmail}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Wird gesendet...
                    </span>
                  ) : (
                    "E-Mails senden"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
          <div className={`rounded-lg px-6 py-4 shadow-lg ${
            notification.type === "success" 
              ? "bg-green-600 text-white" 
              : "bg-red-600 text-white"
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-lg">{notification.type === "success" ? "✓" : "✕"}</span>
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

