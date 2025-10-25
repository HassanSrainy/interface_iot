import React, { useEffect, useState } from "react";
import * as cliniquesApi from "./cliniques-api";
import * as floorsApi from "../floors/floors-api";
import * as servicesApi from "../services/services-api";

import EntityModal from "./EntityModal";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardHeader, CardContent } from "../ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "../ui/alert-dialog";
import { 
  Trash2, Edit, Plus, ChevronDown, ChevronRight, 
  Wifi, WifiOff, RefreshCw, Building2, Layers, 
  Briefcase, Activity 
} from "lucide-react";

type Clinique = cliniquesApi.Clinique;
type Floor = (cliniquesApi.Floor | floorsApi.Floor) & { niveau?: number };
type Service = cliniquesApi.Service | servicesApi.Service;
type Capteur = cliniquesApi.Capteur & Partial<{
  matricule: string;
  adresse_ip: string;
  adresse_mac: string;
  status: "online" | "offline" | string;
}>;

export function CliniqueManagement(): React.ReactElement {
  const [cliniques, setCliniques] = useState<Clinique[]>([]);
  const [floorsMap, setFloorsMap] = useState<Record<number, Floor[]>>({});
  const [servicesMap, setServicesMap] = useState<Record<number, Service[]>>({});
  const [capteursMap, setCapteursMap] = useState<Record<number, Capteur[]>>({});

  const [expandedCliniqueIds, setExpandedCliniqueIds] = useState<Set<number>>(new Set());
  const [expandedFloorIds, setExpandedFloorIds] = useState<Set<number>>(new Set());
  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<number>>(new Set());

  const [floorInputs, setFloorInputs] = useState<Record<number, string>>({});
  const [serviceInputs, setServiceInputs] = useState<Record<number, string>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalEntity, setModalEntity] = useState<"clinique" | "floor" | "service" | null>(null);
  const [modalParentId, setModalParentId] = useState<number | null>(null);
  const [modalInitial, setModalInitial] = useState<Record<string, any>>({});

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await reloadCliniques();
    })();
  }, []);

  const reloadCliniques = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cliniquesApi.getCliniques();
      setCliniques(data);
    } catch (err: any) {
      console.error("Erreur chargement cliniques:", err);
      setError(err?.message ?? "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    setError(null);
    try {
      setFloorsMap({});
      setServicesMap({});
      setCapteursMap({});
      const data = await cliniquesApi.getCliniques();
      setCliniques(data);
    } catch (err: any) {
      console.error("Erreur refresh:", err);
      setError(err?.message ?? "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const toggleSet = (setRef: Set<number>, setter: (s: Set<number>) => void, id: number) => {
    const next = new Set(setRef);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  const loadFloorsForClinique = async (cliniqueId: number) => {
    if (!floorsMap[cliniqueId]) {
      const data = await floorsApi.getFloorsByClinique(cliniqueId);
      setFloorsMap((p) => ({ ...p, [cliniqueId]: data }));
    }
    toggleSet(expandedCliniqueIds, setExpandedCliniqueIds, cliniqueId);
  };

  const loadServicesForFloor = async (floorId: number) => {
    if (!servicesMap[floorId]) {
      const data = await servicesApi.getServicesByFloor(floorId);
      setServicesMap((p) => ({ ...p, [floorId]: data }));
    }
    toggleSet(expandedFloorIds, setExpandedFloorIds, floorId);
  };

  const loadCapteursForService = async (serviceId: number) => {
    if (!capteursMap[serviceId]) {
      const data = await cliniquesApi.getCapteursByService(serviceId);
      setCapteursMap((p) => ({ ...p, [serviceId]: data }));
    }
    toggleSet(expandedServiceIds, setExpandedServiceIds, serviceId);
  };

  const openCreateModal = (entity: "clinique" | "floor" | "service", parentId?: number) => {
    setModalMode("create");
    setModalEntity(entity);
    setModalParentId(parentId ?? null);

    if (entity === "floor") {
      setModalInitial({ niveau: 1 });
    } else {
      setModalInitial({});
    }

    setModalOpen(true);
  };

  const openEditModal = (entity: "clinique" | "floor" | "service", initial: Record<string, any>, parentId?: number) => {
    setModalMode("edit");
    setModalEntity(entity);
    setModalParentId(parentId ?? null);

    if (entity === "floor") {
      setModalInitial({
        ...initial,
        niveau: initial.niveau ?? (initial.nom ? guessNiveauFromNom(initial.nom) : 1)
      });
    } else {
      setModalInitial(initial);
    }

    setModalOpen(true);
  };

  const niveauToNom = (niveau: number | string | null | undefined) => {
    if (niveau === null || niveau === undefined || niveau === "") return "";
    const n = Number(niveau);
    if (Number.isNaN(n)) return String(niveau);
    if (n === 0) return "Rez-de-chaussée";
    if (n === 1) return "1er étage";
    return `${n}e étage`;
  };

  const guessNiveauFromNom = (nom: string) => {
    if (!nom) return 1;
    if (/rez[-\s]?de[-\s]?chauss/i.test(nom) || /rdc/i.test(nom)) return 0;
    const m = nom.match(/(-?\d+)/);
    if (m) return parseInt(m[1], 10);
    return 1;
  };

  const handleModalSave = async (payload: Record<string, any>) => {
    if (modalEntity === "floor") {
      let niveau = payload.niveau;
      if (niveau === undefined || niveau === null || niveau === "") {
        niveau = modalInitial?.niveau ?? 1;
      }
      niveau = Number(niveau);
      if (Number.isNaN(niveau)) niveau = modalInitial?.niveau ?? 1;
      payload.niveau = niveau;

      if (!payload.nom || String(payload.nom).trim() === "") {
        payload.nom = niveauToNom(niveau);
      }
    }

    if (modalMode === "create") {
      if (modalEntity === "clinique") {
        await cliniquesApi.createClinique(payload);
        await reloadCliniques();
      } else if (modalEntity === "floor" && modalParentId) {
        await floorsApi.createFloor({ ...payload, clinique_id: modalParentId } as any);
        const floors = await floorsApi.getFloorsByClinique(modalParentId);
        setFloorsMap((p) => ({ ...p, [modalParentId]: floors }));
        setExpandedCliniqueIds((s) => {
          const next = new Set(s);
          next.add(modalParentId);
          return next;
        });
      } else if (modalEntity === "service" && modalParentId) {
        await servicesApi.createService({ ...payload, floor_id: modalParentId });
        const services = await servicesApi.getServicesByFloor(modalParentId);
        setServicesMap((p) => ({ ...p, [modalParentId]: services }));
        setExpandedFloorIds((s) => {
          const next = new Set(s);
          next.add(modalParentId);
          return next;
        });
      }
    } else {
      if (modalEntity === "clinique" && payload.id) {
        await cliniquesApi.updateClinique(payload.id, payload);
        await reloadCliniques();
      } else if (modalEntity === "floor" && payload.id && modalParentId) {
        await floorsApi.updateFloor(payload.id, payload as any);
        const floors = await floorsApi.getFloorsByClinique(modalParentId);
        setFloorsMap((p) => ({ ...p, [modalParentId]: floors }));
      } else if (modalEntity === "service" && payload.id && modalParentId) {
        await servicesApi.updateService(payload.id, payload);
        const services = await servicesApi.getServicesByFloor(modalParentId);
        setServicesMap((p) => ({ ...p, [modalParentId]: services }));
      }
    }
  };

  const handleAddFloorQuick = async (cliniqueId: number) => {
    const raw = (floorInputs[cliniqueId] ?? "").trim();
    if (raw === "") return;
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) return;
    const niveau = parsed;
    const nom = niveauToNom(niveau);
    await floorsApi.createFloor({ nom, niveau, clinique_id: cliniqueId } as any);
    setFloorInputs((p) => ({ ...p, [cliniqueId]: "" }));
    const floors = await floorsApi.getFloorsByClinique(cliniqueId);
    setFloorsMap((p) => ({ ...p, [cliniqueId]: floors }));
    setExpandedCliniqueIds((s) => {
      const next = new Set(s);
      next.add(cliniqueId);
      return next;
    });
  };

  const handleAddServiceQuick = async (floorId: number) => {
    const raw = (serviceInputs[floorId] || "").trim();
    if (!raw) return;
    await servicesApi.createService({ nom: raw, floor_id: floorId });
    setServiceInputs((p) => ({ ...p, [floorId]: "" }));
    const services = await servicesApi.getServicesByFloor(floorId);
    setServicesMap((p) => ({ ...p, [floorId]: services }));
    setExpandedFloorIds((s) => {
      const next = new Set(s);
      next.add(floorId);
      return next;
    });
  };

  const handleDeleteClinique = async (id: number) => {
    try {
      await cliniquesApi.deleteClinique(id);
      setFloorsMap((p) => { const copy = { ...p }; delete copy[id]; return copy; });
      await reloadCliniques();
    } catch (err) {
      console.error("Erreur suppression clinique", err);
    }
  };

  const handleDeleteFloor = async (floorId: number, cliniqueId: number) => {
    try {
      await floorsApi.deleteFloor(floorId);
      const floors = await floorsApi.getFloorsByClinique(cliniqueId);
      setFloorsMap((p) => ({ ...p, [cliniqueId]: floors }));
    } catch (err) {
      console.error("Erreur suppression étage", err);
    }
  };

  const handleDeleteService = async (serviceId: number, floorId: number) => {
    try {
      await servicesApi.deleteService(serviceId);
      const services = await servicesApi.getServicesByFloor(floorId);
      setServicesMap((p) => ({ ...p, [floorId]: services }));
      setCapteursMap((p) => { const copy = { ...p }; delete copy[serviceId]; return copy; });
    } catch (err) {
      console.error("Erreur suppression service", err);
    }
  };

  const h = React.createElement;

  const renderCap = (cap: Capteur) =>
    h("div", { 
      key: cap.id, 
      className: "p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center hover:border-blue-300 transition-all shadow-sm" 
    },
      h("div", { className: "flex items-center gap-3" },
        h("div", { className: "p-2 rounded-lg bg-blue-50" },
          h(Activity, { className: "w-5 h-5 text-blue-600" })
        ),
        h("div", null,
          h("div", { className: "font-medium text-sm text-slate-900" }, cap.matricule ?? cap.nom),
          h("div", { className: "text-xs text-slate-500 mt-0.5" }, 
            `${cap.adresse_ip ?? "IP: N/A"} • ${cap.adresse_mac ?? "MAC: N/A"}`
          )
        )
      ),
      h("div", null, 
        cap.status === "online" 
          ? h(Wifi, { className: "w-5 h-5 text-green-500" }) 
          : h(WifiOff, { className: "w-5 h-5 text-slate-400" })
      )
    );

  return h("div", { className: "min-h-screen bg-slate-50 p-4 md:p-6" },
    h("div", { className: "max-w-7xl mx-auto space-y-6" },
      // Header
      h("div", { className: "flex items-center justify-between pb-4 border-b border-slate-200" },
        h("div", null,
          h("h1", { className: "text-3xl font-bold text-slate-900" }, "Gestion des Cliniques"),
          h("p", { className: "text-slate-600 mt-1" }, "Gérez votre infrastructure médicale")
        ),
        h("div", { className: "flex items-center gap-3" },
          h(Button, {
            variant: "ghost",
            size: "sm",
            onClick: () => refreshAll(),
            title: "Rafraîchir",
            "aria-label": "Rafraîchir les cliniques",
            disabled: loading,
            className: "p-2"
          }, h(RefreshCw, { className: `w-4 h-4 ${loading ? "animate-spin" : ""}` })),

          h(Button, { 
            onClick: () => openCreateModal("clinique"), 
            disabled: loading 
          }, 
            h(Plus, { className: "w-4 h-4 mr-2" }), 
            "Nouvelle Clinique"
          )
        )
      ),

      // Error
      error && h("div", { 
        className: "text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-4", 
        role: "status", 
        "aria-live": "polite" 
      }, error),

      // Liste cliniques
      h("div", { className: "space-y-4" },
        cliniques.length === 0 && !loading && h("div", { className: "text-center py-16" },
          h(Building2, { className: "w-16 h-16 mx-auto text-slate-300 mb-4" }),
          h("p", { className: "text-lg font-medium text-slate-700" }, "Aucune clinique"),
          h("p", { className: "text-sm text-slate-500 mt-1" }, "Commencez par créer votre première clinique")
        ),

        ...cliniques.map((c) => h(Card, { 
          key: c.id, 
          className: "bg-white shadow-md hover:shadow-lg transition-all border-slate-200" 
        },
          h(CardHeader, { className: "bg-slate-50 border-b border-slate-100" },
            h("div", { className: "flex items-center justify-between w-full" },
              h("div", {
                className: "flex items-center gap-3 cursor-pointer flex-1",
                onClick: () => loadFloorsForClinique(c.id)
              },
                h("div", { className: "p-2 rounded-lg bg-blue-100" },
                  h(Building2, { className: "w-6 h-6 text-blue-600" })
                ),
                expandedCliniqueIds.has(c.id) ? h(ChevronDown, { className: "w-5 h-5 text-slate-400" }) : h(ChevronRight, { className: "w-5 h-5 text-slate-400" }),
                h("div", null,
                  h("div", { className: "text-xl font-bold text-slate-900" }, c.nom),
                  h("div", { className: "text-sm text-slate-500 mt-0.5" }, 
                    `${(c as any).adresse ?? ""} ${(c as any).ville ? `• ${(c as any).ville}` : ""}`
                  )
                )
              ),
              h("div", { className: "flex gap-2" },
                h(Button, { 
                  size: "sm", 
                  variant: "outline", 
                  onClick: (e: React.MouseEvent) => { 
                    e.stopPropagation(); 
                    openEditModal("clinique", c); 
                  }, 
                  disabled: loading 
                }, h(Edit, { className: "w-4 h-4" })),

                h(AlertDialog, {},
                  h(AlertDialogTrigger, { asChild: true },
                    h(Button, { 
                      size: "sm", 
                      variant: "destructive", 
                      onClick: (e: React.MouseEvent) => e.stopPropagation(), 
                      disabled: loading 
                    }, h(Trash2, { className: "w-4 h-4" }))
                  ),
                  h(AlertDialogContent, null,
                    h(AlertDialogHeader, null, h(AlertDialogTitle, null, "Supprimer la clinique")),
                    h("div", { className: "mt-2" }, `Voulez-vous vraiment supprimer la clinique "${c.nom}" ?`),
                    h(AlertDialogFooter, null,
                      h(AlertDialogCancel, null, "Annuler"),
                      h(AlertDialogAction, { onClick: () => handleDeleteClinique(c.id) }, "Supprimer")
                    )
                  )
                )
              )
            )
          ),

          // Floors area
          expandedCliniqueIds.has(c.id) && h(CardContent, { className: "p-6" },
            h("div", { className: "flex gap-2 items-center mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200" },
              h(Layers, { className: "w-5 h-5 text-blue-600" }),
              h("span", { className: "font-medium text-sm" }, "Ajouter un étage:"),
              h(Input, {
                placeholder: "Niveau (0, 1, 2...)",
                value: floorInputs[c.id] ?? "",
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  const val = e.target.value;
                  if (val === "" || /^-?\d*$/.test(val)) {
                    setFloorInputs((p) => ({ ...p, [c.id]: val }));
                  }
                },
                className: "max-w-xs",
                type: "number",
                step: 1,
                min: -5
              }),
              h(Button, { 
                size: "sm", 
                onClick: () => handleAddFloorQuick(c.id), 
                disabled: loading 
              }, 
                h(Plus, { className: "w-4 h-4 mr-1" }), 
                "Ajouter"
              )
            ),

            (floorsMap[c.id] ?? []).length === 0 
              ? h("div", { className: "text-center py-8 text-sm text-slate-500" }, 
                  "Aucun étage. Ajoutez-en un."
                )
              : h("div", { className: "space-y-3" },
                  ...(floorsMap[c.id] ?? []).map((f) => h("div", { 
                    key: f.id, 
                    className: "border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-all" 
                  },
                    h("div", { className: "flex justify-between items-center" },
                      h("div", { 
                        className: "flex items-center gap-3 cursor-pointer flex-1", 
                        onClick: () => loadServicesForFloor(f.id) 
                      },
                        h("div", { className: "p-2 rounded-lg bg-slate-100" },
                          h(Layers, { className: "w-5 h-5 text-slate-600" })
                        ),
                        expandedFloorIds.has(f.id) 
                          ? h(ChevronDown, { className: "w-4 h-4 text-slate-400" }) 
                          : h(ChevronRight, { className: "w-4 h-4 text-slate-400" }),
                        h("div", { className: "font-semibold text-slate-900" }, f.nom)
                      ),
                      h("div", { className: "flex gap-2" },
                        h(Button, { 
                          size: "sm", 
                          variant: "outline", 
                          onClick: (e: React.MouseEvent) => { 
                            e.stopPropagation(); 
                            openEditModal("floor", { ...f, clinique_id: c.id }, c.id); 
                          }, 
                          disabled: loading 
                        }, h(Edit, { className: "w-4 h-4" })),

                        h(AlertDialog, {},
                          h(AlertDialogTrigger, { asChild: true },
                            h(Button, { 
                              size: "sm", 
                              variant: "destructive", 
                              onClick: (e: React.MouseEvent) => e.stopPropagation(), 
                              disabled: loading 
                            }, h(Trash2, { className: "w-4 h-4" }))
                          ),
                          h(AlertDialogContent, null,
                            h(AlertDialogHeader, null, h(AlertDialogTitle, null, "Supprimer l'étage")),
                            h("div", { className: "mt-2" }, `Voulez-vous vraiment supprimer l'étage "${f.nom}" ?`),
                            h(AlertDialogFooter, null,
                              h(AlertDialogCancel, null, "Annuler"),
                              h(AlertDialogAction, { onClick: () => handleDeleteFloor(f.id, c.id) }, "Supprimer")
                            )
                          )
                        )
                      )
                    ),

                    expandedFloorIds.has(f.id) && h("div", { className: "pl-6 mt-4 border-l-2 border-blue-200" },
                      h("div", { className: "flex gap-2 items-center mb-3 p-3 bg-slate-50 rounded-lg" },
                        h(Briefcase, { className: "w-4 h-4 text-blue-600" }),
                        h("span", { className: "text-sm font-medium" }, "Service:"),
                        h(Input, {
                          placeholder: "Nom du service",
                          value: serviceInputs[f.id] ?? "",
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
                            setServiceInputs((p) => ({ ...p, [f.id]: e.target.value })),
                          className: "max-w-sm"
                        }),
                        h(Button, { 
                          size: "sm", 
                          onClick: () => handleAddServiceQuick(f.id), 
                          disabled: loading 
                        }, 
                          h(Plus, { className: "w-4 h-4 mr-1" }), 
                          "Ajouter"
                        )
                      ),

                      (servicesMap[f.id] ?? []).length === 0 
                        ? h("div", { className: "text-sm text-slate-500 ml-2 py-4" }, "Aucun service")
                        : h("div", { className: "space-y-2" },
                            ...(servicesMap[f.id] ?? []).map((s) => h("div", { 
                              key: s.id, 
                              className: "border border-slate-200 rounded-lg p-3 bg-white" 
                            },
                              h("div", { className: "flex items-center justify-between" },
                                h("div", { 
                                  className: "flex items-center gap-2 cursor-pointer flex-1", 
                                  onClick: () => loadCapteursForService(s.id) 
                                },
                                  h(Briefcase, { className: "w-4 h-4 text-slate-600" }),
                                  expandedServiceIds.has(s.id) 
                                    ? h(ChevronDown, { className: "w-4 h-4 text-slate-400" }) 
                                    : h(ChevronRight, { className: "w-4 h-4 text-slate-400" }),
                                  h("div", { className: "font-medium text-slate-900" }, s.nom)
                                ),
                                h("div", { className: "flex gap-2" },
                                  h(Button, { 
                                    size: "sm", 
                                    variant: "outline", 
                                    onClick: () => openEditModal("service", { ...s, floor_id: f.id }, f.id), 
                                    disabled: loading 
                                  }, h(Edit, { className: "w-4 h-4" })),

                                  h(AlertDialog, {},
                                    h(AlertDialogTrigger, { asChild: true },
                                      h(Button, { 
                                        size: "sm", 
                                        variant: "destructive", 
                                        onClick: (e: React.MouseEvent) => e.stopPropagation(), 
                                        disabled: loading 
                                      }, h(Trash2, { className: "w-4 h-4" }))
                                    ),
                                    h(AlertDialogContent, null,
                                      h(AlertDialogHeader, null, h(AlertDialogTitle, null, "Supprimer le service")),
                                      h("div", { className: "mt-2" }, `Voulez-vous vraiment supprimer le service "${s.nom}" ?`),
                                      h(AlertDialogFooter, null,
                                        h(AlertDialogCancel, null, "Annuler"),
                                        h(AlertDialogAction, { onClick: () => handleDeleteService(s.id, f.id) }, "Supprimer")
                                      )
                                    )
                                  )
                                )
                              ),

                              expandedServiceIds.has(s.id) && h("div", { className: "pl-4 mt-4" },
                                (capteursMap[s.id] ?? []).length === 0 
                                  ? h("div", { className: "text-center py-6" },
                                      h(Activity, { className: "w-10 h-10 mx-auto text-slate-300 mb-2" }),
                                      h("div", { className: "text-sm text-slate-500" }, "Aucun capteur")
                                    )
                                  : h("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-3" },
                                      ...(capteursMap[s.id] ?? []).map((cap) => renderCap(cap))
                                    )
                              )
                            ))
                          )
                    )
                  ))
                )
          )
        ))
      )
    ),

    // Modal
    h(EntityModal, {
      open: modalOpen,
      title: modalMode === "create" ? `Créer ${modalEntity}` : `Modifier ${modalEntity}`,
      fields: modalEntity === "clinique"
        ? [
            { name: "nom", label: "Nom", placeholder: "Nom clinique" }, 
            { name: "adresse", label: "Adresse", placeholder: "Adresse" }, 
            { name: "ville", label: "Ville", placeholder: "Ville" }
          ]
        : modalEntity === "floor"
        ? [
            { name: "niveau", label: "Niveau", placeholder: "0 pour Rez-de-chaussée, 1, 2, ...", type: "number" }, 
            { name: "nom", label: "Nom (optionnel)", placeholder: "Laisser vide pour nom par défaut" }
          ]
        : modalEntity === "service"
        ? [
            { name: "nom", label: "Nom service", placeholder: "Nom service" }
          ]
        : [],
      initialData: modalInitial,
      onClose: () => setModalOpen(false),
      onSave: async (payload: Record<string, any>) => { 
        await handleModalSave(payload); 
        setModalOpen(false); 
      }
    })
  );
}

export default CliniqueManagement;