// ============================================================
//  Rise of Arcane and Valor — Main System File
//  rav.js  v0.3.0 — FOUNDATION FIXES
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
  armorer:          "Novice: +1d10 Defense. Expert: Re-roll 1d10 for Defense. Master: Defense success on 6. Grand Master: Re-roll any dice once.",
  armsmaster:       "Novice: +1 damage. Expert: Dual wield/Two-handed. Master: +1 damage. Grand Master: +2 damage.",
  bodybuilding:     "Novice: +1d10 Attack. Expert: +1 HP. Master: +1 HP. Grand Master: +1d10 Attack.",
  caster:           "Novice: +1 magical damage. Expert: Upcharge. Master: +1 magical damage. Grand Master: +2 magical damage.",
  learning:         "Novice: Level in 3/4 day. Expert: Level in 1/2 day. Master: Can teach. Grand Master: +10% gained EXP.",
  meditation:       "Novice: Recover 1 MP/round. Expert: +1 MP. Master: +1 MP. Grand Master: Recover 3 MP/round.",
  relicKnowledge:   "Novice: Uncommon. Expert: Rare. Master: Legendary. Grand Master: Mythic.",
  monsterKnowledge: "Novice: Uncommon. Expert: Rare. Master: Ancient. Grand Master: Mythic.",
  alchemy:          "Novice: Basic potions. Expert: Mix basic. Master: Mix effect. Grand Master: Mix Master.",
  tinkering:        "Novice: Basic. Expert: Advanced. Master: Upgrade weapons. Grand Master: Replicate enchantments.",
  repair:           "Novice: Minor fixes. Expert: Detailed fixes. Master: Restore broken. Grand Master: Replicate items.",
  perception:       "Novice: +1d10 Awareness (looking). Expert: Re-roll 1d10. Master: +1d10 Awareness. Grand Master: Re-roll any dice once.",
  investigation:    "Novice: +1d10 Awareness (searching). Expert: Re-roll 1d10. Master: +1d10 Awareness. Grand Master: Re-roll any dice once.",
  appraisal:        "Novice: +1d10 Awareness (appraisal). Expert: Re-roll 1d10. Master: +1d10 Awareness. Grand Master: Re-roll any dice once.",
  disarmTrap:       "Novice: +1d10 Espionage (disarm). Expert: Re-roll 1d10. Master: +1d10 Espionage. Grand Master: Re-roll any dice once.",
  forgeDocument:    "Novice: Invitations. Expert: Common documents. Master: Official documents. Grand Master: Royal documents.",
  pickLock:         "Novice: +1d10 Espionage (pick). Expert: Re-roll 1d10. Master: +1d10 Espionage. Grand Master: Re-roll any dice once.",
  eloquence:        "Novice: +1d10 Speech (speak). Expert: Re-roll 1d10. Master: +1d10 Speech. Grand Master: Re-roll any dice once.",
  merchant:         "Novice: +1d10 Speech (trade). Expert: Re-roll 1d10. Master: +1d10 Speech. Grand Master: Re-roll any dice once.",
  performance:      "Novice: +1d10 Staging. Expert: Re-roll 1d10. Master: +1d10 Staging. Grand Master: Re-roll any dice once.",
  forage:           "Novice: +1d10 Survival (forage). Expert: Re-roll 1d10. Master: +1d10 Survival. Grand Master: Re-roll any dice once.",
  tracking:         "Novice: +1d10 Survival (track). Expert: Re-roll 1d10. Master: +1d10 Survival. Grand Master: Re-roll any dice once."
};

// ============================================================
//  2. INIT
// ============================================================

Hooks.once("init", function () {
  console.log("RAV | Initialising Rise of Arcane and Valor system v0.3.0");
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
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }],
      dragDrop: [{ dragSelector: ".item-row", dropSelector: null }]
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

  // FIXED: Proper HP/MP calculation
  _prepareHealthMagic(context) {
    const might = context.system.attributes.might.value ?? 1;
    const end   = context.system.attributes.endurance.value ?? 1;
    const int   = context.system.attributes.intellect.value ?? 1;
    const pers  = context.system.attributes.personality.value ?? 1;
    
    // HP = Might + Endurance
    context.system.health.max = might + end;
    
    // MP = (Intellect OR Personality) + Endurance
    const mpSource = context.system.magic.source ?? "intellect";
    const mentalStat = mpSource === "intellect" ? int : pers;
    context.system.magic.max = mentalStat + end;
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
    html.find(".mp-source-toggle").click(this._onMPSourceToggle.bind(this));
    html.find(".item-create").click(this._onItemCreate.bind(this));
    html.find(".item-equip").click(this._onItemEquip.bind(this));
    html.find(".item-edit").click(this._onItemEdit.bind(this));
    html.find(".item-delete").click(this._onItemDelete.bind(this));
    html.find(".spell-cast").click(this._onSpellCast.bind(this));

    // Re-render sheet when attribute value changes so dots and HP/MP update
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
    
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="rav-roll">
        <div class="roll-header"><span class="roll-title">🍀 ${this.actor.name} rolls for Session Luck</span></div>
        <div class="dice-tray"><div class="die success"><span class="die-final alone">${roll.total}</span></div></div>
        <p style="margin-top:6px; font-size:13px; color:#a8987a;">Luck set to ${roll.total} for this session.</p>
      </div>`,
      rolls: [roll]
    });
  }

  // --- ATTRIBUTES ---

  async _onRollAttribute(event) {
    event.preventDefault();
    const attr = event.currentTarget.dataset.attribute;
    const value = this.actor.system.attributes[attr]?.value ?? 1;
    const label = RAV.attributes[attr];

    await _rollD10Pool({
      actor: this.actor,
      pool: value,
      flavor: `${label} Check`,
      skillLevel: 0,
      tier: "novice"
    });
  }

  // --- SKILLS ---

  async _onRollSkill(event) {
    event.preventDefault();
    const group = event.currentTarget.dataset.group;
    const skill = event.currentTarget.dataset.skill;
    const skillData = this.actor.system.skills[group][skill];

    // Ask which attribute to use
    const attrChoice = await Dialog.prompt({
      title: `Roll ${skillData.label}`,
      content: `
        <div class="rav-dialog">
          <p>Which attribute do you want to use for this <strong>${skillData.label}</strong> check?</p>
          <div class="dialog-field">
            <label>Attribute:</label>
            <select id="attr-select" style="flex:1;">
              <option value="might">Might</option>
              <option value="agility">Agility</option>
              <option value="endurance">Endurance</option>
              <option value="intellect">Intellect</option>
              <option value="personality">Personality</option>
            </select>
          </div>
        </div>`,
      callback: (html) => html.find("#attr-select").val(),
      rejectClose: false
    });

    if (!attrChoice) return;

    const attrValue = this.actor.system.attributes[attrChoice]?.value ?? 1;
    const attrLabel = RAV.attributes[attrChoice];

    await _rollD10Pool({
      actor: this.actor,
      pool: attrValue,
      flavor: `${skillData.label} (${attrLabel})`,
      skillLevel: skillData.level,
      tier: skillData.tier
    });
  }

  // --- HP/MP CONTROLS ---

  async _onHPChange(event) {
    event.preventDefault();
    const delta = parseInt(event.currentTarget.dataset.delta);
    const current = this.actor.system.health.value;
    const max = this.actor.system.health.max;
    const newValue = Math.clamped(current + delta, 0, max);
    await this.actor.update({ "system.health.value": newValue });
  }

  async _onMPChange(event) {
    event.preventDefault();
    const delta = parseInt(event.currentTarget.dataset.delta);
    const current = this.actor.system.magic.value;
    const max = this.actor.system.magic.max;
    const newValue = Math.clamped(current + delta, 0, max);
    await this.actor.update({ "system.magic.value": newValue });
  }

  // NEW: MP Source Toggle
  async _onMPSourceToggle(event) {
    event.preventDefault();
    const currentSource = this.actor.system.magic.source ?? "intellect";
    const newSource = currentSource === "intellect" ? "personality" : "intellect";
    await this.actor.update({ "system.magic.source": newSource });
    ui.notifications.info(`MP now based on ${newSource === "intellect" ? "Intellect" : "Personality"}`);
  }

  // --- ITEMS ---

  async _onItemCreate(event) {
    event.preventDefault();
    const type = event.currentTarget.dataset.type;
    const itemData = {
      name: `New ${type.capitalize()}`,
      type: type,
      system: {}
    };
    await this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  async _onItemEquip(event) {
    event.preventDefault();
    const row = event.currentTarget.closest(".item-row");
    const itemId = row.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    await item.update({ "system.equipped": !item.system.equipped });
  }

  _onItemEdit(event) {
    event.preventDefault();
    const row = event.currentTarget.closest(".item-row");
    const item = this.actor.items.get(row.dataset.itemId);
    if (item) item.sheet.render(true);
  }

  async _onItemDelete(event) {
    event.preventDefault();
    const row = event.currentTarget.closest(".item-row");
    const item = this.actor.items.get(row.dataset.itemId);
    if (item) {
      const confirmed = await Dialog.confirm({
        title: "Delete Item",
        content: `<p>Are you sure you want to delete <strong>${item.name}</strong>?</p>`
      });
      if (confirmed) await item.delete();
    }
  }

  // NEW: Cast Spell
  async _onSpellCast(event) {
    event.preventDefault();
    const row = event.currentTarget.closest(".item-row");
    const spell = this.actor.items.get(row.dataset.itemId);
    if (!spell) return;

    const mpCost = spell.system.mpCost ?? 0;
    const currentMP = this.actor.system.magic.value;

    if (currentMP < mpCost) {
      ui.notifications.warn(`Not enough MP! Need ${mpCost}, have ${currentMP}.`);
      return;
    }

    // Deduct MP
    await this.actor.update({ "system.magic.value": currentMP - mpCost });

    // Get magic skill level for the spell's school
    const school = spell.system.school;
    const magicSkill = this.actor.system.skills.magic[school];
    const skillLevel = magicSkill?.level ?? 0;
    const tier = magicSkill?.tier ?? "novice";

    // Parse dice pool from spell (e.g., "3d10")
    const diceMatch = spell.system.dicePool?.match(/(\d+)d10/);
    const pool = diceMatch ? parseInt(diceMatch[1]) : 0;

    if (pool > 0) {
      await _rollD10Pool({
        actor: this.actor,
        pool: pool,
        flavor: `${spell.name} (${spell.system.school.capitalize()})`,
        skillLevel: skillLevel,
        tier: tier,
        extraInfo: `MP Cost: ${mpCost}`
      });
    } else {
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div class="rav-roll">
          <div class="roll-header"><span class="roll-title">${spell.name}</span></div>
          <p><strong>School:</strong> ${spell.system.school.capitalize()}</p>
          <p><strong>MP Cost:</strong> ${mpCost}</p>
          <p><strong>Effect:</strong> ${spell.system.effect}</p>
          <p><strong>Duration:</strong> ${spell.system.duration}</p>
        </div>`
      });
    }
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
      width: 700,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
    });
  }

  getData() {
    const context = super.getData();
    context.system = context.actor.system;
    context.RAV = RAV;
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
    const attr = event.currentTarget.dataset.attribute;
    const value = this.actor.system.attributes[attr]?.value ?? 1;
    const label = RAV.attributes[attr];

    await _rollD10Pool({
      actor: this.actor,
      pool: value,
      flavor: `${label} Check`,
      skillLevel: 0,
      tier: "novice"
    });
  }

  async _onHPChange(event) {
    event.preventDefault();
    const delta = parseInt(event.currentTarget.dataset.delta);
    const current = this.actor.system.health.value;
    const max = this.actor.system.health.max;
    await this.actor.update({ "system.health.value": Math.clamped(current + delta, 0, max) });
  }

  async _onMPChange(event) {
    event.preventDefault();
    const delta = parseInt(event.currentTarget.dataset.delta);
    const current = this.actor.system.magic.value;
    const max = this.actor.system.magic.max;
    await this.actor.update({ "system.magic.value": Math.clamped(current + delta, 0, max) });
  }

  async _onActionAdd(event) {
    event.preventDefault();
    const actions = foundry.utils.duplicate(this.actor.system.actions || {});
    const newKey = `action_${Date.now()}`;
    actions[newKey] = { name: "New Action", target: "", roll: "" };
    await this.actor.update({ "system.actions": actions });
  }

  async _onActionDelete(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.actionKey;
    const actions = foundry.utils.duplicate(this.actor.system.actions || {});
    delete actions[key];
    await this.actor.update({ "system.actions": actions });
  }

  async _onActionRoll(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.actionKey;
    const action = this.actor.system.actions[key];
    if (!action) return;

    const rollMatch = action.roll.match(/(\d+)d10/);
    const pool = rollMatch ? parseInt(rollMatch[1]) : 0;

    if (pool > 0) {
      await _rollD10Pool({
        actor: this.actor,
        pool: pool,
        flavor: action.name,
        skillLevel: 0,
        tier: "novice"
      });
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
      width: 520,
      height: 480,
      tabs: []
    });
  }

  getData() {
    const context = super.getData();
    context.system = context.item.system;
    return context;
  }
}

// ============================================================
//  7. DICE ROLLING (with Specialty Bonuses)
// ============================================================

async function _rollD10Pool({ actor, pool, flavor, skillLevel = 0, tier = "novice", extraInfo = "" }) {
  const baseRoll = await new Roll(`${pool}d10`).evaluate();
  let baseResults = baseRoll.terms[0].results.map(r => r.result);

  // Step 1: Exploding 10s (Critical Rolls)
  let allResults = [...baseResults];
  let critCount = 0;
  for (let i = 0; i < allResults.length; i++) {
    if (allResults[i] === 10) {
      const critRoll = await new Roll("1d10").evaluate();
      allResults.push(critRoll.total);
      critCount++;
    }
  }

  // Step 2: Apply skill modifiers
  let modifiedResults = [...allResults];
  const bonusApplied = [];

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

  // Step 3: Count successes
  const successes = modifiedResults.filter(r => r >= RAV.successThreshold).length;

  // Step 4: Render dice
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

  // Step 5: Build bonus description
  let bonusDesc = "";
  if (skillLevel > 0) {
    const tierLabel = RAV.tiers[tier] ?? tier;
    if (tier === "novice")      bonusDesc = `${tierLabel} · +${Math.ceil(skillLevel/2)} to 1 die`;
    else if (tier === "expert") bonusDesc = `${tierLabel} · +${skillLevel} to 1 die`;
    else if (tier === "master") bonusDesc = `${tierLabel} · +${Math.ceil(skillLevel/2)} / +${Math.floor(skillLevel/2)} across 2 dice`;
    else                        bonusDesc = `${tierLabel} · +${skillLevel} split optimally`;
  }

  const critText  = critCount > 0 ? `<div class="roll-tag crit-tag">⚡ Critical — ${critCount} bonus die added</div>` : "";
  const bonusText = bonusDesc ? `<div class="roll-tag bonus-tag">${bonusDesc}</div>` : "";
  const extraText = extraInfo ? `<div class="roll-tag">${extraInfo}</div>` : "";

  const content = `
    <div class="rav-roll">
      <div class="roll-header">
        <span class="roll-title">${flavor}</span>
        <span class="roll-pool">${pool}d10</span>
      </div>
      <div class="roll-tags">${bonusText}${critText}${extraText}</div>
      <div class="dice-tray">${diceHTML}</div>
      <div class="roll-footer">
        <span class="roll-successes">${successes} Success${successes !== 1 ? "es" : ""}</span>
      </div>
    </div>`;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [baseRoll]
  });

  return { successes, results: modifiedResults };
}

// ============================================================
//  8. BONUS HELPERS
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
//  9. UTILITIES
// ============================================================

function _tierFromLevel(level) {
  if (level >= 9) return "grandmaster";
  if (level >= 7) return "master";
  if (level >= 4) return "expert";
  return "novice";
}
