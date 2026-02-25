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
    context.RAV    = RAV;
    context.system = context.actor.system;
    context.flags  = context.actor.flags;
    this._prepareHealthMagic(context);
    this._prepareTiers(context);
    return context;
  }

  _prepareHealthMagic(context) {
    const end = context.system.attributes.endurance.value ?? 1;
    context.system.health.max = 5 + (end * 2);
    context.system.magic.max  = 5 + (end * 2);
  }

  _prepareTiers(context) {
    for (const group of Object.values(context.system.skills)) {
      for (const skill of Object.values(group)) {
        skill.tier = _tierFromLevel(skill.level);
      }
    }
    for (const spec of Object.values(context.system.specialties)) {
      spec.tier = _tierFromLevel(spec.level);
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
      width: 620,
      height: 640,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats" }]
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
    html.find(".npc-skill-roll").click(this._onRollNPCSkill.bind(this));
    html.find(".hp-btn").click(this._onHPChange.bind(this));
  }

  async _onRollAttribute(event) {
    event.preventDefault();
    const attrKey   = event.currentTarget.dataset.attribute;
    const attrValue = this.actor.system.attributes[attrKey]?.value ?? 1;
    const attrLabel = RAV.attributes[attrKey] ?? attrKey;
    await _rollCheck({ actor: this.actor, flavor: `${attrLabel} Check`, dicePool: attrValue, skillLevel: 0, tier: "novice" });
  }

  async _onRollNPCSkill(event) {
    event.preventDefault();
    const el       = event.currentTarget;
    const skill    = this.actor.system.skills[el.dataset.group][el.dataset.skill];
    const attrOpts = Object.entries(RAV.attributes).map(([k, v]) =>
      `<option value="${k}">${v} (${this.actor.system.attributes[k].value}d10)</option>`
    ).join("");

    new Dialog({
      title:   `${skill.label} Check`,
      content: `<form><div class="dialog-field"><label>Attribute</label><select name="attribute">${attrOpts}</select></div></form>`,
      buttons: {
        roll: {
          label: "Roll",
          callback: async (html) => {
            const attrKey   = html.find("[name=attribute]").val();
            const attrValue = this.actor.system.attributes[attrKey].value ?? 1;
            await _rollCheck({ actor: this.actor, flavor: `${skill.label} Check`, dicePool: attrValue, skillLevel: skill.level ?? 0, tier: _tierFromLevel(skill.level) });
          }
        },
        cancel: { label: "Cancel" }
      },
      default: "roll"
    }).render(true);
  }

  async _onHPChange(event) {
    event.preventDefault();
    const delta   = parseInt(event.currentTarget.dataset.delta);
    const current = this.actor.system.health.value;
    const max     = this.actor.system.health.max;
    await this.actor.update({ "system.health.value": Math.clamped(current + delta, 0, max) });
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
