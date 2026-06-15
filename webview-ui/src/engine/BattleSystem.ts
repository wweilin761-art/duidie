export type CombatRisk = 'low' | 'medium' | 'fatal';

type IdCollection = readonly string[] | ReadonlySet<string>;

const BASE_DAMAGE: Record<string, number> = {
  villager: 8,
  builder: 7,
  farmer: 6,
  hunter: 10,
  warrior: 14,
};

const WEAPON_DAMAGE_BONUS: Record<string, number> = {
  sword: 10,
  iron_sword: 18,
  bow: 12,
  spear: 9,
};

const DEFENDER_DAMAGE: Record<string, number> = {
  goblin: 5,
  wolf: 10,
  boss_troll: 20,
};

export interface CombatInput {
  attackerDefId: string;
  defenderDefId: string;
  attackerHealth?: number;
  defenderHealth: number;
  defenderDamage?: number;
  weaponDefIds?: IdCollection;
}

export interface CombatPreview {
  expectedDamage: number;
  defenderWillDie: boolean;
  attackerRisk: CombatRisk;
}

export interface ApplyCombatRoundInput extends CombatInput {
  attackerUid?: string;
  battleCooldowns?: Record<string, number>;
  cooldownSeconds?: number;
}

export interface CombatRoundResult extends CombatPreview {
  attackerHealth: number;
  defenderHealth: number;
  retaliationDamage: number;
  attackerWillDie: boolean;
  battleCooldowns: Record<string, number>;
}

export function previewCombat(input: CombatInput): CombatPreview {
  const expectedDamage = getExpectedDamage(input.attackerDefId, input.weaponDefIds);
  const defenderWillDie = expectedDamage >= input.defenderHealth;
  const retaliationDamage = defenderWillDie ? 0 : getDefenderDamage(input);
  const attackerRisk = applyShieldRiskReduction(
    getRisk(retaliationDamage, input.attackerHealth ?? 100),
    input.weaponDefIds ?? []
  );

  return {
    expectedDamage,
    defenderWillDie,
    attackerRisk,
  };
}

export function applyCombatRound(input: ApplyCombatRoundInput): CombatRoundResult {
  const preview = previewCombat(input);
  const retaliationDamage = preview.defenderWillDie ? 0 : getDefenderDamage(input);
  const attackerHealth = Math.max(0, (input.attackerHealth ?? 100) - retaliationDamage);
  const defenderHealth = Math.max(0, input.defenderHealth - preview.expectedDamage);
  const battleCooldowns = { ...(input.battleCooldowns ?? {}) };

  if (input.attackerUid) {
    battleCooldowns[input.attackerUid] = input.cooldownSeconds ?? 8;
  }

  return {
    ...preview,
    attackerHealth,
    defenderHealth,
    retaliationDamage,
    attackerWillDie: attackerHealth <= 0,
    battleCooldowns,
  };
}

function getExpectedDamage(attackerDefId: string, weaponDefIds: IdCollection = []): number {
  const baseDamage = BASE_DAMAGE[attackerDefId] ?? 0;
  let weaponBonus = 0;

  for (const defId of weaponDefIds) {
    weaponBonus += WEAPON_DAMAGE_BONUS[defId] ?? 0;
  }

  return baseDamage + weaponBonus;
}

function getDefenderDamage(input: Pick<CombatInput, 'defenderDefId' | 'defenderDamage'>): number {
  return input.defenderDamage ?? DEFENDER_DAMAGE[input.defenderDefId] ?? 0;
}

function getRisk(retaliationDamage: number, attackerHealth: number): CombatRisk {
  if (attackerHealth <= 0 || retaliationDamage >= attackerHealth) {
    return 'fatal';
  }

  if (retaliationDamage >= attackerHealth / 2) {
    return 'medium';
  }

  return 'low';
}

function applyShieldRiskReduction(risk: CombatRisk, weaponDefIds: IdCollection): CombatRisk {
  if (!hasId(weaponDefIds, 'shield')) {
    return risk;
  }

  if (risk === 'fatal') {
    return 'medium';
  }

  if (risk === 'medium') {
    return 'low';
  }

  return 'low';
}

function hasId(ids: IdCollection, id: string): boolean {
  return Array.isArray(ids)
    ? (ids as readonly string[]).includes(id)
    : (ids as ReadonlySet<string>).has(id);
}
