// ============================================================
//  Rise of Arcane and Valor — Main System File
//  rav.js  v0.2.0
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
  tierThresholds: {
    novice:      1,
    expert:      4,
    master:      7,
    grandmaster: 9
  },
  successThreshold: 7
};

// ============================================================
//  SPECIALTY DESCRIPTIONS
//  Shown as tooltips on the character sheet
// ============================================================

const RAV_SPEC_DESCRIPTIONS = {
  armorer:          "Novice: +1 Armor Soak. Expert: Ignore 1 Armor damage per hit. Master: Repair armor in the field with no tools.",
  armsmaster:       "Novice: +1 damage on attacks. Expert: Wield two weapons or a two-handed weapon. Master: +1 additional attack per round.",
  bodybuilding:     "Novice: +2 max HP. Expert: +4 max HP, ignore 1 point of unarmed damage. Master: +6 max HP.",
  caster:           "Novice: Reduce spell MP cost by 1 (min 1). Expert: Cast two spells per action once per round. Master: Ignore spell tier requirements once per session.",
  learning:         "Novice: Learn new skills 25% faster. Expert: Teach others at normal speed. Master: Can raise Skill Tiers through teaching.",
  meditation:       "Novice: Recover 1 MP per round of rest. Expert: Recover 2 MP per round. Master: Recover 3 MP at the start of each round.",
  relicKnowledge:   "Novice: Identify Common and Uncommon relics. Expert: Identify Rare relics and sense curses. Master: Identify Legendary relics.",
  monsterKnowledge: "Novice: Know basic stats of Common monsters. Expert: Know skills of Uncommon monsters. Master: Know full stat blocks of Rare monsters.",
  alchemy:          "Novice: Brew basic potions. Expert: Brew advanced potions and poisons. Master: Create experimental concoctions with unique effects.",
  tinkering:        "Novice: Craft simple mechanical devices. Expert: Craft complex traps and gadgets. Master: Create unique mechanical artifacts.",
  repair:           "Novice: Remove up to 2 damage points from gear. Expert: Fully repair gear in the field. Master: Repair Broken gear without a forge.",
  perception:       "Novice: +1d10 to Awareness checks. Expert: +1d10 and re-roll 1d10 for sight-based checks. Master: Cannot be surprised.",
  investigation:    "Novice: Find hidden clues automatically on success. Expert: Deduce NPC motives on 2+ successes. Master: Reconstruct past events from a scene.",
  appraisal:        "Novice: Estimate item value within 20%. Expert: Detect forgeries. Master: Identify magical properties without Relic Knowledge.",
  disarmTrap:       "Novice: Disarm simple traps. Expert: Disarm complex traps and reset them. Master: Disarm magical traps.",
  forgeDocument:    "Novice: Forge basic documents. Expert: Forge official seals and signatures. Master: Create flawless forgeries of any document.",
  pickLock:         "Novice: Pick simple locks. Expert: Pick complex locks and magical locks. Master: Open any lock given enough time.",
  eloquence:        "Novice: +1d10 to Speech in formal settings. Expert: Re-roll 1 die on failed Speech checks. Master: Sway crowds with a short speech.",
  merchant:         "Novice: Buy items 10% cheaper. Expert: +1d10 and re-roll 1d10 for trading Speech checks. Master: +2d10 to trading, access rare goods.",
  performance:      "Novice: Earn modest income from performances. Expert: Captivate an audience, distract guards. Master: Performances can influence NPC attitudes.",
  forage:           "Novice: Find food for 1 person per success. Expert: Find rare herbs and alchemical ingredients. Master: Never go hungry in the wild.",
  tracking:         "Novice: Track creatures over easy terrain. Expert: Track over any terrain, determine creature type. Master: Track creatures that tried to hide their trail."
};



// ============================================================
//  2. INIT
// ============================================================

Hooks.once("init", function () {
  console.log("RAV | Initialising Rise of Arcane and Valor system");
  game.rav = { RAV };

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

  _registerHandlebarsHelpers();
});

// ============================================================
//  3. HANDLEBARS HELPERS
// ============================================================

function _registerHandlebarsHelpers() {
  Handlebars.registerHelper("eq",  (a, b) => a === b);
  Handlebars.registerHelper("gt",  (a, b) => a > b);
  Handlebars.registerHelper("lte", (a, b) => a <= b);
  Handlebars.registerHelper("add", (a, b) => Number(a) + Number(b));

  Handlebars.registerHelper("tierLabel", (tier) => RAV.tiers[tier] ?? tier);

  Handlebars.registerHelper("capitalize", (str) => {
    if (typeof str !== "string") return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  Handlebars.registerHelper("times", function (n, block) {
    let result = "";
    for (let i = 0; i < n; i++) result += block.fn(i);
    return result;
  });

  Handlebars.registerHelper("dotFilled", (index, value) => (index + 1) <= value);
}

// ============================================================
//  4. CHARACTER SHEET
// ============================================================

class RAVActorSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rav", "sheet", "actor", "character"],
      template: "systems/rav/templates/actor-sheet.html",
      width: 800,
      height: 900,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
    });
  }

  getData() {
    const context  = super.getData();
    context.RAV              = RAV;
    context.system           = context.actor.system;
    context.flags            = context.actor.flags;
    context.specDescriptions = RAV_SPEC_DESCRIPTIONS;
    this._prepareHealthMagic(context);
    this._prepareSuggestedTiers(context);
    return context;
  }

  _prepareHealthMagic(context) {
    const end = context.system.attributes.endurance.value ?? 1;
    context.system.health.max = 5 + (end * 2);
    context.system.magic.max  = 5 + (end * 2);
  }

  // Adds a suggestedTier field to each skill/specialty based on level
  // This is shown as a visual hint but does NOT override the player's chosen tier
  _prepareSuggestedTiers(context) {
    for (const group of Object.values(context.system.skills)) {
      for (const skill of Object.values(group)) {
        skill.suggestedTier = _tierFromLevel(skill.level);
        skill.tierMismatch  = skill.suggestedTier !== skill.tier;
      }
    }
    for (const spec of Object.values(context.system.specialties)) {
      spec.suggestedTier = _tierFromLevel(spec.level);
      spec.tierMismatch  = spec.suggestedTier !== spec.tier;
    }
  }



  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    html.find(".luck-roll").click(this._onRollLuck.bind(this));
    html.find(".attribute-roll").click(this._onRollAttribute.bind(this));
    html.find(".skill-roll").click(this._onRollSkill.bind(this));
    html.find(".hp-btn").click(this._onHPChange.bind(this));
    html.find(".mp-btn").click(this._onMPChange.bind(this));
    html.find(".item-create").click(this._onItemCreate.bind(this));
    html.find(".item-equip").click(this._onItemEquip.bind(this));
    html.find(".item-edit").click(this._onItemEdit.bind(this));
    html.find(".item-delete").click(this._onItemDelete.bind(this));

    // Re-render sheet when attribute value changes so dots update
    html.find(".attribute-value").change(async (event) => {
      const input = event.currentTarget;
      const value = Math.clamped(parseInt(input.value) || 1, 1, 5);
      await this.actor.update({ [input.name]: value });
    });
  }

  // --- LUCK ---

  async _onRollLuck(event) {
    event.preventDefault();
    const roll = await new Roll("1d6").evaluate();
    await this.actor.update({ "system.attributes.luck.value": roll.total });
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor:  `🍀 ${this.actor.name} rolls for Luck — <strong>${roll.total}</strong> point(s) this session!`
    });
  }

  // --- ATTRIBUTE ROLL ---

  async _onRollAttribute(event) {
    event.preventDefault();
    const attrKey   = event.currentTarget.dataset.attribute;
    const attrValue = this.actor.system.attributes[attrKey]?.value ?? 1;
    const attrLabel = RAV.attributes[attrKey] ?? attrKey;
    const luck      = this.actor.system.attributes.luck.value ?? 0;

    await _showRollDialog({
      actor:      this.actor,
      title:      `${attrLabel} Check`,
      dicePool:   attrValue,
      skillLabel: attrLabel,
      skillLevel: 0,
      tier:       "novice",
      luck
    });
  }

  // --- SKILL ROLL ---

  async _onRollSkill(event) {
    event.preventDefault();
    const el       = event.currentTarget;
    const group    = el.dataset.group;
    const skillKey = el.dataset.skill;
    const skill    = this.actor.system.skills[group][skillKey];
    const luck     = this.actor.system.attributes.luck.value ?? 0;

    const attrOptions = Object.entries(RAV.attributes).map(([k, v]) => {
      const dots = this.actor.system.attributes[k].value;
      return `<option value="${k}">${v} — ${dots}d10</option>`;
    }).join("");

    const content = `
      <form class="rav-dialog">
        <div class="dialog-field">
          <label>Attribute</label>
          <select name="attribute">${attrOptions}</select>
        </div>
        <div class="dialog-field">
          <label>Skill Level</label>
          <input type="number" name="skillLevel" value="${skill.level}" min="0" max="9"/>
        </div>
        <div class="dialog-field">
          <label>Tier</label>
          <span class="tier-${skill.tier}">${RAV.tiers[skill.tier] ?? skill.tier}</span>
        </div>
        ${luck > 0 ? `
        <div class="dialog-field luck-field">
          <label>🍀 Spend Luck (${luck} remaining)</label>
          <input type="checkbox" name="useLuck"/>
        </div>` : ""}
      </form>`;

    new Dialog({
      title:   `${skill.label} Check`,
      content,
      buttons: {
        roll: {
          label: "Roll",
          callback: async (html) => {
            const attrKey    = html.find("[name=attribute]").val();
            const skillLevel = parseInt(html.find("[name=skillLevel]").val()) || 0;
            const useLuck    = html.find("[name=useLuck]").prop("checked");
            const attrValue  = this.actor.system.attributes[attrKey].value ?? 1;
            const tier       = _tierFromLevel(skillLevel);

            if (useLuck && luck > 0) {
              await this.actor.update({ "system.attributes.luck.value": luck - 1 });
            }

            await _rollCheck({
              actor:      this.actor,
              flavor:     `${skill.label} + ${RAV.attributes[attrKey]}`,
              dicePool:   attrValue,
              skillLevel,
              tier,
              useLuck
            });
          }
        },
        cancel: { label: "Cancel" }
      },
      default: "roll"
    }).render(true);
  }

  // --- HP / MP ---

  async _onHPChange(event) {
    event.preventDefault();
    const delta   = parseInt(event.currentTarget.dataset.delta);
    const current = this.actor.system.health.value;
    const max     = this.actor.system.health.max;
    await this.actor.update({ "system.health.value": Math.clamped(current + delta, 0, max) });
  }

  async _onMPChange(event) {
    event.preventDefault();
    const delta   = parseInt(event.currentTarget.dataset.delta);
    const current = this.actor.system.magic.value;
    const max     = this.actor.system.magic.max;
    await this.actor.update({ "system.magic.value": Math.clamped(current + delta, 0, max) });
  }

  // --- ITEMS ---

  async _onItemCreate(event) {
    event.preventDefault();
    const type = event.currentTarget.dataset.type ?? "weapon";
    const name = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const [item] = await this.actor.createEmbeddedDocuments("Item", [{ name, type, system: {} }]);
    item.sheet.render(true);
  }

  async _onItemEquip(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item-row").dataset.itemId;
    const item   = this.actor.items.get(itemId);
    await item.update({ "system.equipped": !item.system.equipped });
  }

  _onItemEdit(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item-row").dataset.itemId;
    this.actor.items.get(itemId).sheet.render(true);
  }

  async _onItemDelete(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item-row").dataset.itemId;
    await Dialog.confirm({
      title:   "Delete Item",
      content: "<p>Are you sure?</p>",
      yes:     () => this.actor.deleteEmbeddedDocuments("Item", [itemId])
    });
  }
}

// ============================================================
//  5. NPC SHEET
// ============================================================

class RAVNPCSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rav", "sheet", "actor", "npc"],
      template: "systems/rav/templates/npc-sheet.html",
      width: 660,
      height: 720,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
    });
  }

  getData() {
    const context  = super.getData();
    context.RAV    = RAV;
    context.system = context.actor.system;
    const end = context.system.attributes.endurance.value ?? 1;
    context.system.health.max = 5 + (end * 2);
    context.system.magic.max  = 5 + (end * 2);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;
    html.find(".attribute-roll").click(this._onRollAttribute.bind(this));
    html.find(".hp-btn").click(this._onHPChange.bind(this));
    html.find(".mp-btn").click(this._onMPChange.bind(this));
    html.find(".action-add-btn").click(this._onActionAdd.bind(this));
    html.find(".action-delete-btn").click(this._onActionDelete.bind(this));
    html.find(".action-roll-btn").click(this._onActionRoll.bind(this));
  }

  async _onRollAttribute(event) {
    event.preventDefault();
    const attrKey   = event.currentTarget.dataset.attribute;
    const attrValue = this.actor.system.attributes[attrKey]?.value ?? 1;
    const attrLabel = RAV.attributes[attrKey] ?? attrKey;
    await _rollCheck({ actor: this.actor, flavor: `${attrLabel} Check`, dicePool: attrValue, skillLevel: 0, tier: "novice" });
  }

  async _onHPChange(event) {
    event.preventDefault();
    const delta   = parseInt(event.currentTarget.dataset.delta);
    const current = this.actor.system.health.value;
    const max     = this.actor.system.health.max;
    await this.actor.update({ "system.health.value": Math.clamped(current + delta, 0, max) });
  }

  async _onMPChange(event) {
    event.preventDefault();
    const delta   = parseInt(event.currentTarget.dataset.delta);
    const current = this.actor.system.magic.value;
    const max     = this.actor.system.magic.max;
    await this.actor.update({ "system.magic.value": Math.clamped(current + delta, 0, max) });
  }

  // Add a blank action row
  async _onActionAdd(event) {
    event.preventDefault();
    const actions  = foundry.utils.deepClone(this.actor.system.actions ?? {});
    const key      = "action_" + Date.now();
    actions[key]   = { name: "New Action", target: "One; Adjacent", roll: "2d10" };
    await this.actor.update({ "system.actions": actions });
  }

  // Delete an action row
  async _onActionDelete(event) {
    event.preventDefault();
    const key     = event.currentTarget.dataset.actionKey;
    const actions = foundry.utils.deepClone(this.actor.system.actions ?? {});
    delete actions[key];
    await this.actor.update({ "system.actions": actions });
  }

  // Roll an action directly from the stat block
  async _onActionRoll(event) {
    event.preventDefault();
    const key    = event.currentTarget.dataset.actionKey;
    const action = this.actor.system.actions[key];
    if (!action?.roll) return;

    // Parse roll formula — strip MP cost if present (e.g. "3MP; 4d10 + 1" → "4d10 + 1")
    const formula = action.roll.includes(";")
      ? action.roll.split(";")[1].trim()
      : action.roll.trim();

    try {
      const roll = await new Roll(formula).evaluate();
      const successes = roll.dice.reduce((sum, d) => {
        return sum + d.results.filter(r => r.result >= RAV.successThreshold).length;
      }, 0);

      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor:  `<strong>${action.name}</strong> — ${action.target}<br><em>${roll.formula}</em> → ${successes} success${successes !== 1 ? "es" : ""}`
      });
    } catch(e) {
      ui.notifications.warn(`Could not parse roll formula: ${formula}`);
    }
  }
}

// ============================================================
//  6. ITEM SHEET
// ============================================================

class RAVItemSheet extends ItemSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rav", "sheet", "item"],
      template: "systems/rav/templates/item-sheet.html",
      width: 500,
      height: 420
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
//  7. ROLL DIALOG
// ============================================================

async function _showRollDialog({ actor, title, dicePool, skillLabel, skillLevel, tier, luck }) {
  const attrOptions = Object.entries(RAV.attributes).map(([k, v]) => {
    const dots = actor.system.attributes[k].value;
    return `<option value="${k}">${v} — ${dots}d10</option>`;
  }).join("");

  const content = `
    <form class="rav-dialog">
      <div class="dialog-field">
        <label>Attribute</label>
        <select name="attribute">${attrOptions}</select>
      </div>
      ${luck > 0 ? `
      <div class="dialog-field luck-field">
        <label>🍀 Spend Luck (${luck} remaining)</label>
        <input type="checkbox" name="useLuck"/>
      </div>` : ""}
    </form>`;

  new Dialog({
    title,
    content,
    buttons: {
      roll: {
        label: "Roll",
        callback: async (html) => {
          const attrKey   = html.find("[name=attribute]").val();
          const useLuck   = html.find("[name=useLuck]").prop("checked");
          const attrValue = actor.system.attributes[attrKey].value ?? 1;
          if (useLuck && luck > 0) {
            await actor.update({ "system.attributes.luck.value": luck - 1 });
          }
          await _rollCheck({ actor, flavor: `${skillLabel} + ${RAV.attributes[attrKey]}`, dicePool: attrValue, skillLevel, tier, useLuck });
        }
      },
      cancel: { label: "Cancel" }
    },
    default: "roll"
  }).render(true);
}

// ============================================================
//  8. CORE ROLL ENGINE
// ============================================================

async function _rollCheck({ actor, flavor, dicePool, skillLevel = 0, tier = "novice", useLuck = false }) {

  // Step 1: Base roll
  const pool      = Math.max(1, dicePool);
  const baseRoll  = await new Roll(`${pool}d10`).evaluate();
  let baseResults = baseRoll.dice[0].results.map(r => r.result);

  // Step 2: Luck — reroll lowest die
  if (useLuck) {
    const lowestIdx        = baseResults.indexOf(Math.min(...baseResults));
    const luckRoll         = await new Roll("1d10").evaluate();
    baseResults[lowestIdx] = luckRoll.dice[0].results[0].result;
  }

  // Step 3: Crits — natural 10s add bonus dice
  let critCount  = 0;
  let allResults = [...baseResults];
  for (let i = 0; i < allResults.length; i++) {
    if (allResults[i] === 10) {
      const bonus    = await new Roll("1d10").evaluate();
      const bonusDie = bonus.dice[0].results[0].result;
      allResults.push(bonusDie);
      critCount++;
      if (bonusDie === 10) {
        const bonus2 = await new Roll("1d10").evaluate();
        allResults.push(bonus2.dice[0].results[0].result);
        critCount++;
      }
    }
  }

  // Step 4: Apply skill bonus
  let modifiedResults = [...allResults];
  const bonusApplied  = [];

  if (skillLevel > 0) {
    if (tier === "novice") {
      const bonus = Math.ceil(skillLevel / 2);
      const r = _applyBonusToOne(modifiedResults, bonus);
      modifiedResults = r.results;
      bonusApplied.push({ idx: r.idx, amount: r.amount });
    } else if (tier === "expert") {
      const r = _applyBonusToOne(modifiedResults, skillLevel);
      modifiedResults = r.results;
      bonusApplied.push({ idx: r.idx, amount: r.amount });
    } else if (tier === "master") {
      const half1 = Math.ceil(skillLevel / 2);
      const half2 = Math.floor(skillLevel / 2);
      const r1 = _applyBonusToOne(modifiedResults, half1);
      modifiedResults = r1.results;
      bonusApplied.push({ idx: r1.idx, amount: r1.amount });
      if (half2 > 0) {
        const r2 = _applyBonusToOne(modifiedResults, half2);
        modifiedResults = r2.results;
        bonusApplied.push({ idx: r2.idx, amount: r2.amount });
      }
    } else if (tier === "grandmaster") {
      const r = _applyBonusGreedy(modifiedResults, skillLevel);
      modifiedResults = r.results;
      bonusApplied.push(...r.changes);
    }
  }

  // Step 5: Count successes
  const successes = modifiedResults.filter(r => r >= RAV.successThreshold).length;

  // Step 6: Render dice — show base → modified where changed
  const diceHTML = modifiedResults.map((modVal, i) => {
    const baseVal   = allResults[i] ?? modVal;
    const isSuccess = modVal >= RAV.successThreshold;
    const isCrit    = i >= baseResults.length;
    const modified  = bonusApplied.find(b => b.idx === i);
    const cssClass  = isSuccess ? "success" : "failure";
    const critMark  = isCrit ? '<span class="crit-mark">✦</span>' : "";

    let dieContent;
    if (modified && modified.amount > 0) {
      dieContent = `<span class="die-base">${baseVal}</span><span class="die-arrow">→</span><span class="die-final">${modVal}</span><span class="die-bonus">+${modified.amount}</span>`;
    } else {
      dieContent = `<span class="die-final alone">${modVal}</span>`;
    }

    return `<div class="die ${cssClass}${isCrit ? " crit" : ""}">${critMark}${dieContent}</div>`;
  }).join("");

  // Step 7: Build bonus description
  let bonusDesc = "";
  if (skillLevel > 0) {
    const tierLabel = RAV.tiers[tier] ?? tier;
    if (tier === "novice")      bonusDesc = `${tierLabel} · +${Math.ceil(skillLevel/2)} to 1 die`;
    else if (tier === "expert") bonusDesc = `${tierLabel} · +${skillLevel} to 1 die`;
    else if (tier === "master") bonusDesc = `${tierLabel} · +${Math.ceil(skillLevel/2)} / +${Math.floor(skillLevel/2)} across 2 dice`;
    else                        bonusDesc = `${tierLabel} · +${skillLevel} split optimally`;
  }

  const luckText  = useLuck ? `<div class="roll-tag luck-tag">🍀 Luck — lowest die rerolled</div>` : "";
  const critText  = critCount > 0 ? `<div class="roll-tag crit-tag">⚡ Critical — ${critCount} bonus die added</div>` : "";
  const bonusText = bonusDesc ? `<div class="roll-tag bonus-tag">${bonusDesc}</div>` : "";

  const luck    = actor.system.attributes.luck.value ?? 0;
  const luckBtn = luck > 0
    ? `<button class="luck-reroll-btn" data-actor-id="${actor.id}" data-message-id="PENDING">🍀 Spend Luck to reroll lowest die (${luck} left)</button>`
    : "";

  const content = `
    <div class="rav-roll">
      <div class="roll-header">
        <span class="roll-title">${flavor}</span>
        <span class="roll-pool">${pool}d10</span>
      </div>
      <div class="roll-tags">${bonusText}${luckText}${critText}</div>
      <div class="dice-tray">${diceHTML}</div>
      <div class="roll-footer">
        <span class="roll-successes">${successes} Success${successes !== 1 ? "es" : ""}</span>
      </div>
      ${luckBtn}
    </div>`;

  const msg = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls:   [baseRoll]
  });

  // Patch the message id into the luck button now we have it
  if (luck > 0 && msg) {
    const updated = content.replace(`data-message-id="PENDING"`, `data-message-id="${msg.id}"`);
    await msg.update({ content: updated });
  }

  return { successes, results: modifiedResults };
}

// ============================================================
//  9. LUCK REROLL FROM CHAT
// ============================================================

Hooks.on("renderChatMessage", (message, html) => {
  html.find(".luck-reroll-btn").click(async (event) => {
    event.preventDefault();
    const btn     = event.currentTarget;
    const actorId = btn.dataset.actorId;
    const actor   = game.actors.get(actorId);
    if (!actor) return;

    const luck = actor.system.attributes.luck.value ?? 0;
    if (luck <= 0) {
      ui.notifications.warn("No Luck points remaining!");
      return;
    }

    await actor.update({ "system.attributes.luck.value": luck - 1 });

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="rav-roll">
        <div class="roll-header"><span class="roll-title">🍀 ${actor.name} spends Luck</span></div>
        <p>Reroll your chosen die and apply the new result manually.</p>
        <p><em>Luck remaining: ${luck - 1}</em></p>
      </div>`
    });

    btn.disabled    = true;
    btn.textContent = `🍀 Luck spent (${luck - 1} remaining)`;
  });
});

// ============================================================
//  10. BONUS HELPERS
// ============================================================

function _applyBonusToOne(results, bonus) {
  const arr = [...results];
  let bestIdx = -1;
  let bestGap = Infinity;

  for (let i = 0; i < arr.length; i++) {
    const gap = RAV.successThreshold - arr[i];
    if (gap > 0 && gap <= bonus && gap < bestGap) {
      bestIdx = i;
      bestGap = gap;
    }
  }

  if (bestIdx === -1) {
    let hi = 0;
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > arr[hi] && arr[i] < 10) hi = i;
    }
    bestIdx = hi;
  }

  const before = arr[bestIdx];
  arr[bestIdx] = Math.min(10, arr[bestIdx] + bonus);
  return { results: arr, idx: bestIdx, amount: arr[bestIdx] - before };
}

function _applyBonusGreedy(results, bonus) {
  const arr     = [...results];
  let remaining = bonus;
  const changes = [];

  while (remaining > 0) {
    let bestIdx = -1;
    let bestGap = Infinity;
    for (let i = 0; i < arr.length; i++) {
      const gap = RAV.successThreshold - arr[i];
      if (gap > 0 && gap < bestGap) { bestIdx = i; bestGap = gap; }
    }
    if (bestIdx === -1) {
      let hi = 0;
      for (let i = 1; i < arr.length; i++) if (arr[i] > arr[hi]) hi = i;
      const before = arr[hi];
      arr[hi]      = Math.min(10, arr[hi] + remaining);
      changes.push({ idx: hi, amount: arr[hi] - before });
      break;
    }
    const add    = Math.min(remaining, bestGap);
    const before = arr[bestIdx];
    arr[bestIdx] += add;
    remaining    -= add;
    changes.push({ idx: bestIdx, amount: arr[bestIdx] - before });
  }

  return { results: arr, changes };
}

// ============================================================
//  11. UTILITIES
// ============================================================

function _tierFromLevel(level) {
  if (level >= 9) return "grandmaster";
  if (level >= 7) return "master";
  if (level >= 4) return "expert";
  return "novice";
}
