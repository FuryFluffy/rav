# RAV System v0.5.0 - Pending Roll Engine

## Core Roll Lifecycle

Implemented the approved RAV roll lifecycle:

**Base roll → Pending chat card → Confirm modifiers/rerolls → Final chat card**

## Added

- Pending roll chat cards for all existing d10 pool rolls.
- Suggested optimal Skill Tier modifier allocation.
- Manual Skill modifier editing from the pending chat card.
- Luck reroll button from the pending chat card.
- Finalize without skill modifier option.
- Final chat card showing base successes, skill allocation, rerolls, final successes, and result.
- Structured roll state stored on chat message flags at `flags.rav.pendingRoll`.

## Skill Tier Suggestion Rules

- Novice: uses `ceil(skill level / 2)` on one die.
- Expert: uses full Skill Level on one die.
- Master: splits full Skill Level across up to two dice.
- Grand Master: splits full Skill Level across any number of dice.

The optimizer prioritizes gaining the maximum possible number of successes, then minimizing wasted modifier points.

## Luck Reroll

- Spending a Luck reroll now consumes 1 Luck from the actor.
- After the reroll, the pending card recalculates the suggested optimal Skill allocation.

## Notes

- Attack, defense, and spell-specific bonuses are not fully automated yet. They should now be built on top of the pending roll engine.
- Current Critical Roll behavior from the previous helper is preserved: dice showing 10 generate bonus d10s.
