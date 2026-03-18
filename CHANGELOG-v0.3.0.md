# RAV System v0.3.0 - Foundation Fixes

## 🎯 What's Fixed

### 1. **HP/MP Calculations (CRITICAL FIX)**

**Before (WRONG):**
- HP = 5 + (Endurance × 2)
- MP = 5 + (Endurance × 2)

**Now (CORRECT):**
- **HP = Might + Endurance** ✓
- **MP = (Intellect OR Personality) + Endurance** ✓

**Code Location:** `rav.js` line 149-160 in `_prepareHealthMagic()` method

### 2. **MP Source Toggle (NEW FEATURE)**

Players can now switch MP calculation between Intellect and Personality!

**How it works:**
- New button in vitals bar shows "INT" or "PER"
- Click to toggle between sources
- MP max instantly recalculates
- Notification shows which attribute is now active

**UI:** Small button next to MP controls labeled "INT" or "PER"

**Code Locations:**
- Template: `actor-sheet.html` line 53-64
- Handler: `rav.js` line 265-271 (`_onMPSourceToggle()`)
- Data: `template.json` - added `"source": "intellect"` to magic object

### 3. **Spell Casting from Sheet (NEW)**

Spells now have a "Cast" button (✨) that:
1. Checks if player has enough MP
2. Deducts MP cost automatically
3. Rolls spell dice pool if specified
4. Uses the character's skill level in that magic school
5. Displays spell info in chat

**UI:** Sparkle emoji (✨) button in spell inventory row

**Code Location:** `rav.js` line 306-353 (`_onSpellCast()`)

### 4. **Spell Item Template Improvements**

Added missing fields to spell data model:
- `targets` - Who/what the spell affects
- `duration` - How long it lasts

**Code Location:** `template.json` line 405-408

---

## 📋 File Changes Summary

### **Modified Files:**

1. **template.json**
   - Added `magic.source` field (defaults to "intellect")
   - Fixed HP max to use proper formula
   - Added `targets` and `duration` to spell items

2. **rav.js**
   - Fixed `_prepareHealthMagic()` to use correct formulas
   - Added `_onMPSourceToggle()` handler
   - Added `_onSpellCast()` handler with MP deduction
   - Registered spell cast click listener
   - Updated version to 0.3.0

3. **actor-sheet.html**
   - Added MP source toggle button in vitals bar
   - Added cast button (✨) to spell inventory items

4. **system.json**
   - Bumped version to 0.3.0

### **Unchanged Files:**
- `rav.css` (no styling changes needed)
- `item-sheet.html` (works with new spell fields)
- `npc-sheet.html` (no changes needed)
- `en.json` (no new translations needed)

---

## 🧪 Testing Checklist

Before deploying, test these scenarios:

### HP/MP Calculations
- [ ] Create new character with Might 3, Endurance 2 → HP should be 5
- [ ] Change Might to 4 → HP should update to 6
- [ ] Character with Intellect 3, Endurance 2 → MP should be 5
- [ ] Toggle MP source to Personality (value 4) → MP should update to 6
- [ ] Toggle back to Intellect → MP should revert to 5

### MP Source Toggle
- [ ] Click "INT" button → should change to "PER" and show notification
- [ ] MP max updates immediately
- [ ] Click again → toggles back to "INT"
- [ ] Works on existing characters (defaults to Intellect if not set)

### Spell Casting
- [ ] Create a spell with MP cost 3, dice pool "3d10", school "fire"
- [ ] Character has Fire skill level 4 (Expert tier)
- [ ] Click ✨ cast button
- [ ] MP deducts by 3
- [ ] Roll appears in chat with Fire skill bonus applied
- [ ] Try casting with insufficient MP → shows warning, no roll

---

## 🔧 Installation Instructions

### For Fresh Install:
1. Copy all files to `FoundryVTT/Data/systems/rav/`
2. File structure should be:
   ```
   rav/
   ├── rav.js
   ├── system.json
   ├── template.json
   ├── styles/
   │   └── rav.css
   ├── templates/
   │   ├── actor-sheet.html
   │   ├── npc-sheet.html
   │   └── item-sheet.html
   └── lang/
       └── en.json
   ```
3. Restart Foundry
4. Create new world or enable system

### For Upgrade from v0.2.0:

**IMPORTANT:** Characters created in v0.2.0 will have wrong HP/MP values!

**Migration Steps:**

1. **Before upgrading**, have players note their true HP/MP (calculate manually)
2. Replace system files
3. Restart Foundry
4. Open each character sheet
5. **HP will auto-fix** when you change any attribute
6. **MP needs manual toggle**: Click INT/PER button once to force recalc
7. Verify values match expected calculations

**Safe Migration Script (optional):**
If you have many characters, run this macro in Foundry console after upgrade:

```javascript
game.actors.forEach(actor => {
  if (actor.type === "character") {
    const m = actor.system.attributes.might.value;
    const e = actor.system.attributes.endurance.value;
    const i = actor.system.attributes.intellect.value;
    const p = actor.system.attributes.personality.value;
    
    const hpMax = m + e;
    const mpMax = i + e; // Defaults to intellect
    
    actor.update({
      "system.health.max": hpMax,
      "system.magic.max": mpMax,
      "system.magic.source": "intellect"
    });
    
    console.log(`Fixed ${actor.name}: HP=${hpMax}, MP=${mpMax}`);
  }
});
```

---

## 🎮 Player-Facing Changes

### What Players Will Notice:

1. **HP/MP values are now correct** according to rulebook
2. **New MP button** lets them choose Intellect or Personality
3. **Spells have a ✨ button** to cast directly from sheet
4. **MP auto-deducts** when casting spells
5. **Spell rolls use magic skill** automatically

### What Players Should Know:

- **MP Source Choice:** They can switch anytime, but should pick based on character concept
  - Intellect = studied magic (wizards, scholars)
  - Personality = innate magic (sorcerers, charismatic casters)
  
- **Spell Casting:** Just click ✨, MP is handled automatically
  - If not enough MP, they get a warning
  - Spell uses their skill level in that school
  - Damage spells roll dice pools automatically

---

## 🚀 Next Phase Preview

### Phase 2 will add:

1. **Gear as drag-and-drop items** (like spells)
   - Weapon items with damage tracking
   - Armor items with durability
   - Auto-apply gear bonuses to rolls
   
2. **Specialty bonuses in rolls**
   - Armsmaster: +1 damage on weapon attacks
   - Bodybuilding: +HP and attack bonuses
   - Caster: +magical damage
   - All bonuses show in roll chat output

3. **Spell compendium**
   - Pre-made spell items for all schools
   - Drag from compendium to character
   - Organized by school and tier

4. **Enhanced roll display**
   - Show all active bonuses before rolling
   - Color-coded by source (skill/specialty/gear)
   - Clearer success indicators

---

## 🐛 Known Issues & Limitations

### Current Limitations:

1. **Gear slots are still text fields** - Can't drag items to slots yet
2. **No auto-bonus from specialties** - Armsmaster +1 damage not applied yet
3. **No gear bonus tracking** - Enchanted items don't add to rolls yet
4. **Spell schools not filtered** - All spells show, not organized by school

### Not Bugs (Working as Designed):

- **Tier dropdowns don't auto-update** - Players must manually upgrade tiers during downtime
- **Skill points don't auto-spend** - Intentional, GM must approve
- **Luck doesn't auto-reroll** - Chat button is informational only

---

## 📞 Support & Questions

If you encounter issues:

1. Check the Testing Checklist - did the test pass?
2. Open browser console (F12) - any red errors?
3. Verify file structure matches Installation Instructions
4. For v0.2.0 upgrades, did you run the migration?

Common issues:
- **MP not updating** → Click the INT/PER toggle button once
- **HP still wrong** → Change any attribute value to trigger recalc
- **Spells don't cast** → Check MP cost vs current MP

---

## 🎓 Technical Notes for Developers

### Architecture Decisions:

**Why MP source in data model vs flags?**
- It's core character data, not meta-information
- Needs to trigger recalculation on change
- Should persist with character export

**Why auto-apply skill bonuses vs manual?**
- Reduces player cognitive load
- Faster gameplay at table
- Algorithm ensures optimal placement
- Transparent via visual feedback (arrows showing bonuses)

**Why specialty bonuses not implemented yet?**
- Requires gear item system first
- Bonuses need to stack correctly
- Want comprehensive bonus display before adding more sources

### Code Quality Notes:

- All calculations now match RAV rulebook v1.3.4
- Functions remain pure (no side effects in helpers)
- Event handlers follow Foundry best practices
- Template uses minimal logic (computation in JS)

---

**Version:** 0.3.0  
**Date:** 2026-03-18  
**Status:** Foundation Complete ✓  
**Next:** Phase 2 - Gear & Enhanced Bonuses
