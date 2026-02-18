"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./Tracker.module.css";
import { supabase } from "../lib/supabaseClient";

const TEAM_MEMBERS = ["Haiqal", "Kase", "Taufik", "Chao Hao", "Rifqi"] as const;

const PERSON_COLORS: Record<string, { bg: string; class: string }> = {
  Haiqal: { bg: "#e74c3c", class: "haiqal" },
  Kase: { bg: "#9b59b6", class: "kase" },
  Taufik: { bg: "#f39c12", class: "taufik" },
  "Chao Hao": { bg: "#27ae60", class: "chaohao" },
  Rifqi: { bg: "#3498db", class: "rifqi" },
};

const DEFAULT_TEMPLATE = [
  {
    category: "MANPOWER PLANNING",
    items: [
      { name: "Appointment Holders (Neutral, Medic, Comds from other Coys)", daysOffset: -7 },
      { name: "Projected Strength Template", daysOffset: -5 },
    ],
  },
  {
    category: "SECURITY",
    items: [
      { name: "Camp Clearance", daysOffset: 0 },
      { name: "Armskote: Early WAC, DOO-to-DOO HOTO", daysOffset: 0 },
      {
        name: "Maps: Physical, Self-constructed/Stitched Map, AO size, Drawing of Blue and Red Plans with Report Lines",
        daysOffset: 0,
      },
    ],
  },
  {
    category: "SMARTO - Signals",
    items: [{ name: "Signals: 650, 947, configurations", daysOffset: -14 }],
  },
  {
    category: "SMARTO - Medical",
    items: [{ name: "Medical: medic support, medic supplies, emcool management", daysOffset: -7 }],
  },
  {
    category: "SMARTO - Ammo",
    items: [
      {
        name: "Ammo: indent, ammo voucher and pin, ammo vehicle (confirm if with TO), ammo collection time, ammo assistants",
        daysOffset: -21,
      },
    ],
  },
  {
    category: "SMARTO - Ration",
    items: [
      {
        name: "Ration: Indents, Outration vs. Dine-in, Ration Transfer, Quantity sufficient for trainers, attachments, transport staff, appointment holders",
        daysOffset: -14,
      },
    ],
  },
  {
    category: "SMARTO - Transport",
    items: [{ name: "Transport: Civilian (Buses) and Military indents (SOUV, 5-Ton, Ammo LUV)", daysOffset: -28 }],
  },
  {
    category: "SMARTO - Others",
    items: [
      { name: "Others: Special-to-type equipment, recce date, ATMS management (NR upload, TSP creation, verify correct TSP)", daysOffset: 0 },
    ],
  },
  {
    category: "COORDINATING INSTRUCTIONS",
    items: [
      { name: "Critical Events Timetable", daysOffset: -3 },
      { name: "Store List", daysOffset: -3 },
      { name: "Conducting Checklist and Move-out Items", daysOffset: -3 },
      { name: "Gear, Attire, Packing List", daysOffset: -3 },
    ],
  },
] as const;

type ChecklistItem = {
  id: string;
  name: string;
  category: string;
  deadline: string; // YYYY-MM-DD
  completed: boolean;
};

type Conduct = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  assignedTo: string | null;
  checklist: ChecklistItem[];
};

function calculateDeadline(conductDate: string, daysOffset: number) {
  const d = new Date(conductDate);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split("T")[0];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDeadlineStatus(deadline: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "urgent";
  return "normal";
}

export default function Tracker() {
  const [conducts, setConducts] = useState<Conduct[]>([]);
  const [selectedConduct, setSelectedConduct] = useState<Conduct | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newConductName, setNewConductName] = useState("");
  const [newConductDate, setNewConductDate] = useState("");
  const [newConductAssignedTo, setNewConductAssignedTo] = useState("");

  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("MANPOWER PLANNING");
  const [newItemDeadline, setNewItemDeadline] = useState("");

  const categories = useMemo(
    () => [
      "MANPOWER PLANNING",
      "SECURITY",
      "SMARTO - Signals",
      "SMARTO - Medical",
      "SMARTO - Ammo",
      "SMARTO - Ration",
      "SMARTO - Transport",
      "SMARTO - Others",
      "COORDINATING INSTRUCTIONS",
    ],
    []
  );

  const fetchAll = async () => {
    const { data: conductsRows, error: cErr } = await supabase
      .from("conducts")
      .select("*")
      .order("conduct_date", { ascending: true });

    if (cErr) throw cErr;

    const { data: itemsRows, error: iErr } = await supabase
      .from("checklist_items")
      .select("*");

    if (iErr) throw iErr;

    const itemsByConduct = new Map<string, ChecklistItem[]>();
    for (const row of itemsRows ?? []) {
      const item: ChecklistItem = {
        id: row.id,
        name: row.name,
        category: row.category,
        deadline: row.deadline,
        completed: row.completed,
      };
      const arr = itemsByConduct.get(row.conduct_id) ?? [];
      arr.push(item);
      itemsByConduct.set(row.conduct_id, arr);
    }

    const mapped: Conduct[] = (conductsRows ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      date: r.conduct_date,
      assignedTo: r.assigned_to,
      checklist: itemsByConduct.get(r.id) ?? [],
    }));

    setConducts(mapped);

    // keep selected conduct fresh
    if (selectedConduct) {
      const refreshed = mapped.find((c) => c.id === selectedConduct.id) ?? null;
      setSelectedConduct(refreshed);
    }
  };

  useEffect(() => {
    fetchAll().catch(console.error);
    // Later upgrade: add Supabase Realtime subscriptions here
    // so everyone sees updates instantly.
    // For now, we refetch after every mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createConduct = async () => {
    if (!newConductName || !newConductDate) return;

    const { data: conductRow, error: cErr } = await supabase
      .from("conducts")
      .insert({
        name: newConductName,
        conduct_date: newConductDate,
        assigned_to: newConductAssignedTo || null,
      })
      .select()
      .single();

if (cErr) {
  alert("Conduct insert failed: " + cErr.message);
  console.error(cErr);
  return;
}
 
    const itemsToInsert = DEFAULT_TEMPLATE.flatMap((cat) =>
      cat.items.map((it) => ({
        conduct_id: conductRow.id,
        name: it.name,
        category: cat.category,
        deadline: calculateDeadline(newConductDate, it.daysOffset),
        completed: false,
      }))
    );

    const { error: iErr } = await supabase.from("checklist_items").insert(itemsToInsert);
    if (iErr) {
      console.error(iErr);
      return;
    }

    setNewConductName("");
    setNewConductDate("");
    setNewConductAssignedTo("");
    setIsCreating(false);

    await fetchAll();
  };

  const deleteConduct = async (id: string) => {
    if (!window.confirm("Delete this conduct?")) return;

    const { error } = await supabase.from("conducts").delete().eq("id", id);
    if (error) {
      console.error(error);
      return;
    }

    setSelectedConduct(null);
    await fetchAll();
  };

  const toggleItem = async (itemId: string, completed: boolean) => {
    const { error } = await supabase
      .from("checklist_items")
      .update({ completed: !completed })
      .eq("id", itemId);

    if (error) {
      console.error(error);
      return;
    }

    await fetchAll();
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase.from("checklist_items").delete().eq("id", itemId);
    if (error) {
      console.error(error);
      return;
    }
    await fetchAll();
  };

  const addItem = async (conductId: string) => {
    if (!newItemName || !newItemDeadline) return;

    const { error } = await supabase.from("checklist_items").insert({
      conduct_id: conductId,
      name: newItemName,
      category: newItemCategory,
      deadline: newItemDeadline,
      completed: false,
    });

    if (error) {
      console.error(error);
      return;
    }

    setNewItemName("");
    setNewItemDeadline("");
    await fetchAll();
  };

  const getProgress = (conduct: Conduct) => {
    const completed = conduct.checklist.filter((i) => i.completed).length;
    const total = conduct.checklist.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const groupByCategory = (checklist: ChecklistItem[]) => {
    const grouped: Record<string, ChecklistItem[]> = {};
    checklist.forEach((item) => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });
    return grouped;
  };

  const sortedConducts = useMemo(() => {
    return [...conducts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [conducts]);

  const getPersonClass = (assignedTo: string | null) => {
    if (!assignedTo) return "";
    switch (assignedTo) {
      case "Haiqal":
        return styles.assignedHaiqal;
      case "Kase":
        return styles.assignedKase;
      case "Taufik":
        return styles.assignedTaufik;
      case "Chao Hao":
        return styles.assignedChaoHao;
      case "Rifqi":
        return styles.assignedRifqi;
      default:
        return "";
    }
  };

  const getBadgeClass = (assignedTo: string | null) => {
    if (!assignedTo) return "";
    switch (assignedTo) {
      case "Haiqal":
        return styles.badgeHaiqal;
      case "Kase":
        return styles.badgeKase;
      case "Taufik":
        return styles.badgeTaufik;
      case "Chao Hao":
        return styles.badgeChaoHao;
      case "Rifqi":
        return styles.badgeRifqi;
      default:
        return "";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Alpha Conduct Tracker</h1>
        <p>Manage your conducts and track progress. True &amp; Trusted!</p>
        <button className={styles.newConductBtn} onClick={() => setIsCreating(true)}>
          + New Conduct
        </button>
      </div>

      {sortedConducts.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No conducts yet</h3>
          <p>Click &quot;New Conduct&quot; to get started</p>
        </div>
      ) : (
        <div className={styles.conductsGrid}>
          {sortedConducts.map((conduct) => {
            const p = getProgress(conduct);
            return (
              <div
                key={conduct.id}
                className={`${styles.conductCard} ${getPersonClass(conduct.assignedTo)}`}
                onClick={() => setSelectedConduct(conduct)}
              >
                <h3>{conduct.name}</h3>
                <div className={styles.conductDate}>{formatDate(conduct.date)}</div>

                {conduct.assignedTo && (
                  <div className={`${styles.assignedBadge} ${getBadgeClass(conduct.assignedTo)}`}>
                    {conduct.assignedTo}
                  </div>
                )}

                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${p.percentage}%` }} />
                </div>
                <div className={styles.progressText}>
                  {p.completed} of {p.total} tasks completed
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Conduct Modal */}
      {isCreating && (
        <div className={styles.modal} onClick={() => setIsCreating(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create New Conduct</h2>
              <button className={styles.closeBtn} onClick={() => setIsCreating(false)}>
                ×
              </button>
            </div>

            <div className={styles.formGroup}>
              <label>Conduct Name</label>
              <input
                type="text"
                value={newConductName}
                onChange={(e) => setNewConductName(e.target.value)}
                placeholder="e.g., Battalion Exercise 2026"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Conduct Date</label>
              <input type="date" value={newConductDate} onChange={(e) => setNewConductDate(e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label>Assigned To (Optional)</label>
              <select value={newConductAssignedTo} onChange={(e) => setNewConductAssignedTo(e.target.value)}>
                <option value="">Not assigned</option>
                {TEAM_MEMBERS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={createConduct}>
                Create
              </button>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setIsCreating(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conduct Details Modal */}
      {selectedConduct && (
        <div className={styles.modal} onClick={() => setSelectedConduct(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{selectedConduct.name}</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedConduct(null)}>
                ×
              </button>
            </div>

            <div className={styles.conductMeta}>
              <div className={styles.conductMetaItem}>
                <span className={styles.conductMetaLabel}>Conduct Date</span>
                <span className={styles.conductMetaValue}>{formatDate(selectedConduct.date)}</span>
              </div>
              {selectedConduct.assignedTo && (
                <div className={styles.conductMetaItem}>
                  <span className={styles.conductMetaLabel}>Assigned To</span>
                  <span className={styles.conductMetaValue}>{selectedConduct.assignedTo}</span>
                </div>
              )}
            </div>

            {Object.entries(groupByCategory(selectedConduct.checklist)).map(([category, items]) => (
              <div key={category}>
                <div className={styles.categoryHeader}>{category}</div>

                {items.map((item) => {
                  const status = getDeadlineStatus(item.deadline);
                  const isCompleted = item.completed;

                  const deadlineClass =
                    status === "overdue"
                      ? `${styles.checklistDeadline} ${styles.deadlineOverdue}`
                      : status === "urgent"
                        ? `${styles.checklistDeadline} ${styles.deadlineUrgent}`
                        : styles.checklistDeadline;

                  return (
                    <div
                      key={item.id}
                      className={`${styles.checklistItem} ${isCompleted ? styles.checklistItemCompleted : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => toggleItem(item.id, item.completed)}
                      />

                      <div className={styles.checklistContent}>
                        <div className={`${styles.checklistTitle} ${isCompleted ? styles.checklistTitleCompleted : ""}`}>
                          {item.name}
                        </div>
                        <div className={deadlineClass}>
                          Due: {formatDate(item.deadline)}
                          {status === "overdue" && " - OVERDUE"}
                          {status === "urgent" && " - URGENT"}
                        </div>
                      </div>

                      <button className={styles.deleteItemBtn} onClick={() => deleteItem(item.id)}>
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}

            <div className={styles.addItemSection}>
              <h4>Add Custom Item</h4>
              <div className={styles.addItemForm}>
                <input
                  type="text"
                  placeholder="Item name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
                <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)}>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input type="date" value={newItemDeadline} onChange={(e) => setNewItemDeadline(e.target.value)} />
                <button className={styles.addItemBtn} onClick={() => addItem(selectedConduct.id)}>
                  + Add Item
                </button>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setSelectedConduct(null)}>
                Close
              </button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => deleteConduct(selectedConduct.id)}>
                Delete Conduct
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}