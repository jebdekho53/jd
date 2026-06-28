'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button, Card, CardBody, Input, Select, Spinner, Textarea, useToast } from '@/design-system/primitives';
import {
  createAddonGroup,
  createCombo,
  createMenuCategory,
  createMenuItem,
  fetchMerchantMenu,
  linkAddonToItem,
  type MenuCategory,
} from '@/services/restaurant/menu-api';

const TABS = ['Categories', 'Items', 'Addon Groups', 'Combos', 'Link Addons'] as const;
type Tab = (typeof TABS)[number];

const DIET_TYPES = ['VEG', 'NON_VEG', 'EGG', 'VEGAN'] as const;
const SPICE_LEVELS = ['MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT'] as const;
const SELECTION_TYPES = ['SINGLE', 'MULTIPLE'] as const;

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export function MenuManagementContent({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('Categories');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['merchant', 'menu', storeId],
    queryFn: () => fetchMerchantMenu(storeId),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['merchant', 'menu', storeId] });

  const categoryMutation = useMutation({
    mutationFn: (body: { name: string; description?: string }) => createMenuCategory(storeId, body),
    onSuccess: () => { toast('Category created', 'success'); invalidate(); },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const itemMutation = useMutation({
    mutationFn: createMenuItem.bind(null, storeId),
    onSuccess: () => { toast('Menu item created', 'success'); invalidate(); },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const addonMutation = useMutation({
    mutationFn: createAddonGroup.bind(null, storeId),
    onSuccess: () => { toast('Addon group created', 'success'); invalidate(); },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const comboMutation = useMutation({
    mutationFn: createCombo.bind(null, storeId),
    onSuccess: () => { toast('Combo created', 'success'); invalidate(); },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const linkMutation = useMutation({
    mutationFn: ({ menuItemId, groupId }: { menuItemId: string; groupId: string }) =>
      linkAddonToItem(storeId, menuItemId, groupId),
    onSuccess: () => { toast('Addon group linked to item', 'success'); invalidate(); },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const categories = data?.categories ?? [];
  const addonGroups = data?.addonGroups ?? [];
  const combos = data?.combos ?? [];
  const allItems = categories.flatMap((c) => c.items ?? []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Menu Management</h1>
          <p className="text-sm text-slate-500">
            Categories, dishes, addon groups, and combos for this restaurant store.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/stores/${storeId}`}>
            <Button variant="secondary" size="sm">Store settings</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {tab === 'Categories' && (
            <CategoriesPanel
              categories={categories}
              loading={categoryMutation.isPending}
              onCreate={(name, description) => categoryMutation.mutate({ name, description })}
            />
          )}
          {tab === 'Items' && (
            <ItemsPanel
              categories={categories}
              loading={itemMutation.isPending}
              onCreate={(body) => itemMutation.mutate(body)}
            />
          )}
          {tab === 'Addon Groups' && (
            <AddonGroupsPanel
              groups={addonGroups}
              loading={addonMutation.isPending}
              onCreate={(body) => addonMutation.mutate(body)}
            />
          )}
          {tab === 'Combos' && (
            <CombosPanel
              combos={combos}
              items={allItems}
              loading={comboMutation.isPending}
              onCreate={(body) => comboMutation.mutate(body)}
            />
          )}
          {tab === 'Link Addons' && (
            <LinkAddonsPanel
              items={allItems}
              groups={addonGroups}
              loading={linkMutation.isPending}
              onLink={(menuItemId, groupId) => linkMutation.mutate({ menuItemId, groupId })}
            />
          )}
        </>
      )}
    </div>
  );
}

function CategoriesPanel({
  categories,
  loading,
  onCreate,
}: {
  categories: MenuCategory[];
  loading: boolean;
  onCreate: (name: string, description?: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="font-semibold text-slate-900">Add category</h2>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Starters" />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <Button
            loading={loading}
            disabled={!name.trim()}
            onClick={() => { onCreate(name.trim(), description.trim() || undefined); setName(''); setDescription(''); }}
          >
            <Plus className="h-4 w-4" /> Create category
          </Button>
        </CardBody>
      </Card>
      <div className="space-y-3">
        {categories.map((c) => (
          <Card key={c.id}>
            <CardBody className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{c.name}</p>
                {c.description && <p className="text-sm text-slate-500">{c.description}</p>}
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {(c.items?.length ?? c._count?.items ?? 0)} items
              </span>
            </CardBody>
          </Card>
        ))}
        {!categories.length && (
          <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No categories yet. Create your first menu category.
          </p>
        )}
      </div>
    </div>
  );
}

function ItemsPanel({
  categories,
  loading,
  onCreate,
}: {
  categories: MenuCategory[];
  loading: boolean;
  onCreate: (body: Parameters<typeof createMenuItem>[1]) => void;
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [description, setDescription] = useState('');
  const [dietType, setDietType] = useState<string>('VEG');
  const [spiceLevel, setSpiceLevel] = useState<string>('MEDIUM');
  const [prepTimeMins, setPrepTimeMins] = useState('15');

  const reset = () => { setName(''); setBasePrice(''); setDescription(''); };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="font-semibold text-slate-900">Add menu item</h2>
          <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {!categories.length && <option value="">Create a category first</option>}
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Dish name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Base price (₹)" type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Diet" value={dietType} onChange={(e) => setDietType(e.target.value)}>
              {DIET_TYPES.map((d) => <option key={d} value={d}>{formatLabel(d)}</option>)}
            </Select>
            <Select label="Spice" value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value)}>
              {SPICE_LEVELS.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
            </Select>
          </div>
          <Input label="Prep time (mins)" type="number" min={1} value={prepTimeMins} onChange={(e) => setPrepTimeMins(e.target.value)} />
          <Button
            loading={loading}
            disabled={!categoryId || !name.trim() || !basePrice}
            onClick={() => {
              onCreate({
                categoryId,
                name: name.trim(),
                basePrice: Number(basePrice),
                description: description.trim() || undefined,
                dietType,
                spiceLevel,
                prepTimeMins: Number(prepTimeMins) || 15,
              });
              reset();
            }}
          >
            <Plus className="h-4 w-4" /> Create item
          </Button>
        </CardBody>
      </Card>
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.id}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{cat.name}</h3>
            <div className="space-y-2">
              {(cat.items ?? []).map((item) => (
                <Card key={item.id}>
                  <CardBody className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{formatLabel(item.dietType)} · {item.prepTimeMins ?? 15} min</p>
                    </div>
                    <span className="font-semibold text-brand-700">₹{item.basePrice}</span>
                  </CardBody>
                </Card>
              ))}
              {!cat.items?.length && (
                <p className="text-sm text-slate-400">No items in this category.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddonGroupsPanel({
  groups,
  loading,
  onCreate,
}: {
  groups: Array<{ id: string; name: string; selectionType: string; isRequired: boolean; addons: Array<{ name: string; price: number }> }>;
  loading: boolean;
  onCreate: (body: Parameters<typeof createAddonGroup>[1]) => void;
}) {
  const [name, setName] = useState('');
  const [selectionType, setSelectionType] = useState('SINGLE');
  const [isRequired, setIsRequired] = useState(false);
  const [addonName, setAddonName] = useState('');
  const [addonPrice, setAddonPrice] = useState('');
  const [addons, setAddons] = useState<Array<{ name: string; price: number }>>([]);

  const addAddon = () => {
    if (!addonName.trim()) return;
    setAddons((a) => [...a, { name: addonName.trim(), price: Number(addonPrice) || 0 }]);
    setAddonName('');
    setAddonPrice('');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="font-semibold text-slate-900">Add addon group</h2>
          <Input label="Group name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Extra toppings" />
          <Select label="Selection type" value={selectionType} onChange={(e) => setSelectionType(e.target.value)}>
            {SELECTION_TYPES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
            Required selection
          </label>
          <div className="rounded-xl border border-slate-200 p-3 space-y-2">
            <p className="text-xs font-medium text-slate-500">Addons in group</p>
            <div className="flex gap-2">
              <Input placeholder="Addon name" value={addonName} onChange={(e) => setAddonName(e.target.value)} className="flex-1" />
              <Input placeholder="Price" type="number" min={0} value={addonPrice} onChange={(e) => setAddonPrice(e.target.value)} className="w-24" />
              <Button type="button" variant="secondary" size="sm" onClick={addAddon}>Add</Button>
            </div>
            {addons.map((a, i) => (
              <p key={i} className="text-sm text-slate-600">{a.name} — ₹{a.price}</p>
            ))}
          </div>
          <Button
            loading={loading}
            disabled={!name.trim()}
            onClick={() => {
              onCreate({ name: name.trim(), selectionType, isRequired, addons });
              setName(''); setAddons([]); setIsRequired(false);
            }}
          >
            <Plus className="h-4 w-4" /> Create addon group
          </Button>
        </CardBody>
      </Card>
      <div className="space-y-3">
        {groups.map((g) => (
          <Card key={g.id}>
            <CardBody>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold text-slate-900">{g.name}</p>
                <span className="text-xs text-slate-500">{formatLabel(g.selectionType)}{g.isRequired ? ' · Required' : ''}</span>
              </div>
              <ul className="space-y-1 text-sm text-slate-600">
                {g.addons.map((a) => (
                  <li key={a.name}>{a.name} — ₹{a.price}</li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
        {!groups.length && (
          <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No addon groups yet.
          </p>
        )}
      </div>
    </div>
  );
}

function CombosPanel({
  combos,
  items,
  loading,
  onCreate,
}: {
  combos: Array<{ id: string; name: string; comboPrice: number; items: Array<{ menuItem?: { name: string }; quantity: number }> }>;
  items: Array<{ id: string; name: string }>;
  loading: boolean;
  onCreate: (body: Parameters<typeof createCombo>[1]) => void;
}) {
  const [name, setName] = useState('');
  const [comboPrice, setComboPrice] = useState('');
  const [description, setDescription] = useState('');
  const [menuItemId, setMenuItemId] = useState(items[0]?.id ?? '');
  const [quantity, setQuantity] = useState('1');
  const [comboItems, setComboItems] = useState<Array<{ menuItemId: string; quantity: number }>>([]);

  const addItem = () => {
    if (!menuItemId) return;
    setComboItems((c) => [...c, { menuItemId, quantity: Number(quantity) || 1 }]);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="font-semibold text-slate-900">Add combo</h2>
          <Input label="Combo name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Combo price (₹)" type="number" min={0} value={comboPrice} onChange={(e) => setComboPrice(e.target.value)} />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <div className="rounded-xl border border-slate-200 p-3 space-y-2">
            <p className="text-xs font-medium text-slate-500">Items in combo</p>
            <div className="flex gap-2">
              <Select value={menuItemId} onChange={(e) => setMenuItemId(e.target.value)} className="flex-1">
                {!items.length && <option value="">Add menu items first</option>}
                {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </Select>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-20" />
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>Add</Button>
            </div>
            {comboItems.map((ci, idx) => {
              const label = items.find((i) => i.id === ci.menuItemId)?.name ?? ci.menuItemId;
              return <p key={idx} className="text-sm text-slate-600">{ci.quantity}× {label}</p>;
            })}
          </div>
          <Button
            loading={loading}
            disabled={!name.trim() || !comboPrice || !comboItems.length}
            onClick={() => {
              onCreate({
                name: name.trim(),
                comboPrice: Number(comboPrice),
                description: description.trim() || undefined,
                items: comboItems,
              });
              setName(''); setComboPrice(''); setDescription(''); setComboItems([]);
            }}
          >
            <Plus className="h-4 w-4" /> Create combo
          </Button>
        </CardBody>
      </Card>
      <div className="space-y-3">
        {combos.map((c) => (
          <Card key={c.id}>
            <CardBody>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold text-slate-900">{c.name}</p>
                <span className="font-semibold text-brand-700">₹{c.comboPrice}</span>
              </div>
              <ul className="text-sm text-slate-600">
                {c.items.map((it, i) => (
                  <li key={i}>{it.quantity}× {it.menuItem?.name ?? 'Item'}</li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
        {!combos.length && (
          <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No combos yet.
          </p>
        )}
      </div>
    </div>
  );
}

function LinkAddonsPanel({
  items,
  groups,
  loading,
  onLink,
}: {
  items: Array<{ id: string; name: string }>;
  groups: Array<{ id: string; name: string }>;
  loading: boolean;
  onLink: (menuItemId: string, groupId: string) => void;
}) {
  const [menuItemId, setMenuItemId] = useState(items[0]?.id ?? '');
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');

  return (
    <Card className="max-w-lg">
      <CardBody className="space-y-4">
        <h2 className="font-semibold text-slate-900">Link addon group to item</h2>
        <Select label="Menu item" value={menuItemId} onChange={(e) => setMenuItemId(e.target.value)}>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </Select>
        <Select label="Addon group" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </Select>
        <Button
          loading={loading}
          disabled={!menuItemId || !groupId}
          onClick={() => onLink(menuItemId, groupId)}
        >
          Link addon group
        </Button>
      </CardBody>
    </Card>
  );
}
