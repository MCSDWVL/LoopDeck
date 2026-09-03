# Loop Deck - Running Idea / TODO log

# Card Identity
Cards should have a stronger identity by consistently pairing their attributes and actions.

For now their connections should remain semi-randomized, but we should make stronger cards have
more quirks like being multi or accumulator, with fixed multi/accumulator costs. That way we can
"balance" strong cards by making them require more committed resources to trigger.

The likelihood have having N connections should also be tunable, so that we can have weaker cards
more likely to allow followups with stronger cards more likely to be leaf nodes.

We should consider but maybe not keep having card types have consistent notes (not hardcoded notes
but defined scale positions - i.e. strike is always the first degree of the pentatonic scale).

# Empty Cards
We should have empty transition cards. They should be more common and cost less at shops. These
are pure connections with no activated ability.

# QOL improvements
Players should see their current board and bench when picking rewards or shopping.

There should be a "fast forward" button in battles that simulates the rest of the fight instantly.

# New Card Mechanics
## Cooldown + Negative
A strong card with a cooldown that triggers some negative outcome if retriggered again during the
cooldown. If retriggered in this way we should play a dissonant note and flash a different color.

Example card:
- Gain 25 armor, cooldown 5, if retriggered during cooldown take 25 damage

## Exhaust
Some nodes should only be activatable N times per battle. Once they have reached their activation
count, they become empty connectors for the rest of battle.

Example card:
- Double block, exhaust.

## Time Since Triggered
Cards should know how long it has been since they have received a pulse, and some cards should
build mechanics around this.

Example card:
- Deal N damage. N = N+1 for each beat since this card was last triggered.

## Age of Pulse
Pulses should know how old they are (i.e. how long since they were generated). If two pulses
both enter the same square, the pulse age should become the younger one. Cards should be
able to have effects based on the pulse age

Example card:
- Deal (Pulse Age) Damage

## Board Reading/NeighborReading
Cards should be able to have effects based on the entire board as well as their specific
neighbors. 

Example Card:
- If all cards on the board are attack cards (no blocks), deal 15 damage
- Deal N damage for each connected neighbor
- Deal N damage for each unconnected neighbor
- Deal N damage for each instance of this same ability active/connected on the board

## Activation Count
Cards should know how many times they have been activated in a battle. We can build explicit
mechanics around this.

Example card:
- Deal N damage. N = N+1 each time this card is triggered.

## Switcher
A card which is a switcher should pass incoming pulses to different outputs that rotate
each time a pulse moves through it/it is activated. So it might start forwarding pulses to the
right, then forward them down, then back to right, then back to down, etc. Will need some ui
to show the order it will move through its outputs.

## Battle State/HP Lost/Enemy HP Lost/Enemy Current HP
Cards should be able to change their behavior based on what has happened in the current battle
or the state of player/enemy HP.

Example Card:
- Accumulator 10, accumulate 1 each time you take damage.
- Deal 1 HP damage for each missing HP you have.

## Glass Cards
Glass cards have a 5% chance to break/vanish each time they are pulsed.

These cards would be exceptionally strong but risky to use and temporary.

We should reat this as a generic modifier possible to apply to any card, and just multiply
the numbers on that card, i.e. Strike - Deal 5 damage becomes Glass Strike - Deal 25 damage, Glass.

Example Card:
- Glass Strike - Deal 25 damage, Glass.

## Pulse "Color"
We may defer this one for being too advanced, but an idea is to have a card that changes
the "color" of the pulse it forwards. Then other cards that do different things based on
the "color" of the pulse.

Example Cards:
- Outgoing pulses are red
- Rotate the color of the pulse through the rainbow (red becomes orange, orange becomes yellow, then green, blue, purple, then red again).
- Deal N damage. Deal 2N Damage if the pulse is Red.

# Status Effects
## Weak/Strong
Damage is reduced/increased by N.

## Vulnerable
Incoming damage is incread by N.

## Brittle/Dextrous
Block generated is reduced/increased by N.

## Stunned
Each stack cancels one action activation, then is removed. Stun does not decay on its own.

# Need to Make Lots of Cards

## Red SS Cards
Bash - 8 damage, 2 vulnerable
defend - 5 block
strike - 6 dmg
anger - deal 5 damage, make a copy
armaments - 5 block, upgrade cards in hand
Body Slam - deal damage equal to block
Clash - if all cards in hand are attack, deal 14 damage
Cleave - deal 8 damage to all enemies
Clothesline - deal 12 damage, apply 2 weak
Flex gain 2 strength, at end of turn lose 2 strength
Havoc - play top card of your draw pile
Headbutt - deal 9 damage, place card from your discc ard pile on top of your draw pile
Heavy Blade - Deal 14 damage. Strength affects Heavy Blade 3 times.
Iron Wave - Gain 5 block.
Perfected Strike - deal 6 damage. Deals an additional +2 damage
Pommel Strike - Deal 9 damage. Draw 1 card.
Shrug it off - gain 8 block. Draw 1 card.
Sword Boomerang - deal 3 damage to a random enemy 3 times
Thunderclap - Deal 4 damage and apply 1 vulnerable to all enemies.
True Grit - gain 7 block. Exhaust a random card from your hand.
Twin Strike - deal 5 damage twice
War Cry - Draw 1 card, place a card from your hand on top of your draw pile.
Wild strike - Deal 12 damage. Shuffle a wound into your draw pile.
Battle Trance - Draw 3 cards, you cannot draw more cards this turn.
Blood for Blood - 

# Multi Enemy?


# Longer Term - player and enemy should be animated performing their actions.
