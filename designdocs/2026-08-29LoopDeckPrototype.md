# Loop Deck
"Loop Deck" is a musical battle game where players construct a board that auto battles an opponent.

The board consists of nodes and directed lines. A pulse travels around the board from node to node
one step at a time, following the lines. At each node, a note is played (for starters lets make it
intrinsic to the node and random but drawn from a pleasant sounding major or minor pentatonic scale).

Players can place "actions" on nodes which are similar to slay the spire cards, things like strike,
block, etc. We should aim to have an interesting set similar to slay the spire's set, but start
with a curated premade deck with some synergy to test the idea.

# Board Construction
Players should acquire and "build" their board over time. The reward for a fight might be a choice
of nodes. These nodes would come premade with a set of directed ingoing and outgoing lines. The
ability to socket an action into a node should also be a property. We might consider "double socket"
nodes as well as a special type.

There should be one or more special "starter" nodes that triggers automatically at the start of battle,
and probably again every N turns. We might consider that the starter node only activates after the board
has no live pulses for N turns, or we might allow it to retrigger over and over at some cadence - TBD.

Board construction should happen between battles, or at the start of battle - TBD.

# Node Types
There should be a variety of node types to allow for creating more complex boards:
- Activator that generates a pulse regardless of input every N beats
- Accumulator - stores incoming charges until it reaches N charges then releases a pulse
- Delay - when activated, becomes inert for N beats then releases a pulse
- Multi - requires 2,3, or 4 simultaneous pulses reaching it on the same beat to activate

These more complex nodes should probably come with some commensurate benefit, like allowing
the socketing of actions more often or having more outgoing connections. We will have to iterate
on this.

# Action Socketing
Players can socket actions into nodes that allow it. At the start of a battle, they should draw some
number of their abilities into their hand and place them into their board's open sockets.

Once the board is constructed and the actions are socketed players hit a start button to trigger
the activators and then the battle proceeds automatically until death of player or enemy.

# Enemy
The battle should have an enemy with a board similar to a players board, which similarly loops and
plays notes and triggers actions. The enemy has HP, strength, block, etc similar to the player.

Battle ends when the player or the enemy reach 0 hp.

# Prototype Limitations
For the prototype, we will first implement a single battle in HTML and javascript to test the mechanics.

The player should be given a random assortment of board pieces and allowed to construct their board by 
draggint the pieces into place.

The player should be given a random assortment of actions to socket - we should consider creating 2 or 3
curated "slay the spire-esque" decks with different win conditions, i.e. a block stacker with an ability
that removes all block and does that much damage, a poison mechanic based build (with poison doing damage
equal to poison stacks every N beats or something like that), a regular old striker, etc.

The enemy can have a random board that also draws from similar archetypes/actions or we can create some 
enemy specific actions if needed.

The enemy nodes and player nodes should play their notes at the same time but probably with some difference
in tone or octave to keep it from sounding too busy.
