import string
import random

vowels = "AEIOU"
consonants = "BCDFGHJKLMNPQRSTVWXYZ"

thres = 0.5
name = ""
for i in range(0,random.randint(3,10)):
    if random.random() > thres:
        name += random.choice(vowels)
        thres += 0.3
    else:
        name += random.choice(consonants)
        if name[-1] == 'Q':
            name += "U"
            thres += 0.3
        else:
            thres -= 0.3

print name
