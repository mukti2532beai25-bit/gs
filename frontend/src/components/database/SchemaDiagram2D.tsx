import React from 'react';
import { TableMeta, RelationshipMeta } from '../../three/DatabaseArchitect3D';
import { Key, Link2, Database, Table as TableIcon } from 'lucide-react';

interface SchemaDiagram2DProps {
  tables: TableMeta[];
  relationships: RelationshipMeta[];
  selectedTableId: string | null;
  onSelectTable: (id: string) => void;
  activeTableIds: string[];
}

export default function SchemaDiagram2D({
  tables,
  relationships,
  selectedTableId,
  onSelectTable,
  activeTableIds,
}: SchemaDiagram2DProps) {
  return (
    <div className="w-full p-4 sm:p-6 bg-slate-950/80 rounded-2xl border border-white/10 overflow-x-auto min-h-[460px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Database className="w-4 h-4" />
          <span>2D Relational Entity Diagram (Strict 3NF Schema)</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Click table to inspect columns & functional dependencies
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => {
          const isActive = activeTableIds.includes(table.id);
          const isSelected = selectedTableId === table.id;

          return (
            <div
              key={table.id}
              onClick={() => onSelectTable(table.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-emerald-400 ring-2 ring-emerald-400/20 shadow-glow-emerald'
                  : isActive
                  ? 'bg-slate-900/60 border-white/10 hover:border-cyan-400/50 hover:bg-slate-900/80'
                  : 'bg-black/40 border-white/5 opacity-40 hover:opacity-75'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: table.color }}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{table.name}</h4>
                    <span className="text-[10px] text-slate-400 block">{table.role}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300">
                  {table.records} rows
                </span>
              </div>

              {/* Columns List */}
              <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {table.columns.map((col, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px] font-mono py-1 px-1.5 rounded hover:bg-white/5"
                  >
                    <div className="flex items-center gap-1.5">
                      {col.isPK && (
                        <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          PK
                        </span>
                      )}
                      {col.isFK && (
                        <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          FK
                        </span>
                      )}
                      <span className={col.isPK ? 'text-amber-200 font-semibold' : 'text-slate-300'}>
                        {col.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">{col.type}</span>
                  </div>
                ))}
              </div>

              {/* Foreign References */}
              {table.columns.some((c) => c.ref) && (
                <div className="mt-3 pt-2 border-t border-white/5 text-[10px] font-mono text-cyan-400/80 space-y-0.5">
                  {table.columns
                    .filter((c) => c.ref)
                    .map((c, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <Link2 className="w-3 h-3 shrink-0" />
                        <span>
                          {c.name} → {c.ref}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Relationships Table at Bottom */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <h5 className="text-xs font-mono text-slate-400 mb-2">Verified Schema Relational Edges:</h5>
        <div className="flex flex-wrap gap-2">
          {relationships.map((rel) => (
            <div
              key={rel.id}
              className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5"
            >
              <span className="text-cyan-400 font-bold">{rel.from}</span>
              <span className="text-slate-500">──({rel.label})──&gt;</span>
              <span className="text-emerald-400 font-bold">{rel.to}</span>
              <span className="text-slate-500 text-[9px]">({rel.fromCol} = {rel.toCol})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
