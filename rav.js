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
  armorer:
    "Armorer — Proficiency in the effective use of chosen armor (Shield, Cloth, Leather, Chain, Plate).\n\n" +
    "Novice: +1d10 to Defense Checks.\n" +
    "Expert: Re-roll 1d10 for Defense Checks without spending Luck.\n" +
    "Master: Success threshold for Defense Checks lowers to 6+.\n" +
    "Grand Master: Re-roll any chosen dice for Defense Checks once per turn.",

  armsmaster:
    "Armsmaster — Proficiency in combat techniques and mastery of weapons.\n\n" +
    "Novice: +1 to weapon damage (requires at least 1 damage to land).\n" +
    "Expert: Two-handed weapons — make 2 Attack Checks with one Action.\n" +
    "Master: +1 to weapon damage.\n" +
    "Grand Master: +2 to weapon damage.",

  bodybuilding:
    "Bodybuilding — Physical prowess and resilience.\n\n" +
    "Novice: +1d10 to Attack Checks.\n" +
    "Expert: +1 max HP.\n" +
    "Master: +1 max HP.\n" +
    "Grand Master: +1d10 to Attack Checks.",

  spellcaster:
    "Spellcaster — Proficiency in wielding magical forces.\n\n" +
    "Novice: +1 to magical damage.\n" +
    "Expert: Upcharge — hold a spell one round for +2 damage. Any damage received cancels the spell and consumes its MP.\n" +
    "Master: +1 to magical damage.\n" +
    "Grand Master: +2 to magical damage.",

  learning:
    "Learning — Ability to acquire and process knowledge efficiently.\n\n" +
    "Novice: Level up in 3/4 of a day.\n" +
    "Expert: Level up in 1/2 a day.\n" +
    "Master: Can teach Skills and Specialties you know to others.\n" +
    "Grand Master: +10% to all EXP gained.",

  meditation:
    "Meditation — Connection to inner energies and magical restoration.\n\n" +
    "Novice: Recover 1 MP each round.\n" +
    "Expert: +1 max MP.\n" +
    "Master: +1 max MP.\n" +
    "Grand Master: Recover 3 MP each round.",

  relicKnowledge:
    "Relic Knowledge — Understanding of ancient artifacts and relics.\n\n" +
    "Novice: Identify relics up to Uncommon tier.\n" +
    "Expert: Identify relics up to Rare tier.\n" +
    "Master: Identify relics up to Legendary tier.\n" +
    "Grand Master: Identify relics up to Mythical tier.",

  monsterKnowledge:
    "Monster Knowledge — Familiarity with creatures of Tõus.\n\n" +
    "Novice: Identify Common monsters.\n" +
    "Expert: Identify Rare monsters.\n" +
    "Master: Identify Ancient monsters.\n" +
    "Grand Master: Identify Mythical monsters.",

  alchemy:
    "Alchemy — Expertise in potion brewing.\n\n" +
    "Novice: Brew basic potions (restore HP, MP, cure Diseases).\n" +
    "Expert: Mix basic potions into effect potions (replicate spell effects like Stone Skin or Haste).\n" +
    "Master: Mix effect potions into master potions (temporarily increase Attributes).\n" +
    "Grand Master: Mix master potions into black potions (grant SP or replicate powerful spells).",

  tinkering:
    "Tinkering — Skill in working with mechanisms and weapons.\n\n" +
    "Novice: Basic mechanisms — small explosives, spring traps, trinkets.\n" +
    "Expert: Add special effects to mechanisms (shrapnel, hidden daggers, etc.).\n" +
    "Master: Add special effects to weapons (spikes, hooks — bonus damage).\n" +
    "Grand Master: Upgrade weapons and clothes to enchantment-like effects (e.g. fire sword, silent cloak).",

  repair:
    "Repair — Ability to fix and restore items.\n\n" +
    "Novice: Repair lightly damaged items.\n" +
    "Expert: Repair moderately damaged items.\n" +
    "Master: Repair heavily damaged items.\n" +
    "Grand Master: Craft any design the character has previously worked with.",

  perception:
    "Perception — Awareness based on sight and observation.\n\n" +
    "Novice: +1d10 to Awareness Checks relying on sight.\n" +
    "Expert: Re-roll 1d10 for sight-based Awareness Checks.\n" +
    "Master: +1d10 to sight-based Awareness Checks.\n" +
    "Grand Master: Re-roll any chosen dice for sight Awareness Checks once per Check.",

  investigation:
    "Investigation — Skills in searching and scrutinising details.\n\n" +
    "Novice: +1d10 to Awareness Checks for investigating.\n" +
    "Expert: Re-roll 1d10 for investigation Awareness Checks.\n" +
    "Master: +1d10 to investigation Awareness Checks.\n" +
    "Grand Master: Re-roll any chosen dice for investigation Checks once per Check.",

  appraisal:
    "Appraisal — Ability to assess the value of items.\n\n" +
    "Novice: +1d10 to Awareness Checks for determining item value.\n" +
    "Expert: Re-roll 1d10 for appraisal Checks.\n" +
    "Master: +1d10 to appraisal Awareness Checks.\n" +
    "Grand Master: Re-roll any chosen dice for appraisal Checks once per Check.",

  disarmTrap:
    "Disarm Trap — Expertise in disarming traps.\n\n" +
    "Novice: +1d10 to Espionage Checks for trap disarming.\n" +
    "Expert: Re-roll 1d10 for trap disarming Checks.\n" +
    "Master: +1d10 to Espionage Checks for trap disarming.\n" +
    "Grand Master: Re-roll any chosen dice for trap disarming Checks once per Check.",

  forgeDocument:
    "Forge Document — Skill in creating and altering documents.\n\n" +
    "Novice: Forge invitations.\n" +
    "Expert: Forge common documents.\n" +
    "Master: Forge official documents.\n" +
    "Grand Master: Forge royal documents.",

  pickLock:
    "Pick Lock — Proficiency in picking locks.\n\n" +
    "Novice: +1d10 to Espionage Checks for lock picking.\n" +
    "Expert: Re-roll 1d10 for lock picking Checks.\n" +
    "Master: +1d10 to Espionage Checks for lock picking.\n" +
    "Grand Master: Re-roll any chosen dice for lock picking Checks once per Check.",

  eloquence:
    "Eloquence — Ability to communicate persuasively.\n\n" +
    "Novice: +1d10 to Speech Checks (persuasion, deception, intimidation).\n" +
    "Expert: Re-roll 1d10 for Speech Checks.\n" +
    "Master: +1d10 to Speech Checks.\n" +
    "Grand Master: Re-roll any chosen dice for Speech Checks once per Check.",

  merchant:
    "Merchant — Skill in trade and negotiation.\n\n" +
    "Novice: +1d10 to Speech Checks while trading.\n" +
    "Expert: Re-roll 1d10 for trading Speech Checks.\n" +
    "Master: +1d10 to Speech Checks while trading.\n" +
    "Grand Master: Re-roll any chosen dice for trading Speech Checks once per Check.",

  performance:
    "Performance — Skill in entertaining through various mediums.\n\n" +
    "Novice: +1d10 to Staging Checks.\n" +
    "Expert: Re-roll 1d10 for Staging Checks.\n" +
    "Master: +1d10 to Staging Checks.\n" +
    "Grand Master: Re-roll any chosen dice for Staging Checks once per Check.",

  forage:
    "Forage — Ability to find sustenance in the wild.\n\n" +
    "Novice: +1d10 to Survival Checks for foraging.\n" +
    "Expert: Re-roll 1d10 for foraging Checks.\n" +
    "Master: +1d10 to Survival Checks for foraging.\n" +
    "Grand Master: Re-roll any chosen dice for foraging Checks once per Check.",

  tracking:
    "Tracking — Skill in following trails and footprints.\n\n" +
    "Novice: +1d10 to Survival Checks for tracking.\n" +
    "Expert: Re-roll 1d10 for tracking Checks.\n" +
    "Master: +1d10 to Survival Checks for tracking.\n" +
    "Grand Master: Re-roll any chosen dice for tracking Checks once per Check."
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
    const sys   = context.system;
    const attrs = sys.attributes;
    const specs = sys.specialties;

    const end  = attrs.endurance.value   ?? 1;
    const mig  = attrs.might.value       ?? 1;
    const int_ = attrs.intellect.value   ?? 1;
    const per  = attrs.personality.value ?? 1;

    // HP = Endurance + Might + Bodybuilding bonuses
    const bbExpert = ["expert","master","grandmaster"].includes(specs.bodybuilding?.tier);
    const bbMaster = ["master","grandmaster"].includes(specs.bodybuilding?.tier);
    const hpMax    = end + mig + (bbExpert ? 1 : 0) + (bbMaster ? 1 : 0);

    // MP = Endurance + highest(Intellect, Personality) + Meditation bonuses
    const medExpert = ["expert","master","grandmaster"].includes(specs.meditation?.tier);
    const medMaster = ["master","grandmaster"].includes(specs.meditation?.tier);
    const mpMax     = end + Math.max(int_, per) + (medExpert ? 1 : 0) + (medMaster ? 1 : 0);

    // Write calculated values into context for template rendering
    sys.health.max = hpMax;
    sys.magic.max  = mpMax;

    // Also persist to actor if the stored max is wrong — keeps HP/MP bar accurate
    if (context.actor.system.health.max !== hpMax ||
        context.actor.system.magic.max  !== mpMax) {
      context.actor.update({
        "system.health.max": hpMax,
        "system.magic.max":  mpMax
      });
    }
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
  // Clicks the attribute label -> rolls that attribute directly, no dialog

  async _onRollAttribute(event) {
    event.preventDefault();
    const attrKey   = event.currentTarget.dataset.attribute;
    const attrValue = this.actor.system.attributes[attrKey]?.value ?? 1;
    const attrLabel = RAV.attributes[attrKey] ?? attrKey;

    await _rollCheck({
      actor:      this.actor,
      flavor:     `${attrLabel} Check`,
      dicePool:   attrValue,
      skillLevel: 0,
      tier:       "novice",
      useLuck:    false
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

    // Read tier directly from the sheet's dropdown — more reliable than actor data
    // which may not have tier set on older actors
    const tierSelect = el.closest(".skill-row")?.querySelector(`[name="system.skills.${group}.${skillKey}.tier"]`);
    const liveTier   = tierSelect?.value || skill.tier || "novice";

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
          <span class="tier-${liveTier}">${RAV.tiers[liveTier] ?? liveTier}</span>
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
            const tier       = liveTier;

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
    // NPC HP/MP max is free input — no calculation
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;
    html.find(".attribute-roll").click(this._onRollAttribute.bind(this));
    html.find(".hp-btn").click(this._onHPChange.bind(this));
    html.find(".mp-btn").click(this._onMPChange.bind(this));
    html.find(".action-add-btn:not(.npc-skill-add-btn)").click(this._onActionAdd.bind(this));
    html.find(".action-delete-btn").click(this._onActionDelete.bind(this));
    html.find(".action-roll-btn").click(this._onActionRoll.bind(this));
    html.find(".npc-skill-add-btn").click(this._onNpcSkillAdd.bind(this));
    html.find(".npc-skill-delete").click(this._onNpcSkillDelete.bind(this));

    // Toggle between preview and edit mode for NPC skills
    html.find(".npc-skill-edit-toggle").click((event) => {
      event.preventDefault();
      const viewMode = html.find(".npc-skill-view-mode");
      const editMode = html.find(".npc-skill-edit-mode");
      const isEditing = editMode.is(":visible");
      viewMode.toggle(isEditing);
      editMode.toggle(!isEditing);
    });
  }

  async _onRollAttribute(event) {
    event.preventDefault();
    const attrKey   = event.currentTarget.dataset.attribute;
    const attrValue = this.actor.system.attributes[attrKey]?.value ?? 1;
    const attrLabel = RAV.attributes[attrKey] ?? attrKey;
    await _rollCheck({
      actor:      this.actor,
      flavor:     `${attrLabel} Check`,
      dicePool:   attrValue,
      skillLevel: 0,
      tier:       "novice",
      useLuck:    false
    });
  }

  async _onHPChange(event) {
    event.preventDefault();
    const delta   = parseInt(event.currentTarget.dataset.delta);
    const current = this.actor.system.health.value;
    const max     = this.actor.system.health.max ?? 99;
    await this.actor.update({ "system.health.value": Math.clamped(current + delta, 0, max) });
  }

  async _onMPChange(event) {
    event.preventDefault();
    const delta   = parseInt(event.currentTarget.dataset.delta);
    const current = this.actor.system.magic.value;
    const max     = this.actor.system.magic.max ?? 99;
    await this.actor.update({ "system.magic.value": Math.clamped(current + delta, 0, max) });
  }

  // Add a blank NPC skill row
  async _onNpcSkillAdd(event) {
    event.preventDefault();
    const skills = foundry.utils.deepClone(this.actor.system.npcSkills ?? {});
    const key    = "skill_" + Date.now();
    skills[key]  = { name: "", description: "" };
    await this.actor.update({ "system.npcSkills": skills });
  }

  // Delete an NPC skill row
  async _onNpcSkillDelete(event) {
    event.preventDefault();
    const key    = event.currentTarget.dataset.skillKey;
    const skills = foundry.utils.deepClone(this.actor.system.npcSkills ?? {});
    delete skills[key];
    await this.actor.update({ "system.npcSkills": skills });
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

  // Roll an action directly from the stat block — uses full roll engine
  async _onActionRoll(event) {
    event.preventDefault();
    const key    = event.currentTarget.dataset.actionKey;
    const action = this.actor.system.actions[key];
    if (!action?.roll) return;

    // Parse roll formula — strip MP cost if present (e.g. "3MP; 4d10 + 1" → "4d10 + 1")
    // Also handle flat bonus like "4d10 + 2" — extract dice count and bonus separately
    let rawFormula = action.roll.includes(";")
      ? action.roll.split(";")[1].trim()
      : action.roll.trim();

    // Extract dice pool count from formula (e.g. "5d10 + 1" → pool=5, flatBonus=1)
    const diceMatch = rawFormula.match(/(\d+)d10\s*([+-]\s*\d+)?/i);
    if (!diceMatch) {
      ui.notifications.warn(`Could not parse roll formula: ${rawFormula}`);
      return;
    }

    const dicePool  = parseInt(diceMatch[1]);
    const flatBonus = diceMatch[2] ? parseInt(diceMatch[2].replace(/\s/g, "")) : 0;

    await _rollCheck({
      actor:      this.actor,
      flavor:     `${action.name} — ${action.target}`,
      dicePool,
      skillLevel: 0,       // NPCs have no tier bonus logic
      tier:       "novice",
      useLuck:    false,
      flatBonus            // added directly to success count after roll
    });
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

async function _rollCheck({ actor, flavor, dicePool, skillLevel = 0, tier = "novice", useLuck = false, flatBonus = 0 }) {

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
  // flatBonus adds directly to success count (e.g. "5d10 + 1" = roll 5d10, then +1 success)
  const diceSuccesses = modifiedResults.filter(r => r >= RAV.successThreshold).length;
  const successes     = diceSuccesses + Math.max(0, flatBonus);

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

  const luckText   = useLuck ? `<div class="roll-tag luck-tag">🍀 Luck — lowest die rerolled</div>` : "";
  const critText   = critCount > 0 ? `<div class="roll-tag crit-tag">⚡ Critical — ${critCount} bonus die added</div>` : "";
  const bonusText  = bonusDesc ? `<div class="roll-tag bonus-tag">${bonusDesc}</div>` : "";
  const flatText   = flatBonus > 0 ? `<div class="roll-tag bonus-tag">+${flatBonus} bonus success${flatBonus !== 1 ? "es" : ""}</div>` : "";

  // Luck button — always shown, any player can spend their own Luck
  // data-actor-id is the ORIGINAL actor for reference, but the clicker spends their own Luck
  const luckBtn = `<button class="luck-reroll-btn" data-actor-id="${actor.id}" data-message-id="PENDING">🍀 Spend Luck to reroll lowest die</button>`;

  const content = `
    <div class="rav-roll">
      <div class="roll-header">
        <span class="roll-title">${flavor}</span>
        <span class="roll-pool">${pool}d10</span>
      </div>
      <div class="roll-tags">${bonusText}${flatText}${luckText}${critText}</div>
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
    const btn = event.currentTarget;

    // Find the spending actor — prefer the user's currently controlled/owned token actor,
    // fall back to any owned actor with Luck remaining
    let spender = null;

    // First try: controlled token on canvas
    const controlled = canvas?.tokens?.controlled ?? [];
    for (const token of controlled) {
      if (token.actor?.isOwner && (token.actor.system.attributes.luck.value ?? 0) > 0) {
        spender = token.actor;
        break;
      }
    }

    // Second try: any actor the user owns with Luck > 0
    if (!spender) {
      spender = game.actors.find(a =>
        a.isOwner &&
        a.type === "character" &&
        (a.system.attributes.luck.value ?? 0) > 0
      );
    }

    if (!spender) {
      ui.notifications.warn("No controlled character with Luck remaining!");
      return;
    }

    const luck = spender.system.attributes.luck.value;
    await spender.update({ "system.attributes.luck.value": luck - 1 });

    // Post a 1d10 reroll result to chat for the player to apply manually
    const reroll = await new Roll("1d10").evaluate();
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: spender }),
      content: `<div class="rav-roll">
        <div class="roll-header">
          <span class="roll-title">🍀 ${spender.name} spends Luck</span>
        </div>
        <div class="dice-tray">
          <div class="die ${reroll.total >= 7 ? "success" : "failure"}">
            <span class="die-final alone">${reroll.total}</span>
          </div>
        </div>
        <div class="roll-footer">
          <span class="roll-successes" style="font-size:12px;color:var(--rav-text-dim)">
            Apply this result to your chosen die · Luck remaining: ${luck - 1}
          </span>
        </div>
      </div>`
    });

    btn.textContent = `🍀 Luck spent — ${luck - 1} remaining`;
    btn.style.opacity = "0.6";
    btn.disabled = luck - 1 <= 0;
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
