#!/usr/bin/env python3
"""
Convert Forest Shuffle card data from JavaScript to TypeScript
Processes help/cards/card.js and outputs TypeScript data structures
"""

import json
import re

# Read the JavaScript file
with open('/Users/augustine/Dev/forest_shuffle/help/cards/card.js', 'r') as f:
    js_content = f.read()

# Extract SPECIES_DATA section
species_match = re.search(r'const SPECIES_DATA = \{(.*?)\};', js_content, re.DOTALL)
if not species_match:
    print("Could not find SPECIES_DATA")
    exit(1)

species_raw = species_match.group(1)

# Parse species data - simplified approach
print("// SPECIES_DATA - TypeScript format")
print("export const SPECIES_DATA: Record<string, SpeciesData> = {")

# Extract individual species entries
species_entries = re.findall(r'(\w+):\s*\{([^}]+)\}', species_raw, re.MULTILINE)

for species_name, species_body in species_entries:
    # Parse individual properties
    name_match = re.search(r'name:\s*"([^"]+)"', species_body)
    nb_match = re.search(r'nb:\s*(\d+)', species_body)
    cost_match = re.search(r'cost:\s*(\d+)', species_body)
    type_match = re.search(r'type:\s*"?(\w+)"?', species_body)
    
    # Tags - more complex
    tags_match = re.search(r'tags:\s*\[(.*?)\]', species_body)
    tags = []
    if tags_match:
        tag_str = tags_match.group(1)
        # Extract tag constants
        tags = re.findall(r'[\w\s"-]+', tag_str)
        tags = [t.strip().strip('"') for t in tags if t.strip() and t.strip() != ',']
    
    # Effect, bonus, points - handle multiline strings
    effect_match = re.search(r'effect:\s*"([^"]*)"', species_body, re.DOTALL)
    bonus_match = re.search(r'bonus:\s*"([^"]*)"', species_body, re.DOTALL)
    points_match = re.search(r'points:\s*"([^"]*)"', species_body, re.DOTALL)
    
    if name_match and nb_match and cost_match and type_match:
        print(f"  {species_name}: {{")
        print(f"    name: \"{name_match.group(1)}\",")
        print(f"    nb: {nb_match.group(1)},")
        print(f"    tags: [{', '.join([f\"'{t}'\" for t in tags[:3]])}],")  # Simplified
        print(f"    cost: {cost_match.group(1)},")
        print(f"    type: '{type_match.group(1)}',")
        print(f"    effect: \"{effect_match.group(1) if effect_match else ''}\",")
        print(f"    bonus: \"{bonus_match.group(1) if bonus_match else ''}\",")
        print(f"    points: \"{points_match.group(1) if points_match else ''}\",")
        print(f"  }},")

print("};")
