// Equipos participantes del Game Jam.
// Para renombrar un equipo, edita `name` aquí: el cambio aplica a
// frontend y backend automáticamente. Los colores son fijos por equipo.
export interface Team {
  id: number;
  name: string;
  color: string;
}

export const TEAMS: Team[] = [
  { id: 1, name: "Albacore", color: "#FF8A00" },
  { id: 2, name: "Alhajillo", color: "#FFA7F0" },
  { id: 3, name: "Axobite Games", color: "#FF624D" },
  { id: 4, name: "BuyuProduction", color: "#3834FF" },
  { id: 5, name: "Chulla", color: "#3ECF6B" },
  { id: 6, name: "CLUB DE REALIDAD VIRTUAL UTPL", color: "#F5D90A" },
  { id: 7, name: "Darlingsoft", color: "#8B5A2B" },
  { id: 8, name: "GC Studios", color: "#9B5CFF" },
  { id: 9, name: "Humita Productions", color: "#00C2C7" },
  { id: 10, name: "LAGER", color: "#7CB342" },
  { id: 11, name: "ShinyHunters", color: "#E8D9B0" },
  { id: 12, name: "Supay", color: "#B0653A" },
  { id: 13, name: "Yakuza Pixel", color: "#9AA0A6" },
  { id: 14, name: "Yuraq Michi Interactive", color: "#CA1414" },
  { id: 15, name: "Hámster", color: "#026f46" },
];

export const TEAM_IDS = TEAMS.map((t) => t.id);

export function getTeam(id: number): Team | undefined {
  return TEAMS.find((t) => t.id === id);
}
