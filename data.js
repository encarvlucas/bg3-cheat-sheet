const DATA = [
  {
    name: 'Act 1',
    areas: [
      // --------------------------------- Wilderness ---------------------------------------
      {
        id: 'beach',
        subact: 'wilderness',
        name: 'Ravaged Beach & Wilderness',
        items: [
          { id: 'shart', title: 'Recruit Shadowheart', tags: 'npc' },
          { id: 'laezel', title: "Recruit Lae'zel", tags: 'npc' },
          { id: 'astarion', title: 'Recruit Astarion', tags: 'npc' },
          { id: 'gale', title: 'Recruit Gale', tags: 'npc' },
          { id: 'early-mindflayer', title: 'Kill mindflayer in crashed out ship', tags: 'opt' },
          { id: 'withers', title: 'Explore abandoned church and free Withers', tags: 'npc opt' },
          { id: 'guidance', title: 'Explore around and find guidance amulet', tags: 'loot opt' },
        ],
      },
      {
        id: 'grove',
        subact: 'wilderness',
        name: 'Emerald Grove & Druid Grove',
        items: [
          { id: 'grove', title: 'Meet Zevlor, fight goblins and begin the Save the Grove quest', tags: 'quest npc' },
          { id: 'tief-assassin', title: 'Save tiefling from assassination, get her Soulcoin', tags: 'loot' },
          { id: 'wyll', title: 'Recruit Wyll', tags: 'npc' },
          { id: 'arabella', title: 'Save Arabella', tags: 'npc' },
          { id: 'harpies', title: 'Rescue Mirkon from Harpies, then talk to Mol', tags: 'opt prereq' },
          { id: 'kagha', title: 'Handle Kagha situation (shadow Druids)', tags: 'boss', requires: 'melphit' },
          {
            id: 'silvanus-idol-mol',
            title: 'Steal Idol of Silvanus and get Ring of Protection',
            tags: 'quest loot opt',
            requires: 'kagha harpies',
            subtasks: [{ id: 'silvanus-idol-permanent', title: 'Steal Idol back from Mol', tags: 'loot opt buff' }],
          },
          { id: 'karlach-engine-1', title: 'Talk to Dammon the blacksmith about Karlach engine', tags: 'npc loot buff', requires: 'karlach' },
        ],
      },
      {
        id: 'blighted',
        subact: 'wilderness',
        name: 'Blighted Village',
        items: [
          { id: 'blighted-entryway', title: 'Handle goblins in Blighted Village entryway', tags: 'prereq' },
          { id: 'windmill', title: 'Fight/handle goblins in windmill and free/kill gnome', tags: 'npc loot opt' },
          { id: 'ogres', title: 'Talk to Ogres and fight them or get their support', tags: 'boss opt' },
          { id: 'thay', title: 'Explore cellar, fight skeletons, pass mirror and find Necromancy of Thay', tags: 'opt buff' },
          { id: 'spiders', title: 'Fight phase spiders and grab Amethyst', tags: 'boss loot opt' },
          { id: 'barn-couple', title: "Fight 'couple' copulating in barn", tags: 'opt' },
        ],
      },
      {
        id: 'wild',
        subact: 'wilderness',
        name: 'Wilderness (South) Side Quests',
        items: [
          {
            id: 'owlbear',
            title: 'Talk to absolutist siblings and Fight Owlbear',
            tags: 'boss npc loot prereq',
            subtasks: [{ id: 'owlbear2', title: 'Get them to help in the fight', tags: 'opt' }],
          },
          { id: 'scratch', title: 'Rescue Scratch', tags: 'npc' },
          { id: 'karlach', title: 'Recruit Karlach', tags: 'npc' },
          { id: 'melphit', title: 'Fight melphits and Woads to find secret Kahga letter', tags: 'loot prereq opt' },
          { id: 'hag-redcaps', title: 'Fight Sheep (Redcaps) outside of hag lair', tags: 'opt' },
          {
            id: 'ethel',
            title: "Visit the Hag's Hut and deal with Auntie Ethel",
            tags: 'boss quest loot opt',
            subtasks: [
              { id: 'hag-fight', title: 'Fight mask wearing hag minions then fight Ethel', tags: 'boss loot' },
              { id: 'hag-hair', title: 'Obtain hag hair', tags: 'buff opt' },
            ],
          },
        ],
      },
      {
        id: 'goblins',
        subact: 'wilderness',
        name: 'Goblin Camp',
        items: [
          { id: 'goblin-entrance', title: 'Fight/talk your way out of goblins in entrance to camp', tags: 'loot' },
          { id: 'crusher', title: 'Talk to Crusher and fight/get his ring', tags: 'loot' },
          { id: 'volo-1', title: 'Free Volo', tags: 'npc', subtasks: [{ id: 'volo-eye', title: 'Talk to Volo in camp and get the magic eye', tags: 'buff' }] },
          { id: 'owlbear-cub', title: 'Free Owlbear cub', tags: 'npc', requires: ['owlbear'] },
          { id: 'branded', title: 'Get branded by Absolute', tags: 'buff opt' },
          { id: 'abdirak', title: "Get Loviatar's blessing from Abdirak", tags: 'buff opt' },
          { id: 'tortured-prisioner', title: 'Free/kill tortured prisioner', tags: 'opt' },
          {
            id: 'goblin-decision',
            title: 'Side with or against the goblin leaders',
            tags: 'quest',
            subtasks: [
              { id: 'halsin', title: 'Free Halsin from the Goblin Camp', tags: 'quest npc' },
              { id: 'gut', title: 'Defeat Priestess Gut', tags: 'quest boss' },
              { id: 'dror-ragzlin', title: 'Defeat Dror Ragzlin', tags: 'quest boss' },
              {
                id: 'minty',
                title: 'Defeat or ally with Minthara',
                tags: 'quest boss',
                subtasks: [{ id: 'knock-out-minty', title: 'Knock-out Minthara', tags: 'npc opt' }],
              },
            ],
          },
          { id: 'selune-temple-passage', title: "Go through Priestess Gut's room to the secret passage to the underdark", tags: 'opt' },
          { id: 'camp-fight', title: 'Kill all goblins in the camp', tags: 'opt' },
        ],
      },
      {
        id: 'risen',
        subact: 'wilderness',
        name: 'Risen Road Side Quests',
        items: [
          {
            id: 'paladins-tyr',
            title: 'Fight Paladins of Tyr',
            tags: 'boss loot',
            subtasks: [{ id: 'paladins-tyr-loot', title: 'Loot their Soulcoin and cellar', tags: 'loot' }],
          },
          { id: 'gnolls-1', title: 'Fight Gnolls near bridge', tags: 'loot' },
          { id: 'gnolls-2', title: 'Fight Gnolls near cave', tags: 'boss loot', subtasks: [{ id: 'strongbox', title: 'Steal Iron Flask from Zhentarim', tags: 'opt' }] },
          { id: 'fire', title: 'Rescue Commander Florrick', tags: 'quest npc' },
          { id: 'hideout', title: 'Check out Zhentarim hideout', tags: 'loot', requires: 'gnolls-2' },
          { id: 'gith-dragon', title: 'Handle Gith and go to mountain pass', tags: 'quest boss npc' },
        ],
      },
      // --------------------------------- Underdark ---------------------------------------
      {
        id: 'myconid',
        subact: 'underdark',
        name: 'Myconid Colony',
        items: [
          {
            id: 'colony',
            title: 'Meet Sovereign Spaw in the Myconid Colony',
            tags: 'npc',
            subtasks: [
              { id: 'glut', title: 'Talk to Gut and ask for his help', tags: 'npc', subtasks: [{ id: 'glut-revenge', title: 'Kill Sovereign Spaw', tags: 'opt loot' }] },
              { id: 'beach-duergar', title: "Kill Duergar at the beach and return for Spaw's reward", tags: 'loot prereq' },
            ],
          },
          {
            id: 'sargent-boots',
            title: "Get Thulla's boots",
            tags: 'quest loot',
            subtasks: [{ id: 'return-boots', title: 'Return boots to Sargent Thrinn', tags: 'loot opt' }],
          },
          { id: 'omelum', title: "Do Omelum's quest, then buy his items", tags: 'loot' },
          { id: 'noblestalk', title: "Do Baelen and Derryth's quest and check out her stock", tags: 'loot' },
          { id: 'staff-of-ice', title: 'Assemble the Mourning Frost staff', tags: 'loot', requires: 'horrors beach-duergar spectator' },
        ],
      },
      {
        id: 'underdark-wilds',
        subact: 'underdark',
        name: 'Underdark Wilds',
        items: [
          { id: 'underdark-temple', title: 'Explore Selune Temple', tags: 'loot' },
          { id: 'phalar-aluve', title: 'Take Phalar Aluve from the stone', tags: 'loot' },
          { id: 'minotaurs', name: 'Fight Underdark Minotaurs', tags: 'boss' },
          { id: 'horrors', title: 'Fight Hook Horrors near Sussur Tree', tags: 'loot' },
          { id: 'bulette', title: 'Fight the Bulette', tags: 'boss' },
          { id: 'spectator', title: 'Fight Spectator', tags: 'boss loot' },
          { id: 'arcane-tower', title: "Explore arcane tower and gather Omelum's ingredients", tags: 'loot boss', requires: 'omelum' },
          { id: 'kuo-toa', title: 'Visit the Festering Cove and handle BOOOAL', tags: 'buff opt' },
        ],
      },
      {
        id: 'grymforge',
        subact: 'underdark',
        name: 'Grymforge',
        items: [
          { id: 'grym-entry', title: 'Enter grymforge and talk to Sargent Thrinn', tags: 'quest' },
          { id: 'philomeen', title: 'Find Philomeen and get her explosive', tags: 'loot' },
          { id: 'forge-mimics', title: 'Fight forge Mimics', tags: 'loot' },
          { id: 'nere', title: 'Free Nere', tags: 'loot' },
          {
            id: 'forge',
            title: 'Open passage to forge',
            tags: 'loot',
            subtasks: [
              { id: 'forge-ores-1', title: 'Find mithral ore with mephits', tags: 'loot' },
              { id: 'forge-ores-2', title: 'Find mithral ore across the lava', tags: 'loot' },
              { id: 'cursed-amulet', title: 'Find cursed amulet in the lava', tags: 'loot opt' },
              { id: 'grym', title: 'Craft mithral equipment and defeat Grym', tags: 'boss loot' },
            ],
          },
        ],
      },
      // --------------------------------- Creche ---------------------------------------
      {
        id: 'monastery',
        subact: 'creche',
        name: 'Rosymorn Monastery',
        items: [
          {
            id: 'esther',
            title: 'Talk to lady Esther to get egg quest and buy her stuff',
            tags: 'loot',
            subtasks: [{ id: 'esther-egg', title: 'Give the Githyanki egg to Esther', tags: 'opt', requires: 'gith-egg' }],
          },
          { id: 'mountain-undead', title: 'Fight undead guarding the mountain pass', tags: 'quest boss' },
          { id: 'kobolds', title: 'Fight drunken Kobolds', tags: 'loot prereq' },
          { id: 'eagles', title: 'Fight the eagles on the top of the monastery', tags: 'loot prereq' },
          { id: 'guardian', title: 'Fight the eternal guardian of faith', tags: 'loot prereq' },
          { id: 'crest', title: "Find the Dawnmaster's Crest", tags: 'loot prereq', requires: 'kobolds eagles guardian' },
        ],
      },
      {
        id: 'creche-yllek',
        subact: 'creche',
        name: "Crèche Y'llek",
        items: [
          { id: 'jeera', title: "Shop at Gith's quartermaster", tags: 'loot' },
          { id: 'zaithisk', title: "Participate in the Zaith'isk procedure", tags: 'buff' },
          { id: 'gith-egg', title: 'Steal/get Githyanki egg', tags: 'opt' },
          { id: 'vlaakith', title: "Talk to the Crèche's captain and then with the inquisitor", tags: 'boss' },
          { id: 'lathander', title: 'Find Blood of Lathander', tags: 'loot', requires: 'crest' },
        ],
      },
    ],
  },
  {
    name: 'Act 2',
    areas: [
      {
        id: 'shadow',
        subact: 'shadow',
        name: 'Shadow-Cursed Lands',
        items: [
          { id: 'oliver', title: 'Talk to Oliver and play his games', tags: 'loot' },
          { id: 'shadow-hounds', title: 'Turn off circle of everlasting light and fight shadow hounds', tags: 'loot' },
          { id: 'mound', title: 'Fight Shambling Mound ambush', tags: 'boss loot' },
        ],
      },
      {
        id: 'last-light-inn',
        subact: 'shadow',
        name: 'Shadow-Cursed Lands',
        items: [
          { id: 'last-light', title: 'Reach the Last Light Inn and meet Isobel', tags: 'npc loot' },
          { id: 'rolan', title: 'Talk to Rolan and save him after he leaves', tags: 'npc' },
          { id: 'art-cullagh', title: 'Save mysterious sleeping man in inn', tags: 'loot', subtasks: [
            { id: 'thaniel-1', title: 'Rescue Thaniel from the shadow curse realm', tags: 'boss', requires: 'halsin' },
            { id: 'thaniel-2', title: 'Unite Oliver and Thaniel', tags: 'boss', requires: 'thaniel-1 oliver' },
          ] },
          { id: 'karlach-engine-2', title: 'Talk to Dammon and acquire 2nd engine upgrade for Karlach', tags: 'quest', requires: 'karlach karlach-engine-1' },
        ],
      },
      {
        id: 'reithwin',
        subact: 'moonrise',
        name: 'Shadow-Cursed Lands',
        items: [
          // TODO
        ],
      },
      {
        id: 'moonrise',
        subact: 'moonrise',
        name: 'Shadow-Cursed Lands',
        items: [
          // TODO
          { id: 'ketheric-1', title: 'Defeat Ketheric Thorm', tags: 'quest boss' },
          { id: 'save-minthy', title: 'Save Minthera from execution', tags: 'npc opt', requires: 'knock-out-minty' },
          { id: 'prisoners', title: 'Free the prisoners at Moonrise Towers', tags: 'npc loot', subtasks: [
            { id: 'warden', title: 'Fight Warden', tags: 'opt' },
          ] },
        ],
      },
      {
        id: 'gauntlet',
        subact: 'gauntlet',
        name: 'Shadow-Cursed Lands',
        items: [
          // TODO
        ],
      },
      {
        id: 'colony',
        subact: 'colony',
        name: 'Mindflayer Colony',
        items: [
          // TODO
          { id: 'ketheric-2', title: 'Defeat the Apostle of Myrkul', tags: 'boss' },
        ],
      },
    ],
  },
  {
    name: 'Act 3',
    areas: [
      {
        id: 'lower',
        subact: 'lower-city',
        name: 'Lower City',
        items: [{ id: 'sundries', title: 'Visit Sorcerous Sundries, buy stock', tags: 'quest loot' }],
      },
      {
        id: 'upper',
        subact: 'upper-city',
        name: "Upper City & Wyrm's Rock",
        items: [
          { id: 'cazador', title: 'Defeat Cazador Szarr', tags: 'boss quest npc' },
          { id: 'gortash', title: "Defeat Gortash at Wyrm's Rock", tags: 'boss' },
          { id: 'orin', title: 'Defeat Orin the Red', tags: 'boss' },
          { id: 'end', title: 'Confront the Netherbrain', tags: 'boss' },
        ],
      },
    ],
  },
]
