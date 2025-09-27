// frontend3/src/components/cliniques/clinique-management.tsx
import React, { useEffect, useState } from "react";
import * as cliniquesApi from "./cliniques-api";
import * as floorsApi from "../floors/floors-api";
import * as servicesApi from "../services/services-api";
import * as sensorsApi from "../sensors/sensor-api";

import EntityModal from "./EntityModal";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "../ui/card";
import { Trash2, Edit, Plus, ChevronDown, ChevronRight, Wifi, WifiOff } from "lucide-react";

/* Types (keep optional fields for safety) */
type Clinique = cliniquesApi.Clinique;
type Floor = cliniquesApi.Floor | floorsApi.Floor;
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

  // per-parent isolated inputs
  const [floorInputs, setFloorInputs] = useState<Record<number, string>>({});
  const [serviceInputs, setServiceInputs] = useState<Record<number, string>>({});

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalEntity, setModalEntity] = useState<"clinique" | "floor" | "service" | null>(null);
  const [modalParentId, setModalParentId] = useState<number | null>(null);
  const [modalInitial, setModalInitial] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      await reloadCliniques();
    })();
  }, []);

  const reloadCliniques = async () => {
    const data = await cliniquesApi.getCliniques();
    setCliniques(data);
  };

  const toggleSet = (setRef: Set<number>, setter: (s: Set<number>) => void, id: number) => {
    const next = new Set(setRef);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  // lazy loaders
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

  // modal helpers
  const openCreateModal = (entity: "clinique" | "floor" | "service", parentId?: number) => {
    setModalMode("create");
    setModalEntity(entity);
    setModalParentId(parentId ?? null);
    setModalInitial({});
    setModalOpen(true);
  };

  const openEditModal = (entity: "clinique" | "floor" | "service", initial: Record<string, any>, parentId?: number) => {
    setModalMode("edit");
    setModalEntity(entity);
    setModalParentId(parentId ?? null);
    setModalInitial(initial);
    setModalOpen(true);
  };

  const handleModalSave = async (payload: Record<string, any>) => {
    if (modalMode === "create") {
      if (modalEntity === "clinique") {
        await cliniquesApi.createClinique(payload);
        await reloadCliniques();
      } else if (modalEntity === "floor" && modalParentId) {
        await floorsApi.createFloor({ ...payload, clinique_id: modalParentId });
        const floors = await floorsApi.getFloorsByClinique(modalParentId);
        setFloorsMap((p) => ({ ...p, [modalParentId]: floors }));
        setExpandedCliniqueIds((s) => new Set(s.add(modalParentId)));
      } else if (modalEntity === "service" && modalParentId) {
        await servicesApi.createService({ ...payload, floor_id: modalParentId });
        const services = await servicesApi.getServicesByFloor(modalParentId);
        setServicesMap((p) => ({ ...p, [modalParentId]: services }));
        setExpandedFloorIds((s) => new Set(s.add(modalParentId)));
      }
    } else {
      // edit
      if (modalEntity === "clinique" && payload.id) {
        await cliniquesApi.updateClinique(payload.id, payload);
        await reloadCliniques();
      } else if (modalEntity === "floor" && payload.id && modalParentId) {
        await floorsApi.updateFloor(payload.id, payload);
        const floors = await floorsApi.getFloorsByClinique(modalParentId);
        setFloorsMap((p) => ({ ...p, [modalParentId]: floors }));
      } else if (modalEntity === "service" && payload.id && modalParentId) {
        await servicesApi.updateService(payload.id, payload);
        const services = await servicesApi.getServicesByFloor(modalParentId);
        setServicesMap((p) => ({ ...p, [modalParentId]: services }));
      }
    }
  };

  // quick add
  const handleAddFloorQuick = async (cliniqueId: number) => {
    const raw = (floorInputs[cliniqueId] || "").trim();
    if (!raw) return;
    const parsed = parseInt(raw);
    const nom = !isNaN(parsed) ? (parsed === 0 ? "Rez-de-chaussée" : parsed === 1 ? "1er étage" : `${parsed}e étage`) : raw;
    await floorsApi.createFloor({ nom, clinique_id: cliniqueId });
    setFloorInputs((p) => ({ ...p, [cliniqueId]: "" }));
    const floors = await floorsApi.getFloorsByClinique(cliniqueId);
    setFloorsMap((p) => ({ ...p, [cliniqueId]: floors }));
    setExpandedCliniqueIds((s) => new Set(s.add(cliniqueId)));
  };

  const handleAddServiceQuick = async (floorId: number) => {
    const raw = (serviceInputs[floorId] || "").trim();
    if (!raw) return;
    await servicesApi.createService({ nom: raw, floor_id: floorId });
    setServiceInputs((p) => ({ ...p, [floorId]: "" }));
    const services = await servicesApi.getServicesByFloor(floorId);
    setServicesMap((p) => ({ ...p, [floorId]: services }));
    setExpandedFloorIds((s) => new Set(s.add(floorId)));
  };

  // deletes
  const handleDeleteClinique = async (id: number) => {
    if (!confirm("Supprimer cette clinique ?")) return;
    await cliniquesApi.deleteClinique(id);
    setFloorsMap((p) => { const copy = { ...p }; delete copy[id]; return copy; });
    await reloadCliniques();
  };

  const handleDeleteFloor = async (floorId: number, cliniqueId: number) => {
    if (!confirm("Supprimer cet étage ?")) return;
    await floorsApi.deleteFloor(floorId);
    const floors = await floorsApi.getFloorsByClinique(cliniqueId);
    setFloorsMap((p) => ({ ...p, [cliniqueId]: floors }));
  };

  const handleDeleteService = async (serviceId: number, floorId: number) => {
    if (!confirm("Supprimer ce service ?")) return;
    await servicesApi.deleteService(serviceId);
    const services = await servicesApi.getServicesByFloor(floorId);
    setServicesMap((p) => ({ ...p, [floorId]: services }));
    setCapteursMap((p) => { const copy = { ...p }; delete copy[serviceId]; return copy; });
  };

  // createElement alias
  const h = React.createElement;

  const renderCap = (cap: Capteur) =>
    h("div", { key: cap.id, className: "p-2 bg-white rounded shadow-sm flex justify-between items-center" },
      h("div", null,
        h("div", { className: "font-medium text-sm" }, cap.matricule ?? cap.nom),
        h("div", { className: "text-xs text-gray-500" }, `${cap.adresse_ip ?? "IP: N/A"} • ${cap.adresse_mac ?? "MAC: N/A"}`)
      ),
      h("div", null, (cap.status === "online") ? h(Wifi, { className: "text-green-500" }) : h(WifiOff, { className: "text-gray-400" }))
    );

  // main render tree (createElement)
  return h("div", { className: "space-y-6 p-6" },
    h("div", { className: "flex items-center justify-between" },
      h("h1", { className: "text-2xl font-semibold" }, "Gestion des Cliniques"),
      h(Button, { onClick: () => openCreateModal("clinique") }, h(Plus, { className: "w-4 h-4 mr-2" }), "Nouvelle Clinique")
    ),

    // clinics
    ...cliniques.map((c) => h(Card, { key: c.id, className: "bg-white shadow-md" },
      h(CardHeader, null,
        h("div", { className: "flex items-center justify-between w-full" },
          h("div", {
            className: "flex items-center gap-3 cursor-pointer",
            onClick: () => loadFloorsForClinique(c.id)
          },
            expandedCliniqueIds.has(c.id) ? h(ChevronDown, {}) : h(ChevronRight, {}),
            h("div", null,
              h("div", { className: "text-lg font-medium" }, c.nom),
              h("div", { className: "text-xs text-gray-500" }, `${(c as any).adresse ?? ""} • ${(c as any).ville ?? ""}`)
            )
          ),
          h("div", { className: "flex gap-2" },
            h(Button, { size: "sm", variant: "outline", onClick: (e: React.MouseEvent) => { e.stopPropagation(); openEditModal("clinique", c); } }, h(Edit, { className: "w-4 h-4" })),
            h(Button, { size: "sm", variant: "destructive", onClick: () => handleDeleteClinique(c.id) }, h(Trash2, { className: "w-4 h-4" }))
          )
        )
      ),

      // floors area
      expandedCliniqueIds.has(c.id) && h(CardContent, { className: "pl-8" },
        h("div", { className: "flex gap-2 items-center mb-3" },
          h(Input, {
            placeholder: "Ex: 1 ou Rez-de-chaussée",
            value: floorInputs[c.id] ?? "",
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFloorInputs((p) => ({ ...p, [c.id]: e.target.value })),
            className: "max-w-xs"
          }),
          h(Button, { size: "sm", onClick: () => handleAddFloorQuick(c.id) }, h(Plus, { className: "w-4 h-4 mr-1" }), "Ajouter étage"),
          h(Button, { size: "sm", variant: "outline", onClick: () => openCreateModal("floor", c.id) }, h(Edit, { className: "w-4 h-4 mr-1" }), "Ajouter (modal)")
        ),

        (floorsMap[c.id] ?? []).length === 0 ? h("div", { className: "text-sm text-gray-500" }, "Aucun étage. Ajoutez-en un.") :
        (floorsMap[c.id] ?? []).map((f) => h("div", { key: f.id, className: "border-l pl-4 mb-3" },
          h("div", { className: "flex justify-between items-center" },
            h("div", { className: "flex items-center cursor-pointer", onClick: () => loadServicesForFloor(f.id) },
              expandedFloorIds.has(f.id) ? h(ChevronDown, {}) : h(ChevronRight, {}),
              h("div", { className: "ml-2 font-medium" }, f.nom)
            ),
            h("div", { className: "flex gap-2" },
              h(Button, { size: "sm", variant: "outline", onClick: (e: React.MouseEvent) => { e.stopPropagation(); openEditModal("floor", { ...f, clinique_id: c.id }, c.id); } }, h(Edit, { className: "w-4 h-4" })),
              h(Button, { size: "sm", variant: "destructive", onClick: () => handleDeleteFloor(f.id, c.id) }, h(Trash2, { className: "w-4 h-4" }))
            )
          ),

          expandedFloorIds.has(f.id) && h("div", { className: "pl-6 mt-2" },
            h("div", { className: "flex gap-2 items-center mb-2" },
              h(Input, {
                placeholder: "Nom du service",
                value: serviceInputs[f.id] ?? "",
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setServiceInputs((p) => ({ ...p, [f.id]: e.target.value })),
                className: "max-w-sm"
              }),
              h(Button, { size: "sm", onClick: () => handleAddServiceQuick(f.id) }, h(Plus, { className: "w-4 h-4 mr-1" }), "Ajouter service"),
              h(Button, { size: "sm", variant: "outline", onClick: () => openCreateModal("service", f.id) }, h(Edit, { className: "w-4 h-4 mr-1" }), "Modal service")
            ),

            (servicesMap[f.id] ?? []).length === 0 ? h("div", { className: "text-sm text-gray-500 ml-2" }, "Aucun service") :
            (servicesMap[f.id] ?? []).map((s) => h("div", { key: s.id, className: "border-l pl-4 mb-2" },
              h("div", { className: "flex items-center justify-between" },
                h("div", { className: "flex items-center gap-3 cursor-pointer", onClick: () => loadCapteursForService(s.id) },
                  h(ChevronRight, {}),
                  h("div", null, s.nom)
                ),
                h("div", { className: "flex gap-2" },
                  h(Button, { size: "sm", variant: "outline", onClick: () => openEditModal("service", { ...s, floor_id: f.id }, f.id) }, h(Edit, { className: "w-4 h-4" })),
                  h(Button, { size: "sm", variant: "destructive", onClick: () => handleDeleteService(s.id, f.id) }, h(Trash2, { className: "w-4 h-4" }))
                )
              ),

              expandedServiceIds.has(s.id) && h("div", { className: "pl-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2" },
                (capteursMap[s.id] ?? []).length === 0 ? h("div", { className: "text-sm text-gray-500" }, "Aucun capteur") :
                (capteursMap[s.id] ?? []).map((cap) => renderCap(cap))
              )
            ))
          )
        ))
      )
    )),

    // Modal
    h(EntityModal, {
      open: modalOpen,
      title: modalMode === "create" ? `Créer ${modalEntity}` : `Modifier ${modalEntity}`,
      fields: modalEntity === "clinique"
        ? [{ name: "nom", label: "Nom", placeholder: "Nom clinique" }, { name: "adresse", label: "Adresse", placeholder: "Adresse" }, { name: "ville", label: "Ville", placeholder: "Ville" }]
        : modalEntity === "floor"
        ? [{ name: "nom", label: "Nom étage", placeholder: "1 ou Rez-de-chaussée" }]
        : modalEntity === "service"
        ? [{ name: "nom", label: "Nom service", placeholder: "Nom service" }]
        : [],
      initialData: modalInitial,
      onClose: () => setModalOpen(false),
      onSave: async (payload: Record<string, any>) => { await handleModalSave(payload); setModalOpen(false); }
    })
  );
}

export default CliniqueManagement;
