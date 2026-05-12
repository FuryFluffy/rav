// ============================================================
//  Rise of Arcane and Valor — Main System File
//  rav.js  v0.5.0 — PENDING ROLL ENGINE
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
  console.log("RAV | Initialising Rise of Arcane and Valor system v0.4.0");
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
  _registerChatCardListeners();
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
    this._prepareEquippedGear(context);
    
    return context;
  }

  // FIXED: Proper HP/MP calculation with Specialty bonuses
  _prepareHealthMagic(context) {
    const might = context.system.attributes.might.value ?? 1;
    const end   = context.system.attributes.endurance.value ?? 1;
    const int   = context.system.attributes.intellect.value ?? 1;
    const pers  = context.system.attributes.personality.value ?? 1;
    
    // Base HP = Might + Endurance
    let hpMax = might + end;
    
    // Bodybuilding bonuses to HP
    const bodybuilding = context.system.specialties.bodybuilding;
    if (bodybuilding && bodybuilding.level > 0) {
      const tier = bodybuilding.tier;
      if (tier === "expert") hpMax += 1;
      else if (tier === "master") hpMax += 2;
    }
    
    context.system.health.max = hpMax;
    
    // Base MP = (Intellect OR Personality) + Endurance
    const mpSource = context.system.magic.source ?? "intellect";
    const mentalStat = mpSource === "intellect" ? int : pers;
    let mpMax = mentalStat + end;
    
    // Meditation bonuses to MP
    const meditation = context.system.specialties.meditation;
    if (meditation && meditation.level > 0) {
      const tier = meditation.tier;
      if (tier === "expert") mpMax += 1;
      else if (tier === "master") mpMax += 2;
    }
    
    context.system.magic.max = mpMax;
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

  // Prepare equipped gear data for display
  _prepareEquippedGear(context) {
    const gearSlots = context.system.gear;
    context.equippedGear = {};
    
    for (const [slot, itemId] of Object.entries(gearSlots)) {
      if (itemId) {
        const item = this.actor.items.get(itemId);
        context.equippedGear[slot] = item ?? null;
      } else {
        context.equippedGear[slot] = null;
      }
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
    html.find(".equipped-item-unequip").click(this._onEquippedItemUnequip.bind(this));
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

    const isEquipped = item.system.equipped;
    
    if (isEquipped) {
      // Unequip: remove from slot and mark unequipped
      await this._unequipItem(item);
    } else {
      // Equip: find appropriate slot and equip
      await this._equipItem(item);
    }
  }

  async _equipItem(item) {
    let targetSlot = null;
    
    // Determine which slot this item goes in
    if (item.type === "weapon") {
      // Weapons go in right arm by default, or left if right is occupied
      if (!this.actor.system.gear.rightArm) {
        targetSlot = "rightArm";
      } else if (!this.actor.system.gear.leftArm) {
        targetSlot = "leftArm";
      } else {
        ui.notifications.warn("Both weapon slots are full! Unequip something first.");
        return;
      }
    } else if (item.type === "armor") {
      const armorType = item.system.armorType;
      
      if (armorType.startsWith("shield")) {
        // Shields go in left arm
        targetSlot = "leftArm";
      } else {
        // Armor goes in torso
        targetSlot = "torso";
      }
      
      // Check if slot is occupied
      if (this.actor.system.gear[targetSlot]) {
        ui.notifications.warn(`${targetSlot} slot is full! Unequip something first.`);
        return;
      }
    }
    
    if (targetSlot) {
      await item.update({ "system.equipped": true });
      await this.actor.update({ [`system.gear.${targetSlot}`]: item.id });
      ui.notifications.info(`${item.name} equipped to ${targetSlot}.`);
    }
  }

  async _unequipItem(item) {
    // Find which slot this item is in
    const gearSlots = this.actor.system.gear;
    let slotToClear = null;
    
    for (const [slot, itemId] of Object.entries(gearSlots)) {
      if (itemId === item.id) {
        slotToClear = slot;
        break;
      }
    }
    
    if (slotToClear) {
      await item.update({ "system.equipped": false });
      await this.actor.update({ [`system.gear.${slotToClear}`]: null });
      ui.notifications.info(`${item.name} unequipped.`);
    }
  }

  async _onEquippedItemUnequip(event) {
    event.preventDefault();
    const equippedDiv = event.currentTarget.closest(".equipped-item");
    const itemId = equippedDiv.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) await this._unequipItem(item);
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
//  7. DICE ROLLING — Pending Roll Engine
// ============================================================

async function _rollD10Pool({
  actor,
  pool,
  flavor,
  skillLevel = 0,
  tier = "novice",
  extraInfo = "",
  threshold = RAV.successThreshold,
  difficulty = null,
  rollType = "check",
  attribute = null,
  skillGroup = null,
  skillKey = null
}) {
  pool = Math.max(Number(pool) || 0, 0);
  threshold = Math.max(Number(threshold) || RAV.successThreshold, 2);

  const baseRoll = await new Roll(`${pool}d10`).evaluate();
  const baseDice = baseRoll.terms[0]?.results?.map(r => r.result) ?? [];

  // Critical Roll support: current system behavior keeps rolling an extra d10 for each 10.
  const allDice = [...baseDice];
  const criticalDice = [];
  for (let i = 0; i < allDice.length; i++) {
    if (allDice[i] === 10) {
      const critRoll = await new Roll("1d10").evaluate();
      allDice.push(critRoll.total);
      criticalDice.push(allDice.length - 1);
    }
  }

  const suggestion = RAVRollOptimizer.suggest({
    dice: allDice,
    skillLevel,
    tier,
    threshold
  });

  const state = {
    schemaVersion: 1,
    state: "pending",
    actorId: actor.id,
    tokenId: actor.token?.id ?? null,
    sceneId: actor.token?.parent?.id ?? null,
    rollType,
    flavor,
    attribute,
    skillGroup,
    skillKey,
    pool,
    threshold,
    difficulty,
    skillLevel: Number(skillLevel) || 0,
    tier: tier || "novice",
    extraInfo,
    baseDice,
    criticalDice,
    dice: allDice,
    skillAllocations: suggestion.allocations,
    rerolls: [],
    finalizedBy: null
  };

  const content = RAVPendingRollCard.render(state);

  const msg = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [baseRoll],
    flags: { rav: { pendingRoll: state } }
  });

  return { message: msg, state };
}

class RAVRollOptimizer {
  static suggest({ dice, skillLevel = 0, tier = "novice", threshold = RAV.successThreshold }) {
    skillLevel = Number(skillLevel) || 0;
    if (skillLevel <= 0 || !dice.length) return { allocations: [], unused: 0 };

    const rules = this._tierRules(skillLevel, tier);
    if (rules.budget <= 0 || rules.maxDice <= 0) return { allocations: [], unused: 0 };

    if (rules.maxDice === 1) return this._bestSingleDie(dice, rules.budget, threshold);
    if (Number.isFinite(rules.maxDice)) return this._bestLimitedSplit(dice, rules.budget, rules.maxDice, threshold);
    return this._bestGrandMasterSplit(dice, rules.budget, threshold);
  }

  static _tierRules(skillLevel, tier) {
    if (tier === "novice") return { budget: Math.ceil(skillLevel / 2), maxDice: 1 };
    if (tier === "expert") return { budget: skillLevel, maxDice: 1 };
    if (tier === "master") return { budget: skillLevel, maxDice: 2 };
    if (tier === "grandmaster") return { budget: skillLevel, maxDice: Infinity };
    return { budget: 0, maxDice: 0 };
  }

  static _bestSingleDie(dice, budget, threshold) {
    let bestIdx = -1;
    let bestScore = -Infinity;
    let bestAmount = 0;

    for (let i = 0; i < dice.length; i++) {
      const before = dice[i];
      const needed = Math.max(threshold - before, 0);
      const crosses = before < threshold && needed > 0 && needed <= budget;
      const amount = crosses ? needed : budget;
      const after = before + amount;
      const gained = (before < threshold && after >= threshold) ? 1 : 0;
      const waste = crosses ? budget - needed : budget;
      const closeness = Math.min(after, threshold) / threshold;
      const score = gained * 1000 - waste * 5 + closeness + before / 100;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
        bestAmount = amount;
      }
    }

    return {
      allocations: bestIdx >= 0 && bestAmount > 0 ? [{ dieIndex: bestIdx, amount: bestAmount }] : [],
      unused: Math.max(budget - bestAmount, 0)
    };
  }

  static _bestLimitedSplit(dice, budget, maxDice, threshold) {
    const n = dice.length;
    let best = { allocations: [], score: -Infinity, unused: budget };

    const indices = [];
    const walkIndices = (start) => {
      this._scoreAllocationSet(dice, indices, budget, threshold, best);
      if (indices.length >= maxDice) return;
      for (let i = start; i < n; i++) {
        indices.push(i);
        walkIndices(i + 1);
        indices.pop();
      }
    };
    walkIndices(0);

    return { allocations: best.allocations, unused: best.unused };
  }

  static _scoreAllocationSet(dice, indices, budget, threshold, best) {
    if (!indices.length) return;
    const amounts = new Array(indices.length).fill(0);

    const distribute = (pos, remaining) => {
      if (pos === indices.length) {
        const allocations = indices.map((dieIndex, i) => ({ dieIndex, amount: amounts[i] })).filter(a => a.amount > 0);
        const score = this._allocationScore(dice, allocations, budget, threshold);
        if (score.score > best.score) {
          best.allocations = allocations;
          best.score = score.score;
          best.unused = score.unused;
        }
        return;
      }
      for (let amount = 0; amount <= remaining; amount++) {
        amounts[pos] = amount;
        distribute(pos + 1, remaining - amount);
      }
    };

    distribute(0, budget);
  }

  static _bestGrandMasterSplit(dice, budget, threshold) {
    let remaining = budget;
    const allocations = [];
    const used = new Set();

    // Buy as many new successes as possible, cheapest gaps first.
    const candidates = dice
      .map((value, dieIndex) => ({ dieIndex, value, gap: threshold - value }))
      .filter(d => d.gap > 0 && d.gap <= remaining)
      .sort((a, b) => a.gap - b.gap || b.value - a.value);

    for (const c of candidates) {
      if (c.gap <= remaining) {
        allocations.push({ dieIndex: c.dieIndex, amount: c.gap });
        remaining -= c.gap;
        used.add(c.dieIndex);
      }
    }

    // Put leftover points on the die closest to success, mostly for transparency.
    if (remaining > 0) {
      let bestIdx = -1;
      let bestValue = -Infinity;
      for (let i = 0; i < dice.length; i++) {
        if (used.has(i)) continue;
        if (dice[i] < threshold && dice[i] > bestValue) {
          bestValue = dice[i];
          bestIdx = i;
        }
      }
      if (bestIdx === -1) {
        for (let i = 0; i < dice.length; i++) {
          if (dice[i] > bestValue) {
            bestValue = dice[i];
            bestIdx = i;
          }
        }
      }
      if (bestIdx >= 0) {
        allocations.push({ dieIndex: bestIdx, amount: remaining });
        remaining = 0;
      }
    }

    return { allocations, unused: remaining };
  }

  static _allocationScore(dice, allocations, budget, threshold) {
    const modified = RAVRollState.applyAllocations(dice, allocations);
    const baseSuccesses = RAVRollState.countSuccesses(dice, threshold);
    const finalSuccesses = RAVRollState.countSuccesses(modified, threshold);
    const gained = finalSuccesses - baseSuccesses;
    const spent = allocations.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const unused = Math.max(budget - spent, 0);
    const nearMisses = modified.reduce((sum, d) => sum + (d < threshold ? d / threshold : 1), 0);

    return {
      score: gained * 10000 - unused * 10 + nearMisses + spent / 100,
      unused
    };
  }
}

class RAVRollState {
  static applyAllocations(dice, allocations = []) {
    const modified = [...dice];
    for (const allocation of allocations) {
      const idx = Number(allocation.dieIndex);
      const amount = Number(allocation.amount) || 0;
      if (idx >= 0 && idx < modified.length && amount > 0) modified[idx] += amount;
    }
    return modified;
  }

  static countSuccesses(dice, threshold = RAV.successThreshold) {
    return dice.filter(d => Number(d) >= threshold).length;
  }

  static getFinalDice(state) {
    return this.applyAllocations(state.dice ?? [], state.skillAllocations ?? []);
  }

  static getSkillBudget(state) {
    return RAVRollOptimizer._tierRules(Number(state.skillLevel) || 0, state.tier).budget;
  }

  static getMaxModifiedDice(state) {
    return RAVRollOptimizer._tierRules(Number(state.skillLevel) || 0, state.tier).maxDice;
  }
}

class RAVPendingRollCard {
  static render(state) {
    const finalDice = RAVRollState.getFinalDice(state);
    const baseSuccesses = RAVRollState.countSuccesses(state.dice, state.threshold);
    const projectedSuccesses = RAVRollState.countSuccesses(finalDice, state.threshold);
    const budget = RAVRollState.getSkillBudget(state);
    const spent = (state.skillAllocations ?? []).reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const unused = Math.max(budget - spent, 0);
    const diceHTML = _renderDiceTray({ state, finalDice, pending: true });
    const suggestionText = _renderAllocationSummary(state, finalDice, unused);
    const difficultyText = state.difficulty ? `<span class="roll-difficulty">Difficulty ${state.difficulty}</span>` : "";
    const resultText = state.difficulty ? _resultLabel(projectedSuccesses, state.difficulty) : `${projectedSuccesses} projected`;
    const critText = state.criticalDice?.length ? `<div class="roll-tag crit-tag">⚡ Critical — ${state.criticalDice.length} bonus die${state.criticalDice.length !== 1 ? "s" : ""} added</div>` : "";
    const skillText = state.skillLevel > 0 ? `<div class="roll-tag bonus-tag">${RAV.tiers[state.tier] ?? state.tier} · Skill ${state.skillLevel} · Budget ${budget}</div>` : "";
    const extraText = state.extraInfo ? `<div class="roll-tag">${state.extraInfo}</div>` : "";

    return `
      <div class="rav-roll rav-pending-roll" data-rav-roll-state="pending">
        <div class="roll-header">
          <span class="roll-title">${_escapeHTML(state.flavor)} — Pending</span>
          <span class="roll-pool">${state.pool}d10</span>
        </div>
        <div class="roll-tags">${skillText}${critText}${extraText}<div class="roll-tag pending-tag">Pending: confirm modifiers/rerolls before final result</div></div>
        <div class="dice-tray">${diceHTML}</div>
        <div class="roll-summary">
          <div><strong>Base Successes:</strong> ${baseSuccesses}</div>
          <div><strong>Suggested Skill Use:</strong> ${suggestionText}</div>
          <div><strong>Projected Successes:</strong> ${projectedSuccesses} ${difficultyText}</div>
          <div><strong>Projected Result:</strong> ${resultText}</div>
        </div>
        <div class="rav-roll-actions">
          <button type="button" class="rav-roll-btn rav-accept-suggestion">Accept Suggestion</button>
          <button type="button" class="rav-roll-btn rav-edit-modifier">Edit Skill Modifier</button>
          <button type="button" class="rav-roll-btn rav-luck-reroll">Use Luck Reroll</button>
          <button type="button" class="rav-roll-btn rav-finalize-no-skill">Finalize Without Skill</button>
        </div>
      </div>`;
  }
}

class RAVFinalRollCard {
  static render(state) {
    const finalDice = RAVRollState.getFinalDice(state);
    const baseSuccesses = RAVRollState.countSuccesses(state.dice, state.threshold);
    const successes = RAVRollState.countSuccesses(finalDice, state.threshold);
    const diceHTML = _renderDiceTray({ state, finalDice, pending: false });
    const difficultyText = state.difficulty ? `<span class="roll-difficulty">Difficulty ${state.difficulty}</span>` : "";
    const resultText = state.difficulty ? _resultLabel(successes, state.difficulty) : `${successes} Success${successes !== 1 ? "es" : ""}`;
    const allocations = _renderAllocationSummary(state, finalDice, 0);
    const rerollText = state.rerolls?.length ? `<div><strong>Rerolls:</strong> ${state.rerolls.length}</div>` : "";
    const extraText = state.extraInfo ? `<div class="roll-tag">${state.extraInfo}</div>` : "";

    return `
      <div class="rav-roll rav-final-roll" data-rav-roll-state="final">
        <div class="roll-header">
          <span class="roll-title">${_escapeHTML(state.flavor)} — Final</span>
          <span class="roll-pool">${state.pool}d10</span>
        </div>
        <div class="roll-tags">${extraText}<div class="roll-tag final-tag">Final Result</div></div>
        <div class="dice-tray">${diceHTML}</div>
        <div class="roll-summary">
          <div><strong>Base Successes:</strong> ${baseSuccesses}</div>
          <div><strong>Skill Modifier:</strong> ${allocations}</div>
          ${rerollText}
          <div><strong>Successes:</strong> ${successes} ${difficultyText}</div>
          <div><strong>Result:</strong> ${resultText}</div>
        </div>
      </div>`;
  }
}

function _registerChatCardListeners() {
  Hooks.on("renderChatMessage", (message, html) => {
    const pending = message.getFlag("rav", "pendingRoll");
    if (!pending || pending.state !== "pending") return;

    html.find(".rav-accept-suggestion").click(ev => _onPendingRollFinalize(ev, message));
    html.find(".rav-edit-modifier").click(ev => _onPendingRollEditModifier(ev, message));
    html.find(".rav-luck-reroll").click(ev => _onPendingRollLuckReroll(ev, message));
    html.find(".rav-finalize-no-skill").click(ev => _onPendingRollFinalize(ev, message, { withoutSkill: true }));
  });
}

async function _onPendingRollFinalize(event, message, { withoutSkill = false } = {}) {
  event.preventDefault();
  const state = foundry.utils.duplicate(message.getFlag("rav", "pendingRoll"));
  if (!state || state.state !== "pending") return;

  if (withoutSkill) state.skillAllocations = [];
  state.state = "final";
  state.finalizedBy = game.user.id;

  await message.update({
    content: RAVFinalRollCard.render(state),
    flags: { rav: { pendingRoll: state } }
  });
}

async function _onPendingRollEditModifier(event, message) {
  event.preventDefault();
  const state = foundry.utils.duplicate(message.getFlag("rav", "pendingRoll"));
  if (!state || state.state !== "pending") return;

  if ((Number(state.skillLevel) || 0) <= 0) {
    ui.notifications.info("This roll has no skill modifier to edit.");
    return;
  }

  const budget = RAVRollState.getSkillBudget(state);
  const maxDice = RAVRollState.getMaxModifiedDice(state);
  const current = new Map((state.skillAllocations ?? []).map(a => [Number(a.dieIndex), Number(a.amount) || 0]));

  const rows = state.dice.map((value, i) => `
    <tr>
      <td>Die ${i + 1}</td>
      <td>${value}</td>
      <td><input type="number" class="rav-allocation-input" data-die-index="${i}" min="0" max="${budget}" value="${current.get(i) ?? 0}" style="width:70px;"/></td>
    </tr>`).join("");

  const maxDiceLabel = Number.isFinite(maxDice) ? maxDice : "any number of";
  const content = `
    <div class="rav-dialog">
      <p>Assign up to <strong>${budget}</strong> skill point${budget !== 1 ? "s" : ""} across <strong>${maxDiceLabel}</strong> dice.</p>
      <p class="hint">The system will reject allocations that exceed the tier limits.</p>
      <table class="rav-allocation-table">
        <thead><tr><th>Die</th><th>Base</th><th>Bonus</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  const allocations = await Dialog.prompt({
    title: `Edit ${state.flavor} Modifier`,
    content,
    callback: (html) => {
      const chosen = [];
      html.find(".rav-allocation-input").each((_, input) => {
        const amount = Number(input.value) || 0;
        if (amount > 0) chosen.push({ dieIndex: Number(input.dataset.dieIndex), amount });
      });
      return chosen;
    },
    rejectClose: false
  });

  if (!allocations) return;

  const validation = _validateAllocations(allocations, budget, maxDice, state.dice.length);
  if (!validation.valid) {
    ui.notifications.warn(validation.message);
    return;
  }

  state.skillAllocations = allocations;
  await message.update({
    content: RAVPendingRollCard.render(state),
    flags: { rav: { pendingRoll: state } }
  });
}

async function _onPendingRollLuckReroll(event, message) {
  event.preventDefault();
  const state = foundry.utils.duplicate(message.getFlag("rav", "pendingRoll"));
  if (!state || state.state !== "pending") return;

  const actor = _getActorFromRollState(state);
  if (!actor) return;

  const luck = Number(actor.system.attributes?.luck?.value) || 0;
  if (luck <= 0) {
    ui.notifications.warn(`${actor.name} has no Luck remaining.`);
    return;
  }

  const options = state.dice.map((value, i) => `<option value="${i}">Die ${i + 1}: ${value}</option>`).join("");
  const dieIndex = await Dialog.prompt({
    title: "Use Luck Reroll",
    content: `
      <div class="rav-dialog">
        <p>Choose one die to reroll. This spends 1 Luck.</p>
        <div class="dialog-field"><label>Die:</label><select id="rav-reroll-die">${options}</select></div>
      </div>`,
    callback: (html) => Number(html.find("#rav-reroll-die").val()),
    rejectClose: false
  });

  if (dieIndex === null || dieIndex === undefined || Number.isNaN(dieIndex)) return;

  const oldValue = state.dice[dieIndex];
  const reroll = await new Roll("1d10").evaluate();
  state.dice[dieIndex] = reroll.total;
  state.rerolls = state.rerolls ?? [];
  state.rerolls.push({ type: "luck", dieIndex, oldValue, newValue: reroll.total, userId: game.user.id });

  await actor.update({ "system.attributes.luck.value": Math.max(luck - 1, 0) });

  // After a reroll, recalculate the suggested optimal modifier.
  const suggestion = RAVRollOptimizer.suggest({
    dice: state.dice,
    skillLevel: state.skillLevel,
    tier: state.tier,
    threshold: state.threshold
  });
  state.skillAllocations = suggestion.allocations;

  await message.update({
    content: RAVPendingRollCard.render(state),
    flags: { rav: { pendingRoll: state } }
  });
}

function _validateAllocations(allocations, budget, maxDice, diceCount) {
  const spent = allocations.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const modifiedDice = new Set(allocations.filter(a => Number(a.amount) > 0).map(a => Number(a.dieIndex)));

  if (spent > budget) return { valid: false, message: `Skill allocation exceeds budget (${spent}/${budget}).` };
  if (Number.isFinite(maxDice) && modifiedDice.size > maxDice) {
    return { valid: false, message: `This tier can modify only ${maxDice} die${maxDice !== 1 ? "s" : ""}.` };
  }
  for (const a of allocations) {
    const idx = Number(a.dieIndex);
    const amount = Number(a.amount);
    if (idx < 0 || idx >= diceCount || amount < 0) return { valid: false, message: "Invalid die allocation." };
  }
  return { valid: true, message: "OK" };
}

function _getActorFromRollState(state) {
  if (state.sceneId && state.tokenId) {
    const scene = game.scenes.get(state.sceneId);
    const token = scene?.tokens?.get(state.tokenId);
    if (token?.actor) return token.actor;
  }
  const actor = game.actors.get(state.actorId);
  if (!actor) ui.notifications.warn("Could not find the actor for this roll.");
  return actor;
}

function _renderDiceTray({ state, finalDice, pending }) {
  const allocations = new Map((state.skillAllocations ?? []).map(a => [Number(a.dieIndex), Number(a.amount) || 0]));
  const rerolled = new Set((state.rerolls ?? []).map(r => Number(r.dieIndex)));
  return finalDice.map((finalValue, i) => {
    const baseValue = state.dice[i];
    const amount = allocations.get(i) || 0;
    const isSuccess = finalValue >= state.threshold;
    const isCrit = state.criticalDice?.includes(i);
    const wasRerolled = rerolled.has(i);
    const cssClass = isSuccess ? "success" : "failure";
    const critMark = isCrit ? '<span class="crit-mark">✦</span>' : "";
    const rerollMark = wasRerolled ? '<span class="reroll-mark">↻</span>' : "";
    const pendingMark = pending && amount > 0 ? '<span class="pending-mark">?</span>' : "";

    let dieContent;
    if (amount > 0) {
      dieContent = `<span class="die-base">${baseValue}</span><span class="die-arrow">→</span><span class="die-final">${finalValue}</span><span class="die-bonus">+${amount}</span>`;
    } else {
      dieContent = `<span class="die-final alone">${finalValue}</span>`;
    }
    return `<div class="die ${cssClass}${isCrit ? " crit" : ""}${wasRerolled ? " rerolled" : ""}">${critMark}${rerollMark}${pendingMark}${dieContent}</div>`;
  }).join("");
}

function _renderAllocationSummary(state, finalDice, unused = 0) {
  const allocations = state.skillAllocations ?? [];
  if (!allocations.length) return "None";
  const parts = allocations.map(a => {
    const idx = Number(a.dieIndex);
    const amount = Number(a.amount) || 0;
    const before = state.dice[idx];
    const after = finalDice[idx];
    return `+${amount} to die ${idx + 1} (${before} → ${after})`;
  });
  if (unused > 0) parts.push(`${unused} unused`);
  return parts.join(", ");
}

function _resultLabel(successes, difficulty) {
  const ok = successes >= difficulty;
  return `<span class="${ok ? "result-success" : "result-failure"}">${ok ? "Success" : "Failure"}</span>`;
}

function _escapeHTML(value) {
  const div = document.createElement("div");
  div.innerText = String(value ?? "");
  return div.innerHTML;
}

// ============================================================
//  8. LEGACY BONUS HELPERS (kept for compatibility)
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
      if (arr[i] > arr[hi]) hi = i;
    }
    bestIdx = hi;
  }

  const before = arr[bestIdx];
  arr[bestIdx] = arr[bestIdx] + bonus;
  return { results: arr, idx: bestIdx, amount: arr[bestIdx] - before };
}

function _applyBonusGreedy(results, bonus) {
  return RAVRollOptimizer._bestGrandMasterSplit(results, bonus, RAV.successThreshold);
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
