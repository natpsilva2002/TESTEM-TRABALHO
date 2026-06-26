import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Ruler, Building2, Users, Upload, Box, Loader2, Search, Plus, X
} from "lucide-react";
import { Scene3D, type ModelMetrics } from "@/components/Scene3D";

interface Material {
  id: string;
  name: string;
  category: string;
  nrc: number;
  absorption_500hz: number;
  description: string | null;
}

interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  sabins_500hz: number;
}

interface InventoryEntry {
  item_id: string;
  quantity: number;
}

interface CustomFurnitureItem {
  id: string;        // local uuid
  name: string;
  quantity: number;
  sabins: number;    // sabins per unit @500Hz (medida padrão)
  description?: string;
}

interface Project {
  id: string;
  name: string;
  room_function: string;
  length_m: number | null;
  width_m: number | null;
  height_m: number | null;
  interior_description: string | null;
  furniture_elements: string[] | null;
  wall_material_id: string | null;
  floor_material_id: string | null;
  ceiling_material_id: string | null;
  wall_thickness_mm: number | null;
  floor_thickness_mm: number | null;
  ceiling_thickness_mm: number | null;
  model_file_path: string | null;
  model_file_name: string | null;
  occupancy_preset: string | null;
  furniture_inventory: InventoryEntry[] | null;
  custom_furniture?: CustomFurnitureItem[] | null;
}

const OCCUPANCY_PRESETS = [
  { value: "empty", label: "Vazio", description: "Apenas superfícies — sem mobiliário ou pessoas" },
  { value: "lightly", label: "Pouco mobiliado", description: "Poucos móveis essenciais, ambiente esparso" },
  { value: "furnished", label: "Mobiliado", description: "Mobília completa de uso típico" },
  { value: "crowded", label: "Lotado", description: "Mobília + ocupação humana plena" },
];

// Which DB categories are valid for each surface
const SURFACE_CATEGORIES: Record<"wall" | "floor" | "ceiling", string[]> = {
  wall: ["Parede", "Tratamento"],
  floor: ["Piso"],
  ceiling: ["Teto", "Tratamento"],
};

interface EnvironmentTabProps {
  project: Project;
  onSave: (updates: Partial<Project>) => Promise<void>;
  onModelMetrics?: (metrics: ModelMetrics | null) => void;
}

function CustomFurnitureForm({ onAdd }: { onAdd: (item: CustomFurnitureItem) => void }) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [sabins, setSabins] = useState("");
  const [desc, setDesc] = useState("");
  const handle = () => {
    const trimmedName = name.trim();
    const q = parseInt(qty);
    const s = parseFloat(sabins);
    if (!trimmedName || trimmedName.length > 100) return toast.error("Nome inválido (máx. 100 caracteres)");
    if (!q || q <= 0 || q > 9999) return toast.error("Quantidade inválida");
    if (isNaN(s) || s < 0 || s > 100) return toast.error("Sabins inválidos (0–100)");
    if (desc.length > 300) return toast.error("Descrição muito longa");
    onAdd({
      id: (crypto as any).randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      name: trimmedName, quantity: q, sabins: s,
      description: desc.trim() || undefined,
    });
    setName(""); setQty("1"); setSabins(""); setDesc("");
  };
  return (
    <div
      role="group"
      aria-label="Adicionar item personalizado"
      className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-md border border-dashed border-border bg-muted/30"
    >
      <Input className="sm:col-span-4" placeholder="Nome do item" aria-label="Nome do item personalizado" value={name} onChange={e => setName(e.target.value)} maxLength={100} />
      <Input className="sm:col-span-2" type="number" min="1" placeholder="Qtd" aria-label="Quantidade" value={qty} onChange={e => setQty(e.target.value)} />
      <Input className="sm:col-span-3" type="number" step="0.01" min="0" placeholder="Sabins/un @500Hz" aria-label="Sabins por unidade a 500Hz" value={sabins} onChange={e => setSabins(e.target.value)} />
      <Input className="sm:col-span-2" placeholder="Descrição (opcional)" aria-label="Descrição (opcional)" value={desc} onChange={e => setDesc(e.target.value)} maxLength={300} />
      <Button type="button" size="sm" className="sm:col-span-1" onClick={handle} aria-label="Adicionar item personalizado">
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}

export function EnvironmentTab({ project, onSave, onModelMetrics }: EnvironmentTabProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [furnitureCatalog, setFurnitureCatalog] = useState<FurnitureItem[]>([]);
  const [wallSearch, setWallSearch] = useState("");
  const [floorSearch, setFloorSearch] = useState("");
  const [ceilingSearch, setCeilingSearch] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    length_m: project.length_m?.toString() ?? "",
    width_m: project.width_m?.toString() ?? "",
    height_m: project.height_m?.toString() ?? "",
    room_function: project.room_function,
    interior_description: project.interior_description ?? "",
    furniture_elements: project.furniture_elements ?? [],
    wall_material_id: project.wall_material_id ?? "",
    floor_material_id: project.floor_material_id ?? "",
    ceiling_material_id: project.ceiling_material_id ?? "",
    wall_thickness_mm: project.wall_thickness_mm?.toString() ?? "",
    floor_thickness_mm: project.floor_thickness_mm?.toString() ?? "",
    ceiling_thickness_mm: project.ceiling_thickness_mm?.toString() ?? "",
    model_file_name: project.model_file_name ?? "",
    model_file_path: project.model_file_path ?? "",
    occupancy_preset: project.occupancy_preset ?? "empty",
    furniture_inventory: (project.furniture_inventory ?? []) as InventoryEntry[],
    custom_furniture: (project.custom_furniture ?? []) as CustomFurnitureItem[],
  });

  useEffect(() => {
    supabase.from("materials").select("id, name, category, nrc, absorption_500hz, description").then(({ data }) => {
      if (data) setMaterials(data as Material[]);
    });
    supabase.from("furniture_items").select("id, name, category, description, sabins_500hz").order("category").order("name").then(({ data }) => {
      if (data) setFurnitureCatalog(data as FurnitureItem[]);
    });
  }, []);

  // If there's a model path, generate a signed URL for Three.js
  useEffect(() => {
    if (!form.model_file_path) {
      setModelUrl(null);
      return;
    }
    const ext = form.model_file_path.split(".").pop()?.toLowerCase();
    if (!["glb", "obj", "stl"].includes(ext ?? "")) {
      setModelUrl(null);
      return;
    }
    supabase.storage
      .from("models3d")
      .createSignedUrl(form.model_file_path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setModelUrl(data.signedUrl);
      });
  }, [form.model_file_path]);

  const getMaterialsForSurface = (surface: "wall" | "floor" | "ceiling", search: string) => {
    const validCats = SURFACE_CATEGORIES[surface];
    return materials.filter(m =>
      validCats.includes(m.category) &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.category.toLowerCase().includes(search.toLowerCase()))
    );
  };

  const volume = form.length_m && form.width_m && form.height_m
    ? (parseFloat(form.length_m) * parseFloat(form.width_m) * parseFloat(form.height_m)).toFixed(1)
    : null;

  const setInventoryQty = (itemId: string, qty: number) => {
    setForm(p => {
      const without = p.furniture_inventory.filter(e => e.item_id !== itemId);
      if (qty <= 0) return { ...p, furniture_inventory: without };
      return { ...p, furniture_inventory: [...without, { item_id: itemId, quantity: qty }] };
    });
  };
  const getInventoryQty = (itemId: string) =>
    form.furniture_inventory.find(e => e.item_id === itemId)?.quantity ?? 0;

  const handleSave = () => {
    onSave({
      length_m: form.length_m ? parseFloat(form.length_m) : null,
      width_m: form.width_m ? parseFloat(form.width_m) : null,
      height_m: form.height_m ? parseFloat(form.height_m) : null,
      room_function: form.room_function,
      interior_description: form.interior_description || null,
      furniture_elements: form.furniture_elements,
      wall_material_id: form.wall_material_id || null,
      floor_material_id: form.floor_material_id || null,
      ceiling_material_id: form.ceiling_material_id || null,
      wall_thickness_mm: form.wall_thickness_mm ? parseFloat(form.wall_thickness_mm) : null,
      floor_thickness_mm: form.floor_thickness_mm ? parseFloat(form.floor_thickness_mm) : null,
      ceiling_thickness_mm: form.ceiling_thickness_mm ? parseFloat(form.ceiling_thickness_mm) : null,
      model_file_path: form.model_file_path || null,
      model_file_name: form.model_file_name || null,
      occupancy_preset: form.occupancy_preset,
      furniture_inventory: form.furniture_inventory,
      custom_furniture: form.custom_furniture,
    } as any);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [".glb", ".obj", ".stl", ".skp", ".rvt"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error("Formato não suportado. Use GLB, OBJ, STL, SKP ou RVT");
      return;
    }
    const MAX_SIZE = 200 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("Arquivo muito grande. O limite é 200MB");
      return;
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const path = `${user.id}/${project.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("models3d").upload(path, file);
      if (error) throw error;
      setForm(p => ({ ...p, model_file_path: path, model_file_name: file.name }));
      toast.success("Modelo 3D enviado com sucesso!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  const MaterialSelect = ({
    value,
    onChange,
    label,
    surface,
    search,
    onSearchChange,
  }: {
    value: string;
    onChange: (v: string) => void;
    label: string;
    surface: "wall" | "floor" | "ceiling";
    search: string;
    onSearchChange: (v: string) => void;
  }) => {
    const filtered = getMaterialsForSurface(surface, search);
    const grouped = SURFACE_CATEGORIES[surface].reduce<Record<string, Material[]>>((acc, cat) => {
      const items = filtered.filter(m => m.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    }, {});

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar material..." />
          </SelectTrigger>
          <SelectContent>
            <div className="p-2">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  className="pl-8 h-8 text-sm"
                  placeholder="Buscar material..."
                  value={search}
                  onChange={e => onSearchChange(e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
              </div>
            </div>
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">{cat}</div>
                {items.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center justify-between w-full gap-3">
                      <span className="text-sm">{m.name}</span>
                      <Badge variant="secondary" className="text-xs">NRC {m.nrc.toFixed(2)}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
            {Object.keys(grouped).length === 0 && (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">Nenhum material encontrado</div>
            )}
          </SelectContent>
        </Select>
        {value && (() => {
          const m = materials.find(mat => mat.id === value);
          return m ? (
            <p className="text-xs text-muted-foreground">{m.description}</p>
          ) : null;
        })()}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left column - form */}
      <div className="space-y-6">
        {/* Dimensions */}
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Ruler className="w-4 h-4 text-primary" />
              Dimensões do Ambiente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "length_m", label: "Comprimento (m)" },
                { key: "width_m", label: "Largura (m)" },
                { key: "height_m", label: "Altura (m)" },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="0.0"
                    value={form[key as keyof typeof form] as string}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            {volume && (
              <div className="flex items-center gap-2 p-2.5 bg-primary/5 rounded-lg">
                <Box className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Volume total: <strong className="text-primary">{volume} m³</strong></span>
              </div>
            )}
            <div className="space-y-2">
              <Label>Função do ambiente</Label>
              <Select value={form.room_function} onValueChange={v => setForm(p => ({ ...p, room_function: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["auditório", "sala de aula", "escritório", "estúdio", "teatro", "sala de concertos", "sala de reuniões", "home theater", "restaurante", "outro"].map(f => (
                    <SelectItem key={f} value={f} className="capitalize">{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Materials */}
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Materiais de Revestimento
            </CardTitle>
            <CardDescription>Selecione os materiais das superfícies principais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MaterialSelect
              label="Material da Parede"
              value={form.wall_material_id}
              onChange={v => setForm(p => ({ ...p, wall_material_id: v }))}
              surface="wall"
              search={wallSearch}
              onSearchChange={setWallSearch}
            />
            {form.wall_material_id && (
              <div className="space-y-1.5 pl-4 border-l-2 border-primary/20">
                <Label className="text-xs">Espessura da parede (mm)</Label>
                <Input type="number" step="1" min="1" placeholder="Ex: 150" value={form.wall_thickness_mm} onChange={e => setForm(p => ({ ...p, wall_thickness_mm: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Impacta absorção em baixas frequências</p>
              </div>
            )}

            <MaterialSelect
              label="Material do Piso"
              value={form.floor_material_id}
              onChange={v => setForm(p => ({ ...p, floor_material_id: v }))}
              surface="floor"
              search={floorSearch}
              onSearchChange={setFloorSearch}
            />
            {form.floor_material_id && (
              <div className="space-y-1.5 pl-4 border-l-2 border-primary/20">
                <Label className="text-xs">Espessura do piso (mm)</Label>
                <Input type="number" step="1" min="1" placeholder="Ex: 30" value={form.floor_thickness_mm} onChange={e => setForm(p => ({ ...p, floor_thickness_mm: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Impacta absorção em baixas frequências</p>
              </div>
            )}

            <MaterialSelect
              label="Material do Teto"
              value={form.ceiling_material_id}
              onChange={v => setForm(p => ({ ...p, ceiling_material_id: v }))}
              surface="ceiling"
              search={ceilingSearch}
              onSearchChange={setCeilingSearch}
            />
            {form.ceiling_material_id && (
              <div className="space-y-1.5 pl-4 border-l-2 border-primary/20">
                <Label className="text-xs">Espessura do teto (mm)</Label>
                <Input type="number" step="1" min="1" placeholder="Ex: 15" value={form.ceiling_thickness_mm} onChange={e => setForm(p => ({ ...p, ceiling_thickness_mm: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Impacta absorção em baixas frequências</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interior */}
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Elementos Internos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição do interior</Label>
              <Textarea
                placeholder="Descreva a disposição dos elementos internos, características especiais..."
                value={form.interior_description}
                onChange={e => setForm(p => ({ ...p, interior_description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Densidade de ocupação (preset rápido)</Label>
              <Select value={form.occupancy_preset} onValueChange={v => setForm(p => ({ ...p, occupancy_preset: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OCCUPANCY_PRESETS.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{o.label}</span>
                        <span className="text-xs text-muted-foreground">{o.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Aplica absorção adicional aproximada com base no volume do ambiente.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setAdvancedOpen(o => !o)}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                {advancedOpen ? "−" : "+"} Modo avançado: inventário item-a-item
                {form.furniture_inventory.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {form.furniture_inventory.reduce((s, e) => s + e.quantity, 0)} itens
                  </Badge>
                )}
              </button>
              {advancedOpen && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Quando preenchido, o inventário detalhado <strong>substitui</strong> o preset acima no cálculo.
                    Cada item contribui com absorção em Sabins (m² equivalentes) por banda de frequência.
                  </p>
                  {Object.entries(
                    furnitureCatalog.reduce<Record<string, FurnitureItem[]>>((acc, it) => {
                      (acc[it.category] ??= []).push(it);
                      return acc;
                    }, {})
                  ).map(([cat, items]) => (
                    <div key={cat} className="space-y-1.5">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</div>
                      {items.map(it => {
                        const qty = getInventoryQty(it.id);
                        return (
                          <div key={it.id} className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted/50">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">{it.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {it.sabins_500hz.toFixed(2)} Sabins @500Hz {it.description ? `· ${it.description}` : ""}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button type="button" size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setInventoryQty(it.id, Math.max(0, qty - 1))} aria-label={`Diminuir quantidade de ${it.name}`}>
                                <span aria-hidden="true">−</span>
                              </Button>
                              <Input
                                type="number"
                                min="0"
                                value={qty}
                                onChange={e => setInventoryQty(it.id, parseInt(e.target.value) || 0)}
                                className="h-7 w-14 text-center text-sm"
                                aria-label={`Quantidade de ${it.name}`}
                              />
                              <Button type="button" size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setInventoryQty(it.id, qty + 1)} aria-label={`Aumentar quantidade de ${it.name}`}>
                                <span aria-hidden="true">+</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Custom furniture entries */}
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Itens personalizados
            </CardTitle>
            <CardDescription>
              Adicione manualmente um elemento interno informando seu valor de absorção em Sabins (medida padrão @500Hz).
              Esses Sabins entram diretamente no cálculo determinístico do RT60.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CustomFurnitureForm
              onAdd={(item) =>
                setForm(p => ({ ...p, custom_furniture: [...p.custom_furniture, item] }))
              }
            />
            {form.custom_furniture.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                Nenhum item personalizado adicionado.
              </p>
            ) : (
              <div className="space-y-1.5">
                {form.custom_furniture.map(it => (
                  <div key={it.id} className="flex items-center justify-between gap-3 p-2 rounded-md border border-border">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{it.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.quantity}× · {it.sabins.toFixed(2)} Sabins/un · Total: {(it.quantity * it.sabins).toFixed(2)} Sabins
                        {it.description ? ` · ${it.description}` : ""}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() =>
                        setForm(p => ({ ...p, custom_furniture: p.custom_furniture.filter(c => c.id !== it.id) }))
                      }
                      aria-label="Remover item personalizado"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full gap-2">
          <Plus className="w-4 h-4" />
          Salvar dados do ambiente
        </Button>
      </div>

      {/* Right column - 3D */}
      <div className="space-y-6">
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Box className="w-4 h-4 text-primary" />
              Modelo 3D
            </CardTitle>
            <CardDescription>
              Upload de arquivo GLB, OBJ, STL (visualizável), SKP ou RVT (máx. 200MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="model-upload"
                accept=".glb,.obj,.stl,.skp,.rvt"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label htmlFor="model-upload" className="cursor-pointer">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Enviando modelo...</p>
                  </div>
                ) : form.model_file_name ? (
                  <div className="flex flex-col items-center gap-2">
                    <Box className="w-8 h-8 text-primary" />
                    <p className="text-sm font-medium text-foreground">{form.model_file_name}</p>
                    <p className="text-xs text-muted-foreground">Clique para trocar</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Arraste ou clique para enviar</p>
                    <p className="text-xs text-muted-foreground">GLB, OBJ, STL, SKP ou RVT (máx. 200MB)</p>
                  </div>
                )}
              </label>
            </div>
            {form.model_file_name && (
              <button
                onClick={() => {
                  setForm(p => ({ ...p, model_file_path: "", model_file_name: "" }));
                  setModelUrl(null);
                }}
                className="text-xs text-destructive hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remover modelo
              </button>
            )}
          </CardContent>
        </Card>

        {/* 3D Viewer */}
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Visualização 3D</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Scene3D
              modelPath={form.model_file_path}
              modelUrl={modelUrl}
              projectId={project.id}
              onModelMetrics={onModelMetrics}
              dimensions={
                form.length_m && form.width_m && form.height_m
                  ? {
                      length: parseFloat(form.length_m),
                      width: parseFloat(form.width_m),
                      height: parseFloat(form.height_m),
                    }
                  : null
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}