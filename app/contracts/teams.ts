// Equipos participantes del Game Jam.
// Para renombrar un equipo, edita `name` aquí: el cambio aplica a
// frontend y backend automáticamente. Los colores son fijos por equipo.
export interface Team {
  id: number;
  name: string;
  color: string;
}

export const TEAMS: Team[] = [
  { id: 1, name: "Pixel Raiders", color: "#FF8A00" },
  { id: 2, name: "Glitch Wizards", color: "#FFA7F0" },
  { id: 3, name: "Boss Fight Club", color: "#FF624D" },
  { id: 4, name: "Sprite Storm", color: "#3834FF" },
  { id: 5, name: "Null Pointer Ninjas", color: "#3ECF6B" },
  { id: 6, name: "Respawn Studio", color: "#F5D90A" },
  { id: 7, name: "Loot Box Labs", color: "#8B5A2B" },
  { id: 8, name: "Frame Perfect", color: "#9B5CFF" },
  { id: 9, name: "Crit Hit", color: "#00C2C7" },
  { id: 10, name: "Shader Knights", color: "#7CB342" },
  { id: 11, name: "Byte Bandits", color: "#E8D9B0" },
  { id: 12, name: "Speedrun Society", color: "#B0653A" },
  { id: 13, name: "Final Level", color: "#9AA0A6" },
];

export const TEAM_IDS = TEAMS.map((t) => t.id);

export function getTeam(id: number): Team | undefined {
  return TEAMS.find((t) => t.id === id);
}
