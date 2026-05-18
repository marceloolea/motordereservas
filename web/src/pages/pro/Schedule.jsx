import { WeeklySchedule } from './components/WeeklySchedule';
import { ExceptionsSection } from './components/ExceptionsSection';

export function SchedulePage() {
  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-slate-900">
            Disponibilidad
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Configurá tu horario semanal recurrente. Los clientes solo verán
            slots dentro de estas franjas.
          </p>
        </div>
        <WeeklySchedule />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Excepciones</h2>
          <p className="text-slate-600 mt-1 text-sm">
            Bloqueá días o agregá disponibilidad puntual fuera del horario
            semanal.
          </p>
        </div>
        <ExceptionsSection />
      </section>
    </div>
  );
}
