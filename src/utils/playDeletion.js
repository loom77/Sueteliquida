export function getPlayDeleteDescription(play, gameName = 'este juego') {
  if (play?.purchased) {
    return `La jugada de ${gameName} está registrada como comprada. Se eliminará de Primy, pero esto no anula el boleto físico ni la apuesta realizada. ¿Quieres continuar?`;
  }

  return `La jugada de ${gameName} se eliminará del archivo de Primy. Después podrás deshacer la acción desde el aviso de confirmación.`;
}
