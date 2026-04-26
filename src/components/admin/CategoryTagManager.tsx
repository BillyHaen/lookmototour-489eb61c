import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, Loader2 } from 'lucide-react';
import { useCategories, useTags, useCreateCategory, useCreateTag } from '@/hooks/useBlogTaxonomy';

interface Props {
  selectedCategories: string[];
  selectedTags: string[];
  onCategoriesChange: (ids: string[]) => void;
  onTagsChange: (ids: string[]) => void;
}

export default function CategoryTagManager({ selectedCategories, selectedTags, onCategoriesChange, onTagsChange }: Props) {
  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const createCat = useCreateCategory();
  const createTag = useCreateTag();
  const [newCat, setNewCat] = useState('');
  const [newTag, setNewTag] = useState('');

  const toggle = (id: string, list: string[], setter: (ids: string[]) => void) => {
    setter(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  };

  const addCat = async () => {
    if (!newCat.trim()) return;
    const c = await createCat.mutateAsync(newCat.trim());
    onCategoriesChange([...selectedCategories, c.id]);
    setNewCat('');
  };

  const addTag = async () => {
    if (!newTag.trim()) return;
    const t = await createTag.mutateAsync(newTag.trim());
    onTagsChange([...selectedTags, t.id]);
    setNewTag('');
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">Kategori</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(categories || []).map(c => (
            <Badge
              key={c.id}
              variant={selectedCategories.includes(c.id) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggle(c.id, selectedCategories, onCategoriesChange)}
            >
              {c.name}
              {selectedCategories.includes(c.id) && <X className="h-3 w-3 ml-1" />}
            </Badge>
          ))}
          {(categories || []).length === 0 && <span className="text-xs text-muted-foreground">Belum ada kategori.</span>}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Kategori baru..." value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCat())} className="h-8 text-sm" />
          <Button type="button" size="sm" onClick={addCat} disabled={createCat.isPending || !newCat.trim()}>
            {createCat.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Tag</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(tags || []).map(t => (
            <Badge
              key={t.id}
              variant={selectedTags.includes(t.id) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggle(t.id, selectedTags, onTagsChange)}
            >
              #{t.name}
              {selectedTags.includes(t.id) && <X className="h-3 w-3 ml-1" />}
            </Badge>
          ))}
          {(tags || []).length === 0 && <span className="text-xs text-muted-foreground">Belum ada tag.</span>}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Tag baru..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} className="h-8 text-sm" />
          <Button type="button" size="sm" onClick={addTag} disabled={createTag.isPending || !newTag.trim()}>
            {createTag.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
