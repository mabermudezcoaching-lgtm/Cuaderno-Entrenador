import { Jugador } from '../types';
import { Users, Hourglass, Shield, Compass } from 'lucide-react';

interface StatsDashboardProps {
  players: Jugador[];
}

export default function StatsDashboard({ players }: StatsDashboardProps) {
  // 1. Calculate average age
  const calculateAge = (dob: string) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const totalPlayers = players.length;
  const avgAge = totalPlayers > 0
    ? (players.reduce((sum, p) => sum + calculateAge(p.fecha_nacimiento), 0) / totalPlayers).toFixed(1)
    : '0';

  // 2. Tally by Position
  const positionCounts = {
    Portero: 0,
    Defensa: 0,
    Centrocampista: 0,
    Delantero: 0,
  };

  // 3. Tally by Laterality
  const lateralityCounts = {
    Diestro: 0,
    Zurdo: 0,
    Ambidiestro: 0,
  };

  players.forEach((p) => {
    if (p.demarcacion in positionCounts) {
      positionCounts[p.demarcacion as keyof typeof positionCounts]++;
    }
    if (p.lateralidad in lateralityCounts) {
      lateralityCounts[p.lateralidad as keyof typeof lateralityCounts]++;
    }
  });

  const getPositionBarColor = (pos: string) => {
    switch (pos) {
      case 'Portero': return 'bg-amber-500';
      case 'Defensa': return 'bg-cyan-500';
      case 'Centrocampista': return 'bg-blue-500';
      case 'Delantero': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Total Jugadores */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 flex items-center gap-4 hover:border-slate-700 transition-colors">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-blue-400">
          <Users className="h-6 w-6" id="stat-icon-players" />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-display">Plantilla</span>
          <span className="text-3xl font-black font-display tracking-tight text-white block">{totalPlayers}</span>
          <span className="text-[10px] text-slate-500 block">Fichas oficiales</span>
        </div>
      </div>

      {/* Card 2: Edad Media */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 flex items-center gap-4 hover:border-slate-700 transition-colors">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-blue-400">
          <Hourglass className="h-6 w-6" id="stat-icon-age" />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-display">Edad Media</span>
          <span className="text-3xl font-black font-display tracking-tight text-white block">{avgAge} <span className="text-base font-normal text-slate-400">años</span></span>
          <span className="text-[10px] text-slate-500 block">Balance y veteranía</span>
        </div>
      </div>

      {/* Card 3: Distribución Demarcaciones */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2.5">
          <Shield className="h-4 w-4 text-blue-400" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-display">Líneas de Juego</span>
        </div>
        <div className="space-y-1.5">
          {Object.entries(positionCounts).map(([pos, count]) => {
            const pct = totalPlayers > 0 ? (count / totalPlayers) * 100 : 0;
            return (
              <div key={pos} className="flex items-center gap-2 text-[10px]">
                <span className="w-20 text-slate-400 truncate font-semibold font-mono">{pos}</span>
                <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/50">
                  <div 
                    className={`${getPositionBarColor(pos)} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-5 text-right font-black font-mono text-white">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card 4: Lateralidad */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2.5">
          <Compass className="h-4 w-4 text-blue-400" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-display">Pie Dominante</span>
        </div>
        <div className="space-y-1.5">
          {Object.entries(lateralityCounts).map(([lat, count]) => {
            const pct = totalPlayers > 0 ? (count / totalPlayers) * 100 : 0;
            return (
              <div key={lat} className="flex items-center gap-2 text-[10px]">
                <span className="w-20 text-slate-400 truncate font-semibold font-mono">{lat}</span>
                <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/50">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-5 text-right font-black font-mono text-white">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
