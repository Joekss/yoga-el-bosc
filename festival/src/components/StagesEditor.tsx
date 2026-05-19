import { useState } from 'react';
import type { Festival, Stage } from '../types';
import { useStore } from '../store/store';

const PALETTE = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#a3e635'];

export default function StagesEditor({ festival }: { festival: Festival }) {
  const addStage = useStore((s) => s.addStage);
  const updateStage = useStore((s) => s.updateStage);
  const removeStage = useStore((s) => s.removeStage);
  const [name, setName] = useState('');

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {festival.stages.map((stage) => (
          <StageRow
            key={stage.id}
            stage={stage}
            onUpdate={(patch) => updateStage(festival.id, stage.id, patch)}
            onDelete={() => {
              if (confirm(`¿Borrar "${stage.name}" y sus sets?`)) removeStage(festival.id, stage.id);
            }}
          />
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nuevo escenario"
          className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={async () => {
            if (!name.trim()) return;
            const color = PALETTE[festival.stages.length % PALETTE.length];
            await addStage(festival.id, { id: crypto.randomUUID(), name: name.trim(), color });
            setName('');
          }}
          className="px-4 py-2 rounded-lg bg-ink-700 hover:bg-ink-600 text-sm"
        >
          Añadir
        </button>
      </div>
    </div>
  );
}

function StageRow({
  stage,
  onUpdate,
  onDelete,
}: {
  stage: Stage;
  onUpdate: (patch: Partial<Stage>) => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-2 bg-ink-800 border border-ink-700 rounded-lg px-3 py-2">
      <input
        type="color"
        value={stage.color}
        onChange={(e) => onUpdate({ color: e.target.value })}
        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
      />
      <input
        value={stage.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        className="flex-1 bg-transparent outline-none text-sm"
      />
      <button onClick={onDelete} className="text-ink-400 hover:text-red-400 text-sm">
        ✕
      </button>
    </li>
  );
}
