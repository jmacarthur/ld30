## Connected worlds

There are worlds and you are the connection. You're needed to transport goods (selenium and iron) to different worlds.

## Gameplay
 
2D, top-down. You'll start off in orbit around Planet 1 with the title screen on top so you get the idea that you're safe in orbit without having to do anything.

On pressing space you can control the spaceship using the arrow keys. Up and down accelerate/decelerate (i.e. alter the speed) and left and right steer.

You'll start orbiting around planets if you get close enough. While in orbit you can buy and sell goods and buy upgrades.

On breaking orbit you can fly to another world (directly). While in flight, you may encounter other ships - they will try to attack you.

## What we need

* Position of the ship, speed and heading
* Some sort of dust effect to give the impression of movement while in deep space
* Planets and 'orbiting' code.
* Enemies  and some way for them to follow you and attack you.
    * Let's just say they head straight for you, back off on the throttle if they get too close, and fire lasers at you.
* Decide whether we explode on collision (this would be good for an asteroid field)
* Trading screen.
* Data model for the worlds - determines market prices (which have to vary - it is connected, after all)
    * If we extract information from all players about stock levels we can alter market prices - players are connected too
