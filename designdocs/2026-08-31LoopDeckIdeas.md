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

# New Card Mechanics
## Cooldown + Negative
A strong card with a cooldown that triggers some negative outcome if retriggered again during the
cooldown. If retriggered in this way we should play a dissonant note and flash a different color.

Example card:
- Gain 25 armor, cooldown 5, if retriggered during cooldown take 25 damage

## Strength Gain When Not Triggered
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

## Activation Count
Cards should know how many times they have been activated in a battle. We can build explicit
mechanics around this.

Example card:
- Deal N damage. N = N+1 each time this card is triggered.

# Need to Make Lots of Cards

# Longer Term - player and enemy should be animated performing their actions.