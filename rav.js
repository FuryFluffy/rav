// ============================================================
//  Rise of Arcane and Valor — Main System File
//  rav.js
// ============================================================

// ============================================================
//  1. CONSTANTS
// ============================================================

const RAV = {
  attributes: {
    might:       "Might",
    agility:     "Agility",
    endurance:   "Endurance",
    intellect:   "Intellect",
    personality: "Personality"
  },
  tiers: {
    novice:      "Novice",
    expert:      "Expert",
    master:      "Master",
    grandmaster: "Grand Master"
  },
  // At what skill level each tier unlocks
  tierThresholds: {
    novice:      1,
    expert:      4,
    master:      7,
    grandmaster: 9
  },
  successThreshold: 7  // A die result of 7+ counts as a success
};

// ============================================================
//  2. REGISTER THE SYSTEM ON INIT
// ============================================================

Hooks.once("init", function () {
  console.log("RAV | Initialising Rise of Arcane and Valor system");

  // Store RAV config on the global game object for easy access anywhere
  game.rav = { RAV };

  // Register Actor and Item sheet classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("rav", RAVActorSheet, {
    types: ["character"],
    makeDefault: true,
    label: "RAV Character Sheet"
  });
  Actors.registerSheet("rav", RAVNPCSheet, {
    types: ["npc"],
    makeDefault: true,
    label: "RAV NPC Sheet"
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("rav", RAVItemSheet, {
    makeDefault: true,
    label: "RAV Item Sheet"
  });

  // Register Handlebars helpers used in HTML templates
  _registerHandlebarsHelpers();
});

// ============================================================
//  3. HANDLEBARS HELPERS
//  These are small functions you can call inside your HTML
//  templates to do things like comparisons and formatting.
// ============================================================

function _registerHandlebarsHelpers() {

  // {{eq a b}} — returns true if a equals b
  Handlebars.registerHelper("eq", (a, b) => a === b);

  // {{gt a b}} — returns true if a is greater than b
  Handlebars.registerHelper("gt", (a, b) => a > b);

  // {{tierLabel tier}} — converts "grandmaster" to "Grand Master" etc.
  Handlebars.registerHelper("tierLabel", (tier) => {
    return RAV.tiers[tier] ?? tier;
  });

  // {{capitalize str}} — capitalises first letter
  Handlebars.registerHelper("capitalize", (str) => {
    if (typeof str !== "string") return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  // {{times n}} — lets you loop n times in a template (used for dot displays)
  Handlebars.registerHelper("times", function (n, block) {
    let result = "";
    for (let i = 0; i < n; i++) result += block.fn(i);
    return result;
  });

  // {{lte a b}} — returns true if a <= b (used for filled dot rendering)
  Handlebars.registerHelper("lte", (a, b) => a <= b);

  // {{add a b}} — adds two numbers (used for dot index comparison)
  Handlebars.registerHelper("add", (a, b) => a + b);
}

// ============================================================
//  4. RAV ACTOR SHEET — CHARACTER
// ============================================================

class RAVActorSheet extends ActorSheet {

  /** Default size and title of the sheet window */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rav", "sheet", "actor", "character"],
      template: "systems/rav/templates/actor-sheet.html",
      width: 780,
      height: 860,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
    });
  }

  /** Called every time the sheet renders — prepares data for the HTML template */
  getData() {
    const context = super.getData();
    const actorData = context.actor;

    // Attach the RAV config so templates can access tier labels etc.
    context.RAV = RAV;
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Pre-calculate HP and MP maximums from Endurance
    this._prepareHealthMagic(context);

    // Determine tier automatically from skill level
    this._prepareTiers(context);

    return context;
  }

  /** HP max = 5 + (Endurance × 2), MP max = 5 + (Endurance × 2)
   *  These match the rulebook's Endurance-based pool description.
   *  Adjust the formula here if your rulebook specifies different values. */
  _prepareHealthMagic(context) {
    const endurance = context.system.attributes.endurance.value ?? 1;
    context.system.health.max = 5 + (endurance * 2);
    context.system.magic.max  = 5 + (endurance * 2);
  }

  /** Auto-set tier based on skill level so GM doesn't have to manage it manually.
   *  Tier still requires a teacher to unlock in narrative, but the sheet
   *  reflects it automatically once the level is set. */
  _prepareTiers(context) {
    const skillGroups = context.system.skills;
    for (const group of Object.values(skillGroups)) {
      for (const skill of Object.values(group)) {
        skill.tier = _tierFromLevel(skill.level);
      }
    }
    const specialties = context.system.specialties;
    for (const spec of Object.values(specialties)) {
      spec.tier = _tierFromLevel(spec.level);
    }
  }

  /** Wire up all interactive elements after the sheet HTML is rendered */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) return;

    // Roll Luck (d6) for the session
    html.find(".luck-roll").click(this._onRollLuck.bind(this));

    // Roll an attribute (click the attribute label)
    html.find(".attribute-roll").click(this._onRollAttribute.bind(this));

    // Roll a skill check (click the skill name)
    html.find(".skill-roll").click(this._onRollSkill.bind(this));

    // Item controls (equip, edit, delete)
    html.find(".item-equip").click(this._onItemEquip.bind(this));
    html.find(".item-edit").click(this._onItemEdit.bind(this));
    html.find(".item-delete").click(this._onItemDelete.bind(this));

    // HP / MP quick adjustment buttons
    html.find(".hp-btn").click(this._onHPChange.bind(this));
    html.find(".mp-btn").click(this._onMPChange.bind(this));
  }

  // ----------------------------------------------------------
  //  ROLL HANDLERS
  // ----------------------------------------------------------

  /** Roll a d6 to determine Luck points for the session */
  async _onRollLuck(event) {
    event.preventDefault();
    const roll = await new Roll("1d6").evaluate();
    await this.actor.update({ "system.attributes.luck.value": roll.total });
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `🍀 ${this.actor.name} rolls for Luck — ${roll.total} point(s) this session!`
    });
  }

  /** Pure attribute check — just rolls the attribute's dice pool */
  async _onRollAttribute(event) {
    event.preventDefault();
    const attrKey = event.currentTarget.dataset.attribute;
    const attrValue = this.actor.system.attributes[attrKey]?.value ?? 1;
    const attrLabel = RAV.attributes[attrKey] ?? attrKey;

    await _rollCheck({
      actor: this.actor,
      flavor: `${attrLabel} Check`,
      dicePool: attrValue,
      skillBonus: 0,
      tier: "novice"
    });
  }

  /** Skill check — prompts GM/player to choose which attribute to pair with */
  async _onRollSkill(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const group   = element.dataset.group;   // "misc", "weapon", or "magic"
    const skillKey = element.dataset.skill;
    const skill    = this.actor.system.skills[group][skillKey];
    const skillLabel = skill.label;
    const skillLevel = skill.level ?? 0;
    const tier       = _tierFromLevel(skillLevel);

    // Build attribute selector dialog
    const attrOptions = Object.entries(RAV.attributes)
      .map(([k, v]) => `<option value="${k}">${v} (${this.actor.system.attributes[k].value}d10)</option>`)
      .join("");

    const content = `
      <form>
        <div class="form-group">
          <label>Attribute to pair with <strong>${skillLabel}</strong>:</label>
          <select name="attribute">${attrOptions}</select>
        </div>
      </form>`;

    new Dialog({
      title: `${skillLabel} Skill Check`,
      content,
      buttons: {
        roll: {
          label: "Roll",
          callback: async (html) => {
            const attrKey   = html.find("[name=attribute]").val();
            const attrValue = this.actor.system.attributes[attrKey].value ?? 1;
            const attrLabel = RAV.attributes[attrKey];
            await _rollCheck({
              actor: this.actor,
              flavor: `${skillLabel} + ${attrLabel}`,
              dicePool: attrValue,
              skillLevel,
              tier
            });
          }
        },
        cancel: { label: "Cancel" }
      },
      default: "roll"
    }).render(true);
  }

  // ----------------------------------------------------------
  //  HP / MP HANDLERS
  // ----------------------------------------------------------

  async _onHPChange(event) {
    event.preventDefault();
    const delta     = parseInt(event.currentTarget.dataset.delta);
    const current   = this.actor.system.health.value;
    const max       = this.actor.system.health.max;
    const newValue  = Math.clamped(current + delta, 0, max);
    await this.actor.update({ "system.health.value": newValue });
  }

  async _onMPChange(event) {
    event.preventDefault();
    const delta    = parseInt(event.currentTarget.dataset.delta);
    const current  = this.actor.system.magic.value;
    const max      = this.actor.system.magic.max;
    const newValue = Math.clamped(current + delta, 0, max);
    await this.actor.update({ "system.magic.value": newValue });
  }

  // ----------------------------------------------------------
  //  ITEM HANDLERS
  // ----------------------------------------------------------

  async _onItemEquip(event) {
    event.preventDefault();
    const itemId  = event.currentTarget.closest(".item").dataset.itemId;
    const item    = this.actor.items.get(itemId);
    await item.update({ "system.equipped": !item.system.equipped });
  }

  _onItemEdit(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item   = this.actor.items.get(itemId);
    item.sheet.render(true);
  }

  async _onItemDelete(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }
}

// ============================================================
//  5. RAV NPC SHEET
// ============================================================

class RAVNPCSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rav", "sheet", "actor", "npc"],
      template: "systems/rav/templates/npc-sheet.html",
      width: 620,
      height: 640,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats" }]
    });
  }

  getData() {
    const context = super.getData();
    context.RAV    = RAV;
    context.system = context.actor.system;
    this._prepareHealthMagic(context);
    return context;
  }

  _prepareHealthMagic(context) {
    const endurance = context.system.attributes.endurance.value ?? 1;
    context.system.health.max = 5 + (endurance * 2);
    context.system.magic.max  = 5 + (endurance * 2);
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;
    html.find(".attribute-roll").click(this._onRollAttribute.bind(this));
    html.find(".npc-skill-roll").click(this._onRollNPCSkill.bind(this));
    html.find(".hp-btn").click(this._onHPChange.bind(this));
  }

  async _onRollAttribute(event) {
    event.preventDefault();
    const attrKey   = event.currentTarget.dataset.attribute;
    const attrValue = this.actor.system.attributes[attrKey]?.value ?? 1;
    const attrLabel = RAV.attributes[attrKey] ?? attrKey;
    await _rollCheck({
      actor: this.actor,
      flavor: `${attrLabel} Check`,
      dicePool: attrValue,
      skillLevel: 0,
      tier: "novice"
    });
  }

  async _onRollNPCSkill(event) {
    event.preventDefault();
    const element    = event.currentTarget;
    const group      = element.dataset.group;
    const skillKey   = element.dataset.skill;
    const skill      = this.actor.system.skills[group][skillKey];
    const skillLevel = skill.level ?? 0;
    const tier       = _tierFromLevel(skillLevel);

    const attrOptions = Object.entries(RAV.attributes)
      .map(([k, v]) => `<option value="${k}">${v} (${this.actor.system.attributes[k].value}d10)</option>`)
      .join("");

    new Dialog({
      title: `${skill.label} Check`,
      content: `<form><div class="form-group">
        <label>Attribute:</label>
        <select name="attribute">${attrOptions}</select>
      </div></form>`,
      buttons: {
        roll: {
          label: "Roll",
          callback: async (html) => {
            const attrKey   = html.find("[name=attribute]").val();
            const attrValue = this.actor.system.attributes[attrKey].value ?? 1;
            await _rollCheck({
              actor: this.actor,
              flavor: `${skill.label} Check`,
              dicePool: attrValue,
              skillLevel,
              tier
            });
          }
        },
        cancel: { label: "Cancel" }
      },
      default: "roll"
    }).render(true);
  }

  async _onHPChange(event) {
    event.preventDefault();
    const delta    = parseInt(event.currentTarget.dataset.delta);
    const current  = this.actor.system.health.value;
    const max      = this.actor.system.health.max;
    const newValue = Math.clamped(current + delta, 0, max);
    await this.actor.update({ "system.health.value": newValue });
  }
}

// ============================================================
//  6. RAV ITEM SHEET
// ============================================================

class RAVItemSheet extends ItemSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rav", "sheet", "item"],
      template: "systems/rav/templates/item-sheet.html",
      width: 480,
      height: 380
    });
  }

  getData() {
    const context  = super.getData();
    context.RAV    = RAV;
    context.system = context.item.system;
    return context;
  }
}

// ============================================================
//  7. CORE ROLL ENGINE — the d10+ mechanic
// ============================================================

/**
 * The heart of the RAV system.
 *
 * How the d10+ mechanic works:
 *   1. Roll [dicePool]d10 based on the chosen Attribute.
 *   2. Apply the skill bonus to the LOWEST die that can benefit most
 *      (or split across dice at Master/Grand Master tier).
 *   3. Count dice with final value >= 7 as successes.
 *   4. Natural 10s trigger a Critical Roll — roll 1 extra d10 each.
 *
 * @param {object} options
 * @param {Actor}  options.actor       The actor making the roll
 * @param {string} options.flavor      Chat message header
 * @param {number} options.dicePool    Number of d10s to roll (from attribute)
 * @param {number} options.skillLevel  Skill level value
 * @param {string} options.tier        "novice" | "expert" | "master" | "grandmaster"
 */
async function _rollCheck({ actor, flavor, dicePool, skillLevel = 0, tier = "novice" }) {

  // --- Step 1: Roll the base dice pool ---
  const pool = Math.max(1, dicePool);
  const roll  = await new Roll(`${pool}d10`).evaluate();
  let results = roll.dice[0].results.map(r => r.result);

  // --- Step 2: Handle Critical Rolls (natural 10s get bonus dice) ---
  let critBonus = [];
  for (const r of results) {
    if (r === 10) {
      const bonusRoll = await new Roll("1d10").evaluate();
      critBonus.push(...bonusRoll.dice[0].results.map(r => r.result));
    }
  }
  // Bonus dice can themselves crit
  for (const r of critBonus) {
    if (r === 10) {
      const bonusRoll = await new Roll("1d10").evaluate();
      critBonus.push(...bonusRoll.dice[0].results.map(r => r.result));
    }
  }
  results = [...results, ...critBonus];

  // --- Step 3: Apply skill bonus to die results based on tier ---
  //
  //  Novice:      add HALF skill level (rounded up) to ONE die
  //  Expert:      add FULL skill level to ONE die
  //  Master:      SPLIT skill level across TWO dice
  //  Grand Master: SPLIT skill level across ANY number of dice
  //
  // Strategy: always boost the die closest to 7 (the success threshold)
  // to maximise the chance of turning near-misses into successes.

  let modifiedResults = [...results];

  if (skillLevel > 0) {
    if (tier === "novice") {
      const bonus = Math.ceil(skillLevel / 2);
      modifiedResults = _applyBonusToOne(modifiedResults, bonus);

    } else if (tier === "expert") {
      modifiedResults = _applyBonusToOne(modifiedResults, skillLevel);

    } else if (tier === "master") {
      // Split into two roughly equal halves, apply each to best candidate
      const half1 = Math.ceil(skillLevel / 2);
      const half2 = Math.floor(skillLevel / 2);
      modifiedResults = _applyBonusToOne(modifiedResults, half1);
      if (half2 > 0) modifiedResults = _applyBonusToOne(modifiedResults, half2);

    } else if (tier === "grandmaster") {
      // Distribute 1 point at a time to each die below 7, then repeat
      modifiedResults = _applyBonusGreedy(modifiedResults, skillLevel);
    }
  }

  // --- Step 4: Count successes (7 or higher) ---
  const successes = modifiedResults.filter(r => r >= RAV.successThreshold).length;

  // --- Step 5: Build and send chat message ---
  const diceDisplay = modifiedResults.map((r, i) => {
    const isSuccess  = r >= RAV.successThreshold;
    const wasCrit    = i < results.length && results[i] === 10;
    const cssClass   = isSuccess ? "success" : "failure";
    const critMark   = wasCrit ? " ✦" : "";
    return `<span class="die ${cssClass}">${r}${critMark}</span>`;
  }).join(" ");

  const tierLabel  = RAV.tiers[tier] ?? tier;
  const bonusText  = skillLevel > 0
    ? `<p><em>${tierLabel} tier — Skill bonus: +${skillLevel}</em></p>`
    : "";

  const critText   = critBonus.length > 0
    ? `<p><strong>⚡ Critical Roll! ${critBonus.length} bonus die/dice added.</strong></p>`
    : "";

  const content = `
    <div class="rav-roll">
      <h3>${flavor}</h3>
      ${bonusText}
      ${critText}
      <div class="dice-results">${diceDisplay}</div>
      <p class="successes"><strong>Successes: ${successes}</strong></p>
    </div>`;

  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    rolls: [roll]
  });

  return { successes, results: modifiedResults };
}

// ----------------------------------------------------------
//  BONUS DISTRIBUTION HELPERS
// ----------------------------------------------------------

/**
 * Apply a flat bonus to the single die that benefits most.
 * Priority: the die whose result + bonus first reaches or exceeds 7.
 * If no die can be pushed to 7, boost the highest die instead.
 */
function _applyBonusToOne(results, bonus) {
  const arr = [...results];

  // Find the best candidate: lowest die that can reach 7 with the bonus
  let bestIdx = -1;
  let bestVal = Infinity;
  for (let i = 0; i < arr.length; i++) {
    const needed = RAV.successThreshold - arr[i];
    if (needed > 0 && needed <= bonus && arr[i] < bestVal) {
      bestIdx = i;
      bestVal = arr[i];
    }
  }

  // If no die can reach 7, just boost the highest non-10 die
  if (bestIdx === -1) {
    let highestIdx = 0;
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > arr[highestIdx] && arr[i] < 10) highestIdx = i;
    }
    bestIdx = highestIdx;
  }

  arr[bestIdx] = Math.min(10, arr[bestIdx] + bonus);
  return arr;
}

/**
 * Grand Master tier: distribute bonus points greedily across all dice,
 * prioritising those just below the success threshold.
 */
function _applyBonusGreedy(results, bonus) {
  const arr = [...results];
  let remaining = bonus;

  while (remaining > 0) {
    // Find the die closest to 7 from below
    let bestIdx = -1;
    let bestGap = Infinity;
    for (let i = 0; i < arr.length; i++) {
      const gap = RAV.successThreshold - arr[i];
      if (gap > 0 && gap < bestGap) {
        bestIdx = i;
        bestGap = gap;
      }
    }
    // No more dice below threshold — dump remainder on highest die
    if (bestIdx === -1) {
      let highestIdx = 0;
      for (let i = 1; i < arr.length; i++) {
        if (arr[i] > arr[highestIdx]) highestIdx = i;
      }
      arr[highestIdx] = Math.min(10, arr[highestIdx] + remaining);
      break;
    }
    const add = Math.min(remaining, bestGap);
    arr[bestIdx] += add;
    remaining    -= add;
  }

  return arr;
}

// ============================================================
//  8. UTILITY FUNCTIONS
// ============================================================

/**
 * Determine tier from skill level.
 * Grand Master: 9+, Master: 7-8, Expert: 4-6, Novice: 1-3
 */
function _tierFromLevel(level) {
  if (level >= 9) return "grandmaster";
  if (level >= 7) return "master";
  if (level >= 4) return "expert";
  return "novice";
}
