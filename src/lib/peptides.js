/**
 * Peptide reconstitution + cycle math.
 *
 * Reconstitution: a vial holds `vialMg` of peptide; you add `bacMl` of
 * bacteriostatic water. Concentration = (mg * 1000) / mL  → mcg per mL.
 * To deliver a dose, draw doseVolume mL, shown also in insulin units (U-100).
 */
export function reconstitutedConcentration(vialMg, bacMl) {
  const mg = Number(vialMg);
  const ml = Number(bacMl);
  if (!mg || !ml) return null;
  return (mg * 1000) / ml; // mcg / mL
}

export function doseVolumeMl(doseAmount, doseUnit, concentrationMcgPerMl) {
  const amt = Number(doseAmount);
  if (!amt || !concentrationMcgPerMl) return null;
  let mcg;
  if (doseUnit === 'mcg') mcg = amt;
  else if (doseUnit === 'mg') mcg = amt * 1000;
  else return null; // IU / mL can't be converted without potency info
  return mcg / Number(concentrationMcgPerMl); // mL
}

/** Units on a standard U-100 insulin syringe (1 mL = 100 units). */
export function insulinUnits(volumeMl) {
  if (volumeMl == null) return null;
  return Math.round(volumeMl * 100 * 10) / 10;
}

/** Where the user is in an on/off peptide cycle for a given day. */
export function cycleStatus(cycleStartDate, weeksOn, weeksOff, today = new Date()) {
  if (!cycleStartDate || !weeksOn) return null;
  const start = new Date(cycleStartDate);
  const onDays = Number(weeksOn) * 7;
  const offDays = Number(weeksOff || 0) * 7;
  const period = onDays + offDays;
  const dayIndex = Math.floor((today.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / 86400000);

  if (dayIndex < 0) return { phase: 'pending', label: 'Not started', day: 0, total: period, onDay: false };
  if (period <= 0) return { phase: 'on', label: `Day ${dayIndex + 1}`, day: dayIndex + 1, total: onDays, onDay: true };

  const within = dayIndex % period;
  const phase = within < onDays ? 'on' : 'off';
  return {
    phase,
    onDay: phase === 'on',
    day: within + 1,
    total: period,
    label: `Day ${within + 1} of ${period}`
  };
}
