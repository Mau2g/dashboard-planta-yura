// Stub — full implementation in Task 11/12
export interface TipoB { id: number; nombre: string; familia: string; }
export interface ParticipacionRow { tipo: string; familia: string; tm: number; pct: number; }
export interface FamiliaRow { familia: string; tm: number; }
export interface PlanVsRealRow { fecha: string; plan: number; real: number; }

export async function getTipos(): Promise<TipoB[]> { return []; }
export async function guardarParte(_payload: any): Promise<void> { return; }
export async function cargarParte(_fecha: string): Promise<any | null> { return null; }
export async function getParticipacionDia(_fecha: string): Promise<ParticipacionRow[]> { return []; }
export async function getDespachoPorFamilia(_fecha: string): Promise<FamiliaRow[]> { return []; }
export async function getComparativaAnual(_fecha: string): Promise<any[]> { return []; }
export async function getPlanVsReal(_fecha: string): Promise<PlanVsRealRow[]> { return []; }
