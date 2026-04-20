import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  imageSrc: string;
  onCropped: (blob: Blob) => Promise<void> | void;
  saving?: boolean;
}

async function getCroppedBlob(imageSrc: string, area: { x: number; y: number; width: number; height: number }): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = imageSrc;
  });
  const size = Math.min(area.width, area.height, 512);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.9));
}

export default function AvatarCropDialog({ open, onOpenChange, imageSrc, onCropped, saving }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<any>(null);

  const onCropComplete = useCallback((_: any, px: any) => setArea(px), []);

  const handleSave = async () => {
    if (!area) return;
    const blob = await getCroppedBlob(imageSrc, area);
    await onCropped(blob);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Atur Foto Profil</DialogTitle></DialogHeader>
        <div className="relative w-full h-72 bg-muted rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="flex items-center gap-3 px-1">
          <ZoomOut className="h-4 w-4 text-muted-foreground" />
          <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={(v) => setZoom(v[0])} className="flex-1" />
          <ZoomIn className="h-4 w-4 text-muted-foreground" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Batal</Button>
          <Button onClick={handleSave} disabled={saving || !area}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
