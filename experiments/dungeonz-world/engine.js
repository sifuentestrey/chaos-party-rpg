var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// adapter:fs
var require_fs = __commonJS({
  "adapter:fs"(exports, module) {
    module.exports = { existsSync: () => true, writeFileSync: () => {
    } };
  }
});

// adapter:settings
var require_settings = __commonJS({
  "adapter:settings"(exports, module) {
    module.exports = { IGNORE_WARNINGS: false };
  }
});

// experiments/dungeonz-world/upstream/server/src/Utils.js
var require_Utils = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/Utils.js"(exports, module) {
    var fs = require_fs();
    var settings = require_settings();
    var Utils = class {
      /**
       * @class Creates a counter that will track it's own 
       * count and allow the next count to be retrieved.
       * Useful for creating unique IDs.
       */
      Counter = class Counter {
        constructor() {
          this._count = 0;
        }
        getNext() {
          this._count += 1;
          return this._count;
        }
      };
      /**
       * Gets a random number between, and including, min and max.
       * @param {Number} min
       * @param {Number} max
       * @returns {*}
       */
      getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      /**
       * Gets a random element from the given array.
       * @param {Array} array
       * @returns {*}
       */
      getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
      }
      /**
       * Creates an array of all permutations of a given array's elements.
       * @param {Array.<*>} array 
       * @returns {Array.<Array.<*>>} An array of arrays.
       */
      getPermutations(array) {
        let result = [];
        const permute = (arr, m = []) => {
          if (arr.length === 0) {
            result.push(m);
          } else {
            for (let i = 0; i < arr.length; i += 1) {
              let curr = arr.slice();
              let next = curr.splice(i, 1);
              permute(curr.slice(), m.concat(next));
            }
          }
        };
        permute(array);
        return result;
      }
      /**
       * @param {Array} array
       * @param {String} nameKey - The name of each property key on the result object.
       * @param {String} valueKey - The name of the property to use as each propety value.
       * @returns {Object} The array as an object.
       */
      arrayToObject(array, nameKey, valueKey) {
        if (Array.isArray(array) === false) return {};
        return array.reduce((obj, item) => {
          obj[item[nameKey]] = item[valueKey];
          return obj;
        }, {});
      }
      /**
       * Push an item into an array multiple times.
       * @param {Array} array - The array to push into.
       * @param {*} item - The item to add.
       * @param {Number} number - How many times the item should be added.
       */
      arrayMultiPush = (array, item, amount) => {
        for (let i = 0; i < amount; i += 1) {
          array.push(item);
        }
      };
      /**
       * Checks the location to write to exists. If not, creates it.
       * @param {String} directory The directory to check for.
       */
      checkDirectoryExists(directory) {
        if (fs.existsSync(directory) === false) {
          fs.mkdirSync(directory);
        }
      }
      /**
       * Checks the client catalogues directory exists. If not, creates it.
       */
      checkClientCataloguesExists() {
        this.checkDirectoryExists("../client/src/catalogues");
      }
      /**
       * Prints a system message in the project format.
       * Wrapper for console.log.
       * @param {*} message
       */
      message(...args) {
        args.unshift("*");
        console.log.apply(console, args);
      }
      /**
       * Prints a warning message.
       * @param {*} message
       */
      warning(...args) {
        if (!settings.IGNORE_WARNINGS) {
          args.unshift("* WARNING:");
          console.log.apply(console, args);
        }
      }
      /**
       * Stops the process and prints an error message.
       * @param {*} message
       */
      error(...args) {
        args.unshift("* ERROR:");
        console.error.apply(console, args);
        console.trace();
        process.exit();
      }
    };
    module.exports = new Utils();
  }
});

// experiments/dungeonz-world/upstream/server/src/gameplay/Damage.js
var require_Damage = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/gameplay/Damage.js"(exports, module) {
    var Damage = class {
      /**
       * A model of damage to be dealt.
       * @param {Object} config
       * @param {Number} config.amount How much damage to deal.
       * @param {Array.<Number>} [config.types=[Damage.Types.Physical]] The types of damage to deal. A list of Damage.Types.
       * @param {Number} [config.armourPiercing=0] How much armour this damage will ignore. 0 to 1.
       */
      constructor(config) {
        if (config.amount) this.amount = config.amount;
        if (config.types) this.types = config.types;
        if (config.armourPiercing) this.armourPiercing = config.armourPiercing;
      }
      /**
       * Checks if any of the types of this damage are not on a given entitys damage type immunity list.
       * @param {Entity} entity
       */
      canAffectTarget(entity) {
        if (entity.damageTypeImmunities) {
          for (const type of this.types) {
            if (entity.damageTypeImmunities.includes(type)) {
              continue;
            }
            return true;
          }
        } else {
          return true;
        }
        return false;
      }
    };
    module.exports = Damage;
    Damage.Types = {
      /**
       * @type {Number} Solid objects, such as swords, arrows, melee attacks and spike traps.
       */
      Physical: 1,
      /**
       * @type {Number} Magic related things, like fire balls, wind blasts and curses.
       */
      Magical: 2,
      /**
       * @type {Number} Organic related things, such as disease, poison, and possibly
       * environmental effects like heat and cold.
       */
      Biological: 3
    };
    Damage.prototype.amount = 0;
    Damage.prototype.types = [
      Damage.Types.Physical
    ];
    Damage.prototype.armourPiercing = 0;
  }
});

// experiments/dungeonz-world/upstream/server/src/gameplay/Heal.js
var require_Heal = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/gameplay/Heal.js"(exports, module) {
    var Heal = class {
      /**
       * A model of healing to be done.
       * @param {Object} config
       * @param {Number} config.amount How much hitpoints to restore.
       */
      constructor(amount) {
        this.amount = amount || 0;
      }
      /**
       * Override for same function in Damage. This will heal anything that can be healed.
       */
      canAffectTarget() {
        return true;
      }
    };
    module.exports = Heal;
    Heal.prototype.amount = 0;
  }
});

// experiments/dungeonz-world/upstream/server/src/DayPhases.js
var require_DayPhases = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/DayPhases.js"(exports, module) {
    module.exports = {
      Dawn: 1,
      Day: 2,
      Dusk: 3,
      Night: 4
    };
  }
});

// experiments/dungeonz-world/upstream/server/src/gameplay/Directions.js
var require_Directions = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/gameplay/Directions.js"(exports, module) {
    var Utils = require_Utils();
    var UP = "u";
    var DOWN = "d";
    var LEFT = "l";
    var RIGHT = "r";
    module.exports.Directions = {
      UP,
      DOWN,
      LEFT,
      RIGHT
    };
    module.exports.DirectionsValues = [
      UP,
      DOWN,
      LEFT,
      RIGHT
    ];
    module.exports.OppositeDirections = {
      u: DOWN,
      d: UP,
      l: RIGHT,
      r: LEFT
    };
    module.exports.SideDirections = {
      u: [LEFT, RIGHT],
      d: [RIGHT, LEFT],
      l: [DOWN, UP],
      r: [UP, DOWN]
    };
    module.exports.RowColOffsetsByDirection = {
      u: { row: -1, col: 0 },
      d: { row: 1, col: 0 },
      l: { row: 0, col: -1 },
      r: { row: 0, col: 1 }
    };
    module.exports.rowColOffsetToDirection = (rowOffset, colOffset) => {
      if (rowOffset < 0) return UP;
      if (rowOffset > 0) return DOWN;
      if (colOffset < 0) return LEFT;
      if (colOffset > 0) return RIGHT;
      if (rowOffset === 0 && colOffset === 0) return UP;
      Utils.error(`A valid offset wasn't given to rowColOffsetToDirection, row: ${rowOffset}, col: ${colOffset}`);
      return void 0;
    };
    module.exports.getRowColsToSides = (direction, row, col) => {
      if (direction === UP || direction === DOWN) {
        return [
          { row, col: col - 1 },
          { row, col: col + 1 }
        ];
      }
      return [
        { row: row - 1, col },
        { row: row + 1, col }
      ];
    };
    module.exports.DirectionsPermutations = Utils.getPermutations(
      Object.values(module.exports.Directions)
    );
    module.exports.DirectionsPermutationsAsRowColOffsets = module.exports.DirectionsPermutations.map((directions) => directions.map((direction) => module.exports.RowColOffsetsByDirection[direction]));
  }
});

// experiments/dungeonz-world/upstream/server/src/EventsList.js
var require_EventsList = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/EventsList.js"(exports, module) {
    var fs = require_fs();
    var Utils = require_Utils();
    var counter = 0;
    function registerEventName() {
      counter += 1;
      return counter;
    }
    var EventsList = {
      moved: registerEventName(),
      add_entity: registerEventName(),
      change_direction: registerEventName(),
      active_state: registerEventName(),
      activate_ammunition: registerEventName(),
      activate_clothing: registerEventName(),
      activate_holding: registerEventName(),
      activate_spell_book: registerEventName(),
      // TODO: remove with spell books
      add_bank_item: registerEventName(),
      add_entities: registerEventName(),
      add_inventory_item: registerEventName(),
      already_logged_in: registerEventName(),
      bank_max_weight: registerEventName(),
      bank_max_weight_upgrade_cost: registerEventName(),
      bank_weight: registerEventName(),
      // breakable_broken: registerEventName(), // TODO: not used, maybe add back with bases
      // breakable_damaged: registerEventName(),
      // breakable_repaired: registerEventName(),
      // cannot_drop_here: registerEventName(),// TODO: not used, see other inventory todo
      chat: registerEventName(),
      // chat_warning: registerEventName(),
      change_board: registerEventName(),
      change_day_phase: registerEventName(),
      change_display_name: registerEventName(),
      change_password_failure: registerEventName(),
      change_password_success: registerEventName(),
      // clan_destroyed: registerEventName(),
      // clan_joined: registerEventName(),
      // clan_left: registerEventName(),
      // clan_promoted: registerEventName(),
      // clan_kicked: registerEventName(),
      // clan_values: registerEventName(),
      create_account_failure: registerEventName(),
      create_account_success: registerEventName(),
      curse_set: registerEventName(),
      curse_removed: registerEventName(),
      damage: registerEventName(),
      deactivate_ammunition: registerEventName(),
      deactivate_clothing: registerEventName(),
      deactivate_holding: registerEventName(),
      defence_value: registerEventName(),
      dungeon_door_keys: registerEventName(),
      effect_start_burn: registerEventName(),
      effect_stop_burn: registerEventName(),
      effect_start_poison: registerEventName(),
      effect_stop_poison: registerEventName(),
      effect_start_disease: registerEventName(),
      effect_stop_disease: registerEventName(),
      effect_start_health_regen: registerEventName(),
      effect_stop_health_regen: registerEventName(),
      effect_start_energy_regen: registerEventName(),
      effect_stop_energy_regen: registerEventName(),
      effect_start_cured: registerEventName(),
      effect_stop_cured: registerEventName(),
      effect_start_cold_resistance: registerEventName(),
      effect_stop_cold_resistance: registerEventName(),
      effect_start_chill: registerEventName(),
      effect_stop_chill: registerEventName(),
      effect_start_broken_bones: registerEventName(),
      effect_stop_broken_bones: registerEventName(),
      energy_value: registerEventName(),
      enchantment_set: registerEventName(),
      enchantment_removed: registerEventName(),
      equip_clothes: registerEventName(),
      unequip_clothes: registerEventName(),
      exp_gained: registerEventName(),
      glory_value: registerEventName(),
      hatchet_needed: registerEventName(),
      heal: registerEventName(),
      hit_point_value: registerEventName(),
      inactive_state: registerEventName(),
      invalid_login_details: registerEventName(),
      inventory_max_weight: registerEventName(),
      inventory_weight: registerEventName(),
      item_broken: registerEventName(),
      item_dropped: registerEventName(),
      item_used: registerEventName(),
      join_world_success: registerEventName(),
      melee_attack: registerEventName(),
      modify_bank_item: registerEventName(),
      modify_inventory_item: registerEventName(),
      parties: registerEventName(),
      pickaxe_needed: registerEventName(),
      player_in_combat: registerEventName(),
      player_died: registerEventName(),
      player_respawn: registerEventName(),
      remove_all_inventory_items: registerEventName(),
      remove_bank_item: registerEventName(),
      remove_entity: registerEventName(),
      remove_inventory_item: registerEventName(),
      settings: registerEventName(),
      shop_prices: registerEventName(),
      something_went_wrong: registerEventName(),
      start_dungeon: registerEventName(),
      start_gathering: registerEventName(),
      stat_levelled: registerEventName(),
      task_added: registerEventName(),
      task_claimed: registerEventName(),
      task_progress_made: registerEventName(),
      world_full: registerEventName()
    };
    var dataToWrite = {};
    Object.entries(EventsList).forEach(([eventTypeKey, eventTypeValue]) => {
      dataToWrite[eventTypeValue] = eventTypeKey;
    });
    dataToWrite = JSON.stringify(dataToWrite);
    Utils.checkClientCataloguesExists();
    fs.writeFileSync("../client/src/catalogues/EventNames.json", dataToWrite);
    Utils.message("Event names catalogue written to file.");
    module.exports = EventsList;
  }
});

// experiments/dungeonz-world/upstream/server/src/entities/classes/Entity.js
var require_Entity = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/entities/classes/Entity.js"(exports, module) {
    var Utils = require_Utils();
    var Damage = require_Damage();
    var Heal = require_Heal();
    var DayPhases = require_DayPhases();
    var { Directions } = require_Directions();
    var idCounter = new Utils.Counter();
    var typeNumberCounter = new Utils.Counter();
    var Entity = class {
      /**
       * @param {Object} config
       * @param {Number} config.row
       * @param {Number} config.col
       * @param {Board} config.board
       */
      constructor(config) {
        this.id = idCounter.getNext();
        this.row = config.row;
        this.col = config.col;
        this.board = config.board;
      }
      static registerEntityType() {
        this.prototype.typeNumber = typeNumberCounter.getNext();
      }
      /**
       * Remove this entity from the game world completely, and allow it to be GCed.
       * Any specific destruction functionality should be added to onDestroy, which is called from this method.
       */
      destroy() {
        if (this._destroyed === true) return;
        this._destroyed = true;
        this.onDestroy();
      }
      /**
       * Specific destruction functionality. If overridden, should still be chained from the overrider up to this.
       */
      onDestroy() {
        this.board = null;
      }
      /**
       * When another entity moves into the same tile as this entity.
       * @param {Entity} otherEntity - The entity that moved.
       */
      onMovedInto(otherEntity) {
      }
      /**
       * Change the hitpoints value of this entity, if it has the hitpoints property set (not null).
       * Calls onDamage or onHeal based on the amount, and also onModHitPoints.
       * @param {Damage|Heal} hitPointModifier - An object that details how much to increase or decrease the HP by.
       * @param {Entity} [source] - The entity that caused this change.
       */
      modHitPoints(hitPointModifier, source) {
        if (this._destroyed === true) return;
        if (this.hitPoints === null) return;
        const amount = Math.floor(hitPointModifier.amount);
        if (Number.isInteger(amount) === false) return;
        if (hitPointModifier instanceof Damage) {
          this.onDamage(hitPointModifier, source);
        } else if (hitPointModifier instanceof Heal) {
          this.onHeal(hitPointModifier);
        } else {
          Utils.warning("Hitpoint modifier passed into Entity.modHitPoints is not an instance of either Damage or Heal. hitPointModifier:", hitPointModifier);
        }
        this.onModHitPoints();
      }
      /**
       *
       * @param {Heal} heal
       * @param {Entity} source
       */
      heal(heal, source) {
        if (heal instanceof Heal === false) {
          Utils.error("Entity.heal must be passed a Heal config object. Value of 'heal':", heal);
        }
        if (heal.amount === null) return;
        this.modHitPoints(heal, source);
      }
      /**
       * Hitpoints are to be added to this entity.
       * If overridden, should still be chained from the overrider up to this.
       * @param {Heal} heal - A heal config object.
       */
      onHeal(heal) {
        const amount = Math.floor(heal.amount);
        const original = this.hitPoints;
        this.hitPoints += amount;
        if (this.hitPoints > this.maxHitPoints) {
          this.hitPoints = this.maxHitPoints;
        }
        const difference = this.hitPoints - original;
        this.board.emitToNearbyPlayers(
          this.row,
          this.col,
          this.EventsList.heal,
          { id: this.id, amount: difference }
        );
      }
      /**
       * Deal damage to this entity. Lowers the hitpoints. Used mainly by weapons and melee mobs when attacking.
       * @param {Damage} damage - A damage config object.
       * @param {Entity} [source] - The entity that caused this damage.
       */
      damage(damage, source) {
        if (damage instanceof Damage === false) {
          Utils.error("Entity.damage must be passed a Damage config object. Value of 'damage':", damage);
        }
        this.modHitPoints(damage, source);
      }
      /**
       * Hitpoints are to be subtracted from this entity.
       * If HP goes <0, then onAllHitPointsLost is called.
       * This method does NOT destroy directly.
       * If overridden, should still be chained from the overrider up to this.
       * @param {Damage} damage
       * @param {Entity} [source] - The entity that caused this damage.
       */
      onDamage(damage, source) {
        damage.amount = Math.floor(damage.amount);
        this.hitPoints -= damage.amount;
        if (this.hitPoints <= 0) {
          this.onAllHitPointsLost();
        } else {
          this.board.emitToNearbyPlayers(
            this.row,
            this.col,
            this.EventsList.damage,
            { id: this.id, amount: -damage.amount }
          );
        }
      }
      /**
       * This entity has been taken to or below 0 hitpoints.
       * If overridden, should still be chained from the overrider up to this.
       */
      onAllHitPointsLost() {
      }
      /**
       * This entity has had its hitpoints changed.
       * If overridden, should still be chained from the overrider up to this.
       */
      onModHitPoints() {
      }
      /**
       * Get all of the properties of this entity that can be emitted to clients.
       * This method should be overridden on each subclass (and any further subclasses), and
       * then called on the superclass of every subclass, calling it's way back up to Entity.
       * So if Player.getEmittableProperties is called, it adds the relevant properties from Player, then
       * adds from Character, and so on until Entity, then returns the result back down the stack.
       * @param {Object} properties - The properties of this entity that have been added so far. If this is the start of the chain, pass in an empty object.
       * @returns {{}}
       */
      getEmittableProperties(properties) {
        return properties;
      }
      /**
       * Returns the board tile this entity is currently occupying.
       * Shouldn't have to worry about the tile being valid, as they shouldn't be occupying an invalid tile.
       * @returns {BoardTile}
       */
      getBoardTile() {
        return this.board.grid[this.row][this.col];
      }
      /**
       * Returns a random direction.
       * @returns {String}
       */
      getRandomDirection() {
        const keys = Object.keys(Directions);
        return Directions[keys[keys.length * Math.random() << 0]];
      }
      /**
       * When finished constructing this entity, use this to tell the nearby players to add this entity.
       * @returns {Entity}
       */
      emitToNearbyPlayers() {
        this.board.emitToNearbyPlayers(
          this.row,
          this.col,
          this.EventsList.add_entity,
          this.getEmittableProperties({})
        );
        return this;
      }
      /**
       * Checks if another entity is cardinally adjacent to this one. Does NOT include if they are in the same position.
       * @param {Entity} entity
       * @returns {Boolean}
       */
      isAdjacentToEntity(entity) {
        if (entity.row === this.row - 1 && entity.col === this.col) return true;
        if (entity.row === this.row + 1 && entity.col === this.col) return true;
        if (entity.row === this.row && entity.col === this.col - 1) return true;
        if (entity.row === this.row && entity.col === this.col + 1) return true;
        return false;
      }
      /**
       * Checks if any entity of the given type is cardinally adjacent to this one. Does NOT include if they are in the same position.
       * Useful for checking if a player is next to a bank chest, crafting station, etc. when attempting to bank/craft.
       * @param {Number} typeNumber
       * @returns {Boolean}
       */
      isAdjacentToStaticType(typeNumber) {
        const { grid } = this.board;
        if (grid[this.row - 1][this.col].static !== null) {
          if (grid[this.row - 1][this.col].static.typeNumber === typeNumber) {
            return true;
          }
        }
        if (grid[this.row + 1][this.col].static !== null) {
          if (grid[this.row + 1][this.col].static.typeNumber === typeNumber) {
            return true;
          }
        }
        if (grid[this.row][this.col - 1].static !== null) {
          if (grid[this.row][this.col - 1].static.typeNumber === typeNumber) {
            return true;
          }
        }
        if (grid[this.row][this.col + 1].static !== null) {
          if (grid[this.row][this.col + 1].static.typeNumber === typeNumber) {
            return true;
          }
        }
        return false;
      }
      /**
       * Checks if another entity is diagonally adjacent to this one. Does NOT include if they are in the same position.
       * @param {Entity} entity
       * @returns {Boolean}
       */
      isDiagonalToEntity(entity) {
        if (entity.row === this.row - 1 && entity.col === this.col - 1) return true;
        if (entity.row === this.row - 1 && entity.col === this.col + 1) return true;
        if (entity.row === this.row + 1 && entity.col === this.col - 1) return true;
        if (entity.row === this.row + 1 && entity.col === this.col + 1) return true;
        return false;
      }
      /**
       * Checks whether this type of entity can be spawned on the given board tile.
       * Useful for checking special criteria, such as time of day for certain creatures.
       * @param {BoardTile} boardTile - The board tile to spawn the entity on.
       * @param {Number} dayPhase - The time of day that the world is currently on.
       * @returns {Boolean}
       */
      checkSpawnCriteria(boardTile, dayPhase) {
        if (!this.spawnableDayPhases[dayPhase]) return false;
        return true;
      }
    };
    module.exports = Entity;
    Entity.abstract = true;
    Entity.prototype.EventsList = require_EventsList();
    Entity.prototype.typeNumber = null;
    Entity.prototype._destroyed = false;
    Entity.prototype.spawnRate = 6e4;
    Entity.prototype.spawnableDayPhases = {
      [DayPhases.Dawn]: true,
      [DayPhases.Day]: true,
      [DayPhases.Dusk]: true,
      [DayPhases.Night]: true
    };
    Entity.prototype.maxHitPoints = null;
    Entity.prototype.hitPoints = null;
    Entity.prototype.taskIdKilled = null;
    Entity.prototype.taskIdFrozen = null;
    Entity.prototype.taskIdBurned = null;
    Entity.prototype.taskIdInteracted = null;
    Entity.prototype.gatherTaskId = null;
    Entity.prototype.taskIdAnimated = null;
  }
});

// experiments/dungeonz-world/upstream/server/src/entities/classes/statics/Static.js
var require_Static = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/entities/classes/statics/Static.js"(exports, module) {
    var Entity = require_Entity();
    var Utils = require_Utils();
    var Static = class extends Entity {
      /**
       * @param {Object} config
       * @param {Number} config.row
       * @param {Number} config.col
       * @param {Board} config.board
       */
      constructor(config) {
        super(config);
        config.board.addStatic(this);
        if (this._highBlocked === true) {
          this._lowBlocked = true;
        }
        if (this._lowBlocked !== true && this._lowBlocked !== false) Utils.error("Low blocked is not boolean in Static.constructor:", this._lowBlocked);
        if (this._highBlocked !== true && this._highBlocked !== false) Utils.error("High blocked is not boolean in Static.constructor:", this._highBlocked);
        this.blocking = true;
      }
      onDestroy() {
        this.board.removeStatic(this);
        super.onDestroy();
      }
      /**
       * Whether this static currently low blocking the tile it is on.
       * @returns {Boolean}
       */
      isLowBlocked() {
        if (this.blocking === false) return false;
        return this._lowBlocked;
      }
      /**
       * Whether this static currently high blocking the tile it is on.
       * @returns {Boolean}
       */
      isHighBlocked() {
        if (this.blocking === false) return false;
        return this._highBlocked;
      }
    };
    Static.prototype._lowBlocked = true;
    Static.prototype._highBlocked = true;
    module.exports = Static;
  }
});

// experiments/dungeonz-world/upstream/server/src/entities/classes/statics/interactables/Interactable.js
var require_Interactable = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/entities/classes/statics/interactables/Interactable.js"(exports, module) {
    var Static = require_Static();
    var Interactable = class extends Static {
      /**
       * @param {Object} config
       * @param {Number} config.row
       * @param {Number} config.col
       * @param {Board} config.board
       * @param {Number} [config.activeState=true] - Whether this entity is already active when created.
       */
      constructor(config) {
        super(config);
        this.activeState = true;
        if (config.activeState === false) this.activeState = false;
      }
      onDestroy() {
        clearTimeout(this.reactivationTimer);
        super.onDestroy();
      }
      getEmittableProperties(properties) {
        properties.row = this.row;
        properties.col = this.col;
        return properties;
      }
      /**
       * @param {Character} interactedBy
       * @param {Item} toolUsed
       */
      interaction(interactedBy, toolUsed) {
      }
      /**
       * Activate this interactable.
       */
      activate() {
        if (this.getBoardTile().containsAnyDestroyables() === false) {
          this.activeState = true;
          this.board.emitToNearbyPlayers(this.row, this.col, this.EventsList.active_state, `${this.row}-${this.col}`);
        } else {
          this.reactivationTimer = setTimeout(
            this.activate.bind(this),
            this.reactivationRate || 5e3
            // Use some time in case it is null.
          );
        }
      }
      /**
       * Deactivate this interactable.
       */
      deactivate() {
        this.activeState = false;
        if (this.reactivationRate !== null) {
          this.reactivationTimer = setTimeout(this.activate.bind(this), this.reactivationRate);
        }
        this.board.emitToNearbyPlayers(this.row, this.col, this.EventsList.inactive_state, `${this.row}-${this.col}`);
      }
    };
    module.exports = Interactable;
    Interactable.prototype.activeState = true;
    Interactable.prototype.warningEvent = null;
    Interactable.prototype.interactionEnergyCost = 0;
    Interactable.prototype.toolCategory = null;
    Interactable.prototype.isToolRequired = false;
    Interactable.prototype.reactivationRate = null;
    Interactable.prototype.reactivationTimer = null;
  }
});

// experiments/dungeonz-world/upstream/server/src/entities/classes/statics/interactables/breakables/Breakable.js
var require_Breakable = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/entities/classes/statics/interactables/breakables/Breakable.js"(exports, module) {
    var Interactable = require_Interactable();
    var Breakable = class extends Interactable {
      /**
       * @param {Object} config
       * @param {Number} config.row
       * @param {Number} config.col
       * @param {Board} config.board
       * @param {Number} [config.activeState = true] - Whether this entity is already active when created.
       */
      constructor(config) {
        super(config);
      }
      isLowBlocked() {
        if (this.blocking === false) return false;
        if (this._lowBlocked === true) return true;
        return false;
      }
      isHighBlocked() {
        if (this.blocking === false) return false;
        if (this._highBlocked === true) return true;
        return false;
      }
      /**
       * Hitpoints are to be subtracted from this entity.
       * If HP goes <0, then onAllHitPointsLost is called.
       * Breakables are NEVER destroyed.
       * This is the end of the call chain for breakables. Don't go up to Entity.
       * @param {Number} amount - How much to decrease by.
       * @param {Entity} [source] - The entity that caused this damage.
       */
      /* onDamage (amount, source) {
              console.log("breakable ondamage:", amount);
      
              this.hitPoints += amount;
      
              console.log("breakable hp:", this.hitPoints);
      
              // Check if this entity is destroyed.
              if(this.hitPoints <= 0){
                  this.onAllHitPointsLost();
              }
              // Entity is still alive. Tell nearby players.
              else {
                  this.board.emitToNearbyPlayers(this.row, this.col, this.EventsList.breakable_damaged, {id: this.row + "-" + this.col, amount: amount});
              }
          } */
      /**
       * All hitpoints have been lost. This breakable is now broken.
       */
      /* onAllHitPointsLost () {
              console.log("breakable onallHPlost:");
              // The breakable might be waiting to reactive when broken. Deal with the timeout that would fire.
              clearTimeout(this.reactivationTimer);
      
              // Tell nearby players this entity is now broken.
              this.board.emitToNearbyPlayers(this.row, this.col, this.EventsList.breakable_broken, this.row + "-" + this.col);
      
              this.activeState = false;
      
              // If a repair rate is set, start a timer to reactivate this object.
              if(this.repairRate !== null){
                  this.repairTimer = setTimeout(this.activate.bind(this), this.repairRate);
              }
      
          }
      
          getEmittableProperties (properties) {
              properties.brokenState = this.hitPoints <= 0;
              return super.getEmittableProperties(properties);
          } */
      /**
       * @param {Character} interactedBy
       * @param {Item} toolUsed
       */
      interaction(interactedBy, toolUsed) {
      }
      /**
       * Make this breakable not broken any more.
       */
      /* repair () {
              // Check there are no obstructions on the object before repairing it.
              if(this.board.grid[this.row][this.col].containsAnyDestroyables() === false){
                  // Nothing in the way. Repair this object.
                  this.hitPoints = this.maxHitPoints;
                  this.activeState = true;
      
                  // Tell any nearby players that this object is now repaired.
                  this.board.emitToNearbyPlayers(this.row, this.col, this.EventsList.breakable_repaired, this.row + "-" + this.col);
              }
              // Something in the way.
              else {
                  // Restart the timer to activate this object.
                  this.repairTimer = setTimeout(this.repair.bind(this), this.repairRate);
              }
          } */
    };
    module.exports = Breakable;
  }
});

// experiments/dungeonz-world/upstream/server/src/entities/classes/statics/interactables/breakables/WoodDoor.js
var require_WoodDoor = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/entities/classes/statics/interactables/breakables/WoodDoor.js"(exports, module) {
    var Breakable = require_Breakable();
    var WoodDoor = class extends Breakable {
      /**
       * @param {Object} config
       * @param {Number} config.row
       * @param {Number} config.col
       * @param {Board} config.board
       * @param {Clan} config.clan
       */
      constructor(config) {
        super(config);
      }
      interaction(interactedBy) {
        if (this.activeState === false) return;
        if (interactedBy.energy < this.interactionEnergyCost) return;
        interactedBy.modEnergy(-this.interactionEnergyCost);
        this.deactivate();
        this.blocking = false;
      }
      activate() {
        super.activate();
        if (this.activeState === true) this.blocking = true;
      }
    };
    module.exports = WoodDoor;
    WoodDoor.prototype.interactionEnergyCost = 1;
    WoodDoor.prototype.reactivationRate = 5e3;
  }
});

// <stdin>
var import_WoodDoor = __toESM(require_WoodDoor());
var import_Damage = __toESM(require_Damage());
var export_Damage = import_Damage.default;
var export_WoodDoor = import_WoodDoor.default;
export {
  export_Damage as Damage,
  export_WoodDoor as WoodDoor
};
